import express from 'express';
import session from 'express-session';
import 'dotenv/config';

// Importacions de la nova estructura
import sessionConfig from './server/config/session.js';
import authRoutes from './server/routes/authRoutes.js';
import salaRoutes from './server/routes/salaRoutes.js';
import userRoutes from './server/routes/userRoutes.js';
import { createWebSocketServer } from './server/websocket/wsServer.js';

const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(express.json());
app.use(session(sessionConfig));

// Rutes de l'API
app.use('/api', authRoutes); // Ex: /api/register, /api/login
app.use('/api/sala', salaRoutes); // Ex: /api/sala/crear
app.use('/api', userRoutes); // Ex: /api/ranking

// Creació del servidor HTTP
const server = app.listen(port, () => {
  console.log(`Servidor HTTP executant-se a http://localhost:${port}`);
});

// Inici del servidor WebSocket (adjuntat al servidor HTTP)
createWebSocketServer(server);