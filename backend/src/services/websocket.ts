import { Server as SocketServer, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, Clinic, TimeSlot, ChatMessage } from '../types/index.js';

let io: SocketServer<ClientToServerEvents, ServerToClientEvents> | null = null;

export function initializeWebSocket(socketServer: SocketServer<ClientToServerEvents, ServerToClientEvents>) {
  io = socketServer;
  
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });
}

// Emit events to all connected clients
export function emitShowClinics(clinics: Clinic[]) {
  if (io) {
    console.log('[WebSocket] Emitting show_clinics');
    io.emit('show_clinics', clinics);
  }
}

export function emitShowCalendar(slots: TimeSlot[]) {
  if (io) {
    console.log('[WebSocket] Emitting show_calendar');
    io.emit('show_calendar', slots);
  }
}

export function emitCallStarted(callId: string) {
  if (io) {
    console.log(`[WebSocket] Emitting call_started: ${callId}`);
    io.emit('call_started', callId);
  }
}

export function emitCallOnHold(callId: string) {
  if (io) {
    console.log(`[WebSocket] Emitting call_on_hold: ${callId}`);
    io.emit('call_on_hold', callId);
  }
}

export function emitCallEnded(callId: string, transcript: string[]) {
  if (io) {
    console.log(`[WebSocket] Emitting call_ended: ${callId}`);
    io.emit('call_ended', callId, transcript);
  }
}

export function emitCallResumed(callId: string) {
  if (io) {
    console.log(`[WebSocket] Emitting call_resumed: ${callId}`);
    io.emit('call_resumed', callId);
  }
}

export function emitTranscriptUpdate(callId: string, line: string) {
  if (io) {
    io.emit('call_transcript_update', callId, line);
  }
}

export function emitEmergencyTrigger() {
  if (io) {
    console.log('[WebSocket] Emitting emergency_trigger');
    io.emit('emergency_trigger');
  }
}

export function emitChatResponse(message: ChatMessage) {
  if (io) {
    io.emit('chat_response', message);
  }
}

export function emitError(message: string) {
  if (io) {
    io.emit('error', message);
  }
}

export function emitAgentNeedsInput(data: { question: string; context?: string }) {
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
