import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import WebSocket, { WebSocketServer } from 'ws';
import Twilio from 'twilio';
import { setupMcpRoutes } from './mcp.js';
dotenv.config({ path: '../.env' });
const { ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, EMERGENCY_PHONE_NUMBER, PORT = 3001 } = process.env;
// Validate required env vars
if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
    console.error('[Backend] Missing ElevenLabs credentials');
}
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('[Backend] Missing Twilio credentials');
}
const app = express();
const httpServer = createServer(app);
// Initialize Twilio client
const twilioClient = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const eventQueues = new Map();
const activeCalls = new Map();
// Helper: Get ElevenLabs signed URL
async function getSignedUrl() {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${ELEVENLABS_AGENT_ID}`, {
        method: 'GET',
        headers: { 'xi-api-key': ELEVENLABS_API_KEY }
    });
    if (!response.ok)
        throw new Error(`Failed to get signed URL: ${response.statusText}`);
    const data = await response.json();
    return data.signed_url;
}
// Helper functions for event queuing
function addEventToSession(sessionId, type, data) {
    if (!eventQueues.has(sessionId)) {
        eventQueues.set(sessionId, []);
    }
    eventQueues.get(sessionId).push({ type, data });
    console.log(`[Event] Added ${type} event to session ${sessionId}`);
}
function emitCallStarted(callSid, sessionId) {
    if (sessionId) {
        addEventToSession(sessionId, 'call_started', callSid);
    }
}
function emitTranscriptUpdate(callSid, speaker, text, sessionId) {
    if (sessionId) {
        addEventToSession(sessionId, 'call_transcript_update', { callSid, speaker, text });
    }
}
function emitCallEnded(callSid, transcript, sessionId) {
    if (sessionId) {
        addEventToSession(sessionId, 'call_ended', { callSid, transcript });
    }
}
function emitChatResponse(content, sessionId) {
    if (sessionId) {
        addEventToSession(sessionId, 'chat_response', { role: 'assistant', content });
    }
}
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// ============ POLLING ENDPOINT ============
app.get('/events', (req, res) => {
    const sessionId = req.query.sessionId;
    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId required' });
    }
    // Get and clear events for this session
    const events = eventQueues.get(sessionId) || [];
    eventQueues.delete(sessionId);
    res.json(events);
});
// ============ CHAT ROUTE (Text-only ElevenLabs) ============
// Helper to initiate a call (used by both chat tool and direct API)
async function initiateCall(phoneNumber, prompt, firstMessage, hostUrl, sessionId) {
    const call = await twilioClient.calls.create({
        from: TWILIO_PHONE_NUMBER,
        to: phoneNumber,
        url: `https://${hostUrl}/call/twiml?prompt=${encodeURIComponent(prompt)}&first_message=${encodeURIComponent(firstMessage)}`
    });
    activeCalls.set(call.sid, {
        elevenLabsWs: null,
        twilioStreamWs: null,
        streamSid: null,
        callSid: call.sid,
        transcript: [],
        sessionId
    });
    emitCallStarted(call.sid, sessionId);
    return call.sid;
}
// Setup MCP server routes
setupMcpRoutes(app, { initiateCall, activeCalls, twilioClient, getSignedUrl });
console.log('[Backend] MCP server routes initialized');
// POST /chat - Text chat with ElevenLabs agent (text-only mode)
app.post('/chat', async (req, res) => {
    const { message, sessionId } = req.body;
    console.log('[Chat] Received message:', message, 'sessionId:', sessionId);
    if (!message) {
        return res.status(400).json({ error: 'message required' });
    }
    try {
        const signedUrl = await getSignedUrl();
        // Connect to ElevenLabs in text-only mode
        const ws = new WebSocket(signedUrl);
        let responseText = '';
        let hasResponded = false;
        ws.on('open', () => {
            console.log('[Chat] Connected to ElevenLabs');
            // Send initial config for text-only mode with client tools
            ws.send(JSON.stringify({
                type: 'conversation_initiation_client_data',
                text_only: true,
                conversation_config_override: {
                    agent: {
                        prompt: {
                            prompt: `You are Health.me, a friendly AI health assistant. You can help users with health questions and medical information.

You have access to a tool called "make_call" that allows you to initiate phone calls on behalf of the user.
When the user asks you to call someone (e.g., "call my doctor", "call Alex and tell him I'll be late"), use the make_call tool.

Always be helpful, empathetic, and provide accurate health information.`
                        }
                    },
                    tools: [
                        {
                            type: 'client',
                            name: 'make_call',
                            description: 'Initiates a phone call to a specified number with a message',
                            parameters: {
                                type: 'object',
                                properties: {
                                    phone_number: {
                                        type: 'string',
                                        description: 'The phone number to call (with country code)'
                                    },
                                    message: {
                                        type: 'string',
                                        description: 'The message or purpose of the call - what the agent should say'
                                    },
                                    recipient_name: {
                                        type: 'string',
                                        description: 'Name of the person being called'
                                    }
                                },
                                required: ['message']
                            }
                        }
                    ]
                }
            }));
            // Send the user's message
            setTimeout(() => {
                ws.send(JSON.stringify({
                    type: 'user_message',
                    text: message
                }));
            }, 500);
        });
        ws.on('message', async (data) => {
            try {
                const msg = JSON.parse(data.toString());
                console.log('[Chat] ElevenLabs event:', msg.type);
                // Handle different message types
                if (msg.type === 'agent_response' || msg.type === 'text') {
                    const text = msg.agent_response_event?.agent_response || msg.text || '';
                    if (text) {
                        responseText += text;
                    }
                }
                // Handle tool calls
                if (msg.type === 'client_tool_call') {
                    const toolName = msg.client_tool_call?.tool_name;
                    const toolParams = msg.client_tool_call?.parameters || {};
                    const toolCallId = msg.client_tool_call?.tool_call_id;
                    console.log(`[Chat] Tool call: ${toolName}`, toolParams);
                    if (toolName === 'make_call') {
                        const phoneNumber = toolParams.phone_number || EMERGENCY_PHONE_NUMBER;
                        const callMessage = toolParams.message || 'Hello, this is Health.me calling.';
                        const recipientName = toolParams.recipient_name || 'the recipient';
                        try {
                            const callSid = await initiateCall(phoneNumber, `You are calling ${recipientName} on behalf of the user. Your message: ${callMessage}`, `Hello! This is Health.me calling on behalf of your contact. ${callMessage}`, req.headers.host || 'localhost:3001', sessionId);
                            // Send tool result back to agent
                            ws.send(JSON.stringify({
                                type: 'client_tool_result',
                                tool_call_id: toolCallId,
                                result: JSON.stringify({ success: true, callSid, message: `Call initiated to ${recipientName}` })
                            }));
                        }
                        catch (callError) {
                            console.error('[Chat] Call failed:', callError);
                            ws.send(JSON.stringify({
                                type: 'client_tool_result',
                                tool_call_id: toolCallId,
                                result: JSON.stringify({ success: false, error: 'Failed to initiate call' })
                            }));
                        }
                    }
                }
                // Handle conversation end
                if (msg.type === 'agent_response_end' || msg.type === 'conversation_end') {
                    if (!hasResponded && responseText) {
                        hasResponded = true;
                        emitChatResponse(responseText, sessionId);
                        ws.close();
                        res.json({ success: true, message: responseText });
                    }
                }
                // Handle ping
                if (msg.type === 'ping' && msg.ping_event?.event_id) {
                    ws.send(JSON.stringify({
                        type: 'pong',
                        event_id: msg.ping_event.event_id
                    }));
                }
            }
            catch (parseError) {
                console.error('[Chat] Parse error:', parseError);
            }
        });
        ws.on('error', (error) => {
            console.error('[Chat] WebSocket error:', error);
            if (!hasResponded) {
                hasResponded = true;
                res.status(500).json({ error: 'Connection error' });
            }
        });
        ws.on('close', () => {
            console.log('[Chat] WebSocket closed');
            if (!hasResponded) {
                hasResponded = true;
                if (responseText) {
                    emitChatResponse(responseText, sessionId);
                    res.json({ success: true, message: responseText });
                }
                else {
                    res.status(500).json({ error: 'No response received' });
                }
            }
        });
        // Timeout after 30 seconds
        setTimeout(() => {
            if (!hasResponded) {
                hasResponded = true;
                ws.close();
                if (responseText) {
                    emitChatResponse(responseText, sessionId);
                    res.json({ success: true, message: responseText });
                }
                else {
                    res.status(504).json({ error: 'Request timeout' });
                }
            }
        }, 30000);
    }
    catch (error) {
        console.error('[Chat] Error:', error);
        res.status(500).json({ error: 'Failed to process chat request' });
    }
});
// ============ CALL ROUTES ============
// POST /call/start - Initiate an outbound call
app.post('/call/start', async (req, res) => {
    try {
        const { phoneNumber, prompt, firstMessage, sessionId } = req.body;
        const targetNumber = phoneNumber || EMERGENCY_PHONE_NUMBER;
        console.log(`[Call] Initiating call to ${targetNumber}`);
        const callSid = await initiateCall(targetNumber, prompt || 'You are a helpful health assistant.', firstMessage || 'Hello! How can I help you today?', req.headers.host || 'localhost:3001', sessionId);
        res.json({ success: true, callSid });
    }
    catch (error) {
        console.error('[Call] Error starting call:', error);
        res.status(500).json({ error: 'Failed to start call' });
    }
});
// POST /call/initiate - Alias for /call/start
app.post('/call/initiate', async (req, res) => {
    try {
        const { type, sessionId } = req.body;
        const targetNumber = type === 'emergency' ? EMERGENCY_PHONE_NUMBER : req.body.phoneNumber;
        if (!targetNumber) {
            return res.status(400).json({ error: 'phoneNumber or emergency type required' });
        }
        console.log(`[Call] Initiating ${type || 'regular'} call to ${targetNumber}`);
        const callSid = await initiateCall(targetNumber, req.body.prompt || 'You are a helpful health assistant.', req.body.firstMessage || 'Hello! How can I help you today?', req.headers.host || 'localhost:3001', sessionId);
        res.json({ success: true, callSid });
    }
    catch (error) {
        console.error('[Call] Error initiating call:', error);
        res.status(500).json({ error: 'Failed to initiate call' });
    }
});
// GET/POST /call/twiml - TwiML response for Twilio
app.all('/call/twiml', (req, res) => {
    const prompt = req.query.prompt || '';
    const firstMessage = req.query.first_message || '';
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Connect>
        <Stream url="wss://${req.headers.host}/call/media-stream">
          <Parameter name="prompt" value="${prompt}" />
          <Parameter name="first_message" value="${firstMessage}" />
        </Stream>
      </Connect>
    </Response>`;
    res.type('text/xml').send(twiml);
});
// POST /call/end - End an active call
app.post('/call/end', async (req, res) => {
    try {
        const { callSid } = req.body;
        if (!callSid) {
            return res.status(400).json({ error: 'callSid required' });
        }
        // End the Twilio call
        await twilioClient.calls(callSid).update({ status: 'completed' });
        // Clean up
        const callData = activeCalls.get(callSid);
        if (callData) {
            if (callData.elevenLabsWs?.readyState === WebSocket.OPEN) {
                callData.elevenLabsWs.close();
            }
            emitCallEnded(callSid, callData.transcript, callData.sessionId);
            activeCalls.delete(callSid);
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('[Call] Error ending call:', error);
        res.status(500).json({ error: 'Failed to end call' });
    }
});
// GET /call/status/:callSid - Get call status and transcript
app.get('/call/status/:callSid', (req, res) => {
    const callData = activeCalls.get(req.params.callSid);
    if (!callData) {
        return res.status(404).json({ error: 'Call not found' });
    }
    res.json({
        callSid: callData.callSid,
        streamSid: callData.streamSid,
        transcript: callData.transcript,
        connected: callData.elevenLabsWs?.readyState === WebSocket.OPEN
    });
});
// ============ WEBSOCKET FOR TWILIO MEDIA STREAM ============
const wss = new WebSocketServer({ noServer: true });
httpServer.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    if (pathname === '/call/media-stream') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    }
    // Let Socket.IO handle its own upgrades for other paths
});
wss.on('connection', async (twilioWs) => {
    console.log('[Twilio] Media stream connected');
    let streamSid = null;
    let callSid = null;
    let elevenLabsWs = null;
    let customParameters = null;
    // Set up ElevenLabs connection
    const setupElevenLabs = async () => {
        try {
            const signedUrl = await getSignedUrl();
            elevenLabsWs = new WebSocket(signedUrl);
            elevenLabsWs.on('open', () => {
                console.log('[ElevenLabs] Connected to Conversational AI');
                // Send initial configuration
                const initialConfig = {
                    type: 'conversation_initiation_client_data',
                    conversation_config_override: {
                        agent: {
                            prompt: {
                                prompt: customParameters?.prompt || 'You are a helpful health assistant named Health.me. Help the user with their medical questions.'
                            },
                            first_message: customParameters?.first_message || 'Hello! This is Health.me calling. How can I assist you today?'
                        }
                    }
                };
                elevenLabsWs.send(JSON.stringify(initialConfig));
            });
            elevenLabsWs.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    switch (message.type) {
                        case 'audio':
                            if (streamSid) {
                                const audioPayload = message.audio?.chunk || message.audio_event?.audio_base_64;
                                if (audioPayload) {
                                    twilioWs.send(JSON.stringify({
                                        event: 'media',
                                        streamSid,
                                        media: { payload: audioPayload }
                                    }));
                                }
                            }
                            break;
                        case 'interruption':
                            if (streamSid) {
                                twilioWs.send(JSON.stringify({ event: 'clear', streamSid }));
                            }
                            break;
                        case 'ping':
                            if (message.ping_event?.event_id) {
                                elevenLabsWs.send(JSON.stringify({
                                    type: 'pong',
                                    event_id: message.ping_event.event_id
                                }));
                            }
                            break;
                        case 'agent_response':
                            const agentText = message.agent_response_event?.agent_response;
                            if (agentText && callSid) {
                                console.log(`[Agent] ${agentText}`);
                                const callData = activeCalls.get(callSid);
                                emitTranscriptUpdate(callSid, 'agent', agentText, callData?.sessionId);
                                if (callData) {
                                    callData.transcript.push(`Agent: ${agentText}`);
                                }
                            }
                            break;
                        case 'user_transcript':
                            const userText = message.user_transcription_event?.user_transcript;
                            if (userText && callSid) {
                                console.log(`[User] ${userText}`);
                                const callData = activeCalls.get(callSid);
                                emitTranscriptUpdate(callSid, 'user', userText, callData?.sessionId);
                                if (callData) {
                                    callData.transcript.push(`User: ${userText}`);
                                }
                            }
                            break;
                    }
                }
                catch (error) {
                    console.error('[ElevenLabs] Error processing message:', error);
                }
            });
            elevenLabsWs.on('error', (error) => {
                console.error('[ElevenLabs] WebSocket error:', error);
            });
            elevenLabsWs.on('close', () => {
                console.log('[ElevenLabs] Disconnected');
            });
        }
        catch (error) {
            console.error('[ElevenLabs] Setup error:', error);
        }
    };
    // Handle messages from Twilio
    twilioWs.on('message', (message) => {
        try {
            const msg = JSON.parse(message.toString());
            switch (msg.event) {
                case 'start':
                    streamSid = msg.start.streamSid;
                    callSid = msg.start.callSid;
                    customParameters = msg.start.customParameters;
                    console.log(`[Twilio] Stream started - StreamSid: ${streamSid}, CallSid: ${callSid}`);
                    // Update stored call data
                    if (callSid && activeCalls.has(callSid)) {
                        const callData = activeCalls.get(callSid);
                        callData.streamSid = streamSid;
                        callData.twilioStreamWs = twilioWs;
                    }
                    // Now set up ElevenLabs with the parameters
                    setupElevenLabs();
                    break;
                case 'media':
                    if (elevenLabsWs?.readyState === WebSocket.OPEN) {
                        elevenLabsWs.send(JSON.stringify({
                            user_audio_chunk: Buffer.from(msg.media.payload, 'base64').toString('base64')
                        }));
                    }
                    break;
                case 'stop':
                    console.log(`[Twilio] Stream ${streamSid} ended`);
                    if (elevenLabsWs?.readyState === WebSocket.OPEN) {
                        elevenLabsWs.close();
                    }
                    if (callSid) {
                        const callData = activeCalls.get(callSid);
                        if (callData) {
                            emitCallEnded(callSid, callData.transcript, callData.sessionId);
                            activeCalls.delete(callSid);
                        }
                    }
                    break;
            }
        }
        catch (error) {
            console.error('[Twilio] Error processing message:', error);
        }
    });
    twilioWs.on('close', () => {
        console.log('[Twilio] Client disconnected');
        if (elevenLabsWs?.readyState === WebSocket.OPEN) {
            elevenLabsWs.close();
        }
    });
    twilioWs.on('error', (error) => {
        console.error('[Twilio] WebSocket error:', error);
    });
});
// Export functions for MCP tools
export { initiateCall, activeCalls, twilioClient, getSignedUrl };
// Start server
httpServer.listen(PORT, () => {
    console.log(`[Backend] Server running on http://localhost:${PORT}`);
    console.log(`[Backend] WebSocket server ready`);
});
