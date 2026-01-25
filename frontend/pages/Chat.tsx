
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useNavigate } from 'react-router-dom';

interface Message {
  role: 'user' | 'model';
  text: string;
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
  const [showLocationOverlay, setShowLocationOverlay] = useState(false);
  const [showCalendarOverlay, setShowCalendarOverlay] = useState(false);
  const [showCallOverlay, setShowCallOverlay] = useState(false);
  
  // Calendar specific state
  const [selectedDay, setSelectedDay] = useState('Tue');
  const [selectedTime, setSelectedTime] = useState('08:00 AM');

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

  const LocationOverlay = () => (
    <div className="fixed inset-0 z-[110] bg-white/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-card-beige w-full max-w-4xl rounded-[40px] shadow-2xl border border-black/5 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-10 border-b border-black/5 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="serif-font text-4xl text-primary">Find Nearby Doctors</h2>
            <p className="text-gray-500 font-medium mt-1">Showing clinics within 5 miles of your location</p>
          </div>
          <button onClick={() => setShowLocationOverlay(false)} className="size-12 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          <div className="w-full lg:w-1/2 p-10 overflow-y-auto custom-scrollbar space-y-6">
             {[
               { name: 'City Health Center', dist: '0.8 miles', rate: '4.8', tags: ['GP', 'Urgent Care'] },
               { name: 'Prime Care Medical', dist: '1.2 miles', rate: '4.5', tags: ['Diagnostics'] },
               { name: 'St. Mary Diagnostics', dist: '2.4 miles', rate: '4.9', tags: ['Cardiology'] }
             ].map(clinic => (
               <div key={clinic.name} className="bg-white p-6 rounded-3xl border border-black/5 hover:border-primary transition-all group cursor-pointer shadow-sm">
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="font-black text-xl text-primary">{clinic.name}</h3>
                   <span className="text-xs font-bold text-gray-400">{clinic.dist}</span>
                 </div>
                 <div className="flex items-center gap-1 text-orange-500 mb-4">
                   <span className="material-symbols-outlined text-[16px] fill-1">star</span>
                   <span className="text-sm font-black">{clinic.rate}</span>
                 </div>
                 <div className="flex flex-wrap gap-2 mb-6">
                   {clinic.tags.map(t => <span key={t} className="px-3 py-1 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-lg">{t}</span>)}
                 </div>
                 <button onClick={() => { setShowLocationOverlay(false); setShowCalendarOverlay(true); }} className="w-full bg-primary text-white py-3 rounded-2xl text-xs font-black shadow-lg shadow-black/5 hover:bg-black transition-all">
                   Select This Center
                 </button>
               </div>
             ))}
          </div>
          <div className="w-full lg:w-1/2 bg-gray-100 relative grayscale opacity-80 min-h-[300px]">
             <img src="https://picsum.photos/seed/sfmap/800/800" className="w-full h-full object-cover" alt="Map" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
               <div className="size-8 bg-primary rounded-full border-4 border-white shadow-2xl pulse-red"></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const CalendarOverlay = () => {
    const days = [
      { day: 'MON', date: '12' },
      { day: 'TUE', date: '13' },
      { day: 'WED', date: '14' },
      { day: 'THU', date: '15', disabled: true },
      { day: 'FRI', date: '16' },
      { day: 'SAT', date: '17' },
      { day: 'SUN', date: '18' },
    ];

    const slots: Record<string, string[]> = {
      'MON': ['09:00 AM', '10:30 AM'],
      'TUE': ['08:00 AM', '11:00 AM'],
      'WED': ['02:00 PM', '04:30 PM'],
      'FRI': ['09:15 AM', '03:00 PM'],
      'SAT': ['10:00 AM'],
      'SUN': ['11:30 AM'],
    };

    return (
      <div className="fixed inset-0 z-[110] bg-white/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
        <div className="bg-card-beige w-full max-w-5xl rounded-[40px] shadow-2xl border border-black/5 p-12 overflow-hidden relative">
          <button onClick={() => setShowCalendarOverlay(false)} className="absolute top-8 right-8 size-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-black/5 hover:bg-primary hover:text-white transition-all">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
          
          <div className="flex justify-between items-start mb-16">
            <div>
              <h2 className="serif-font text-4xl text-primary mb-2">Select Appointment Time</h2>
              <p className="text-gray-400 font-medium">Confirmed with City Health Center</p>
            </div>
            <div className="flex gap-2">
              <button className="size-12 bg-white rounded-full flex items-center justify-center border border-black/5 hover:shadow-md transition-all">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="size-12 bg-white rounded-full flex items-center justify-center border border-black/5 hover:shadow-md transition-all">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-4 mb-16">
            {days.map((item) => (
              <div key={item.date} className="flex flex-col items-center">
                <div className={`text-[11px] font-black uppercase tracking-widest mb-3 ${item.disabled ? 'text-gray-200' : 'text-gray-400'}`}>
                  {item.day}
                </div>
                <div 
                  onClick={() => !item.disabled && setSelectedDay(item.day)}
                  className={`text-2xl font-black mb-8 cursor-pointer transition-all ${
                    item.day === selectedDay ? 'text-primary scale-110' : item.disabled ? 'text-gray-200 cursor-default' : 'text-primary opacity-40 hover:opacity-100'
                  }`}
                >
                  {item.date}
                </div>
                
                <div className="flex flex-col gap-3 w-full">
                  {item.disabled ? (
                    <div className="text-[11px] italic text-gray-300 font-medium mt-4">No slots</div>
                  ) : (
                    slots[item.day]?.map(time => (
                      <button
                        key={time}
                        onClick={() => { setSelectedDay(item.day); setSelectedTime(time); }}
                        className={`w-full py-4 rounded-3xl border text-[13px] font-bold transition-all ${
                          selectedDay === item.day && selectedTime === time
                            ? 'bg-primary text-white border-primary shadow-xl scale-105'
                            : 'bg-white/40 border-black/5 text-primary hover:border-primary/20'
                        }`}
                      >
                        {time}
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => { setShowCalendarOverlay(false); setShowCallOverlay(true); }}
            className="w-full bg-primary text-white py-8 rounded-[28px] text-lg font-black shadow-2xl hover:bg-black transition-all active:scale-[0.98]"
          >
            Confirm Appointment — {days.find(d => d.day === selectedDay)?.day}, Oct {days.find(d => d.day === selectedDay)?.date} at {selectedTime}
          </button>
        </div>
      </div>
    );
  };

  const CallOverlay = () => (
    <div className="fixed inset-0 z-[120] bg-white/60 backdrop-blur-2xl flex items-center justify-center p-6 animate-in slide-in-from-bottom-10 duration-500">
      <div className="w-full max-w-4xl h-[85vh] bg-soft-cream rounded-[48px] shadow-3xl border border-black/5 flex flex-col overflow-hidden">
        {/* Call Header */}
        <div className="p-10 border-b border-black/5 flex justify-between items-center bg-white/50">
          <div>
            <h2 className="serif-font text-3xl text-primary mb-2">Relay Call: City Health Center</h2>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100">
                <span className="size-1.5 rounded-full bg-green-500 pulse-green"></span>
                AI Connected
              </span>
              <p className="text-xs text-gray-400 font-medium">Auto-scheduling annual check-up</p>
            </div>
          </div>
          <button onClick={() => setShowCallOverlay(false)} className="size-12 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Transcript Area */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
           <div className="flex gap-4">
              <div className="size-10 rounded-full overflow-hidden border border-black/5">
                 <img src="https://picsum.photos/seed/clinic/100/100" className="w-full h-full object-cover" alt="Clinic" />
              </div>
              <div className="bg-white p-5 rounded-3xl rounded-tl-none shadow-sm border border-black/5 max-w-lg">
                 <p className="text-sm text-primary leading-relaxed">City Health Center, how can I help you today?</p>
              </div>
           </div>

           <div className="flex flex-row-reverse gap-4">
              <div className="size-10 bg-primary rounded-full flex items-center justify-center shadow-md">
                 <span className="material-symbols-outlined text-white text-lg fill-1">smart_toy</span>
              </div>
              <div className="bg-primary p-5 rounded-3xl rounded-tr-none shadow-xl text-white max-w-lg">
                 <p className="text-sm leading-relaxed">Hello, I'm calling from Health.me for Sam Smith. We'd like to book an appointment for {selectedDay} at {selectedTime} if available.</p>
              </div>
           </div>

           <div className="flex gap-4">
              <div className="size-10 rounded-full overflow-hidden border border-black/5">
                 <img src="https://picsum.photos/seed/clinic/100/100" className="w-full h-full object-cover" alt="Clinic" />
              </div>
              <div className="bg-white p-5 rounded-3xl rounded-tl-none shadow-sm border border-black/5 max-w-lg">
                 <p className="text-sm text-primary leading-relaxed">Checking now... Yes, we have that slot open with Dr. Aris. I'll get that scheduled for Sam.</p>
              </div>
           </div>

           {/* Waveform */}
           <div className="flex justify-center items-center gap-1.5 py-12">
             {[0.1, 0.4, 0.2, 0.6, 0.3, 0.5, 0.2].map((d, i) => (
               <div key={i} className="waveform-bar w-1.5 bg-primary rounded-full" style={{ animationDelay: `${d}s` }}></div>
             ))}
           </div>
        </div>

        {/* Call Footer */}
        <div className="p-10 bg-white border-t border-black/5 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
                    <div className="size-4 bg-white rounded-full translate-x-6 transition-transform"></div>
                 </div>
                 <span className="text-xs font-bold uppercase tracking-wider text-primary">AI Control Mode</span>
              </div>
           </div>
           <button 
             onClick={() => setShowCallOverlay(false)}
             className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black text-sm flex items-center gap-3 shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95"
           >
             <span className="material-symbols-outlined">call_end</span>
             End Call
           </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-soft-cream relative">
      {showLocationOverlay && <LocationOverlay />}
      {showCalendarOverlay && <CalendarOverlay />}
      {showCallOverlay && <CallOverlay />}

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
               onClick={() => setShowLocationOverlay(true)}
               className="flex items-center gap-2 bg-white border border-black/5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider text-primary hover:bg-black hover:text-white transition-all shadow-sm"
             >
               <span className="material-symbols-outlined text-sm">location_on</span>
               Locations
             </button>
             <button 
               onClick={() => setShowCalendarOverlay(true)}
               className="flex items-center gap-2 bg-white border border-black/5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider text-primary hover:bg-black hover:text-white transition-all shadow-sm"
             >
               <span className="material-symbols-outlined text-sm">calendar_month</span>
               Schedule
             </button>
             <button 
               onClick={() => setShowCallOverlay(true)}
               className="flex items-center gap-2 bg-white border border-black/5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider text-primary hover:bg-black hover:text-white transition-all shadow-sm"
             >
               <span className="material-symbols-outlined text-sm">phone_in_talk</span>
               Call
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
  );
};

export default Chat;
