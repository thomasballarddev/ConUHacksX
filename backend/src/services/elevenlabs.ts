import { ElevenLabsClient } from '@elevenlabs/client';
import { emitChatResponse } from './websocket.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

if (!API_KEY) {
  console.warn('[ElevenLabs] Missing ELEVENLABS_API_KEY');
}

if (!AGENT_ID) {
  console.warn('[ElevenLabs] Missing ELEVENLABS_AGENT_ID');
}

// Store active conversations
const activeConversations = new Map<string, any>();

// Get signed URL for WebSocket connection
export async function getSignedUrl(): Promise<string> {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`, {
      method: 'GET',
      headers: {
        'xi-api-key': API_KEY || ''
      }
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.signed_url;
  } catch (error) {
    console.error('[ElevenLabs] Error getting signed URL:', error);
    throw error;
  }
}

// Send a chat message to the ElevenLabs agent via WebSocket (text-only mode)
export async function sendChatMessage(message: string, sessionId: string = 'default'): Promise<{ message: string }> {
  console.log(`[ElevenLabs] Sending message: "${message}" for session: ${sessionId}`);

  try {
    // For text-only mode, we need to connect via WebSocket
    // Get signed URL first
    const signedUrl = await getSignedUrl();

    // Create WebSocket connection
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(signedUrl);
      let hasResponded = false;
      let fullResponse = '';

      ws.onopen = () => {
        console.log('[ElevenLabs] WebSocket connected');

        // Send initialization for text-only mode
        ws.send(JSON.stringify({
          type: 'conversation_initiation_client_data',
          conversation_config_override: {
            agent: {
              tts: {
                // Disable audio output for text-only
              }
            }
          },
          text_only: true
        }));

        // Send the user's message
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'user_message',
            text: message
          }));
        }, 500);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data.toString());
          console.log('[ElevenLabs] Received:', data.type);

          if (data.type === 'agent_response') {
            fullResponse += (data.text || data.agent_response || '');
          }

          if (data.type === 'agent_response_end' || data.type === 'conversation_end') {
            if (!hasResponded && fullResponse) {
              hasResponded = true;

              // Emit via WebSocket to frontend
              emitChatResponse({
                role: 'assistant',
                content: fullResponse,
                timestamp: new Date().toISOString()
              });

              ws.close();
              resolve({ message: fullResponse });
            }
          }

          // Handle text chunk streaming
          if (data.type === 'text' || data.type === 'agent_text') {
            fullResponse += (data.text || '');
          }

        } catch (e) {
          console.error('[ElevenLabs] Parse error:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('[ElevenLabs] WebSocket error:', error);
        if (!hasResponded) {
          hasResponded = true;
          reject(new Error('WebSocket connection error'));
        }
      };

      ws.onclose = () => {
        console.log('[ElevenLabs] WebSocket closed');
        if (!hasResponded) {
          hasResponded = true;
          if (fullResponse) {
            resolve({ message: fullResponse });
          } else {
            reject(new Error('Connection closed without response'));
          }
        }
      };

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!hasResponded) {
          hasResponded = true;
          ws.close();
          if (fullResponse) {
            resolve({ message: fullResponse });
          } else {
            reject(new Error('Request timeout'));
          }
        }
      }, 30000);
    });

  } catch (error) {
    console.error('[ElevenLabs] Error sending message:', error);
    throw error;
  }
}

// Triggers a call to the user or clinic (if supported by API)
export async function triggerCall(phoneNumber: string, type: 'user' | 'clinic') {
  console.log(`[ElevenLabs] Triggering call to ${phoneNumber} (${type})`);
  return { success: true, message: 'Call initiated' };
}
