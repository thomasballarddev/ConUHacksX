import dotenv from 'dotenv';
import { TimeSlot } from '../types/index.js';
import WebSocket from 'ws';

dotenv.config({ path: '../.env' });

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

if (!API_KEY) {
  console.warn('[ElevenLabs] Missing ELEVENLABS_API_KEY');
}

// Interface for ElevenLabs Conversational AI API responses
interface ConversationResponse {
  conversation_id: string;
  audio?: string; // Base64 audio if TTS
  message?: string;
}

export async function sendChatMessage(message: string, conversationId?: string): Promise<ConversationResponse> {
  const signedUrlResponse = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`, {
    method: 'GET',
    headers: {
      'xi-api-key': API_KEY || ''
    }
  });

  if (!signedUrlResponse.ok) {
    throw new Error(`ElevenLabs API error: ${signedUrlResponse.statusText}`);
  }

  const { conversation_id } = await signedUrlResponse.json();
  const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${AGENT_ID}&conversation_id=${conversation_id}`;

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let agentText = "";
    let resolved = false;

    const resolveOnce = (response: ConversationResponse) => {
      if (!resolved) {
        resolved = true;
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        resolve(response);
      }
    };

    ws.onopen = () => {
      console.log('[ElevenLabs] Connected to Agent WS');
      // ElevenLabs ConvAI protocol: send user text as 'user_message' type
      const payload = {
        type: 'user_message',
        user_message: {
          text: message
        }
      };
      console.log('[ElevenLabs] Sending user message:', message);
      ws.send(JSON.stringify(payload));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data.toString());
        console.log('[ElevenLabs] WS Message:', data.type, JSON.stringify(data).substring(0, 200));

        if (data.type === 'ping') {
          // Respond to keep connection alive
          ws.send(JSON.stringify({ type: 'pong', event_id: data.ping_event?.event_id }));
        }

        if (data.type === 'agent_response') {
          // Structure varies. Common patterns:
          // { type: "agent_response", agent_response_event: { agent_response: "text here" } }
          // OR: { type: "agent_response", agent_response_event: { response: "text" } }
          // OR: { type: "agent_response", text: "..." }
          const evt = data.agent_response_event || data;
          const text = evt.agent_response || evt.response || evt.text || data.text || "";
          
          if (text && typeof text === 'string' && text.length > 0) {
            agentText += text;
          }
        }

        // Some implementations send "agent_response_correction" with final text
        if (data.type === 'agent_response_correction') {
          const correctedText = data.agent_response_correction_event?.corrected_response || data.corrected_response || "";
          if (correctedText) {
            agentText = correctedText; // Replace with corrected version
          }
        }

        // Look for end-of-turn or final message indicator
        // Some agents send "audio" with is_final flag or "end_of_response" type
        if (data.type === 'audio' && data.audio_event?.end_of_stream) {
          // Audio stream finished, if we have text, resolve
          if (agentText) {
            resolveOnce({ conversation_id, message: agentText });
          }
        }

      } catch (e) {
        console.error('Error parsing WS message', e);
      }
    };
    
    // TIMEOUT / Safety - wait longer for full response
    setTimeout(() => {
        resolveOnce({
            conversation_id,
            message: agentText || "Agent processing... (no text response received)"
        });
    }, 10000);

    ws.onerror = (error) => {
      console.error('[ElevenLabs] WS Error:', error);
      if (!resolved) {
        reject(error);
      }
    };
    
    ws.onclose = () => {
       console.log('[ElevenLabs] WS Closed');
       // If we have accumulated text but didn't resolve yet, do it now
       if (!resolved && agentText) {
         resolveOnce({ conversation_id, message: agentText });
       }
    };
  });
}

// Triggers a call to the user or clinic (if supported by API)
// For this hackathon, we might rely on the Agent being triggered manually or via a specific "start call" endpoint
export async function triggerCall(phoneNumber: string, type: 'user' | 'clinic') {
  console.log(`[ElevenLabs] Triggering call to ${phoneNumber} (${type})`);
  // This would use the ElevenLabs API to initiate an outbound call if available
  // Mocking it for now as "action successful" 
  return { success: true, message: 'Call initiated' };
}
