import express from 'express';
import session from 'express-session';
import 'dotenv/config';

import path from 'path';
import { fileURLToPath } from 'url';

import sessionConfig from './server/config/session.js';
import authRoutes from './server/routes/authRoutes.js';
import salaRoutes from './server/routes/salaRoutes.js';
import userRoutes from './server/routes/userRoutes.js';
import { createWebSocketServer } from './server/websocket/wsServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(session(sessionConfig));

app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/uploads', express.static(path.join(__dirname, '../frontend/public/uploads')));

app.use('/api', authRoutes); 
app.use('/api/sala', salaRoutes); 
app.use('/api/user', userRoutes); 

const server = app.listen(port, () => {
  console.log(`Servidor HTTP executant-se a http://localhost:${port}`);
});

createWebSocketServer(server);