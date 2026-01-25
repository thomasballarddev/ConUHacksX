import { Router, Request, Response } from 'express';
import { sendChatMessage } from '../services/elevenlabs.js';
import { emitChatResponse } from '../services/websocket.js';

const router = Router();

// POST /chat - Initialize chat or send message
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    console.log('[Chat] Received message:', message);

    // Get signed URL from ElevenLabs
    const result = await sendChatMessage(message);

    // Emit response via WebSocket so frontend receives it
    emitChatResponse({
      role: 'assistant',
      content: result.message || 'Agent signed URL generated. Please connect to start the conversation.',
      timestamp: new Date().toISOString()
    });

    res.json({
      ...result,
      signedUrl: result.conversation_id // Return signed URL for frontend to connect to ElevenLabs
    });
  } catch (error) {
    console.error('[Chat] Error:', error);
    emitChatResponse({
      role: 'assistant',
      content: 'Sorry, I encountered an error processing your request. Please try again.',
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

export default router;
