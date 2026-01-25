/**
 * Main Server - Express + WebSocket for ElevenLabs Single-Agent System
 * One agent handles both browser chat AND phone calls with server tools
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server for both Express and WebSocket
const server = http.createServer(app);

// WebSocket server for frontend client connections
const wss = new WebSocketServer({ server, path: '/ws' });

// Track connected clients
const clients = new Set();

// ============================================
// Pending Request Queue for Server Tools
// ============================================
// When the agent calls a server tool during a phone call,
// we hold the HTTP response until the user responds via UI
const pendingRequests = new Map();

/**
 * Create a pending request that waits for user response
 */
function createPendingRequest(requestId, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error('Request timed out waiting for user response'));
    }, timeoutMs);
    
    pendingRequests.set(requestId, {
      resolve: (data) => {
        clearTimeout(timeout);
        pendingRequests.delete(requestId);
        resolve(data);
      },
      reject: (error) => {
        clearTimeout(timeout);
        pendingRequests.delete(requestId);
        reject(error);
      },
      createdAt: Date.now()
    });
  });
}

/**
 * Resolve a pending request with user's response
 */
function resolvePendingRequest(requestId, data) {
  const pending = pendingRequests.get(requestId);
  if (pending) {
    pending.resolve(data);
    return true;
  }
  return false;
}

// ============================================
// WebSocket Connection Handler
// ============================================
wss.on('connection', (ws) => {
  console.log('[Server] Client connected via WebSocket');
  clients.add(ws);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleClientMessage(ws, message);
    } catch (error) {
      console.error('[Server] Invalid message format:', error);
    }
  });

  ws.on('close', () => {
    console.log('[Server] Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('[Server] WebSocket error:', error);
    clients.delete(ws);
  });
});

/**
 * Handle incoming messages from frontend client
 */
function handleClientMessage(ws, message) {
  console.log('[Server] Client message:', message.type);
  
  switch (message.type) {
    case 'appointment_selected':
      // User selected an appointment slot OR asked for next week
      console.log('[Server] User selected slot:', message.slot);
      resolvePendingRequest('slot_selection', {
        type: message.slot === 'ask_next_week' ? 'ask_next_week' : 'slot_selected',
        selectedSlot: message.slot
      });
      break;
      
    case 'user_answer':
      // User answered a question from the agent
      console.log('[Server] User answered:', message.answer);
      resolvePendingRequest('user_question', {
        answer: message.answer
      });
      break;
      
    default:
      console.log('[Server] Unknown client message type:', message.type);
  }
}

/**
 * Broadcast message to all connected WebSocket clients
 */
function broadcastToClients(message) {
  const payload = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(payload);
    }
  });
}

// ============================================
// REST API Endpoints
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connectedClients: clients.size,
    pendingRequests: pendingRequests.size
  });
});

// Get agent configuration (for frontend)
app.get('/api/config', (req, res) => {
  res.json({
    agentId: process.env.ELEVENLABS_AGENT_ID,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  });
});

/**
 * Server Tool: Get User Appointment Preference
 * 
 * Called by the agent during a phone call when receptionist provides slots.
 * Agent says "give me a second" then calls this tool.
 * We show calendar to user and wait for their selection.
 */
app.post('/api/server-tools/get-preference', async (req, res) => {
  const { available_slots } = req.body;
  
  if (!available_slots || !Array.isArray(available_slots)) {
    return res.status(400).json({ error: 'available_slots array is required' });
  }
  
  console.log('[Server] Agent requesting user preference for slots:', available_slots);
  
  // Show calendar to user via WebSocket
  broadcastToClients({
    type: 'appointment_slots',
    data: { 
      slots: available_slots,
      showAskNextWeek: true
    }
  });
  
  try {
    // Wait for user to select a slot (60 second timeout)
    const userResponse = await createPendingRequest('slot_selection', 60000);
    
    console.log('[Server] User responded:', userResponse);
    
    res.json({
      success: true,
      response_type: userResponse.type,
      selected_slot: userResponse.selectedSlot
    });
    
  } catch (error) {
    console.error('[Server] Error waiting for user preference:', error.message);
    res.json({
      success: false,
      response_type: 'timeout',
      error: 'User did not respond in time'
    });
  }
});

/**
 * Server Tool: Ask User Question
 * 
 * Called by the agent during a phone call when receptionist asks something
 * the agent doesn't know (e.g., date of birth, insurance info).
 * We show a text prompt to user and wait for their answer.
 */
app.post('/api/server-tools/ask-user', async (req, res) => {
  const { question } = req.body;
  
  if (!question) {
    return res.status(400).json({ error: 'question is required' });
  }
  
  console.log('[Server] Agent asking user:', question);
  
  // Show question prompt to user via WebSocket
  broadcastToClients({
    type: 'user_question',
    data: { question }
  });
  
  try {
    // Wait for user to answer (60 second timeout)
    const userResponse = await createPendingRequest('user_question', 60000);
    
    console.log('[Server] User answered:', userResponse.answer);
    
    res.json({
      success: true,
      answer: userResponse.answer
    });
    
  } catch (error) {
    console.error('[Server] Error waiting for user answer:', error.message);
    res.json({
      success: false,
      error: 'User did not respond in time'
    });
  }
});

/**
 * Trigger Outbound Call
 * 
 * Called by the frontend (via client tool) when user agrees to call clinic.
 * Initiates outbound call using ElevenLabs API.
 */
app.post('/api/trigger-call', async (req, res) => {
  const { reason, userContext } = req.body;
  
  if (!reason) {
    return res.status(400).json({ error: 'Reason is required' });
  }
  
  console.log('[Server] Triggering outbound call:', reason);
  
  // Notify user that call is starting
  broadcastToClients({
    type: 'call_status',
    data: { status: 'connecting', message: 'Connecting to clinic...' }
  });
  
  try {
    // Initiate outbound call via ElevenLabs API
    const response = await fetch(
      'https://api.elevenlabs.io/v1/convai/conversation/initiate-outbound-call',
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent_id: process.env.ELEVENLABS_AGENT_ID,
          agent_overrides: {
            prompt: {
              prompt: `You are now calling a clinic on behalf of a patient.
              
REASON FOR CALL: ${reason}

PATIENT CONTEXT:
${JSON.stringify(userContext || {}, null, 2)}

INSTRUCTIONS:
1. Introduce yourself professionally
2. Explain you're calling to schedule an appointment
3. When given available times, say "give me a moment to check with the patient" and use the get_user_appointment_preference tool
4. If asked questions you don't know, say "let me check with the patient" and use the ask_user_question tool
5. Confirm the appointment and thank the receptionist`
            }
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to initiate call: ${error}`);
    }

    const result = await response.json();
    
    broadcastToClients({
      type: 'call_status',
      data: { status: 'connected', message: 'Connected to clinic' }
    });
    
    res.json({ success: true, conversationId: result.conversation_id });

  } catch (error) {
    console.error('[Server] Call initiation failed:', error);
    
    broadcastToClients({
      type: 'call_status',
      data: { status: 'error', message: 'Failed to connect' }
    });
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// Start Server
// ============================================

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     ElevenLabs Single-Agent Healthcare System                  ║
╠════════════════════════════════════════════════════════════════╣
║  Server running on http://localhost:${PORT}                       ║
║  WebSocket endpoint: ws://localhost:${PORT}/ws                    ║
╠════════════════════════════════════════════════════════════════╣
║  API Endpoints:                                                ║
║  • GET  /api/health                    - Health check          ║
║  • GET  /api/config                    - Get agent config      ║
║  • POST /api/trigger-call              - Start outbound call   ║
║  • POST /api/server-tools/get-preference - Slot selection      ║
║  • POST /api/server-tools/ask-user     - Ask user question     ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server };
