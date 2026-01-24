const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Connects the Twilio Stream to the ElevenLabs Conversational AI WebSocket
const handleTwilioStream = (ws, req, elevenLabsAgentId) => {
    const streamSid = req.params.streamSid || uuidv4();
    console.log(`Starting Twilio Stream Handler for Session: ${streamSid}`);

    // Connect to ElevenLabs Conversational AI WebSocket
    // Note: Protocol details are illustrative and need to match ElevenLabs exact spec for ConvAI
    // Assuming: wss://api.elevenlabs.io/v1/convai/conversation?agent_id={id}
    const elevenLabsWsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${elevenLabsAgentId}`;
    
    // We need to pass the API Key? Usually in headers.
    // WS from 'ws' package allows headers.
    const elevenLabsWs = new WebSocket(elevenLabsWsUrl, {
        headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY
        }
    });

    let streamId = null; // Twilio Stream SID

    // === ElevenLabs -> Twilio ===
    elevenLabsWs.on('open', () => {
        console.log("Connected to ElevenLabs AI");
    });

    elevenLabsWs.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            
            // Audio from Agent
            if (msg.audio) {
                // ElevenLabs sends base64 audio. Twilio expects base64 mulaw 8k.
                // Assuming ElevenLabs is configured to output ulaw 8k or we need to transcode.
                // For this prototype, we assume we configured the Agent to output compatible audio (mulaw 8000Hz).
                const audioPayload = {
                    event: "media",
                    streamSid: streamId,
                    media: {
                        payload: msg.audio 
                    }
                };
                ws.send(JSON.stringify(audioPayload));
            }

            // Handling Tool Calls from Agent
            if (msg.type === 'client_tool_call') {
                const toolName = msg.client_tool_call.tool_name;
                const toolCallId = msg.client_tool_call.tool_call_id;
                
                if (toolName === 'showAvailability') {
                    // Forward to Frontend
                    // We need access to the `userSocket` from server.js. 
                    // We can emit an event or call a callback.
                    global.broadcastToUser('show_calendar');
                }
            }

        } catch (e) {
            console.error("Error parsing ElevenLabs message:", e);
        }
    });

    elevenLabsWs.on('close', () => {
        console.log("ElevenLabs connection closed");
        ws.close();
    });

    // === Twilio -> ElevenLabs ===
    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message);
            
            if (msg.event === 'start') {
                streamId = msg.start.streamSid;
                console.log(`Twilio Stream Started: ${streamId}`);
            } else if (msg.event === 'media') {
                // Audio from Twilio (Mulaw 8k) called "payload"
                // Send to ElevenLabs
                if (elevenLabsWs.readyState === WebSocket.OPEN) {
                     const payload = {
                        user_audio_chunk: msg.media.payload
                     };
                     elevenLabsWs.send(JSON.stringify(payload));
                }
            } else if (msg.event === 'stop') {
                console.log("Twilio Stream Stopped");
                elevenLabsWs.close();
            }
        } catch (e) {
            console.error("Error parsing Twilio message:", e);
        }
    });

    ws.on('close', () => {
        console.log("Twilio connection closed");
        if (elevenLabsWs.readyState === WebSocket.OPEN) elevenLabsWs.close();
    });

    // Function to inject text (e.g., from Frontend selection)
    // We attach this to the ws object so we can call it externally? 
    // Or we store this connection in a global map.
    ws.injectText = (text) => {
        if (elevenLabsWs.readyState === WebSocket.OPEN) {
            // Check ElevenLabs docs for "inject text" or "reply"
            // Typically:
            // elevenLabsWs.send(JSON.stringify({ type: "conversation_initiation", ... }))? 
            // Or just a text event.
            // Hypothethical "text_input" event:
            elevenLabsWs.send(JSON.stringify({
                text: text
            }));
            console.log(`Injected text to Agent: ${text}`);
        }
    };
    
    // Track this active connection globally for "Bridge" logic
    global.activeTwilioStream = ws; 
};

module.exports = { handleTwilioStream };
