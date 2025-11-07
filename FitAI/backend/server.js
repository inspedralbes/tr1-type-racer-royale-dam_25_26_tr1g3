import express from 'express';
import session from 'express-session';        
import { WebSocketServer, WebSocket } from 'ws'; 
import { v4 as uuidv4 } from 'uuid';           
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

const sessions = {};

function calcularLeaderboard(sessionId) {
  const session = sessions[sessionId];
  if (!session) return [];
  const leaderboard = Object.entries(session.participants)
    .map(([userId, data]) => ({ userId, reps: data.reps }))
    .sort((a, b) => b.reps - a.reps);
  session.leaderboard = leaderboard;
  return leaderboard;
}

function broadcastToSession(sessionId, message) {
  const session = sessions[sessionId];
  if (!session) return;
  Object.values(session.participants).forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

function netejarSessio(sessionId) {
  const session = sessions[sessionId];
  if (session && Object.keys(session.participants).length === 0) {
    delete sessions[sessionId];
    console.log(`Sessió ${sessionId} eliminada (sense participants)`);
  }
}

wss.on('connection', (ws) => {
  console.log('Nou client WebSocket connectat');
  let currentSessionId = null;
  let currentUserId = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Missatge rebut:', message);

      switch (message.type) {
        case 'join': {
          const { sessionId, userId } = message;

          if (!sessionId || !userId) {
            return ws.send(JSON.stringify({ error: 'sessionId i userId requerits' }));
          }

          if (!sessions[sessionId]) {
            sessions[sessionId] = { participants: {}, leaderboard: [] };
            console.log(`Sessió creada: ${sessionId}`);
          }

          const session = sessions[sessionId];
          const numParticipants = Object.keys(session.participants).length;

          if (numParticipants >= 4) {
            console.log(`Sessió ${sessionId} plena (4 jugadors màxim)`);
            return ws.send(JSON.stringify({
              type: 'error',
              message: 'La sessió està plena (màxim 4 jugadors).'
            }));
          }

          if (session.participants[userId]) {
            return ws.send(JSON.stringify({
              type: 'error',
              message: 'Usuari ja connectat en aquesta sessió.'
            }));
          }

          session.participants[userId] = { ws, reps: 0 };
          currentSessionId = sessionId;
          currentUserId = userId;

          const leaderboard = calcularLeaderboard(sessionId);
          broadcastToSession(sessionId, {
            type: 'leaderboard',
            sessionId,
            leaderboard
          });

          ws.send(JSON.stringify({
            type: 'joined',
            sessionId,
            userId,
            message: 'T’has unit a la sessió correctament.'
          }));

          console.log(`Usuari ${userId} unit a la sessió ${sessionId} (${numParticipants + 1}/4 jugadors)`);
          break;
        }

        case 'start': {
          const { sessionId } = message;
          if (!sessionId || !sessions[sessionId]) return;

          console.log(`Partida iniciada a la sessió ${sessionId}`);

          broadcastToSession(sessionId, {
            type: 'start',
            sessionId
          });
          break;
        }


        case 'update': {
          if (
            currentSessionId &&
            currentUserId &&
            sessions[currentSessionId]?.participants[currentUserId]
          ) {
            sessions[currentSessionId].participants[currentUserId].reps = message.reps || 0;
            const leaderboard = calcularLeaderboard(currentSessionId);
            broadcastToSession(currentSessionId, {
              type: 'leaderboard',
              sessionId: currentSessionId,
              leaderboard
            });
          }
          break;
        }

        case 'leave': {
          if (currentSessionId && currentUserId) {
            delete sessions[currentSessionId].participants[currentUserId];
            const leaderboard = calcularLeaderboard(currentSessionId);
            broadcastToSession(currentSessionId, {
              type: 'leaderboard',
              sessionId: currentSessionId,
              leaderboard
            });
            netejarSessio(currentSessionId);
            console.log(`Usuari ${currentUserId} ha sortit de la sessió ${currentSessionId}`);
            currentSessionId = null;
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
  });

  ws.on('error', (error) => {
    console.error('Error en WebSocket:', error);
  });
});

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

app.get('/api/create-session', (req, res) => { 
  const sessionId = uuidv4();
  sessions[sessionId] = { participants: {}, leaderboard: [] };
  console.log(`Nova sessió de sala creada: ${sessionId}`);
  res.json({ sessionId });
});

app.get('/api/check-session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  if (sessions[sessionId]) {
    return res.status(200).json({ exists: true });
  } else {
    return res.status(404).json({ exists: false });
  }
});

console.log('Servidor WebSocket i API llestos (HTTP a :4000, WS a /ws)');