import { Router } from 'express';
import { emitShowCalendar, emitCallOnHold, emitCallResumed, emitEmergencyTrigger } from '../services/websocket.js';
import { initiateClinicCall, sendResponseToCall, getActiveCallStatus } from '../services/elevenlabs-call.js';
import { TimeSlot } from '../types/index.js';

const router = Router();

// POST /call/initiate - Start a clinic call
router.post('/initiate', async (req, res) => {
  try {
    const { phone, reason, clinic_name } = req.body;
    
    if (!phone || !reason) {
      return res.status(400).json({ error: 'Phone and reason are required' });
    }
    
    const result = await initiateClinicCall(phone, reason, clinic_name || 'Medical Clinic');
    res.json(result);
  } catch (error) {
    console.error('Call initiate error:', error);
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

// POST /call/respond - Send user response to active call
router.post('/respond', async (req, res) => {
  try {
    const { response } = req.body;
    
    if (!response) {
      return res.status(400).json({ error: 'Response is required' });
    }
    
    const success = sendResponseToCall(response);
    
    if (success) {
      res.json({ status: 'sent', message: 'Response sent to call' });
    } else {
      res.status(400).json({ error: 'No active call to respond to' });
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

// Webhook for Agent: "Show Calendar"
router.post('/show-calendar', (req, res) => {
  const { slots } = req.body;
  console.log('[Call] Agent showing calendar with slots:', slots);
  
  const slotsToSend: TimeSlot[] = slots || [
    { day: 'TUE', date: '13', time: '02:00 PM' },
    { day: 'WED', date: '14', time: '03:00 PM' }
  ];

  emitShowCalendar(slotsToSend);
  res.json({ success: true });
});

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

// POST /call/webhook - ElevenLabs webhook for call events
router.post('/webhook', async (req, res) => {
  console.log('[Call Webhook] Received:', req.body);
  res.json({ received: true });
});

export default router;
