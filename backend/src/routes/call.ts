import { Router } from 'express';
import { emitShowCalendar, emitCallOnHold, emitCallResumed, emitEmergencyTrigger } from '../services/websocket.js';
import { TimeSlot } from '../types/index.js';

const router = Router();

// Webhook for Agent: "Hold Call"
// Triggered when agent needs to ask user for input
router.post('/hold', (req, res) => {
  console.log('[Call] Agent requested hold');
  // In a real generic Twilio flow, we might update TwiML here.
  // For ElevenLabs agent, we acknowledge the tool call.
  emitCallOnHold('current-call-id');
  res.json({ success: true });
});

// Webhook for Agent: "Show Calendar"
// Triggered when receptionist offers times
router.post('/show-calendar', (req, res) => {
  const { slots } = req.body; // Expecting { slots: [{ day, date, time }] } from Agent tool
  console.log('[Call] Agent showing calendar with slots:', slots);
  
  // If slots are not provided (mock mode), send defaults
  const slotsToSend: TimeSlot[] = slots || [
    { day: 'TUE', date: '13', time: '02:00 PM' },
    { day: 'WED', date: '14', time: '03:00 PM' }
  ];

  emitShowCalendar(slotsToSend);
  res.json({ success: true });
});

// Webhook for Agent: "Resume Call"
// Triggered (maybe internally or via frontend) to signal agent to proceed
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

export default router;
