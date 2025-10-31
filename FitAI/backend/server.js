// server.js - Backend per a l'Entrenador Virtual en Temps Real
// Tecnologies: Node.js, Express, WebSockets (ws), uuid

import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config'; // Això son les variables del .env, recordeu que això el borra el github, el posaré al drive

// Base de dades

import sequelize from './config/database.js';
import Usuari from './models/Usuari.js';
import Sala from './models/Sala.js';
import ParticipantSala from './models/ParticipantSala.js';

// Relacions

Usuari.hasMany(Sala, { foreignKey: 'creador_id', as: 'salesCreades' });
Sala.belongsTo(Usuari, { foreignKey: 'creador_id', as: 'creador', onDelete: 'SET NULL' });

Usuari.belongsToMany(Sala, { through: ParticipantSala, foreignKey: 'usuari_id' });
Sala.belongsToMany(Usuari, { through: ParticipantSala, foreignKey: 'sala_id' });

const app = express();
const port = 4000;

app.use(cors());
app.use(express.static('public'));

const server = app.listen(port, () => {
  console.log(`✅ Servidor executant-se a http://localhost:${port}`);
});

const wss = new WebSocketServer({ server });

const sessions = {};

function calcularLeaderboard(sessionId) {
  const session = sessions[sessionId];
  if (!session) return [];

  const leaderboard = Object.entries(session.participants)
    .map(([userId, data]) => ({
      userId,
      reps: data.reps,
    }))
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
    console.log(`🗑️ Sessió ${sessionId} eliminada (sense participants)`);
  }
}

wss.on('connection', (ws) => {
  console.log('👋 Nou client connectat');

  let currentSessionId = null;
  let currentUserId = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Missatge rebut:', message);

      switch (message.type) {
        case 'join': {
          const { sessionId, userId } = message;

          if (!sessionId || !userId) {
            return ws.send(JSON.stringify({ error: '❗ sessionId i userId requerits' }));
          }

          if (!sessions[sessionId]) {
            sessions[sessionId] = { participants: {}, leaderboard: [] };
            console.log(`🆕 Sessió creada: ${sessionId}`);
          }

          const session = sessions[sessionId];
          const numParticipants = Object.keys(session.participants).length;

          if (numParticipants >= 4) {
            console.log(`⚠️ Sessió ${sessionId} plena (4 jugadors màxim)`);
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

          console.log(`✅ Usuari ${userId} unit a la sessió ${sessionId} (${numParticipants + 1}/4 jugadors)`);
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
            console.log(`👋 Usuari ${currentUserId} ha sortit de la sessió ${currentSessionId}`);
            currentSessionId = null;
            currentUserId = null;
          }
          break;
        }

        default:
          ws.send(JSON.stringify({ error: 'Tipus de missatge desconegut' }));
      }
    } catch (error) {
      console.error('❌ Error processant missatge:', error);
      ws.send(JSON.stringify({ error: 'Missatge invàlid' }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 Client desconnectat');
    if (currentSessionId && currentUserId) {
      delete sessions[currentSessionId].participants[currentUserId];
      const leaderboard = calcularLeaderboard(currentSessionId);
      broadcastToSession(currentSessionId, { 
        type: 'leaderboard', 
        sessionId: currentSessionId, 
        leaderboard 
      });
      netejarSessio(currentSessionId);
    }
  });

  ws.on('error', (error) => {
    console.error('⚠️ Error en WebSocket:', error);
  });
});

app.get('/create-session', (req, res) => {
  const sessionId = uuidv4();
  sessions[sessionId] = { participants: {}, leaderboard: [] };
  console.log(`🆕 Nova sessió creada: ${sessionId}`);
  res.json({ sessionId });
});

console.log("🚀 Servidor WebSocket llest per gestionar sessions d'entrenament en temps real");

