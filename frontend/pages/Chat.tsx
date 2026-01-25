
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useNavigate } from 'react-router-dom';

interface Message {
  role: 'user' | 'model';
  text: string;
}

import AppointmentScheduler from '../components/AppointmentScheduler';
import LiveCallPanel from '../components/LiveCallPanel';
import LocationWidget from '../components/LocationWidget';

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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...messages, { role: 'user', text: userMsg }].map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: 'You are Health.me, a professional medical AI assistant. You are knowledgeable about symptoms, medication, and clinical processes. Be empathetic, clinical yet accessible, and always prioritize user safety. If symptoms sound urgent, recommend using the Emergency Alert feature. Always state you are an AI assistant.',
        }
      });

      const aiText = response.text || "I apologize, I'm having trouble processing that right now.";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I encountered a connectivity issue. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
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
          showRightPanel ? 'w-[440px] translate-x-0' : 'w-0 translate-x-full opacity-0'
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
                />
              )}
              {activeWidget === 'schedule' && (
                <div className="h-full overflow-y-auto">
                   <AppointmentScheduler 
                     onClose={() => setActiveWidget('none')}
                     onConfirm={handleAppointmentConfirm}
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
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
