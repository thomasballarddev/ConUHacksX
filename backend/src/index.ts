import express, { Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { sendChatMessage } from './services/elevenlabs.js';
import { setupMcpRoutes } from './mcp.js';

dotenv.config({ path: '../.env' });

const {
  ELEVENLABS_API_KEY,
  ELEVENLABS_AGENT_ID,
  PORT = 3001
} = process.env;

// Validate required env vars
if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
  console.error('[Backend] Missing ElevenLabs credentials');
}

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Event queue for polling
interface BackendEvent {
  type: string;
  data: any;
}

const eventQueues = new Map<string, BackendEvent[]>();

// Helper functions for event queuing
function addEventToSession(sessionId: string, type: string, data: any) {
  if (!eventQueues.has(sessionId)) {
    eventQueues.set(sessionId, []);
  }
  eventQueues.get(sessionId)!.push({ type, data });
  console.log(`[Event] Added ${type} event to session ${sessionId}`);
}

function emitChatResponse(content: string, sessionId?: string) {
  if (sessionId) {
    addEventToSession(sessionId, 'chat_response', { role: 'assistant', content });
  }
}

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ POLLING ENDPOINT ============
app.get('/events', (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId required' });
  }

  // Get and clear events for this session
  const events = eventQueues.get(sessionId) || [];
  eventQueues.delete(sessionId);

  res.json(events);
});

// ============ CHAT ROUTE ============
app.post('/chat', async (req: Request, res: Response) => {
  const { message, sessionId } = req.body;
  console.log('[Chat] Received message:', message, 'sessionId:', sessionId);

  if (!message) {
    return res.status(400).json({ error: 'message required' });
  }

  try {
    const response = await sendChatMessage(message);
    console.log('[Chat] Got response from ElevenLabs:', response.message);

    const responseMessage = response.message || 'No response received';
    emitChatResponse(responseMessage, sessionId);
    res.json({ success: true, message: responseMessage });
  } catch (error) {
    console.error('[Chat] Error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

// Setup MCP server routes
setupMcpRoutes(app, {
  initiateCall: async () => ({}),
  activeCalls: new Map(),
  twilioClient: {},
  getSignedUrl: async () => '',
  sendChatMessage
});
console.log('[Backend] MCP server routes initialized');

// Start server
httpServer.listen(PORT, () => {
  console.log(`[Backend] Server running on http://localhost:${PORT}`);
});
