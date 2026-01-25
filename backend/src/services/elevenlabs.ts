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
    let userMessageSent = false;
    let greetingReceived = false;
    let responseCount = 0;

    const resolveOnce = (response: ConversationResponse) => {
      if (!resolved) {
        resolved = true;
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        resolve(response);
      }
    };

    const sendUserMessage = () => {
      if (!userMessageSent) {
        userMessageSent = true;
        agentText = ""; // Clear the greeting text
        const payload = {
          type: 'user_message',
          user_message: {
            text: message
          }
        };
        console.log('[ElevenLabs] Sending user message:', message);
        ws.send(JSON.stringify(payload));
      }
    };

    ws.onopen = () => {
      console.log('[ElevenLabs] Connected to Agent WS');
      // Don't send immediately - wait for greeting to complete
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data.toString());
        console.log('[ElevenLabs] WS Message:', data.type, JSON.stringify(data).substring(0, 200));

        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', event_id: data.ping_event?.event_id }));
        }

        if (data.type === 'agent_response') {
          responseCount++;
          const evt = data.agent_response_event || data;
          const text = evt.agent_response || evt.response || evt.text || data.text || "";
          
          if (text && typeof text === 'string' && text.length > 0) {
            if (userMessageSent) {
              // This is the response to our message
              agentText += text;
            } else {
              // This is the initial greeting - mark it received
              greetingReceived = true;
              console.log('[ElevenLabs] Greeting received:', text);
            }
          }
        }

        if (data.type === 'agent_response_correction' && userMessageSent) {
          const correctedText = data.agent_response_correction_event?.corrected_response || data.corrected_response || "";
          if (correctedText) {
            agentText = correctedText;
          }
        }

        // When greeting audio ends, send our message
        if (data.type === 'audio' && data.audio_event?.end_of_stream) {
          if (!userMessageSent && greetingReceived) {
            console.log('[ElevenLabs] Greeting audio finished, sending user message');
            sendUserMessage();
          } else if (userMessageSent && agentText) {
            // Response to our message is complete
            resolveOnce({ conversation_id, message: agentText });
          }
        }

      } catch (e) {
        console.error('Error parsing WS message', e);
      }
    };
    
    // Fallback: if no audio end_of_stream, send message after delay
    setTimeout(() => {
      if (!userMessageSent) {
        console.log('[ElevenLabs] Timeout - sending user message anyway');
        sendUserMessage();
      }
    }, 3000);

    // Final timeout
    setTimeout(() => {
        resolveOnce({
            conversation_id,
            message: agentText || "Agent processing... (no response received)"
        });
    }, 15000);

    ws.onerror = (error) => {
      console.error('[ElevenLabs] WS Error:', error);
      if (!resolved) {
        reject(error);
      }
    };
    
    ws.onclose = () => {
       console.log('[ElevenLabs] WS Closed');
       if (!resolved && agentText && userMessageSent) {
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
