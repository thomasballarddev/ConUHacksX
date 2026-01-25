
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Emergency: React.FC = () => {
  const [seconds, setSeconds] = useState(42);
  const [isAiMode, setIsAiMode] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-beige-dashboard dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-emergency/30 flex flex-col">
        {/* Header */}
        <div className="bg-white/50 dark:bg-white/5 px-8 py-6 flex flex-col items-center border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-3 w-3">
              <span className="pulse-red absolute inline-flex h-full w-full rounded-full bg-emergency opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emergency"></span>
            </span>
            <span className="text-emergency font-bold text-sm uppercase tracking-widest font-manrope">Live 911 Emergency Call</span>
          </div>
          <div className="text-5xl font-black tabular-nums font-manrope tracking-tighter">{formatTime(seconds)}</div>
          <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">San Francisco Emergency Dispatch</p>
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="mb-8">
            <label className="block text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Select Communication Mode</label>
            <div className="bg-gray-200/50 dark:bg-white/5 p-1.5 rounded-2xl flex gap-1 border border-gray-200 dark:border-white/10">
              <button 
                onClick={() => setIsAiMode(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${!isAiMode ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-gray-400'}`}
              >
                <span className="material-symbols-outlined text-xl">record_voice_over</span>
                Talk Myself
              </button>
              <button 
                onClick={() => setIsAiMode(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${isAiMode ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-gray-400'}`}
              >
                <span className="material-symbols-outlined text-xl fill-1">smart_toy</span>
                AI Assistant
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden mb-8 shadow-sm">
            <div className="bg-gray-50 dark:bg-white/5 px-4 py-2 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">AI Assistant Transcript</span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-green-500 pulse-green"></span>
                <span className="text-[10px] font-bold text-green-600 uppercase">Active Relay</span>
              </span>
            </div>
            <div className="p-5 min-h-[160px] flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="size-7 shrink-0 bg-emergency/10 rounded-lg flex items-center justify-center text-emergency">
                  <span className="material-symbols-outlined text-base">emergency</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
                  "This is an automated emergency relay from Health.me. I am assisting Alex Mercer, who is experiencing severe respiratory distress."
                </p>
              </div>
              <div className="flex gap-3">
                <div className="size-7 shrink-0 bg-emergency/10 rounded-lg flex items-center justify-center text-emergency">
                  <span className="material-symbols-outlined text-base">info</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
                  "User Profile: Type 1 Diabetic, allergic to penicillin. Current location: 123 Maple Street, San Francisco. Apartment 4B."
                </p>
              </div>
              <div className="flex gap-3 items-center">
                <div className="size-7 shrink-0 bg-emergency/10 rounded-lg flex items-center justify-center text-emergency">
                  <span className="material-symbols-outlined text-base">sensors</span>
                </div>
                <p className="text-sm font-bold text-emergency">AI is relaying real-time heart rate and oxygen levels...</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => navigate('/')}
              className="w-full py-5 bg-emergency hover:bg-red-700 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-emergency/20"
            >
              <span className="material-symbols-outlined fill-1">call_end</span>
              END CALL
            </button>
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-2 text-gray-400">
                <span className="material-symbols-outlined text-sm">mic</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Microphone Active</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="material-symbols-outlined text-sm">location_on</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">GPS Sharing ON</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 dark:bg-white/5 py-4 px-8 flex items-center justify-between border-t border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="material-symbols-outlined text-xs">verified_user</span>
            <span className="text-[9px] font-bold uppercase tracking-widest">E911 Digital Relay Certified</span>
          </div>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Health.me Safety Core v2.4</span>
        </div>
      </div>
    </div>
  );
};

export default Emergency;
