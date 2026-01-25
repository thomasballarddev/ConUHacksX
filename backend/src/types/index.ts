// Types for Health.me backend

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: string;
  rating: number;
  tags: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface TimeSlot {
  day: string;
  date: string;
  time: string;
}

export interface CallState {
  id: string;
  clinicId: string;
  status: 'initiating' | 'active' | 'on_hold' | 'completed' | 'failed';
  transcript: string[];
  availableSlots?: TimeSlot[];
  selectedSlot?: TimeSlot;
  startedAt: string;
  endedAt?: string;
}

export interface TranscriptMessage {
  message: string;
  sender: string;
}

// WebSocket event types
export interface ServerToClientEvents {
  show_clinics: (clinics: Clinic[]) => void;
  show_calendar: (slots: TimeSlot[]) => void;
  call_started: (callId: string) => void;
  call_on_hold: (callId: string) => void;
  call_resumed: (callId: string) => void;
  call_ended: (callId: string, transcript: TranscriptMessage[]) => void;
  call_transcript_update: (callId: string, data: TranscriptMessage) => void;
  emergency_trigger: () => void;
  chat_response: (message: ChatMessage) => void;
  error: (message: string) => void;
  agent_needs_input: (data: { question: string; context?: string }) => void;
  agent_input_received: () => void;
}

export interface ClientToServerEvents {
  chat_message: (message: string) => void;
  select_clinic: (clinicId: string) => void;
  select_slot: (slot: TimeSlot) => void;
  cancel_emergency: () => void;
}
