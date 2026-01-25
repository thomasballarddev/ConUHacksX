/**
 * Polls ElevenLabs Conversation API for transcript updates
 * This is a workaround since real-time transcript webhooks don't work for Twilio calls
 */
import dotenv from 'dotenv';
import { emitTranscriptUpdate } from './websocket.js';
dotenv.config({ path: '../.env' });
const API_KEY = process.env.ELEVENLABS_API_KEY;
const POLL_INTERVAL = 2000; // Poll every 2 seconds
// Track which conversation we're currently polling
let activeConversationId = null;
let pollingInterval = null;
let lastMessageCount = 0;
/**
 * Start polling a conversation for transcript updates
 */
export function startTranscriptPolling(conversationId) {
    console.log('[TranscriptPoller] Starting polling for conversation:', conversationId);
    // Stop any existing polling
    stopTranscriptPolling();
    activeConversationId = conversationId;
    lastMessageCount = 0;
    // Start polling
    pollingInterval = setInterval(() => {
        pollConversation(conversationId);
    }, POLL_INTERVAL);
    // Do an immediate poll
    pollConversation(conversationId);
}
/**
 * Stop polling for transcript updates
 */
export function stopTranscriptPolling() {
    console.log('[TranscriptPoller] Stopping polling');
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
    activeConversationId = null;
    lastMessageCount = 0;
}
/**
 * Poll the conversation API for new messages
 */
async function pollConversation(conversationId) {
    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
            headers: {
                'xi-api-key': API_KEY,
            }
        });
        if (!response.ok) {
            console.error('[TranscriptPoller] Failed to fetch conversation:', response.statusText);
            return;
        }
        const data = await response.json();
        const transcript = data.transcript || data.messages || [];
        console.log('[TranscriptPoller] Fetched transcript, message count:', transcript.length);
        // Check if there are new messages
        if (transcript.length > lastMessageCount) {
            // Emit only the new messages
            for (let i = lastMessageCount; i < transcript.length; i++) {
                const msg = transcript[i];
                // Format the message based on role
                const speaker = msg.role === 'agent' ? 'Agent' : 'Receptionist';
                const text = msg.message || msg.text || '';
                if (text) {
                    console.log('[TranscriptPoller] New message:', speaker, '-', text);
                    emitTranscriptUpdate('current-call-id', `${speaker}: ${text}`);
                }
            }
            lastMessageCount = transcript.length;
        }
        // Check if conversation ended
        if (data.status === 'ended' || data.status === 'completed') {
            console.log('[TranscriptPoller] Conversation ended, stopping polling');
            stopTranscriptPolling();
        }
    }
    catch (error) {
        console.error('[TranscriptPoller] Error polling conversation:', error);
    }
}
