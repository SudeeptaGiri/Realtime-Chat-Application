"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = 8080;
// Enable CORS for all routes
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('WebSocket Chat Server is running!');
});
const httpServer = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
const connectedUsers = new Map();
const wss = new ws_1.WebSocketServer({ server: httpServer });
wss.on('connection', (socket) => {
    console.log("New client connected 🚀");
    socket.on('error', console.error);
    socket.on('message', (data, isBinary) => {
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
        }
        catch (error) {
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
function broadcastToAll(messageData) {
    const message = JSON.stringify(messageData);
    wss.clients.forEach((client) => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            console.log("Broadcasting message to client");
            client.send(message);
        }
    });
}
console.log("WebSocket server is ready for connections on ws://localhost:8080");
