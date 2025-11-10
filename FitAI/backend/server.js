import express from 'express';
import session from 'express-session'; 
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from './config/database.js'; // Assegura't que la connexió a la DB funciona

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

// --- NOVES FUNCIONS DE BASE DE DADES ---

async function guardarResultats(sessionId) {
    const session = sessions[sessionId];
    if (!session || !session.leaderboard || session.leaderboard.length === 0 || !session.creadorId) {
        console.log(`Sessió ${sessionId} buida, no es guarda res.`);
        return;
    }

    const { exercici, creadorId, leaderboard } = session;
    // El codi d'accés només existeix per a sales "multi". Per a "solo" (UUID), no el guardem.
    const codiPartit = sessionId.split('-');
    const codiAcces = (codiPartit.length > 1 && codiPartit[0].toLowerCase() === exercici.toLowerCase()) ? codiPartit[1] : uuidv4().substring(0, 5);

    let client;
    try {
        client = await pool.getConnection();
        await client.beginTransaction();

        // 1. Crear la sala a la DB
        const [salaResult] = await client.execute(
            'INSERT INTO sales (creador_id, codi_acces, exercici, estat) VALUES (?, ?, ?, ?)',
            [creadorId, codiAcces, exercici, 'finalitzada']
        );
        const sala_id = salaResult.insertId;

        const participacionsInserts = [];
        const usuarisUpdates = [];

        for (const jugador of leaderboard) {
            // 2. Afegir cada participació
            participacionsInserts.push(
                client.execute(
                    'INSERT INTO participacions (usuari_id, sala_id, repeticions) VALUES (?, ?, ?)',
                    [jugador.userId, sala_id, jugador.reps]
                )
            );

            // 3. Actualitzar els totals de cada usuari (només si ha fet repeticions)
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
            userId: parseInt(userId, 10), // Guardem ID numèric
            userName: data.userName,     // Guardem Nom
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
    let currentUserId = null; // Ara serà l'ID numèric

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
                // Neteja la sessió (i la desa a la DB) si està buida
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
                    // ARA REBEM ID NUMÈRIC I NOM
                    const { sessionId, userId, userName } = message;

                    if (!sessionId || !userId || !userName) {
                        return ws.send(JSON.stringify({ error: 'sessionId, userId i userName requerits' }));
                    }

                    // Extreure l'exercici del sessionId (p.ex., "Flexions-ABCDE" o "uuid...")
                    // Per a sessions "solo" (UUID), no tenim l'exercici al nom.
                    let exercici;
                    const parts = sessionId.split('-');
                    // Comprova si la primera part coincideix amb un exercici conegut
                    const exercicisConecuts = ['flexions', 'squats', 'salts', 'abdominals'];
                    if (exercicisConecuts.includes(parts[0].toLowerCase())) {
                        exercici = parts[0];
                    } else {
                        // Per a "solo" (UUID), agafem l'exercici de la ruta (que no tenim aquí... Hauríem de passar-lo)
                        // SOLUCIÓ: El frontend (Joc.vue) el passarà al missatge 'join'
                        exercici = message.exercici; 
                    }

                    if (!sessions[sessionId]) {
                        sessions[sessionId] = {
                            exercici: exercici.toLowerCase(), // Guardem l'exercici
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

                    // Fem servir l'ID numèric com a clau
                    session.participants[userId] = { ws, reps: 0, userName: userName };
                    currentSessionId = sessionId;
                    currentUserId = userId; // ID numèric

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

                case 'update': {
                    if (
                        currentSessionId &&
                        currentUserId &&
                        sessions[currentSessionId]?.participants[currentUserId]
                    ) {
                        sessions[currentSessionId].participants[currentUserId].reps = message.reps || 0;
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

// --- RUTAS API (MODIFICADES I NOVES) ---

app.post('/api/register', async (req, res) => {
    // ... (El teu codi de registre existent està bé)
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
    // ... (El teu codi de login existent està bé)
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
            id: user.id, // <--- GUARDEM L'ID NUMÈRIC
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
    // ... (El teu codi /api/me està bé)
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ message: 'No autenticat' });
    }
});

app.post('/api/logout', (req, res) => {
    // ... (El teu codi /api/logout està bé)
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'No s\'ha pogut tancar la sessió' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Sessió tancada' });
    });
});

// Aquesta ruta es manté per al "Mode Individual"
app.get('/api/create-session', (req, res) => {
    const sessionId = uuidv4(); // Genera un ID únic per a la partida "solo"
    // No creem la sessió aquí, es crearà al 'join' del WebSocket
    console.log(`Nova sessió de sala "solo" generada: ${sessionId}`);
    res.json({ sessionId });
});

app.get('/api/check-session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    if (sessions[sessionId]) {
        return res.status(200).json({ exists: true });
    } else {
        // PERMILLORA: Podríem comprovar si la sala existeix a la DB (però ja està finalitzada)
        return res.status(404).json({ exists: false });
    }
});

// --- NOVA RUTA PEL RÀNQUING GLOBAL ---
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