import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import chatRoutes from './routes/chat.js';
// import clinicRoutes from './routes/clinics.js'; // Replaced by MCP
import callRoutes from './routes/call.js';
import { initializeWebSocket } from './services/websocket.js';
import { setupMcpRoutes } from './mcp.js';

dotenv.config({ path: '../.env' });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all for hackathon
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize WebSocket Service
initializeWebSocket(io);

// Routes
app.use('/chat', chatRoutes);
// app.use('/clinics', clinicRoutes);
app.use('/call', callRoutes);

// Setup MCP over SSE
setupMcpRoutes(app);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`[Backend] Server running on http://localhost:${PORT}`);
  console.log(`[Backend] WebSocket server ready`);
});
