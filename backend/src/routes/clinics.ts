import { Router } from 'express';
import { clinics } from '../data/clinics.js';
import { emitShowClinics } from '../services/websocket.js';

const router = Router();

// GET /clinics - Returns hardcoded list
router.get('/', (req, res) => {
  // Also emit to websocket for good measure if needed, 
  // but usually the frontend requests this via REST or the Agent triggers it via webhook
  res.json(clinics);
});

// POST /clinics/trigger - Webhook for Agent to trigger "Show Clinics"
router.post('/trigger', (req, res) => {
  console.log('[Clinics] Agent triggered show_clinics');
  emitShowClinics(clinics);
  res.json({ success: true, message: 'Clinics pushed to client' });
});

export default router;
