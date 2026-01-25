import dotenv from 'dotenv';
import { emitShowCalendar, emitCallStarted, emitCallEnded, emitTranscriptUpdate, emitCallOnHold } from './websocket.js';
import { TimeSlot } from '../types/index.js';
import { startTranscriptPolling, stopTranscriptPolling } from './transcript-poller.js';

dotenv.config({ path: '../.env' });

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER; // Your Twilio number connected to ElevenLabs

interface ActiveCall {
  id: string;
  conversationId: string | null;
  state: 'connecting' | 'active' | 'on_hold' | 'ended';
  transcript: string[];
  clinicName: string;
  reason: string;
  pendingUserResponse: boolean;
}

// Store active call (only one at a time for simplicity)
let activeCall: ActiveCall | null = null;

/**
 * Initiate an ACTUAL outbound phone call to a clinic via ElevenLabs + Twilio
 */
export async function initiateClinicCall(phoneNumber: string, reason: string, clinicName: string, patientInfo?: string): Promise<{ callId: string; status: string }> {
  console.log(`[ElevenLabs-Call] Initiating REAL call to ${clinicName} at ${phoneNumber}`);
  console.log(`[ElevenLabs-Call] Reason: ${reason}`);
  console.log(`[ElevenLabs-Call] Patient Info: ${patientInfo || 'Not provided'}`);
  console.log(`[ElevenLabs-Call] Using AGENT_ID: ${AGENT_ID}`);
  console.log(`[ElevenLabs-Call] Using Twilio Phone: ${TWILIO_PHONE_NUMBER}`);

  if (!API_KEY || !AGENT_ID) {
    throw new Error('Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID');
  }

  if (!TWILIO_PHONE_NUMBER) {
    throw new Error('Missing TWILIO_PHONE_NUMBER - required for outbound calls');
  }

  const callId = `call_${Date.now()}`;

  // Create active call record
  activeCall = {
    id: callId,
    conversationId: null,
    state: 'connecting',
    transcript: [],
    clinicName,
    reason,
    pendingUserResponse: false
  };

  // Emit call started event to frontend
  emitCallStarted(callId);
  console.log('[ElevenLabs-Call] Call started event emitted');

  // Use the ElevenLabs Twilio outbound call API
  // This initiates an actual phone call using Twilio integration

  // Override phone number if PHONE_NUMBER_TO_USE is set
  let targetPhoneNumber = phoneNumber;
  if (process.env.PHONE_NUMBER_TO_USE) {
    console.log(`[ElevenLabs-Call] OVERRIDE: Redirecting call to ${process.env.PHONE_NUMBER_TO_USE} (instead of ${phoneNumber})`);
    targetPhoneNumber = process.env.PHONE_NUMBER_TO_USE;
  }

  const payload = {
    agent_id: AGENT_ID,
    agent_phone_number_id: TWILIO_PHONE_NUMBER,
    to_number: targetPhoneNumber,
    conversation_initiation_client_data: {
      dynamic_variables: {
        clinic_name: clinicName,
        patient_symptoms: reason,
        patient_info: patientInfo || 'No patient information available'
      }
    }
  };
  console.log('[ElevenLabs-Call] Sending payload:', JSON.stringify(payload, null, 2));

  const outboundCallResponse = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!outboundCallResponse.ok) {
    const errorText = await outboundCallResponse.text();
    console.error('[ElevenLabs-Call] Failed to initiate outbound call:', errorText);

    // Update call state
    if (activeCall) {
      activeCall.state = 'ended';
      emitCallEnded(callId, [{ message: `Error: ${errorText}`, sender: 'unknown' }]);
    }

    throw new Error(`ElevenLabs outbound call error: ${outboundCallResponse.statusText} - ${errorText}`);
  }

  const callData = await outboundCallResponse.json();
  console.log('[ElevenLabs-Call] Outbound call initiated:', JSON.stringify(callData));

  // Store the conversation ID for later reference
  if (activeCall) {
    activeCall.conversationId = callData.conversation_id || callData.call_sid || callId;
    activeCall.state = 'active';

    // DISABLED: Polling not needed - webhooks are working!
    // if (callData.conversation_id) {
    //   console.log('[ElevenLabs-Call] Starting transcript polling for conversation:', callData.conversation_id);
    //   startTranscriptPolling(callData.conversation_id);
    // }
  }

  // Note: Transcript webhooks are configured in ElevenLabs dashboard
  // They send events to /call/transcript-webhook

  return {
    callId,
    status: 'call_initiated',
    ...callData
  };
}

/**
 * Handle messages from the ElevenLabs agent during a call
 */
function handleAgentMessage(data: any) {
  if (!activeCall) return;

  console.log('[ElevenLabs-Call] Agent message:', data.type);

  switch (data.type) {
    case 'ping':
      // No WebSocket to respond to in outbound call mode
      // This would be handled via webhook
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
 * Send user's time selection back to the active call via conversation API
 */
export async function sendResponseToCall(response: string): Promise<boolean> {
  if (!activeCall || !activeCall.conversationId) {
    console.error('[ElevenLabs-Call] No active call to send response to');
    return false;
  }

  console.log('[ElevenLabs-Call] Sending user response to call:', response);

  // For outbound calls via Twilio, we need to send the response via the conversation API
  // This tells the ElevenLabs agent what the user selected
  try {
    const API_KEY = process.env.ELEVENLABS_API_KEY;

    // Use the ElevenLabs API to send a message to the ongoing conversation
    // Note: This is a simplified approach - in production you might use webhooks
    const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${activeCall.conversationId}/send-message`, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `The patient has selected: ${response}. Please confirm this appointment time with the receptionist.`
      })
    });

    if (!res.ok) {
      console.error('[ElevenLabs-Call] Failed to send response:', await res.text());
      return false;
    }

    activeCall.state = 'active';
    activeCall.pendingUserResponse = false;
    return true;
  } catch (error) {
    console.error('[ElevenLabs-Call] Error sending response:', error);
    return false;
  }
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
