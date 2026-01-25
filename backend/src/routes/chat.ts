import { Router } from 'express';
import { sendChatMessage } from '../services/gemini.js';

const router = Router();

// POST /chat - Send message to Gemini AI
router.post('/', async (req, res) => {
  try {
    const { message, conversation_id } = req.body;

    console.log('[Chat Route] Received message:', message);
    console.log('[Chat Route] Conversation ID from frontend:', conversation_id || 'NOT PROVIDED');

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await sendChatMessage(message, conversation_id);
    console.log('[Chat Route] Returning conversation_id:', result.conversation_id);
    res.json(result);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

export default router;
