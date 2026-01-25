let io = null;
export function initializeWebSocket(socketServer) {
    io = socketServer;
    io.on('connection', (socket) => {
        console.log(`[WebSocket] Client connected: ${socket.id}`);
        socket.on('disconnect', () => {
            console.log(`[WebSocket] Client disconnected: ${socket.id}`);
        });
    });
}
// Emit events to all connected clients
export function emitShowClinics(clinics) {
    if (io) {
        console.log('[WebSocket] Emitting show_clinics');
        io.emit('show_clinics', clinics);
    }
}
export function emitShowCalendar(slots) {
    if (io) {
        console.log('[WebSocket] Emitting show_calendar');
        io.emit('show_calendar', slots);
    }
}
export function emitCallStarted(callId) {
    if (io) {
        console.log(`[WebSocket] Emitting call_started: ${callId}`);
        io.emit('call_started', callId);
    }
}
export function emitCallOnHold(callId) {
    if (io) {
        console.log(`[WebSocket] Emitting call_on_hold: ${callId}`);
        io.emit('call_on_hold', callId);
    }
}
export function emitCallEnded(callId, transcript) {
    if (io) {
        console.log(`[WebSocket] Emitting call_ended: ${callId}`);
        io.emit('call_ended', callId, transcript);
    }
}
export function emitCallResumed(callId) {
    if (io) {
        console.log(`[WebSocket] Emitting call_resumed: ${callId}`);
        io.emit('call_resumed', callId);
    }
}
export function emitTranscriptUpdate(callId, message, sender) {
    if (io) {
        // Emit with sender information for clean display on frontend
        io.emit('call_transcript_update', callId, { message, sender: sender || 'unknown' });
    }
}
export function emitEmergencyTrigger() {
    if (io) {
        console.log('[WebSocket] Emitting emergency_trigger');
        io.emit('emergency_trigger');
    }
}
export function emitChatResponse(message) {
    if (io) {
        io.emit('chat_response', message);
    }
}
export function emitError(message) {
    if (io) {
        io.emit('error', message);
    }
}
export function emitAgentNeedsInput(data) {
    if (io) {
        console.log('[WebSocket] Emitting agent_needs_input');
        io.emit('agent_needs_input', data);
    }
}
export function emitAgentInputReceived() {
    if (io) {
        console.log('[WebSocket] Emitting agent_input_received');
        io.emit('agent_input_received');
    }
}
