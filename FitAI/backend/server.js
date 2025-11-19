import express from 'express';
import session from 'express-session';
import 'dotenv/config';

// Imports per al path
import path from 'path';
import { fileURLToPath } from 'url';

// Importacions de la nova estructura
import sessionConfig from './server/config/session.js';
import authRoutes from './server/routes/authRoutes.js';
import salaRoutes from './server/routes/salaRoutes.js';
import userRoutes from './server/routes/userRoutes.js';
import { createWebSocketServer } from './server/websocket/wsServer.js';

// Configuració de __dirname per a ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(express.json());
app.use(session(sessionConfig));

// ======================================
// LÍNIA CORREGIDA
// ======================================
// Serveix fitxers estàtics (imatges, etc.) des de la carpeta 'public' DEL FRONTEND
app.use(express.static(path.join(__dirname, '../frontend/public')));
// Serve la carpeta uploads desde el backend
app.use('/uploads', express.static(path.join(__dirname, '../frontend/public/uploads')));

// ======================================

// Rutes de l'API
app.use('/api', authRoutes); // Ex: /api/register, /api/login
app.use('/api/sala', salaRoutes); // Ex: /api/sala/crear
app.use('/api/user', userRoutes); // Ex: /api/user/ranking, /api/user/profile/picture

// Creació del servidor HTTP
const server = app.listen(port, () => {
  console.log(`Servidor HTTP executant-se a http://localhost:${port}`);
});

// Inici del servidor WebSocket (adjuntat al servidor HTTP)
createWebSocketServer(server);