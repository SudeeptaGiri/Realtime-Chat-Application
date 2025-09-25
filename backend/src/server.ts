import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';

const app = express();
const PORT = 8080;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response): void => {
  res.send('WebSocket Chat Server is running!');
});

const httpServer = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Store connected users with their usernames
interface User {
  socket: WebSocket;
  username: string;
}

const connectedUsers = new Map<WebSocket, string>();

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (socket: WebSocket) => {
  console.log("New client connected 🚀");
  
  socket.on('error', console.error);
  
  socket.on('message', (data: Buffer, isBinary: boolean) => {
    try {
      const messageData = JSON.parse(data.toString());
      console.log("Received message:", messageData);

      switch (messageData.type) {
        case 'join':
          // Store username for this socket
          connectedUsers.set(socket, messageData.username);
          console.log(`User ${messageData.username} joined the chat`);
          
          // Broadcast join message to all clients
          broadcastToAll({
            type: 'join',
            username: messageData.username,
            message: messageData.message,
            timestamp: new Date().toLocaleTimeString()
          });
          break;

        case 'message':
          // Broadcast regular message to all clients
          broadcastToAll({
            type: 'message',
            username: messageData.username,
            message: messageData.message,
            timestamp: messageData.timestamp
          });
          break;

        case 'leave':
          // Handle user leaving
          connectedUsers.delete(socket);
          broadcastToAll({
            type: 'leave',
            username: messageData.username,
            message: messageData.message,
            timestamp: new Date().toLocaleTimeString()
          });
          break;

        default:
          console.log('Unknown message type:', messageData.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  socket.on('close', () => {
    const username = connectedUsers.get(socket);
    if (username) {
      console.log(`User ${username} disconnected`);
      connectedUsers.delete(socket);
      
      // Broadcast leave message to remaining clients
      broadcastToAll({
        type: 'leave',
        username: username,
        message: `${username} left the chat`,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  });
});

// Helper function to broadcast to all connected clients
function broadcastToAll(messageData: any) {
  const message = JSON.stringify(messageData);
  
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      console.log("Broadcasting message to client");
      client.send(message);
    }
  });
}

console.log("WebSocket server is ready for connections on ws://localhost:8080");