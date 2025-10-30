// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const createWSServer = require('./src/ws/wsServer');

const app = express();
app.use(express.json());

// Rutes mínimes:
app.get('/health', (req, res) => res.json({ ok: true }));

// (Afegeix controllers / rutes per usuaris i sessions aquí)

const server = http.createServer(app);
createWSServer(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server escoltant a http://localhost:${PORT}`);
});
