import { WebSocket } from 'ws';
import pool from '../config/database.js';

const sessions = {}; 

// ======================================================
// === NOU: SISTEMA DE HEARTBEAT (BATEC DE COR) ===
// ======================================================

function heartbeat() {
  // A 'this' es refereix a la connexió WebSocket (ws) individual.
  // Marqueu-la com a viva per a la propera comprovació.
  this.isAlive = true;
}

// Aquesta funció s'executarà cada 30 segons per a comprovar totes les connexions.
const interval = setInterval(function ping() {
  Object.values(sessions).forEach(session => {
    Object.values(session.participants).forEach(({ ws }) => {
      // Si un client no ha respost a l'últim 'ping', el donem per mort.
      if (ws.isAlive === false) {
        console.log(`Connexió terminada per timeout (sense resposta al ping): ${ws.userId}`);
        return ws.terminate(); // terminate() tanca la connexió bruscament.
      }
      
      // Marquem la connexió com a "possiblement morta" i li enviem un 'ping'.
      // Si respon amb un 'pong', la funció heartbeat() la tornarà a marcar com a viva.
      ws.isAlive = false;
      ws.ping();
    });
  });
}, 30000); // Executa cada 30 segons.


// ======================================================
// === RESTA DEL CODI (amb la teva lògica) ===
// ======================================================

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
    console.log(`Sessió ${codi_acces} eliminada de la memòria`);
    try {
      await pool.execute('UPDATE sales SET estat = ? WHERE codi_acces = ? AND estat != ?', ['finalitzada', codi_acces, 'finalitzada']);
    } catch (error) {
      console.error('Error al finalitzar la sala a la BBDD:', error);
    }
  }
}

function broadcastToOthers(codi_acces, message, senderId) {
  const session = sessions[codi_acces];
  if (!session) return;
  Object.entries(session.participants).forEach(([userId, { ws }]) => {
    if (userId !== senderId.toString() && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}


export const handleConnection = (ws) => {
  console.log('Nou client WebSocket connectat');
  
  // NOU: INICIALITZEM L'ESTAT DEL HEARTBEAT PER A AQUESTA CONNEXIÓ
  ws.isAlive = true;
  // NOU: DEFINIM QUÈ FER QUAN REBEM UN 'PONG' (la resposta al 'ping')
  ws.on('pong', heartbeat);

  let currentCodiAcces = null;
  let currentUserId = null;

  ws.on('message', async (data) => {
    // ... (la teva lògica de 'message' no canvia, és la mateixa que ja tens)
    try {
      const message = JSON.parse(data.toString());
      if (message.type !== 'pose_update') {
          console.log('Missatge rebut:', message);
      }

      switch (message.type) {
        case 'join': {
          const { codi_acces, userId, userName } = message;
          if (!codi_acces || !userId || !userName) {
            return ws.send(JSON.stringify({ type: 'error', message: 'Dades "join" incompletes' }));
          }
          if (!sessions[codi_acces]) {
            const [rows] = await pool.execute('SELECT id FROM sales WHERE codi_acces = ? AND estat = ?', [codi_acces, 'esperant']);
            if (rows.length === 0) {
              return ws.send(JSON.stringify({ type: 'error', message: 'La sala no existeix o ja ha començat.' }));
            }
            sessions[codi_acces] = { sala_id: rows[0].id, participants: {} };
          }
          const session = sessions[codi_acces];
          if (Object.keys(session.participants).length >= 4) {
            return ws.send(JSON.stringify({ type: 'error', message: 'La sala està plena.' }));
          }
          session.participants[userId] = { ws, userName, reps: 0 };
          currentCodiAcces = codi_acces;
          currentUserId = userId;
          ws.userId = userId; // Guardem l'ID a la pròpia connexió ws
          broadcastLeaderboard(codi_acces);
          break;
        }
        case 'start': {
          const { codi_acces } = message;
          if (!codi_acces || !sessions[codi_acces]) return;
          try {
            await pool.execute('UPDATE sales SET estat = ? WHERE codi_acces = ?', ['en_curs', codi_acces]);
            console.log(`Partida iniciada a la sessió ${codi_acces}`);
            broadcastToSession(codi_acces, { type: 'start', codi_acces });
          } catch (error) {
            console.error("Error a l'iniciar la partida:", error);
          }
          break;
        }
        case 'pose_update': {
            if (currentCodiAcces && currentUserId && message.pose) {
              broadcastToOthers(currentCodiAcces, {
                type: 'pose_update',
                from: currentUserId,
                pose: message.pose
              }, currentUserId);
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
        // ... dins de wsHandler.js

        case 'finish': {
          const { reps, exercici, codi_acces, time } = message;
          const session = sessions[codi_acces];
          const userId = currentUserId; 

          if (!session || !userId || !exercici || reps === undefined) {
            console.error('Dades "finish" invàlides o sessió no trobada. Missatge:', message);
            return;
          }
          
          const repsFinals = parseInt(reps, 10) || 0;
          const timeFinal = parseInt(time, 10) || 0;
          
          if (repsFinals > 0) {
            let connection;
            try {
              connection = await pool.getConnection();
              await connection.beginTransaction();
              await connection.execute('INSERT INTO participacions (usuari_id, sala_id, exercici, repeticions) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE repeticions = VALUES(repeticions)', [userId, session.sala_id, exercici, repsFinals]);
              await connection.execute(`UPDATE usuaris SET repeticions_totals = repeticions_totals + ?, sessions_completades = sessions_completades + 1, temps_total = IFNULL(temps_total, 0) + ?, ultima_sessio = CURDATE() WHERE id = ?`, [repsFinals, timeFinal, userId]);
              await connection.commit();
              console.log(`[Transacció ÈXIT] Dades de la sessió finalitzada per a l'usuari ${userId} guardades correctament.`);
            } catch (error) {
              if (connection) { await connection.rollback(); }
              console.error(`[Transacció ERROR] per a l'usuari ${userId}:`, error);
            } finally {
              if (connection) { connection.release(); }
            }
          }
          if (session.participants[userId]) {
            console.log(`L'usuari ${userId} ha acabat. Es prepara per sortir de la sala ${codi_acces}`);
            
            // L'eliminem de la llista de participants actius
            delete session.participants[userId];
            
            // Actualitzem la classificació per a la resta de jugadors
            broadcastLeaderboard(codi_acces);
            
            // Comprovem si la sala ha quedat buida per a netejar-la
            netejarSessio(codi_acces);
          }
          
          break;
        }

        case 'leave': {
          if (currentCodiAcces && currentUserId && sessions[currentCodiAcces]) {
            delete sessions[currentCodiAcces].participants[currentUserId];
            console.log(`Usuari ${currentUserId} ha sortit de la sessió ${currentCodiAcces}`);
            broadcastLeaderboard(currentCodiAcces);
            netejarSessio(currentCodiAcces);
            currentCodiAcces = null;
            currentUserId = null;
          }
          break;
        }

        case 'session_ended': {
          // Aquest missatge el cridarà el frontend quan es torni al menú principal
          // des de la pantalla d'estadístiques.
          if (currentCodiAcces && sessions[currentCodiAcces]) {
            console.log(`L'usuari ${currentUserId} ha confirmat el final de la sessió ${currentCodiAcces}.`);
            
            // Marquem la sala com a finalitzada a la memòria i a la BBDD
            sessions[currentCodiAcces].estat = 'finalitzada';
            try {
              await pool.execute('UPDATE sales SET estat = ? WHERE codi_acces = ?', ['finalitzada', currentCodiAcces]);
              console.log(`Sala ${currentCodiAcces} marcada com a finalitzada a la BBDD.`);
            } catch (error) {
              console.error('Error al finalitzar la sala a la BBDD:', error);
            }

            // Desconnectem l'usuari i netegem si cal
            delete sessions[currentCodiAcces].participants[currentUserId];
            broadcastLeaderboard(currentCodiAcces); // Notifiquem per si algú queda
            netejarSessio(currentCodiAcces);
          }
          break;
        }

        default:
          ws.send(JSON.stringify({ type: 'error', message: 'Tipus de missatge desconegut' }));
      }
    } catch (error) {
      console.error('Error processant missatge WS:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Error intern del servidor' }));
    }
  });

  ws.on('close', () => {
    // Aquesta és la versió simple i original, que és la correcta amb el heartbeat.
    // El heartbeat ja s'encarrega dels talls de connexió.
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

// NOU: NETEJA DE L'INTERVAL QUAN EL SERVIDOR ES TANCA (bona pràctica)
process.on('SIGINT', () => {
    clearInterval(interval);
    process.exit();
});