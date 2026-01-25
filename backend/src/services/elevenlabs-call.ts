import WebSocket from 'ws';
import dotenv from 'dotenv';
import { emitShowCalendar, emitCallStarted, emitCallEnded, emitTranscriptUpdate, emitCallOnHold } from './websocket.js';
import { TimeSlot } from '../types/index.js';

dotenv.config({ path: '../.env' });

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

interface ActiveCall {
  id: string;
  ws: WebSocket | null;
  state: 'connecting' | 'active' | 'on_hold' | 'ended';
  transcript: string[];
  clinicName: string;
  reason: string;
  pendingUserResponse: boolean;
}

// Store active call (only one at a time for simplicity)
let activeCall: ActiveCall | null = null;

/**
 * Initiate an outbound call to a clinic via ElevenLabs
 */
export async function initiateClinicCall(phoneNumber: string, reason: string, clinicName: string): Promise<{ callId: string; status: string }> {
  console.log(`[ElevenLabs-Call] Initiating call to ${clinicName} at ${phoneNumber}`);
  console.log(`[ElevenLabs-Call] Reason: ${reason}`);
  console.log(`[ElevenLabs-Call] Using AGENT_ID: ${AGENT_ID}`);
  
  if (!API_KEY || !AGENT_ID) {
    throw new Error('Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID');
  }
  
  // First, get a signed URL for the conversation
  const signedUrlResponse = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`, {
    method: 'GET',
    headers: {
      'xi-api-key': API_KEY
    }
  });

  if (!signedUrlResponse.ok) {
    const errorText = await signedUrlResponse.text();
    console.error('[ElevenLabs-Call] Failed to get signed URL:', errorText);
    throw new Error(`ElevenLabs API error: ${signedUrlResponse.statusText}`);
  }

  const responseData = await signedUrlResponse.json();
  console.log('[ElevenLabs-Call] API Response:', JSON.stringify(responseData));
  
  // The response contains signed_url directly
  const signedUrl = responseData.signed_url;
  if (!signedUrl) {
    throw new Error('No signed_url in ElevenLabs response');
  }
  
  const callId = `call_${Date.now()}`;
  
  // Create active call record
  activeCall = {
    id: callId,
    ws: null,
    state: 'connecting',
    transcript: [],
    clinicName,
    reason,
    pendingUserResponse: false
  };

  // Emit call started event to frontend
  emitCallStarted(callId);
  console.log('[ElevenLabs-Call] Call started event emitted');
  
  // Connect to WebSocket for the conversation
  console.log('[ElevenLabs-Call] Connecting to WebSocket...');
  const ws = new WebSocket(signedUrl);
  activeCall.ws = ws;

  ws.onopen = () => {
    console.log('[ElevenLabs-Call] Connected to agent WebSocket');
    if (activeCall) {
      activeCall.state = 'active';
    }
    
    // Send initial context to the agent about the call
    const contextMessage = {
      type: 'contextual_update',
      text: `You are calling ${clinicName} on behalf of a patient. The patient is experiencing: ${reason}. Please introduce yourself as an AI assistant calling on behalf of a Health.me patient, and request to schedule an appointment. When the receptionist offers available times, use your request_schedule_selection tool to let the patient choose.`
    };
    ws.send(JSON.stringify(contextMessage));
    console.log('[ElevenLabs-Call] Sent context message to agent');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data.toString());
      handleAgentMessage(data);
    } catch (e) {
      console.error('[ElevenLabs-Call] Error parsing message:', e);
    }
  };

  ws.onerror = (error) => {
    console.error('[ElevenLabs-Call] WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('[ElevenLabs-Call] WebSocket closed');
    if (activeCall) {
      activeCall.state = 'ended';
      emitCallEnded(activeCall.id, activeCall.transcript);
    }
  };

  return { callId, status: 'connecting' };
}

/**
 * Handle messages from the ElevenLabs agent during a call
 */
function handleAgentMessage(data: any) {
  if (!activeCall) return;

  console.log('[ElevenLabs-Call] Agent message:', data.type);

  switch (data.type) {
    case 'ping':
      activeCall.ws?.send(JSON.stringify({ type: 'pong', event_id: data.ping_event?.event_id }));
      break;
    
    case 'agent_response':
      const agentText = data.agent_response_event?.agent_response || '';
      if (agentText) {
        activeCall.transcript.push(`Agent: ${agentText}`);
        emitTranscriptUpdate(activeCall.id, `Agent: ${agentText}`);
      }
      break;
    
    case 'user_transcript':
      // This is the receptionist's response (from the phone call STT)
      const userText = data.user_transcript_event?.user_transcript || '';
      if (userText) {
        activeCall.transcript.push(`Receptionist: ${userText}`);
        emitTranscriptUpdate(activeCall.id, `Receptionist: ${userText}`);
        
        // Check if receptionist is offering times (simple heuristic)
        if (containsSchedulingInfo(userText)) {
          handleSchedulingOffer(userText);
        }
      }
      break;
    
    case 'client_tool_call':
      // The ElevenLabs agent is requesting client-side action
      handleClientToolCall(data.client_tool_call);
      break;
  }
}

/**
 * Check if text contains scheduling availability info
 */
function containsSchedulingInfo(text: string): boolean {
  const lowerText = text.toLowerCase();
  const schedulingKeywords = ['available', 'appointment', 'slot', 'opening', 'schedule', 'pm', 'am', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  return schedulingKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Parse scheduling info and show calendar to user
 */
function handleSchedulingOffer(text: string) {
  if (!activeCall) return;
  
  console.log('[ElevenLabs-Call] Detected scheduling offer, pausing for user input');
  
  // Put call on hold
  activeCall.state = 'on_hold';
  activeCall.pendingUserResponse = true;
  emitCallOnHold(activeCall.id);
  
  // Parse available times (simplified - in production use NLP)
  const slots: TimeSlot[] = parseTimeSlotsFromText(text);
  
  // Show calendar to user
  emitShowCalendar(slots);
}

/**
 * Handle client tool calls from ElevenLabs agent
 */
function handleClientToolCall(toolCall: any) {
  if (!activeCall) return;
  
  console.log('[ElevenLabs-Call] Client tool call:', toolCall.tool_name);
  
  if (toolCall.tool_name === 'request_schedule_selection') {
    // Agent is asking user to select a time
    const slots = toolCall.parameters?.available_slots || [];
    
    activeCall.state = 'on_hold';
    activeCall.pendingUserResponse = true;
    emitCallOnHold(activeCall.id);
    
    // Parse slots if they're strings, or use as-is if already TimeSlot format
    const parsedSlots: TimeSlot[] = slots.map((s: any) => {
      if (typeof s === 'string') {
        return parseTimeSlotFromString(s);
      }
      return s;
    });
    
    emitShowCalendar(parsedSlots.length > 0 ? parsedSlots : [
      { day: 'TUE', date: '28', time: '02:00 PM' },
      { day: 'TUE', date: '28', time: '04:00 PM' }
    ]);
  }
}

/**
 * Send user's time selection back to the active call
 */
export function sendResponseToCall(response: string): boolean {
  if (!activeCall || !activeCall.ws || activeCall.ws.readyState !== WebSocket.OPEN) {
    console.error('[ElevenLabs-Call] No active call to send response to');
    return false;
  }
  
  console.log('[ElevenLabs-Call] Sending user response to call:', response);
  
  // Send the user's selection as a message to the agent
  const message = {
    type: 'user_message',
    user_message: {
      text: `The patient has selected: ${response}. Please confirm this appointment time with the receptionist.`
    }
  };
  
  activeCall.ws.send(JSON.stringify(message));
  activeCall.state = 'active';
  activeCall.pendingUserResponse = false;
  
  return true;
}

/**
 * Get status of active call
 */
export function getActiveCallStatus(): ActiveCall | null {
  return activeCall;
}

/**
 * Parse time slots from natural language text
 */
function parseTimeSlotsFromText(text: string): TimeSlot[] {
  // Simple parsing - in production use NLP/LLM
  const slots: TimeSlot[] = [];
  
  // Look for time patterns like "2pm", "2:00 PM", "14:00"
  const timePattern = /(\d{1,2}):?(\d{2})?\s*(am|pm)?/gi;
  const matches = text.match(timePattern) || [];
  
  const today = new Date();
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  matches.slice(0, 4).forEach((match, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() + index + 1);
    
    slots.push({
      day: days[date.getDay()],
      date: String(date.getDate()),
      time: match.toUpperCase().replace(/(\d)([AP])/, '$1 $2') + (match.toLowerCase().includes('m') ? '' : ' PM')
    });
  });
  
  // Fallback slots if none parsed
  if (slots.length === 0) {
    return [
      { day: 'TUE', date: '28', time: '02:00 PM' },
      { day: 'WED', date: '29', time: '10:00 AM' }
    ];
  }
  
  return slots;
}

/**
 * Parse a single time slot from string
 */
function parseTimeSlotFromString(s: string): TimeSlot {
  // Expected format: "Tuesday 2pm" or "2:00 PM on Wednesday"
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dayMatch = s.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  const timeMatch = s.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
  
  const today = new Date();
  
  return {
    day: dayMatch ? dayMatch[1].substring(0, 3).toUpperCase() : days[today.getDay()],
    date: String(today.getDate() + 1),
    time: timeMatch ? timeMatch[0].toUpperCase() : '02:00 PM'
  };
}
