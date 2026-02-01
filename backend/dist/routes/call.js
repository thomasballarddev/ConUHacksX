import { Router } from 'express';
import { emitShowCalendar, emitCallOnHold, emitCallResumed, emitEmergencyTrigger, emitAgentNeedsInput, emitAgentInputReceived, emitTranscriptUpdate } from '../services/websocket.js';
import { initiateClinicCall, sendResponseToCall, getActiveCallStatus } from '../services/elevenlabs-call.js';
import { getPatientSymptoms } from '../services/gemini.js';
import { getUserProfile, formatProfileForAgent } from '../services/firestore.js';
import { stopTranscriptPolling } from '../services/transcript-poller.js';
const router = Router();
// Log ALL incoming requests for debugging
router.use((req, res, next) => {
    console.log('[Call Routes] ===== INCOMING REQUEST =====');
    console.log('[Call Routes] Method:', req.method);
    console.log('[Call Routes] Path:', req.path);
    console.log('[Call Routes] Headers:', JSON.stringify(req.headers, null, 2));
    console.log('[Call Routes] Body:', JSON.stringify(req.body, null, 2));
    console.log('[Call Routes] ===== END REQUEST LOG =====');
    next();
});
let pendingWebhook = null;
// Emergency phone number
const EMERGENCY_PHONE = '+14385202457';
// POST /call/initiate - Start a clinic call or emergency call
router.post('/initiate', async (req, res) => {
    try {
        const { phone, clinic_name, type, userId } = req.body;
        // Handle emergency calls
        if (type === 'emergency') {
            const emergencyPhone = phone || EMERGENCY_PHONE;
            console.log(`[Call] Initiating EMERGENCY call to ${emergencyPhone}`);
            const result = await initiateClinicCall(emergencyPhone, 'EMERGENCY - Patient needs immediate assistance', 'Emergency Services');
            return res.json(result);
        }
        if (!phone) {
            return res.status(400).json({ error: 'Phone is required' });
        }
        // Get symptoms by analyzing the full conversation with Gemini
        const symptoms = await getPatientSymptoms();
        console.log(`[Call] Initiating call with extracted symptoms: ${symptoms}`);
        // Get patient info from Firestore if userId is provided
        let patientInfo;
        if (userId) {
            console.log(`[Call] Fetching profile for user: ${userId}`);
            const profile = await getUserProfile(userId);
            if (profile) {
                patientInfo = formatProfileForAgent(profile);
                console.log(`[Call] Patient info retrieved: ${patientInfo}`);
            }
            else {
                console.log(`[Call] No profile found for user: ${userId}`);
            }
        }
        else {
            console.log(`[Call] No userId provided, skipping profile fetch`);
        }
        const result = await initiateClinicCall(phone, symptoms, clinic_name || 'Medical Clinic', patientInfo);
        res.json(result);
    }
    catch (error) {
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
            emitAgentInputReceived();
            res.json({ status: 'sent', message: 'Response sent to ElevenLabs agent' });
        }
        else {
            // Fallback: try sending via conversation API
            const success = await sendResponseToCall(response);
            if (success) {
                res.json({ status: 'sent', message: 'Response sent to call' });
            }
            else {
                res.status(400).json({ error: 'No active call or pending webhook to respond to' });
            }
        }
    }
    catch (error) {
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
    }
    else {
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
    const slotsToSend = parseSlots(slots);
    // Show calendar to user via WebSocket
    emitShowCalendar(slotsToSend);
    emitCallOnHold('current-call-id');
    console.log('[Call Webhook] Calendar shown to user, waiting for selection...');
    // Create a promise that resolves when user selects a time
    const userSelection = await new Promise((resolve) => {
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
/**
 * WEBHOOK: Agent asks the user a question via UI overlay
 */
router.post('/ask-user', async (req, res) => {
    const { question } = req.body;
    console.log('[Call Webhook] Agent asking user:', question);
    // Show Question Widget to user
    emitAgentNeedsInput({ question });
    // Wait for user response (using same mechanism as calendar)
    const userResponse = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
            console.log('[Call Webhook] Timeout waiting for user answer');
            pendingWebhook = null;
            resolve('The user did not provide an answer in time.');
        }, 60000);
        pendingWebhook = { resolve, timeout };
    });
    console.log('[Call Webhook] User answered:', userResponse);
    res.json({
        success: true,
        user_response: userResponse,
        message: `The user answered: "${userResponse}". Relay this exactly to the receptionist.`
    });
});
/**
 * NEW WEBHOOK: Agent sends transcript updates
 * This is a workaround since ElevenLabs doesn't send real-time transcript events for Twilio calls
 */
router.post('/send-transcript', (req, res) => {
    const { speaker, text } = req.body;
    console.log('[Call Webhook] Transcript update - Speaker:', speaker, '- Text:', text);
    // Emit transcript to frontend
    if (speaker && text) {
        emitTranscriptUpdate('current-call-id', `${speaker}: ${text}`);
    }
    res.json({ success: true, received: true });
});
// Helper function to parse slots from the agent
// Supported formats:
// 1. { month: 2, day: 23, time: "5:00 PM" } - specific date
// 2. { dayOfWeek: "Monday", time: "2:00 PM" } - next occurrence of that day
// 3. { day: 23, time: "5:00 PM" } - day of current month
function parseSlots(slots) {
    if (!slots || !Array.isArray(slots)) {
        return [];
    }
    const parsedSlots = [];
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const monthAbbrev = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNamesLower = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6,
        'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6
    };
    const monthNames = {
        'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
        'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11,
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'jun': 5, 'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };
    // Helper to normalize time string
    const normalizeTime = (time) => {
        const timeMatch = time.match(/(\d{1,2}):?(\d{2})?\s*([ap]\.?m\.?)?/i);
        if (timeMatch) {
            const hour = parseInt(timeMatch[1]);
            const minute = timeMatch[2] || '00';
            const meridian = timeMatch[3] ? (timeMatch[3].toLowerCase().includes('a') ? 'AM' : 'PM') : (hour >= 12 ? 'PM' : 'AM');
            return `${hour.toString().padStart(2, '0')}:${minute} ${meridian}`;
        }
        return time;
    };
    for (const s of slots) {
        try {
            if (typeof s === 'object' && s !== null && s.time !== undefined) {
                const currentDate = new Date();
                let dayOfWeek;
                let dayOfMonth;
                const timeStr = normalizeTime(s.time);
                // Option 1: dayOfWeek is provided (e.g., "Monday", "tuesday", "MON")
                if (s.dayOfWeek !== undefined) {
                    const dayOfWeekLower = s.dayOfWeek.toLowerCase();
                    const targetDayIndex = dayNamesLower[dayOfWeekLower];
                    if (targetDayIndex !== undefined) {
                        // Calculate days until next occurrence of this day
                        const currentDayIndex = currentDate.getDay();
                        let daysUntil = targetDayIndex - currentDayIndex;
                        if (daysUntil <= 0) {
                            daysUntil += 7; // Next week
                        }
                        const targetDate = new Date(currentDate);
                        targetDate.setDate(currentDate.getDate() + daysUntil);
                        dayOfWeek = dayNames[targetDayIndex];
                        dayOfMonth = targetDate.getDate();
                        console.log(`[parseSlots] dayOfWeek "${s.dayOfWeek}" -> next ${dayOfWeek} is ${targetDate.toDateString()}`);
                        parsedSlots.push({
                            day: dayOfWeek,
                            date: String(dayOfMonth),
                            time: timeStr,
                            month: monthAbbrev[targetDate.getMonth()]
                        });
                    }
                    else {
                        console.warn(`[parseSlots] Unknown dayOfWeek: "${s.dayOfWeek}"`);
                    }
                }
                // Option 2: day (and optional month) is provided
                else if (s.day !== undefined) {
                    // Parse month (default to current month if not provided)
                    let monthIndex;
                    if (s.month === undefined || s.month === null) {
                        monthIndex = currentDate.getMonth();
                    }
                    else if (typeof s.month === 'number') {
                        monthIndex = s.month - 1; // Convert 1-indexed to 0-indexed
                    }
                    else if (typeof s.month === 'string') {
                        const monthLower = s.month.toLowerCase();
                        if (monthNames[monthLower] !== undefined) {
                            monthIndex = monthNames[monthLower];
                        }
                        else {
                            const parsed = parseInt(s.month);
                            monthIndex = isNaN(parsed) ? currentDate.getMonth() : parsed - 1;
                        }
                    }
                    else {
                        monthIndex = currentDate.getMonth();
                    }
                    // Parse day
                    dayOfMonth = typeof s.day === 'string' ? parseInt(s.day.replace(/\D/g, '')) : s.day;
                    // Create date to find day of week
                    const year = currentDate.getFullYear();
                    const targetYear = monthIndex < currentDate.getMonth() ? year + 1 : year;
                    const targetDate = new Date(targetYear, monthIndex, dayOfMonth);
                    dayOfWeek = dayNames[targetDate.getDay()];
                    console.log(`[parseSlots] month=${monthIndex + 1}, day=${dayOfMonth} -> ${dayOfWeek}, ${dayOfMonth} at ${timeStr}`);
                    parsedSlots.push({
                        day: dayOfWeek,
                        date: String(dayOfMonth),
                        time: timeStr,
                        month: monthAbbrev[monthIndex]
                    });
                }
            }
            // Option 3: Legacy string format (e.g., "23rd at 5 p.m.")
            else if (typeof s === 'string') {
                console.warn(`[parseSlots] Received string format (deprecated): "${s}"`);
                const dateMatch = s.match(/(\d{1,2})(st|nd|rd|th)?/i);
                const timeMatch = s.match(/(\d{1,2}):?(\d{2})?\s*([ap]\.?m\.?)/i);
                if (dateMatch && timeMatch) {
                    const dayOfMonth = parseInt(dateMatch[1]);
                    const currentDate = new Date();
                    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayOfMonth);
                    if (targetDate < currentDate) {
                        targetDate.setMonth(targetDate.getMonth() + 1);
                    }
                    const dayOfWeek = dayNames[targetDate.getDay()];
                    const hour = parseInt(timeMatch[1]);
                    const minute = timeMatch[2] || '00';
                    const meridian = timeMatch[3].toLowerCase().includes('a') ? 'AM' : 'PM';
                    const timeStr = `${hour.toString().padStart(2, '0')}:${minute} ${meridian}`;
                    parsedSlots.push({
                        day: dayOfWeek,
                        date: String(dayOfMonth),
                        time: timeStr,
                        month: monthAbbrev[targetDate.getMonth()]
                    });
                }
            }
        }
        catch (error) {
            console.error('[parseSlots] Error parsing slot:', s, error);
        }
    }
    return parsedSlots;
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
/**
 * WEBHOOK: Receive real-time transcript events from ElevenLabs
 * Custom format: { message: string, sender: "bot" | "receptionist" }
 */
router.post('/transcript-webhook', (req, res) => {
    console.log('[Transcript Webhook] ===== NEW EVENT =====');
    console.log('[Transcript Webhook] Full payload:', JSON.stringify(req.body, null, 2));
    const { message, sender } = req.body;
    // Handle custom format with message and sender fields
    if (message && sender) {
        const speakerLabel = sender === 'bot' ? 'Agent' : 'Receptionist';
        console.log('[Transcript Webhook]', speakerLabel, 'said:', message);
        // Emit with sender information for clean display on frontend
        emitTranscriptUpdate('current-call-id', message, sender);
    }
    else {
        console.log('[Transcript Webhook] Unknown format - message or sender missing');
    }
    console.log('[Transcript Webhook] ===== END EVENT =====');
    res.json({ received: true });
});
// POST /call/webhook - Generic ElevenLabs webhook for call events
router.post('/webhook', async (req, res) => {
    console.log('[Call Webhook] ===== GENERIC WEBHOOK CALLED =====');
    console.log('[Call Webhook] Event type:', req.body.type);
    console.log('[Call Webhook] Full payload:', JSON.stringify(req.body, null, 2));
    // Check if this is a transcript event coming to the wrong endpoint
    const { type, agent_response_event, user_transcription_event } = req.body;
    if (type === 'agent_response' && agent_response_event?.agent_response) {
        const agentText = agent_response_event.agent_response;
        console.log('[Call Webhook] AGENT TRANSCRIPT:', agentText);
        emitTranscriptUpdate('current-call-id', `Agent: ${agentText}`);
    }
    if (type === 'user_transcript' && user_transcription_event?.user_transcript) {
        const userText = user_transcription_event.user_transcript;
        console.log('[Call Webhook] USER TRANSCRIPT:', userText);
        emitTranscriptUpdate('current-call-id', `Receptionist: ${userText}`);
    }
    // Handle call ended events
    if (type === 'conversation.ended' || type === 'call.ended' || req.body.status === 'ended') {
        console.log('[Call Webhook] Call ended, stopping transcript polling');
        stopTranscriptPolling();
    }
    console.log('[Call Webhook] ===== END GENERIC WEBHOOK =====');
    res.json({ received: true });
});
// POST /call/end - Manually end a call
router.post('/end', (req, res) => {
    console.log('[Call] Manually ending call and stopping transcript polling');
    stopTranscriptPolling();
    res.json({ success: true });
});
export default router;
