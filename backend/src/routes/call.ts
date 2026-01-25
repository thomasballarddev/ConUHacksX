import { Router, Response } from 'express';
import { emitShowCalendar, emitCallOnHold, emitCallResumed, emitEmergencyTrigger } from '../services/websocket.js';
import { initiateClinicCall, sendResponseToCall, getActiveCallStatus } from '../services/elevenlabs-call.js';
import { getPatientSymptoms } from '../services/gemini.js';
import { TimeSlot } from '../types/index.js';

const router = Router();

// Store for pending webhook responses (waiting for user calendar selection)
interface PendingWebhook {
  resolve: (selection: string) => void;
  timeout: NodeJS.Timeout;
}
let pendingWebhook: PendingWebhook | null = null;

// POST /call/initiate - Start a clinic call
router.post('/initiate', async (req, res) => {
  try {
    const { phone, clinic_name } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone is required' });
    }
    
    // Get actual symptoms from Gemini conversation
    const symptoms = getPatientSymptoms();
    console.log(`[Call] Initiating call with symptoms: ${symptoms}`);
    
    const result = await initiateClinicCall(phone, symptoms, clinic_name || 'Medical Clinic');
    res.json(result);
  } catch (error) {
    console.error('Call initiate error:', error);
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

// POST /call/respond - User selected a time from the calendar
// This resolves the pending webhook so the ElevenLabs agent gets the response
router.post('/respond', async (req, res) => {
  try {
    const { response } = req.body;
    
    if (!response) {
      return res.status(400).json({ error: 'Response is required' });
    }
    
    console.log('[Call] User selected time:', response);
    
    // Resolve the pending webhook if one exists
    if (pendingWebhook) {
      clearTimeout(pendingWebhook.timeout);
      pendingWebhook.resolve(response);
      pendingWebhook = null;
      res.json({ status: 'sent', message: 'Response sent to ElevenLabs agent' });
    } else {
      // Fallback: try sending via conversation API
      const success = await sendResponseToCall(response);
      if (success) {
        res.json({ status: 'sent', message: 'Response sent to call' });
      } else {
        res.status(400).json({ error: 'No active call or pending webhook to respond to' });
      }
    }
  } catch (error) {
    console.error('Call respond error:', error);
    res.status(500).json({ error: 'Failed to send response' });
  }
});

// GET /call/status - Get active call status
router.get('/status', (req, res) => {
  const status = getActiveCallStatus();
  
  if (status) {
    res.json({
      id: status.id,
      state: status.state,
      clinic: status.clinicName,
      transcript_length: status.transcript.length,
      pending_user_response: status.pendingUserResponse
    });
  } else {
    res.json({ status: 'no_active_call' });
  }
});

// Webhook for Agent: "Hold Call"
router.post('/hold', (req, res) => {
  console.log('[Call] Agent requested hold');
  emitCallOnHold('current-call-id');
  res.json({ success: true });
});

/**
 * LONG-POLL WEBHOOK: ElevenLabs agent calls this when asking for schedule selection
 * This endpoint HOLDS the response until the user selects a time from the calendar UI
 * Then it returns the user's selection to the agent
 */
router.post('/show-calendar', async (req, res) => {
  const { slots } = req.body;
  console.log('[Call Webhook] ElevenLabs agent requesting schedule selection');
  console.log('[Call Webhook] Available slots from agent:', slots);
  
  // Parse slots from agent (could be strings or objects)
  const slotsToSend: TimeSlot[] = parseSlots(slots);
  
  // Show calendar to user via WebSocket
  emitShowCalendar(slotsToSend);
  emitCallOnHold('current-call-id');
  console.log('[Call Webhook] Calendar shown to user, waiting for selection...');
  
  // Create a promise that resolves when user selects a time
  const userSelection = await new Promise<string>((resolve) => {
    // Set timeout - if user doesn't respond in 60 seconds, return a fallback
    const timeout = setTimeout(() => {
      console.log('[Call Webhook] Timeout waiting for user selection');
      pendingWebhook = null;
      resolve('the first available appointment slot');
    }, 60000); // 60 second timeout
    
    // Store the resolve function so /respond endpoint can call it
    pendingWebhook = { resolve, timeout };
  });
  
  console.log('[Call Webhook] User selected:', userSelection);
  
  // Resume the call
  emitCallResumed('current-call-id');
  
  // Return the selection to ElevenLabs agent
  // The agent will use this response to tell the receptionist
  res.json({ 
    success: true,
    user_selection: userSelection,
    message: `The patient has selected: ${userSelection}. Please confirm this appointment time with the receptionist.`
  });
});

// Helper function to parse slots from various formats
function parseSlots(slots: any): TimeSlot[] {
  if (!slots || !Array.isArray(slots)) {
    return [
      { day: 'TUE', date: '28', time: '02:00 PM' },
      { day: 'WED', date: '29', time: '03:00 PM' }
    ];
  }
  
  return slots.map((s: any) => {
    if (typeof s === 'string') {
      // Parse string like "Tuesday at 2pm"
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
    return s;
  });
}

// Webhook for Agent: "Resume Call"
router.post('/resume', (req, res) => {
  const { slot } = req.body;
  console.log('[Call] Resuming call with slot:', slot);
  emitCallResumed('current-call-id');
  res.json({ success: true });
});

// Webhook for Agent: "Emergency"
router.post('/emergency', (req, res) => {
  console.log('[Call] Agent triggered EMERGENCY');
  emitEmergencyTrigger();
  res.json({ success: true, message: 'Emergency sequence initiated' });
});

// POST /call/webhook - Generic ElevenLabs webhook for call events
router.post('/webhook', async (req, res) => {
  console.log('[Call Webhook] Received:', req.body);
  res.json({ received: true });
});

export default router;
