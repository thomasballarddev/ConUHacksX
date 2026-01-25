import { GoogleGenerativeAI, ChatSession, SchemaType, FunctionDeclaration } from '@google/generative-ai';
import dotenv from 'dotenv';
import { initiateClinicCall, getActiveCallStatus, sendResponseToCall } from './elevenlabs-call.js';
import { emitShowClinics } from './websocket.js';
import { clinics } from '../data/clinics.js';
import { addMessage, getConversationText, getCurrentChat, debugState } from './chatStorage.js';

dotenv.config({ path: '../.env' });

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('[Gemini] Missing GEMINI_API_KEY');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

// Single chat session (one user, no auth needed)
let chatSession: ChatSession | null = null;

const SYSTEM_PROMPT = `You are a helpful AI health assistant for Health.me. You help users with:
- Understanding their health symptoms
- Finding nearby clinics and scheduling appointments
- Answering general health questions
- Providing health tips and wellness advice

Be empathetic, professional, and concise. If a user describes a medical emergency,
advise them to call emergency services immediately.

When a user describes symptoms and needs a doctor appointment:
1. First show them nearby clinics using the show_nearby_clinics function
2. When they want to book, use initiate_clinic_call to have our AI agent call the clinic on their behalf

IMPORTANT: Users may have typos or autocorrect errors. Always interpret their messages in the context of the conversation. For example, if you asked about "nausea" and they respond with "Nassau", they likely mean "nausea" - not the location. Use common sense to infer meaning from context.

Keep responses conversational and helpful.`;


// Function declarations for Gemini
const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "show_nearby_clinics",
    description: "Display a list of nearby medical clinics to the user. Call this when the user describes symptoms and needs to find a clinic or doctor. Always include the patient's symptoms.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        symptoms: {
          type: SchemaType.STRING,
          description: "Summary of the patient's symptoms as described in the conversation"
        }
      },
      required: ["symptoms"]
    }
  },
  {
    name: "initiate_clinic_call",
    description: "Start an automated phone call to a clinic to schedule an appointment on behalf of the user. Use this when the user wants to book an appointment at a specific clinic.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        clinic_name: {
          type: SchemaType.STRING,
          description: "Name of the clinic to call"
        },
        reason: {
          type: SchemaType.STRING,
          description: "Brief description of why the patient needs an appointment (symptoms)"
        }
      },
      required: ["clinic_name", "reason"]
    }
  },
  {
    name: "get_call_status",
    description: "Check the status of an ongoing clinic call",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: []
    }
  }
];

// Execute function calls
async function executeFunctionCall(name: string, args: Record<string, unknown>): Promise<string> {
  console.log(`[Gemini] Executing function: ${name}`, args);
  
  switch (name) {
    case "show_nearby_clinics": {
      const symptoms = args.symptoms as string || 'general health concerns';
      console.log(`[Gemini] Patient symptoms: ${symptoms}`);
      emitShowClinics(clinics);
      return `Displayed 3 nearby clinics to the user. The patient is experiencing: ${symptoms}. Ask them which clinic they'd like to book with.`;
    }
    
    case "initiate_clinic_call": {
      const clinicName = args.clinic_name as string;
      const reason = args.reason as string;
      // Find clinic phone number
      const clinic = clinics.find(c => c.name.toLowerCase().includes(clinicName.toLowerCase()));
      const phone = clinic?.phone || process.env.TWILIO_PHONE_NUMBER || '+14388083471';
      
      try {
        const result = await initiateClinicCall(phone, reason, clinicName);
        return `Call initiated to ${clinicName}. Our AI agent is now speaking with the receptionist on behalf of the patient. The user will see updates and be asked for input when needed (like choosing appointment times).`;
      } catch (error) {
        return `Failed to initiate call: ${error}. Please try again.`;
      }
    }
    
    case "get_call_status": {
      const status = getActiveCallStatus();
      if (status) {
        return `Call is ${status.state}. ${status.transcript?.length ? 'Last message: ' + status.transcript[status.transcript.length - 1] : ''}`;
      }
      return "No active call at the moment.";
    }
    
    default:
      return `Unknown function: ${name}`;
  }
}

export async function sendChatMessage(message: string, conversationId?: string): Promise<{ message: string; conversation_id: string; function_called?: string }> {
  // Get current chat from db.json
  const chat = getCurrentChat();

  // Store user message in db.json
  addMessage('user', message);

  // Debug: show current state
  debugState();

  // Create chat session if needed (single session for single user)
  if (!chatSession) {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations }]
    });

    chatSession = model.startChat({
      history: [],
    });

    console.log('[Gemini] Created new chat session');
  }

  try {
    console.log('[Gemini] Sending message:', message);
    let result = await chatSession.sendMessage(message);
    let response = result.response;

    // Check for function calls
    const functionCalls = response.functionCalls();
    if (functionCalls && functionCalls.length > 0) {
      const fc = functionCalls[0];
      console.log('[Gemini] Function call requested:', fc.name);

      // Execute the function
      const functionResult = await executeFunctionCall(fc.name, fc.args as Record<string, unknown>);

      // Send function result back to Gemini
      result = await chatSession.sendMessage([{
        functionResponse: {
          name: fc.name,
          response: { result: functionResult }
        }
      }]);

      response = result.response;

      const responseText = response.text();
      // Store assistant response in db.json
      addMessage('assistant', responseText);

      return {
        message: responseText,
        conversation_id: chat.id,
        function_called: fc.name
      };
    }

    const responseText = response.text();
    // Store assistant response in db.json
    addMessage('assistant', responseText);

    return {
      message: responseText,
      conversation_id: chat.id
    };
  } catch (error) {
    console.error('[Gemini] Error:', error);
    throw error;
  }
}

/**
 * Extract patient symptoms from the full conversation history stored in db.json.
 * Passes the entire conversation to Gemini and asks it to summarize the symptoms.
 */
export async function getPatientSymptoms(): Promise<string> {
  // Get conversation from db.json
  const conversationText = getConversationText();

  if (!conversationText) {
    console.log('[Gemini] No conversation history found, using default');
    return 'general health concerns';
  }

  console.log('[Gemini] Extracting symptoms from conversation...');
  console.log('[Gemini] Conversation text:', conversationText.substring(0, 200) + '...');

  try {
    // Use a simple generateContent call (not chat) to extract symptoms
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are analyzing a conversation between a patient and a health assistant.
Based on the conversation below, extract a concise list of the patient's symptoms.
Return ONLY the symptoms as a brief, comma-separated list (e.g., "sore throat, fever, headache").
Do not include any other text or explanation.

Conversation:
${conversationText}

Symptoms:`;

    const result = await model.generateContent(prompt);
    const symptoms = result.response.text().trim();

    console.log(`[Gemini] Extracted symptoms: ${symptoms}`);
    return symptoms || 'general health concerns';
  } catch (error) {
    console.error('[Gemini] Error extracting symptoms:', error);
    return 'general health concerns';
  }
}

/**
 * Reset the chat session (for new conversation)
 */
export function resetChatSession(): void {
  chatSession = null;
  console.log('[Gemini] Chat session reset');
}
