
import React, { useState, useEffect, useRef } from 'react';
import AppointmentScheduler from '../components/AppointmentScheduler';
import LiveCallPanel from '../components/LiveCallPanel';
import LocationWidget from '../components/LocationWidget';
import { useNavigate } from 'react-router-dom';

interface Message {
  role: 'user' | 'model';
  text: string;
}

import EmergencyModal from '../components/EmergencyModal';
import { io, Socket } from 'socket.io-client';

// WebSocket event interface (matching backend)
interface ServerToClientEvents {
  show_clinics: (clinics: any[]) => void;
  show_calendar: (slots: any[]) => void;
  call_started: (callId: string) => void;
  call_on_hold: (callId: string) => void;
  call_resumed: (callId: string) => void;
  call_ended: (callId: string, transcript: string[]) => void;
  call_transcript_update: (callId: string, line: string) => void;
  emergency_trigger: () => void;
  chat_response: (message: { role: 'user' | 'assistant', content: string }) => void;
  error: (message: string) => void;
}

interface ClientToServerEvents {
  chat_message: (message: string) => void;
}


const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: 'Hello! I am your Health.me AI assistant. I have access to your health records and current vitals. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Widget State
  const [activeWidget, setActiveWidget] = useState<'none' | 'location' | 'schedule'>('none');
  const [isCallActive, setIsCallActive] = useState(false);
 
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
  const [clinics, setClinics] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [showEmergency, setShowEmergency] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);

  useEffect(() => {
    // 1. Connect to Backend WebSocket
    const socket = io('http://localhost:3001'); // Assume local for now, env var later
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to backend WS');
    });

    // 2. Listen for Events
    socket.on('show_clinics', (data) => {
      setClinics(data);
      setActiveWidget('location');
    });

    socket.on('show_calendar', (slots) => {
      setAvailableSlots(slots);
      setActiveWidget('schedule');
    });

    socket.on('call_started', () => {
      setIsCallActive(true);
      // Keep widget if open, or minimized
    });

    socket.on('emergency_trigger', () => {
      setShowEmergency(false); // Close modal if open
      setShowEmergency(true); // Re-open or just ensure state
    });

    socket.on('call_transcript_update', (callId, line) => {
      setTranscript(prev => [...prev, line]);
    });

    socket.on('chat_response', (msg) => {
      setIsLoading(false);
      setMessages(prev => [...prev, { role: 'model', text: msg.content }]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      // Send to backend via REST (or WS, but REST handles the ElevenLabs agent initiation better initially)
      const res = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMsg })
      });
      
      const data = await res.json();
      
      // If backend returns a message directly (e.g. signedUrl or error)
      if (data.message && !data.conversation_id) { 
         // Fallback if not using signed URL flow for chat messages
         setMessages(prev => [...prev, { role: 'model', text: data.message }]);
         setIsLoading(false);
      }
      // If signed URL, the frontend ElevenLabs widget would handle it, 
      // but here we are simulating text chat via our backend proxy for now.
      // Wait, if we use conversational AI, it's audio.
      // If we use text-to-agent, we need to know how.
      // Assuming backend proxies text to agent via some API or mocks it for now.
      
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Connection error. Please check backend." }]);
      setIsLoading(false);
    }
  };
  
  const handleEmergencyConfirm = async () => {
    setShowEmergency(false);
    // Call the mock emergency line
    // In demo, we might just show a "Calling..." UI or use Twilio
    // For now, let's pretend a call started
    setIsCallActive(true);
    // Trigger backend call
    await fetch('http://localhost:3001/call/initiate', {
        method: 'POST', 
        body: JSON.stringify({ type: 'emergency' }),
        headers: {'Content-Type': 'application/json'}
    });
  };

  const handleNewChat = () => {
    setMessages([{ role: 'model', text: 'New conversation started. How can I assist you with your health today?' }]);
  };

  const handleAppointmentConfirm = (details: { day: string; date: string; time: string }) => {
    setActiveWidget('none');
    setMessages(prev => [...prev, 
      { role: 'model', text: `Appointment confirmed for ${details.day}, Oct ${details.date} at ${details.time}.` }
    ]);
    setIsCallActive(true);
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
                 className={`flex items-center gap-2 border border-black/5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${
                    activeWidget === 'location' ? 'bg-primary text-white' : 'bg-white text-primary hover:bg-black hover:text-white'
                 }`}
               >
                 <span className="material-symbols-outlined text-sm">location_on</span>
                 Locations
               </button>
               <button 
                 onClick={() => setActiveWidget(activeWidget === 'schedule' ? 'none' : 'schedule')}
                 className={`flex items-center gap-2 border border-black/5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${
                    activeWidget === 'schedule' ? 'bg-primary text-white' : 'bg-white text-primary hover:bg-black hover:text-white'
                 }`}
               >
                 <span className="material-symbols-outlined text-sm">calendar_month</span>
                 Schedule
               </button>
               <button 
                 onClick={() => setIsCallActive(!isCallActive)}
                 className={`flex items-center gap-2 border border-black/5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${
                    isCallActive ? 'bg-primary text-white' : 'bg-white text-primary hover:bg-black hover:text-white'
                 }`}
               >
                 <span className="material-symbols-outlined text-sm">phone_in_talk</span>
                 {isCallActive ? 'End Call' : 'Call'}
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
                  <div className={`size-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-sm ${
                    msg.role === 'user' ? 'bg-black text-white' : 'bg-primary text-white'
                  }`}>
                    {msg.role === 'user' ? 'SM' : <span className="material-symbols-outlined text-base">smart_toy</span>}
                  </div>
                  
                  <div className={`rounded-3xl p-5 shadow-sm border border-black/5 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white text-primary rounded-tl-none'
                  }`}>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="flex gap-4">
                  <div className="size-9 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-white text-base">smart_toy</span>
                  </div>
                  <div className="bg-white text-primary rounded-3xl rounded-tl-none p-5 shadow-sm border border-black/5 flex space-x-2 items-center">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="py-8 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleNewChat}
                className="group flex flex-col items-center justify-center size-14 rounded-3xl bg-white border border-black/5 text-gray-400 hover:text-primary hover:border-primary transition-all shadow-sm"
                title="New Conversation"
              >
                <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">add_comment</span>
                <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5">New</span>
              </button>
              
              <div className="flex-1 bg-white border border-black/5 shadow-2xl rounded-[32px] p-2 flex items-center space-x-2 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <button className="p-3 text-gray-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">attachment</span>
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
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className={`size-11 rounded-2xl transition-all flex items-center justify-center ${
                    isLoading || !input.trim() 
                      ? 'bg-gray-100 text-gray-400' 
                      : 'bg-primary text-white hover:bg-black active:scale-95 shadow-lg shadow-black/10'
                  }`}
                >
                  <span className="material-symbols-outlined">arrow_upward</span>
                </button>
              </div>
            </div>
            
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
          </div>
        </div>
      </div>

      {/* Shared Right Sidebar */}
      <div 
        className={`bg-white border-l border-black/5 shadow-xl transition-all duration-500 ease-in-out flex flex-col ${
          showRightPanel ? 'w-full lg:w-1/2 translate-x-0' : 'w-0 translate-x-full opacity-0'
        }`}
      >
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Widget Area (Location or Schedule) */}
          {activeWidget !== 'none' && (
            <div className={`flex-1 flex flex-col min-h-0 ${isCallActive ? 'h-[60%]' : 'h-full'}`}>
              {activeWidget === 'location' && (
                <LocationWidget 
                  onClose={() => setActiveWidget('none')} 
                  onSelect={() => setActiveWidget('schedule')}
                  clinics={clinics}
                />
              )}
              {activeWidget === 'schedule' && (
                <div className="h-full overflow-y-auto">
                   <AppointmentScheduler 
                     onClose={() => setActiveWidget('none')}
                     onConfirm={handleAppointmentConfirm}
                     availableSlots={availableSlots}
                   />
                </div>
              )}
            </div>
          )}

          {/* Bottom Call Area */}
          {isCallActive && (
            <div className={`${activeWidget !== 'none' ? 'flex-shrink-0' : 'flex-1 h-full'}`}>
              <LiveCallPanel 
                onClose={() => setIsCallActive(false)} 
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
    </div>
  );
};

export default Chat;
