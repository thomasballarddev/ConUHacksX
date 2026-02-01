
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

import LiveCallPanel from '../components/LiveCallPanel';
import LocationWidget from '../components/LocationWidget';
import QuestionWidget from '../components/QuestionWidget';
import GoogleCalendarModal from '../components/GoogleCalendarModal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { saveMessage, getOrCreateActiveChat, subscribeToMessages, createChatSession, setActiveChatId, getUserProfile } from '../src/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../src/firebase';

interface Message {
  role: 'user' | 'model';
  text: string;
}

import EmergencyModal from '../components/EmergencyModal';
import { io, Socket } from 'socket.io-client';

// WebSocket event interface (matching backend)
interface ServerToClientEvents {
  show_clinics: (clinics: any[]) => void;

  call_started: (callId: string) => void;
  call_on_hold: (callId: string) => void;
  call_resumed: (callId: string) => void;
  call_ended: (callId: string, transcript: TranscriptMessage[]) => void;
  call_transcript_update: (callId: string, data: { message: string; sender: string }) => void;
  emergency_trigger: () => void;
  chat_response: (message: { role: 'user' | 'assistant', content: string }) => void;
  error: (message: string) => void;
  // Agent input request events
  agent_needs_input: (data: { callId: string; question: string; context?: string }) => void;
  agent_input_received: (data: { callId: string }) => void;
}

interface TranscriptMessage {
  message: string;
  sender: 'bot' | 'receptionist' | 'unknown';
}

interface ClientToServerEvents {
  chat_message: (message: string) => void;
}



import { useVoiceInput } from '../src/hooks/useVoiceInput';
import AudioVisualizer from '../components/AudioVisualizer';

// ... existing interfaces ...

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: 'Hello! I am your Health.me AI assistant. I have access to your health records and current vitals. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [firestoreChatId, setFirestoreChatId] = useState<string | null>(null);

  // Session state
  const [searchParams] = useSearchParams();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Widget State
  const [activeWidget, setActiveWidget] = useState<'none' | 'location' | 'question'>('none');
  const [isCallActive, setIsCallActive] = useState(false);
  const [userInitials, setUserInitials] = useState('U');

  // Fetch user profile for initials
  useEffect(() => {
    if (user) {
      // Try Firestore profile first, then fall back to Firebase Auth displayName
      getUserProfile(user.uid).then(profile => {
        const name = profile?.personalInfo?.fullName || user.displayName || '';
        if (name) {
          const names = name.trim().split(' ').filter(n => n.length > 0);
          const initials = names.length >= 2
            ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
            : names[0]?.slice(0, 2).toUpperCase() || 'U';
          setUserInitials(initials);
        }
      });
    }
  }, [user]);

  // Initialize Firestore chat session when user is authenticated or URL changes
  useEffect(() => {
    if (!user) return;

    const sessionParam = searchParams.get('session');

    const initFirestoreChat = async () => {
      try {
        let chatId: string;

        if (sessionParam) {
          // Load specific session from URL
          chatId = sessionParam;
          setActiveSessionId(sessionParam);
          await setActiveChatId(user.uid, chatId);
        } else {
          // Get or create active chat
          chatId = await getOrCreateActiveChat(user.uid);
          setActiveSessionId(null);
        }

        setFirestoreChatId(chatId);

        // Subscribe to messages from Firestore
        const unsubscribe = subscribeToMessages(user.uid, chatId, (firestoreMessages) => {
          if (firestoreMessages.length > 0) {
            setMessages(firestoreMessages.map(m => ({ role: m.role, text: m.text })));
          } else {
            // No messages yet, show welcome message
            setMessages([{
              role: 'model',
              text: 'Hello! I am your Health.me AI assistant. I have access to your health records and current vitals. How can I help you today?'
            }]);
          }
        });

        setIsCompleted(false);
        return unsubscribe;
      } catch (error) {
        console.error('Error initializing Firestore chat:', error);
      }
    };

    const cleanup = initFirestoreChat();
    return () => {
      cleanup?.then(unsub => unsub?.());
    };
  }, [user, searchParams]);

  // Voice Hook
  const handleVoiceFinalResult = (text: string) => {
    // Auto-send when silence is detected
    handleSend(text);
  };

  const {
    isListening,
    transcript: voiceTranscript,
    startListening,
    stopListening,
    audioData,
    speak
  } = useVoiceInput({ onFinalTranscript: handleVoiceFinalResult });

  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Socket Ref
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  // Widget Data

  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [showEmergency, setShowEmergency] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);

  // Agent input request state (when agent needs info from user during call)
  const [agentNeedsInput, setAgentNeedsInput] = useState(false);
  const [agentQuestion, setAgentQuestion] = useState('');
  const [agentContext, setAgentContext] = useState('');

  // Google Calendar modal state
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<{ day: string; date: string; time: string; month?: string } | null>(null);
  const [selectedClinicName, setSelectedClinicName] = useState('Medical Clinic');

  useEffect(() => {
    // 1. Connect to Backend WebSocket
    const socket = io(import.meta.env.VITE_BACKEND_URL); // Uses env var
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to backend WS');
    });

    // 2. Listen for Events
    socket.on('show_clinics', () => {
      setActiveWidget('location');
    });


    socket.on('call_started', () => {
      setIsCallActive(true);
      // Keep widget if open, or minimized
    });

    socket.on('emergency_trigger', () => {
      setShowEmergency(false); // Close modal if open
      setShowEmergency(true); // Re-open or just ensure state
    });

    socket.on('call_transcript_update', (callId, data) => {
      console.log('[Frontend] Received transcript update:', data);
      setTranscript(prev => [...prev, data]);
    });

    socket.on('chat_response', (msg: { role: string, content: string, audio?: string }) => {
      setIsLoading(false);
      setMessages(prev => [...prev, { role: 'model', text: msg.content }]);
      // Just speak the response, don't auto-activate mic
      speak(msg.content, undefined, msg.audio);
    });

    // Agent needs user input during call
    socket.on('agent_needs_input', (data) => {
      setAgentNeedsInput(true);
      setAgentQuestion(data.question);
      setAgentContext(data.context || 'The receptionist is asking for this information.');
      setActiveWidget('question'); // Switch to question widget
    });

    // Agent received user input, clear the prompt
    socket.on('agent_input_received', () => {
      setAgentNeedsInput(false);
      setAgentQuestion('');
      setAgentContext('');
    });

    return () => {
      socket.disconnect();
    };
  }, [speak]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    // Use textOverride if provided, otherwise clear input state
    if (!textOverride) setInput('');

    const userMessage = { role: 'user' as const, text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Save user message to Firestore
    if (user && firestoreChatId) {
      saveMessage(user.uid, firestoreChatId, userMessage);
    }

    try {
      // Send to backend via REST (or WS, but REST handles the ElevenLabs agent initiation better initially)
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          conversation_id: conversationId  // Include conversation_id for context
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      // Store conversation_id for subsequent messages
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      // Gemini returns { message: "...", conversation_id: "..." }
      if (data.message) {
        const modelMessage = { role: 'model' as const, text: data.message };
        setMessages(prev => [...prev, modelMessage]);

        // Save model message to Firestore
        if (user && firestoreChatId) {
          saveMessage(user.uid, firestoreChatId, modelMessage);
        }

        speak(data.message, undefined, data.audio);
      }
      setIsLoading(false);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Connection error. Please check backend." }]);
      setIsLoading(false);
    }
  };

  const handleEmergencyConfirm = async () => {
    setShowEmergency(false);
    // Call the emergency line
    setIsCallActive(true);
    setMessages(prev => [...prev, { role: 'model', text: 'Connecting you to emergency services at 438 520 2457...' }]);
    // Trigger backend call to emergency number
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/call/initiate`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'emergency',
        phone: '+14385202457',  // Emergency line
        userId: user?.uid // Pass the user ID for emergency calls too
      }),
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const handleNewChat = async () => {
    setMessages([{ role: 'model', text: 'New conversation started. How can I assist you with your health today?' }]);
    setIsCompleted(false);
    setActiveSessionId(null);
    setConversationId(null);  // Reset conversation for fresh start

    // Create a new Firestore chat session
    if (user) {
      try {
        const newChatId = await createChatSession(user.uid);
        setFirestoreChatId(newChatId);

        // Update the active chat reference
        const activeChatRef = doc(db, 'users', user.uid, 'activeChat', 'current');
        await setDoc(activeChatRef, { chatId: newChatId });

        console.log('[Chat] Created new Firestore chat:', newChatId);
      } catch (error) {
        console.error('[Chat] Failed to create new Firestore chat:', error);
      }
    }

    navigate('/chat');
  };

  const handleClinicSelect = async (clinic: { name: string; phone?: string }) => {
    setActiveWidget('none');
    setIsCallActive(true);
    setSelectedClinicName(clinic.name);
    setMessages(prev => [...prev,
    { role: 'model', text: `Calling ${clinic.name} to schedule your appointment... Our AI assistant will speak with the receptionist on your behalf.` }
    ]);

    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/call/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '+18194755578', // Demo: always call this number
          clinic_name: clinic.name,
          userId: user?.uid // Pass the user ID to fetch profile data
        })
      });
    } catch (error) {
      console.error('Failed to initiate call:', error);
      setMessages(prev => [...prev,
      { role: 'model', text: 'Sorry, there was an issue connecting the call. Please try again.' }
      ]);
      setIsCallActive(false);
    }
  };

  const handleAppointmentConfirm = async (details: { day: string; date: string; time: string }) => {
    setActiveWidget('none');
    const appointmentText = `${details.day}, the ${details.date} at ${details.time}`;

    // Calculate month for the appointment
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const dayNum = parseInt(details.date);
    // If the date is smaller than today's date, it's likely next month
    const month = monthNames[dayNum < today.getDate() ? (today.getMonth() + 1) % 12 : today.getMonth()];

    // Show the Google Calendar modal
    setConfirmedAppointment({ ...details, month });
    setShowCalendarModal(true);

    // Send selection to active call
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/call/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: appointmentText })
      });

      setMessages(prev => [...prev,
      { role: 'model', text: `Great! I've told the clinic you'd like the appointment on ${appointmentText}. The receptionist is confirming now...` }
      ]);
    } catch (error) {
      console.error('Failed to send appointment selection:', error);
      setMessages(prev => [...prev,
      { role: 'model', text: `Appointment selected: ${appointmentText}. (Note: Could not update the call)` }
      ]);
    }
  };

  // Handle user response to agent input request
  const handleAgentInputResponse = async (response: string) => {
    // For testing: clear immediately (in production, socket event handles this)
    setAgentNeedsInput(false);
    setAgentQuestion('');
    setAgentContext('');

    // Add the response to the transcript for visibility
    setTranscript(prev => [...prev, { message: response, sender: 'bot' }]);

    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/call/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response })
      });
      // The socket will emit 'agent_input_received' to clear the prompt
      setActiveWidget('none');
    } catch (error) {
      console.error('Failed to send user response:', error);
    }
  };

  // Derived state for Right Panel visibility
  const showRightPanel = activeWidget !== 'none' || isCallActive;

  return (
    <div className="flex h-full bg-soft-cream relative overflow-hidden">
      {/* Main Chat Area */}
      <div className={`flex flex-col h-full flex-1 relative transition-all duration-500`}>
        <div className="max-w-4xl mx-auto w-full flex flex-col h-full px-6">
          <div className="py-6 border-b border-black/5 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="serif-font text-3xl text-primary">AI Health Assistant</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="px-2 py-0.5 bg-green-50 rounded-full flex items-center space-x-1.5 border border-green-100">
                    <span className="size-1 rounded-full bg-green-500"></span>
                    <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Secure session</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveWidget(activeWidget === 'location' ? 'none' : 'location')}
                className={`flex items-center gap-2 border border-black/5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-sm ${activeWidget === 'location' ? 'bg-primary text-white' : 'bg-white text-primary hover:bg-black hover:text-white'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">location_on</span>
                Locations
              </button>

              <button
                onClick={async () => {
                  if (isCallActive) {
                    // Close the call UI
                    setIsCallActive(false);
                    setTranscript([]);
                  } else {
                    setIsCallActive(true);
                  }
                }}
                className={`flex items-center gap-2 border border-black/5 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-sm ${isCallActive ? 'bg-primary text-white' : 'bg-white text-primary hover:bg-black hover:text-white'
                  }`}
              >
                {isCallActive ? (
                  <>
                    <span className="material-symbols-outlined text-sm">call_end</span>
                    <span className="text-[11px] font-black uppercase tracking-wider">End</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">phone_in_talk</span>
                    <span className="text-[11px] font-black uppercase tracking-wider">Call</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto py-8 space-y-8 custom-scrollbar pr-2 scroll-smooth"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`size-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-sm ${msg.role === 'user' ? 'bg-black text-white' : 'bg-primary text-white'
                    }`}>
                    {msg.role === 'user' ? userInitials : 'H'}
                  </div>

                  <div className={`rounded-3xl p-5 shadow-sm border border-black/5 ${msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-white text-primary rounded-tl-none'
                    }`}>
                    {msg.role === 'user' ? (
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div className="text-[15px] leading-relaxed prose prose-sm max-w-none prose-headings:text-primary prose-strong:text-primary prose-ul:my-2 prose-li:my-0.5">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-4">
                  <div className="size-9 rounded-full bg-primary flex items-center justify-center shadow-sm text-white text-xs font-bold">
                    H
                  </div>
                  <div className="bg-white text-primary rounded-3xl rounded-tl-none p-5 shadow-sm border border-black/5 flex space-x-2 items-center">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="py-8 flex-shrink-0">
            {isCompleted ? (
              <div className="bg-gray-100 border border-black/5 rounded-[32px] p-4 flex items-center justify-center gap-3">
                <span className="material-symbols-outlined text-gray-400">lock</span>
                <p className="text-gray-500 text-sm font-medium">This conversation is completed and read-only</p>
                <button
                  onClick={handleNewChat}
                  className="ml-4 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black transition-all"
                >
                  Start New Chat
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleNewChat}
                  className="group flex flex-col items-center justify-center size-14 rounded-3xl bg-white border border-black/5 text-gray-400 hover:text-primary hover:border-primary transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-sm"
                  title="New Conversation"
                >
                  <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">add_comment</span>
                  <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5">New</span>
                </button>

                {isListening ? (
                  <div className="flex-1 bg-white border-2 border-primary/30 shadow-2xl rounded-[32px] p-2 flex items-center gap-2 animate-in fade-in zoom-in duration-300 min-w-0">
                    {/* Recording indicator */}
                    <div className="flex items-center gap-2 px-3 flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      <AudioVisualizer audioData={audioData} />
                    </div>

                    {/* Transcript display */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-[15px] text-gray-800 truncate">
                        {voiceTranscript || <span className="text-gray-400 italic">Listening...</span>}
                      </p>
                    </div>

                    {/* Send button */}
                    <button
                      onClick={() => {
                        if (voiceTranscript.trim()) {
                          stopListening();
                          handleSend(voiceTranscript.trim());
                        }
                      }}
                      disabled={!voiceTranscript.trim()}
                      className={`size-11 rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center flex-shrink-0 ${voiceTranscript.trim()
                        ? 'bg-primary text-white hover:bg-black active:scale-95 shadow-lg shadow-black/10'
                        : 'bg-gray-100 text-gray-400'
                        }`}
                      title="Send Message"
                    >
                      <span className="material-symbols-outlined">arrow_upward</span>
                    </button>

                    {/* Cancel button */}
                    <button
                      onClick={stopListening}
                      className="size-11 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center flex-shrink-0"
                      title="Cancel"
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 bg-white border border-black/5 shadow-2xl rounded-[32px] p-2 flex items-center space-x-2 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    <button
                      onClick={() => startListening()}
                      className="p-3 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-full transition-all group"
                      title="Voice Input"
                    >
                      <span className="material-symbols-outlined group-hover:scale-110 transition-transform">mic</span>
                    </button>
                    <input
                      className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] placeholder:text-gray-400 py-3"
                      placeholder="Ask about symptoms or bookings..."
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={isLoading || !input.trim()}
                      className={`size-11 rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center ${isLoading || !input.trim()
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-primary text-white hover:bg-black active:scale-95 shadow-lg shadow-black/10'
                        }`}
                    >
                      <span className="material-symbols-outlined">arrow_upward</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isCompleted && (
              <div className="mt-4 flex justify-center gap-6 opacity-40">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[12px] fill-1">verified</span>
                  HIPAA Compliant
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[12px] fill-1">lock</span>
                  Private Session
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shared Right Sidebar */}
      <div
        className={`bg-white border-l border-black/5 shadow-xl transition-all duration-500 ease-in-out flex flex-col ${showRightPanel ? 'w-full lg:w-1/2 translate-x-0' : 'w-0 translate-x-full opacity-0'
          }`}
      >
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Widget Area (Location or Schedule) */}
          {activeWidget !== 'none' && (
            <div className={`flex-1 flex flex-col min-h-0 ${isCallActive ? 'h-[60%]' : 'h-full'}`}>
              {activeWidget === 'location' && (
                <LocationWidget
                  onClose={() => setActiveWidget('none')}
                  onClinicSelect={handleClinicSelect}
                />
              )}

              {activeWidget === 'question' && (
                <QuestionWidget
                  onClose={() => { /* Cannot close question widget, user must answer */ }}
                  onSubmit={handleAgentInputResponse}
                  question={agentQuestion}
                />
              )}
            </div>
          )}

          {/* Bottom Call Area */}
          {isCallActive && (
            <div className={`${activeWidget !== 'none' ? 'flex-shrink-0' : 'flex-1 h-full'}`}>
              <LiveCallPanel
                onClose={() => {
                  setIsCallActive(false);
                  setTranscript([]);
                }}
                minimized={activeWidget !== 'none'}
                transcript={transcript}
              />
            </div>
          )}
        </div>
      </div>
      {showEmergency && (
        <EmergencyModal
          onCancel={() => setShowEmergency(false)}
          onConfirm={handleEmergencyConfirm}
        />
      )}

      {/* Google Calendar Modal */}
      <GoogleCalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        appointment={confirmedAppointment}
        clinicName={selectedClinicName}
      />
    </div>
  );
};

export default Chat;
