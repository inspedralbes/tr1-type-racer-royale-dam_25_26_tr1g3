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
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 setmana
    },
}));

const server = app.listen(port, () => {
    console.log(`Servidor HTTP executant-se a http://localhost:${port}`);
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

// Objecte en memòria per les sessions ACTIVES
const sessions = {};

// --- FUNCIONS DE BASE DE DADES (CORREGIDES) ---

// ⚠️ RECORDA EXECUTAR AIXÒ A LA TEVA DB 1 VEGADA:
// ALTER TABLE sales ADD COLUMN exercici VARCHAR(100) NOT NULL AFTER codi_acces;
async function guardarResultats(sessionId) {
    const session = sessions[sessionId];
    if (!session || !session.leaderboard || session.leaderboard.length === 0 || !session.creadorId) {
        console.log(`Sessió ${sessionId} buida, no es guarda res.`);
        return;
    }

    const { exercici, creadorId, leaderboard } = session;
    const codiPartit = sessionId.split('-');
    const codiAcces = (codiPartit.length > 1 && codiPartit[0].toLowerCase() === exercici.toLowerCase()) ? codiPartit[1] : uuidv4().substring(0, 5);

    let client;
    try {
        client = await pool.getConnection();
        await client.beginTransaction();

        // 1. Crear la sala a la DB (El teu codi ja incloïa 'exercici', la DB ha d'estar actualitzada)
        const [salaResult] = await client.execute(
            'INSERT INTO sales (creador_id, codi_acces, exercici, estat) VALUES (?, ?, ?, ?)',
            [creadorId, codiAcces, exercici, 'finalitzada']
        );
        const sala_id = salaResult.insertId;

        const participacionsInserts = [];
        const usuarisUpdates = [];

        for (const jugador of leaderboard) {
            // ✅ CORRECCIÓ 3: S'ha afegit 'exercici' al INSERT de participacions
            participacionsInserts.push(
                client.execute(
                    'INSERT INTO participacions (usuari_id, sala_id, exercici, repeticions) VALUES (?, ?, ?, ?)',
                    [jugador.userId, sala_id, exercici, jugador.reps]
                )
            );

            // 3. Actualitzar els totals de cada usuari
            if (jugador.reps > 0) {
                usuarisUpdates.push(
                    client.execute(
                        'UPDATE usuaris SET repeticions_totals = repeticions_totals + ?, sessions_completades = sessions_completades + 1 WHERE id = ?',
                        [jugador.reps, jugador.userId]
                    )
                );
            }
        }

        await Promise.all([...participacionsInserts, ...usuarisUpdates]);
        await client.commit();
        console.log(`Sessió ${sessionId} guardada a la DB (Sala ID: ${sala_id})`);

    } catch (error) {
        if (client) await client.rollback();
        console.error(`Error guardant sessió ${sessionId} a la DB:`, error);
    } finally {
        if (client) client.release();
    }
}

async function netejarSessio(sessionId) {
    const session = sessions[sessionId];
    if (session && Object.keys(session.participants).length === 0) {
        // Guardem resultats abans d'esborrar de memòria
        await guardarResultats(sessionId);
        delete sessions[sessionId];
        console.log(`Sessió ${sessionId} eliminada (i guardada a la DB)`);
    }
}

// --- FUNCIONS DE WEBSOCKET (MODIFICADES) ---

function calcularLeaderboard(sessionId) {
    const session = sessions[sessionId];
    if (!session) return [];
    
    const leaderboard = Object.entries(session.participants)
        .map(([userId, data]) => ({
            userId: parseInt(userId, 10),
            userName: data.userName,
            reps: data.reps
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

wss.on('connection', (ws) => {
    console.log('Nou client WebSocket connectat');
    let currentSessionId = null;
    let currentUserId = null;

    function handleLeave() {
        if (currentSessionId && currentUserId && sessions[currentSessionId]?.participants[currentUserId]) {
            const oldSessionId = currentSessionId;
            console.log(`Usuari ${currentUserId} ha sortit de la sessió ${oldSessionId}`);
            
            delete sessions[oldSessionId].participants[currentUserId];

            if (sessions[oldSessionId]) {
                const leaderboard = calcularLeaderboard(oldSessionId);
                broadcastToSession(oldSessionId, {
                    type: 'leaderboard',
                    sessionId: oldSessionId,
                    leaderboard
                });
                netejarSessio(oldSessionId).catch(err => console.error("Error en netejarSessio:", err));
            }
            
            currentSessionId = null;
            currentUserId = null;
        }
    }

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('Missatge rebut:', message);

            switch (message.type) {
                case 'join': {
                    const { sessionId, userId, userName, exercici: exerciciClient } = message; // S'ha afegit exerciciClient

                    if (!sessionId || !userId || !userName) {
                        return ws.send(JSON.stringify({ error: 'sessionId, userId i userName requerits' }));
                    }

                    // A les sales "solo" (UUID), l'exercici no està al sessionId, l'agafem del client.
                    // El teu frontend (Joc.vue) ja l'envia.
                    let exercici;
                    const parts = sessionId.split('-');
                    const exercicisConecuts = ['flexions', 'squats', 'salts', 'abdominals'];
                    
                    if (exercicisConecuts.includes(parts[0].toLowerCase())) {
                        exercici = parts[0];
                    } else {
                        // Per a "solo" (UUID), agafem l'exercici del missatge 'join'
                        exercici = exerciciClient; 
                    }

                    if (!exercici) {
                         return ws.send(JSON.stringify({ error: 'Exercici no especificat per a aquesta sessió.' }));
                    }

                    if (!sessions[sessionId]) {
                        sessions[sessionId] = {
                            exercici: exercici.toLowerCase(),
                            creadorId: userId,
                            participants: {},
                            leaderboard: []
                        };
                        console.log(`Sessió creada: ${sessionId}`);
                    }

                    const session = sessions[sessionId];
                    const numParticipants = Object.keys(session.participants).length;

                    if (numParticipants >= 4) {
                        return ws.send(JSON.stringify({ type: 'error', message: 'La sessió està plena (màxim 4 jugadors).' }));
                    }

                    session.participants[userId] = { ws, reps: 0, userName: userName };
                    currentSessionId = sessionId;
                    currentUserId = userId;

                    const leaderboard = calcularLeaderboard(sessionId);
                    broadcastToSession(sessionId, { type: 'leaderboard', sessionId, leaderboard });
                    break;
                }

                case 'start': {
                    const { sessionId } = message;
                    if (!sessionId || !sessions[sessionId]) return;
                    console.log(`Partida iniciada a la sessió ${sessionId}`);
                    broadcastToSession(sessionId, { type: 'start', sessionId });
                    break;
                }

                // ✅ CORRECCIÓ 1: S'ha canviat 'update' per 'rep_completed'
                case 'rep_completed': { 
                    if (
                        currentSessionId &&
                        currentUserId &&
                        sessions[currentSessionId]?.participants[currentUserId]
                    ) {
                        // Incrementa el comptador al servidor
                        sessions[currentSessionId].participants[currentUserId].reps += 1;
                        
                        const leaderboard = calcularLeaderboard(currentSessionId);
                        broadcastToSession(currentSessionId, { type: 'leaderboard', sessionId: currentSessionId, leaderboard });
                    }
                    break;
                }

                case 'leave': {
                    handleLeave();
                    break;
                }
            }
        } catch (error) {
            console.error('Error processant missatge WS:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client WebSocket desconnectat');
        handleLeave();
    });

    ws.on('error', (error) => {
        console.error('Error en WebSocket:', error);
        handleLeave();
    });
});

// --- RUTAS API (Sense canvis, però s'inclouen) ---

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
    console.log(`Nova sessió de sala "solo" generada: ${sessionId}`);
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

app.get('/api/ranking-global', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT nom, repeticions_totals FROM usuaris WHERE repeticions_totals > 0 ORDER BY repeticions_totals DESC LIMIT 10'
        );
        
        const ranking = rows.map(user => ({
            jugador: user.nom,
            puntos: user.repeticions_totals
        }));
        res.json(ranking);

    } catch (error) {
        console.error('Error obtenint ranking global:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

console.log('Servidor WebSocket i API llestos.');