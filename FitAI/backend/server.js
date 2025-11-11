import express from 'express';
import session from 'express-session';
import { WebSocketServer, WebSocket } from 'ws';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

//import db
import db from './config/database.js';
import { findUserByEmailOrName, createUser, getGlobalRanking } from './models/user.model.js';
import * as SalaModel from './models/sala.model.js';
import * as ParticipacioModel from './models/participacio.model.js';

//server
const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(session({
  secret: 'un-secret-molt-molt-segur-canvia-aixo',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

const server = app.listen(port, () => {
  console.log(`Servidor HTTP executant-se a http://localhost:${port}`);
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = request.url;
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Lògica de WebSockets
const sessions = {}; // Estructura: sessions[codi_acces] = { sala_id, participants: { userId: { ws, userName, reps } } }

function broadcastToSession(codi_acces, message) {
  const session = sessions[codi_acces];
  if (!session) return;
  Object.values(session.participants).forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

function broadcastLeaderboard(codi_acces) {
  const session = sessions[codi_acces];
  if (!session) return;
  const leaderboard = Object.entries(session.participants)
    .map(([userId, data]) => ({
      userId: parseInt(userId, 10),
      userName: data.userName,
      reps: data.reps,
    }))
    .sort((a, b) => b.reps - a.reps);

  broadcastToSession(codi_acces, {
    type: 'leaderboard',
    codi_acces,
    leaderboard,
  });
}

async function netejarSessio(codi_acces) {
  const session = sessions[codi_acces];
  if (session && Object.keys(session.participants).length === 0) {
    delete sessions[codi_acces];
    console.log(`Sessió ${codi_acces} eliminada de la memòria (sense participants)`);
  }
}

// Gestió de Connexions WebSocket
wss.on('connection', (ws) => {
  console.log('Nou client WebSocket connectat');
  let currentCodiAcces = null;
  let currentUserId = null;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Missatge rebut:', message);

      switch (message.type) {
        case 'join': {
          const { codi_acces, userId, userName } = message;

          if (!codi_acces || !userId || !userName) {
            return ws.send(JSON.stringify({ error: 'codi_acces, userId i userName requerits' }));
          }

          if (!sessions[codi_acces]) {
            const sala = await SalaModel.buscarSalaPerCodi(codi_acces);
            if (!sala) {
              return ws.send(JSON.stringify({ type: 'error', message: 'La sala no existeix o ja ha començat.' }));
            }
            sessions[codi_acces] = { sala_id: sala.id, participants: {} };
          }

          const session = sessions[codi_acces];
          if (Object.keys(session.participants).length >= 4) {
            return ws.send(JSON.stringify({ type: 'error', message: 'La sessió està plena.' }));
          }

          session.participants[userId] = { ws, userName, reps: 0 };
          currentCodiAcces = codi_acces;
          currentUserId = userId;

          broadcastLeaderboard(codi_acces);
          ws.send(JSON.stringify({ type: 'joined', codi_acces, userId, message: 'T’has unit a la sessió.' }));
          console.log(`Usuari ${userId} (${userName}) unit a la sessió ${codi_acces}`);
          break;
        }

        case 'start': {
          const { codi_acces } = message;
          if (!codi_acces || !sessions[codi_acces]) return;
          
          try {
            await SalaModel.iniciarSala(codi_acces);
            console.log(`Partida iniciada a la sessió ${codi_acces}`);
            broadcastToSession(codi_acces, { type: 'start', codi_acces });
          } catch (error) {
            console.error("Error a l'iniciar la partida:", error);
          }
          break;
        }

        case 'update': {
          if (currentCodiAcces && currentUserId && sessions[currentCodiAcces]?.participants[currentUserId]) {
            sessions[currentCodiAcces].participants[currentUserId].reps = message.reps || 0;
            broadcastLeaderboard(currentCodiAcces);
          }
          break;
        }

        case 'finish': {
          const { reps, exercici, codi_acces } = message;
          const session = sessions[codi_acces];
          if (!session || !currentUserId || !exercici || reps === undefined) return;
          
          try {
            // RAD-3: Guardem el progrés del participant a la taula de participacions
            await ParticipacioModel.actualitzarResultatsParticipant(
              currentUserId,
              session.sala_id,
              exercici,
              parseInt(reps, 10) || 0
            );
            console.log(`Resultats intermedis guardats per l'usuari ${currentUserId}.`);
          } catch (error) {
            console.error("Error al guardar dades 'finish':", error);
          }
          break;
        }

        case 'leave': {
          if (currentCodiAcces && currentUserId && sessions[currentCodiAcces]) {
            delete sessions[currentCodiAcces].participants[currentUserId];
            broadcastLeaderboard(currentCodiAcces);
            netejarSessio(currentCodiAcces);
            console.log(`Usuari ${currentUserId} ha sortit de la sessió ${currentCodiAcces}`);
            currentCodiAcces = null;
            currentUserId = null;
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error processant missatge WS:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client WebSocket desconnectat');
    if (currentCodiAcces && currentUserId && sessions[currentCodiAcces]) {
      delete sessions[currentCodiAcces].participants[currentUserId];
      broadcastLeaderboard(currentCodiAcces);
      netejarSessio(currentCodiAcces);
    }
  });

  ws.on('error', (error) => console.error('Error en WebSocket:', error));
});


// RUTAS DE L'API

// Gestió d'Usuaris
app.post('/api/register', async (req, res) => {
  const { nom, email, password } = req.body;
  if (!nom || !email || !password) {
    return res.status(400).json({ message: 'Tots els camps són obligatoris' });
  }
  try {
    await createUser(nom, email, password);
    res.status(201).json({ message: 'Usuari registrat!' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Aquest email ja està registrat' });
    }
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email: loginInput, password } = req.body;
  if (!loginInput || !password) {
    return res.status(400).json({ message: 'Usuari/Email i contrasenya obligatoris' });
  }
  try {
    const user = await findUserByEmailOrName(loginInput);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Credencials incorrectes' });
    }
    req.session.user = { id: user.id, nom: user.nom, email: user.email };
    res.json(req.session.user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.get('/api/me', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: 'No autenticat' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'No s\'ha pogut tancar la sessió' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Sessió tancada' });
  });
});

// Gestió de Sales
app.post('/api/sala/crear', async (req, res) => {
  const creador_id = req.session.user?.id;
  
  if (!creador_id) {
    return res.status(401).json({ message: 'No autenticat' });
  }

  try {
    const sala = await SalaModel.crearNovaSala(creador_id);
    res.status(201).json(sala);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor al crear sala' });
  }
});

app.post('/api/sala/unir', async (req, res) => {
  const { codi_acces } = req.body;
  if (!codi_acces) {
    return res.status(400).json({ message: 'Codi d\'accés requerit' });
  }
  try {
    const sala = await SalaModel.buscarSalaPerCodi(codi_acces);
    if (!sala) {
      return res.status(404).json({ message: 'Sala no trobada o ja està en curs' });
    }
    res.json(sala);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Gestió Transaccional
app.post('/api/sala/:salaId/finalitzar', async (req, res) => {
    const salaId = parseInt(req.params.salaId, 10);
    const userId = req.session.user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'No autenticat' });
    }
    try {
        const [salaRows] = await db.query('SELECT creador_id FROM sales WHERE id = ?', [salaId]);
        if (salaRows.length === 0 || salaRows[0].creador_id !== userId) {
            return res.status(403).json({ message: 'No autoritzat per finalitzar aquesta sala' });
        }

        await SalaModel.finalitzarSessio(salaId);

        res.json({ message: 'Sala finalitzada i estadístiques actualitzades correctament.' });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor al finalitzar la sala.' });
    }
});

// Rànquing
app.get('/api/ranking', async (req, res) => {
  try {
    const ranking = await getGlobalRanking();
    res.json(ranking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});


console.log('Servidor WebSocket i API llestos (HTTP a :4000, WS a /ws)');