import express from 'express';
import session from 'express-session';
import { WebSocketServer, WebSocket } from 'ws';
// import { v4 as uuidv4 } from 'uuid'; // Ja no el necessitem per a les sales
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from './config/database.js';

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

// Aquest objecte 'sessions' ara només emmagatzema connexions WS actives,
// no és la font de veritat de l'estat de la sala.
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
    console.log(`Sessió ${codi_acces} eliminada (sense participants)`);
    // Opcional: Marcar la sala com a 'finalitzada' a la BBDD
    try {
      await pool.execute('UPDATE sales SET estat = ? WHERE codi_acces = ? AND estat != ?', ['finalitzada', codi_acces, 'finalitzada']);
    } catch (error) {
      console.error('Error al finalitzar la sala a la BBDD:', error);
    }
  }
}

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

          // Si la sessió no existeix en memòria, la inicialitzem des de la BBDD
          if (!sessions[codi_acces]) {
            const [rows] = await pool.execute('SELECT id FROM sales WHERE codi_acces = ?', [codi_acces]);
            if (rows.length === 0) {
              return ws.send(JSON.stringify({ type: 'error', message: 'La sala no existeix.' }));
            }
            sessions[codi_acces] = { sala_id: rows[0].id, participants: {} };
          }

          const session = sessions[codi_acces];
          const numParticipants = Object.keys(session.participants).length;

          if (numParticipants >= 4) {
            return ws.send(JSON.stringify({
              type: 'error',
              message: 'La sessió està plena (màxim 4 jugadors).'
            }));
          }

          session.participants[userId] = { ws, userName, reps: 0 };
          currentCodiAcces = codi_acces;
          currentUserId = userId;

          broadcastLeaderboard(codi_acces);

          ws.send(JSON.stringify({
            type: 'joined',
            codi_acces,
            userId,
            message: 'T’has unit a la sessió correctament.'
          }));

          console.log(`Usuari ${userId} (${userName}) unit a la sessió ${codi_acces} (${numParticipants + 1}/4 jugadors)`);
          break;
        }

        case 'start': {
          const { codi_acces } = message;
          if (!codi_acces || !sessions[codi_acces]) return;
          
          // Només el creador (o el primer que s'ha unit) pot començar?
          // Per ara, només actualitzem la BBDD i avisem
          try {
            await pool.execute('UPDATE sales SET estat = ? WHERE codi_acces = ?', ['en_curs', codi_acces]);
            console.log(`Partida iniciada a la sessió ${codi_acces}`);
            broadcastToSession(codi_acces, {
              type: 'start',
              codi_acces
            });
          } catch (error) {
            console.error("Error a l'iniciar la partida:", error);
          }
          break;
        }

        case 'update': {
          if (
            currentCodiAcces &&
            currentUserId &&
            sessions[currentCodiAcces]?.participants[currentUserId]
          ) {
            sessions[currentCodiAcces].participants[currentUserId].reps = message.reps || 0;
            broadcastLeaderboard(currentCodiAcces);
          }
          break;
        }

        case 'finish': {
          // El client envia aquest missatge abans de 'leave' o desconnectar-se
          const { reps, exercici, codi_acces } = message;
          const session = sessions[codi_acces];
          
          if (!session || !currentUserId || !exercici || reps === undefined) return;

          const { sala_id } = session;
          const repsFinals = parseInt(reps, 10) || 0;

          if (repsFinals > 0) {
            try {
              // 1. Guardar a la taula de participacions
              await pool.execute(
                'INSERT INTO participacions (usuari_id, sala_id, exercici, repeticions) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE repeticions = ?',
                [currentUserId, sala_id, exercici, repsFinals, repsFinals]
              );

              // 2. Actualitzar el total de l'usuari
              await pool.execute(
                'UPDATE usuaris SET repeticions_totals = repeticions_totals + ?, sessions_completades = sessions_completades + 1 WHERE id = ?',
                [repsFinals, currentUserId]
              );
              
              console.log(`Dades guardades per usuari ${currentUserId} a sala ${sala_id}: ${repsFinals} ${exercici}`);

            } catch (error) {
              console.error("Error al guardar dades 'finish':", error);
            }
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

        default:
          ws.send(JSON.stringify({ error: 'Tipus de missatge desconegut' }));
      }
    } catch (error) {
      console.error('Error processant missatge WS:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client WebSocket desconnectat');
    if (currentCodiAcces && currentUserId && sessions[currentCodiAcces]) {
      // El client s'ha desconnectat sense 'leave' (ex: tancar pestanya)
      // Les dades 'finish' no s'hauran guardat, però el traiem de la llista
      delete sessions[currentCodiAcces].participants[currentUserId];
      broadcastLeaderboard(currentCodiAcces);
      netejarSessio(currentCodiAcces);
    }
  });

  ws.on('error', (error) => {
    console.error('Error en WebSocket:', error);
  });
});

// --- API DE REGISTRE I LOGIN (Sense canvis) ---

app.post('/api/register', async (req, res) => {
  const { nom, email, password } = req.body;
  if (!nom || !email || !password) {
    return res.status(400).json({ message: 'Tots els camps són obligatoris' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await pool.execute(
      'INSERT INTO usuaris (nom, email, password) VALUES (?, ?, ?)',
      [nom, email, hashedPassword]
    );
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
    const [rows] = await pool.execute(
      'SELECT * FROM usuaris WHERE email = ? OR nom = ?',
      [loginInput, loginInput]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Credencials incorrectes' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credencials incorrectes' });
    }
    
    req.session.user = {
      id: user.id,
      nom: user.nom,
      email: user.email,
    };
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


// --- NOVES APIS PER A SALES I RANKING ---

function generarCodiAcces(length = 5) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// API per crear una nova sala
app.post('/api/sala/crear', async (req, res) => {
  const creador_id = req.session.user?.id;
  if (!creador_id) {
    return res.status(401).json({ message: 'No autenticat' });
  }

  let codi_acces;
  let sala;
  let attempts = 0;

  // Intentem generar un codi únic (improbable que falli, però per seguretat)
  do {
    codi_acces = generarCodiAcces(5);
    try {
      const [result] = await pool.execute(
        'INSERT INTO sales (creador_id, codi_acces, estat) VALUES (?, ?, ?)',
        [creador_id, codi_acces, 'esperant']
      );
      sala = { id: result.insertId, creador_id, codi_acces, estat: 'esperant' };
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') { 
        console.error(error);
        return res.status(500).json({ message: 'Error del servidor al crear sala' });
      }
      // Si el codi està duplicat (ER_DUP_ENTRY), el bucle tornarà a provar
    }
    attempts++;
  } while (!sala && attempts < 10);

  if (!sala) {
    return res.status(500).json({ message: 'No s\'ha pogut crear la sala (massa intents)' });
  }
  
  console.log(`Sala creada: ${codi_acces} per usuari ${creador_id}`);
  res.status(201).json(sala);
});

// API per unir-se a una sala (comprovar si existeix)
app.post('/api/sala/unir', async (req, res) => {
  const { codi_acces } = req.body;
  if (!codi_acces) {
    return res.status(400).json({ message: 'Codi d\'accés requerit' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM sales WHERE codi_acces = ? AND estat = ?',
      [codi_acces.toUpperCase(), 'esperant']
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Sala no trobada o ja està en curs' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// API per obtenir el ranking global
app.get('/api/ranking', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT nom, repeticions_totals FROM usuaris WHERE repeticions_totals > 0 ORDER BY repeticions_totals DESC, nom ASC LIMIT 10'
    );
    // Mapegem a la nova estructura que espera el frontend
    const ranking = rows.map(r => ({
      jugador: r.nom,
      puntos: r.repeticions_totals
    }));
    res.json(ranking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});


// --- ELIMINACIÓ DE LES ANTIGUES RUTES DE SESSIÓ EN MEMÒRIA ---
// app.get('/api/create-session', ...); // ELIMINAT
// app.get('/api/check-session/:sessionId', ...); // ELIMINAT

console.log('Servidor WebSocket i API llestos (HTTP a :4000, WS a /ws)');
