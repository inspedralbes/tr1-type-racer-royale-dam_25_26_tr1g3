// server.js - Backend per a l'Entrenador Virtual en Temps Real
// Tecnologies: Node.js, Express, WebSockets (ws), uuid
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid'; // Per generar IDs únics de sessions

const app = express();
const port = 3000; // Port del servidor

// Servidor HTTP amb Express
app.use(cors());
app.use(express.static('public')); // Serveix fitxers estàtics del frontend (opcional)

// Crea el servidor HTTP
const server = app.listen(port, () => {
  console.log(`Servidor executant-se a http://localhost:${port}`);
});

// Instància de WebSocket Server
const wss = new WebSocketServer({ server });

// Estructura de dades en memòria (sense base de dades)
const sessions = {}; // { sessionId: { participants: { userId: { ws, reps } }, leaderboard: [] } }

// Funció per calcular i ordenar el leaderboard
function calcularLeaderboard(sessionId) {
  const session = sessions[sessionId];
  if (!session) return [];

  const leaderboard = Object.entries(session.participants)
    .map(([userId, data]) => ({
      userId,
      reps: data.reps,
    }))
    .sort((a, b) => b.reps - a.reps); // Ordenat per repeticions descendents

  session.leaderboard = leaderboard;
  return leaderboard;
}

// Funció per fer broadcast a tots els clients d'una sessió
function broadcastToSession(sessionId, message) {
  const session = sessions[sessionId];
  if (!session) return;

  Object.values(session.participants).forEach(({ ws }) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

// Gestió de connexions WebSocket
wss.on('connection', (ws) => {
  console.log('Nou client connectat');

  let currentSessionId = null;
  let currentUserId = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Missatge rebut:', message);

      switch (message.type) {
        case 'join': {
          const { sessionId, userId } = message;
          if (!sessions[sessionId]) {
            sessions[sessionId] = { participants: {}, leaderboard: [] };
          }
          sessions[sessionId].participants[userId] = { ws, reps: 0 };
          currentSessionId = sessionId;
          currentUserId = userId;

          const leaderboard = calcularLeaderboard(sessionId);
          broadcastToSession(sessionId, { type: 'leaderboard', sessionId, leaderboard });
          break;
        }

        case 'update':
          if (
            currentSessionId &&
            currentUserId &&
            sessions[currentSessionId]?.participants[currentUserId]
          ) {
            sessions[currentSessionId].participants[currentUserId].reps = message.reps;
            const leaderboard = calcularLeaderboard(currentSessionId);
            broadcastToSession(currentSessionId, { type: 'leaderboard', sessionId: currentSessionId, leaderboard });
          }
          break;

        case 'leave':
          if (currentSessionId && currentUserId) {
            delete sessions[currentSessionId].participants[currentUserId];
            const leaderboard = calcularLeaderboard(currentSessionId);
            broadcastToSession(currentSessionId, { type: 'leaderboard', sessionId: currentSessionId, leaderboard });
            currentSessionId = null;
            currentUserId = null;
          }
          break;

        default:
          ws.send(JSON.stringify({ error: 'Tipus de missatge desconegut' }));
      }
    } catch (error) {
      console.error('Error processant missatge:', error);
      ws.send(JSON.stringify({ error: 'Missatge invàlid' }));
    }
  });

  ws.on('close', () => {
    console.log('Client desconnectat');
    if (currentSessionId && currentUserId) {
      delete sessions[currentSessionId].participants[currentUserId];
      const leaderboard = calcularLeaderboard(currentSessionId);
      broadcastToSession(currentSessionId, { type: 'leaderboard', sessionId: currentSessionId, leaderboard });
    }
  });

  ws.on('error', (error) => {
    console.error('Error en WebSocket:', error);
  });
});

// Ruta per crear una nova sessió (opcional)
app.get('/create-session', (req, res) => {
  const sessionId = uuidv4();
  sessions[sessionId] = { participants: {}, leaderboard: [] };
  res.json({ sessionId });
});

console.log("Servidor WebSocket llest per gestionar sessions d'entrenament");
