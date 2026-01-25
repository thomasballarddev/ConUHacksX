import { Router, Request, Response } from 'express';
import { sendChatMessage } from '../services/elevenlabs.js';
import { emitChatResponse } from '../services/websocket.js';

const router = Router();

// POST /chat - Send message to ElevenLabs agent
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, sessionId } = req.body;
    console.log('[Chat] Received message:', message);

    // Send to ElevenLabs agent and get response
    const result = await sendChatMessage(message, sessionId || 'default');

    // Response is already emitted via WebSocket in elevenlabs service
    // Also return via REST for redundancy
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('[Chat] Error:', error);

    // Emit error response via WebSocket
    emitChatResponse({
      role: 'assistant',
      content: 'Sorry, I encountered an error processing your request. Please try again.',
      timestamp: new Date().toISOString()
    });

    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

export default router;
