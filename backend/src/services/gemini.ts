import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('[Gemini] Missing GEMINI_API_KEY');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

// Store chat sessions by conversation ID for continuity
const chatSessions = new Map<string, ChatSession>();

const SYSTEM_PROMPT = `You are a helpful AI health assistant for Health.me. You help users with:
- Understanding their health symptoms
- Finding nearby clinics and scheduling appointments
- Answering general health questions
- Providing health tips and wellness advice

Be empathetic, professional, and concise. If a user describes a medical emergency, 
advise them to call emergency services immediately.

You have access to the user's health records and can help them navigate the healthcare system.
Keep responses conversational and helpful.`;

export async function sendChatMessage(message: string, conversationId?: string): Promise<{ message: string; conversation_id: string }> {
  // Generate or reuse conversation ID
  const convId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  let chatSession = chatSessions.get(convId);
  
  if (!chatSession) {
    // Create new chat session with system instruction
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT
    });
    
    chatSession = model.startChat({
      history: [],
    });
    
    chatSessions.set(convId, chatSession);
    console.log('[Gemini] Created new chat session:', convId);
  }
  
  try {
    console.log('[Gemini] Sending message:', message);
    const result = await chatSession.sendMessage(message);
    const response = result.response.text();
    console.log('[Gemini] Response:', response.substring(0, 100) + '...');
    
    return {
      message: response,
      conversation_id: convId
    };
  } catch (error) {
    console.error('[Gemini] Error:', error);
    throw error;
  }
}

// Clean up old sessions (call periodically)
export function cleanupOldSessions(maxAgeMs: number = 30 * 60 * 1000) {
  // Simple cleanup - in production, track last access time
  if (chatSessions.size > 100) {
    const keysToDelete = Array.from(chatSessions.keys()).slice(0, 50);
    keysToDelete.forEach(key => chatSessions.delete(key));
    console.log('[Gemini] Cleaned up', keysToDelete.length, 'old sessions');
  }
}
