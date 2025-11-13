import { WebSocket } from 'ws';
import pool from '../config/database.js';

// Aquest objecte 'sessions' ara només emmagatzema connexions WS actives.
// Com que està definit aquí, persisteix a la memòria del servidor per a totes les connexions.
const sessions = {}; // Estructura: sessions[codi_acces] = { sala_id, participants: { userId: { ws, userName, reps } } }

/**
 * Envia un missatge a tots els participants d'una sessió.
 * @param {string} codi_acces - El codi de la sala.
 * @param {object} message - L'objecte del missatge a enviar.
 */
function broadcastToSession(codi_acces, message) {
  const session = sessions[codi_acces];
  if (!session) return;
  Object.values(session.participants).forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

/**
 * Calcula i envia el rànquing actualitzat (leaderboard) a tots els membres de la sala.
 * @param {string} codi_acces - El codi de la sala.
 */
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

/**
 * Elimina una sessió de la memòria si no queden participants i, opcionalment,
 * actualitza el seu estat a la base de dades.
 * @param {string} codi_acces - El codi de la sala.
 */
async function netejarSessio(codi_acces) {
  const session = sessions[codi_acces];
  if (session && Object.keys(session.participants).length === 0) {
    delete sessions[codi_acces];
    console.log(`Sessió ${codi_acces} eliminada de la memòria (sense participants)`);
    // Opcional: Marcar la sala com a 'finalitzada' a la BBDD
    try {
      await pool.execute('UPDATE sales SET estat = ? WHERE codi_acces = ? AND estat != ?', ['finalitzada', codi_acces, 'finalitzada']);
    } catch (error) {
      console.error('Error al finalitzar la sala a la BBDD:', error);
    }
  }
}

/**
 * Gestiona una nova connexió de WebSocket.
 * @param {WebSocket} ws - La instància del client WebSocket.
 */
export const handleConnection = (ws) => {
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
          const { reps, exercici, codi_acces } = message;
          const session = sessions[codi_acces];
          
          if (!session || !currentUserId || !exercici || reps === undefined) return;

          const { sala_id } = session;
          const repsFinals = parseInt(reps, 10) || 0;

          if (repsFinals > 0) {
            try {
              await pool.execute(
                'INSERT INTO participacions (usuari_id, sala_id, exercici, repeticions) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE repeticions = ?',
                [currentUserId, sala_id, exercici, repsFinals, repsFinals]
              );
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
      delete sessions[currentCodiAcces].participants[currentUserId];
      broadcastLeaderboard(currentCodiAcces);
      netejarSessio(currentCodiAcces);
    }
  });

  ws.on('error', (error) => {
    console.error('Error en WebSocket:', error);
  });
};