import { GoogleGenerativeAI, ChatSession, SchemaType, FunctionDeclaration } from '@google/generative-ai';
import dotenv from 'dotenv';
import { initiateClinicCall, getActiveCallStatus, sendResponseToCall } from './elevenlabs-call.js';
import { emitShowClinics } from './websocket.js';
import { clinics } from '../data/clinics.js';

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

When a user describes symptoms and needs a doctor appointment:
1. First show them nearby clinics using the show_nearby_clinics function
2. When they want to book, use initiate_clinic_call to have our AI agent call the clinic on their behalf

Keep responses conversational and helpful.`;

// Store current patient symptoms for call context
let currentPatientSymptoms: string = '';

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
      currentPatientSymptoms = symptoms;
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
  const convId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  let chatSession = chatSessions.get(convId);
  
  if (!chatSession) {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations }]
    });
    
    chatSession = model.startChat({
      history: [],
    });
    
    chatSessions.set(convId, chatSession);
    console.log('[Gemini] Created new chat session:', convId);
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
      
      return {
        message: response.text(),
        conversation_id: convId,
        function_called: fc.name
      };
    }
    
    return {
      message: response.text(),
      conversation_id: convId
    };
  } catch (error) {
    console.error('[Gemini] Error:', error);
    throw error;
  }
}

// Clean up old sessions
export function cleanupOldSessions(maxAgeMs: number = 30 * 60 * 1000) {
  if (chatSessions.size > 100) {
    const keysToDelete = Array.from(chatSessions.keys()).slice(0, 50);
    keysToDelete.forEach(key => chatSessions.delete(key));
    console.log('[Gemini] Cleaned up', keysToDelete.length, 'old sessions');
  }
}

// Get current patient symptoms for call context
export function getPatientSymptoms(): string {
  return currentPatientSymptoms || 'general health concerns';
}
