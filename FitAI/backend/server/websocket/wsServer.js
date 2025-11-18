import { WebSocketServer } from 'ws';
import { handleConnection } from './wsHandler.js';

export const createWebSocketServer = (httpServer) => {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = request.url;
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
    
  });

  wss.on('connection', handleConnection);

  console.log('Servidor WebSocket preparat per a connexions a /ws');
  return wss;
};