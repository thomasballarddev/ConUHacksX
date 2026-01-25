import { Router } from 'express';
import { sendChatMessage } from '../services/elevenlabs.js';
const router = Router();
// POST /chat - Initialize chat or send message
router.post('/', async (req, res) => {
    try {
        const { message } = req.body;
        // For now, we prefer to return a signed URL for the frontend to connect 
        // directly to ElevenLabs WebSocket for low latency, 
        // OR we just return the agent config if using the widget.
        // If the frontend calls this to "start" the session:
        const result = await sendChatMessage(message);
        res.json(result);
    }
    catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to process chat request' });
    }
});
export default router;
