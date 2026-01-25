
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Emergency: React.FC = () => {
  const [seconds, setSeconds] = useState(10);
  const [isAiMode, setIsAiMode] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-soft-cream rounded-3xl shadow-2xl overflow-hidden border border-black/5">
        {/* Header */}
        <div className="bg-white p-6 flex flex-col items-center border-b border-black/5">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="pulse-red absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-red-500 font-black text-[10px] uppercase tracking-widest">Emergency Call Active</span>
          </div>
          <div className="text-4xl font-black tabular-nums text-primary">{seconds}s</div>
          <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-wider">Montreal Emergency Dispatch</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Mode Selector */}
          <div>
            <label className="block text-center text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Communication Mode</label>
            <div className="bg-white p-1 rounded-xl flex gap-1 border border-black/5">
              <button 
                onClick={() => setIsAiMode(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${!isAiMode ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-primary'}`}
              >
                <span className="material-symbols-outlined text-sm">record_voice_over</span>
                Talk Myself
              </button>
              <button 
                onClick={() => setIsAiMode(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${isAiMode ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-primary'}`}
              >
                <span className="material-symbols-outlined text-sm fill-1">smart_toy</span>
                AI Relay
              </button>
            </div>
          </div>

          {/* Transcript */}
          <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-black/5 flex justify-between items-center">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">AI Transcript</span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-green-500 pulse-green"></span>
                <span className="text-[9px] font-black text-green-600 uppercase">Active</span>
              </span>
            </div>
            <div className="p-4 space-y-3 max-h-[140px] overflow-y-auto custom-scrollbar">
              <div className="flex gap-2">
                <div className="size-6 shrink-0 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
                  <span className="material-symbols-outlined text-xs">emergency</span>
                </div>
                <p className="text-xs text-gray-600 italic leading-relaxed">
                  "This is an automated emergency relay from Health.me. Assisting Sam Smith with respiratory distress."
                </p>
              </div>
              <div className="flex gap-2">
                <div className="size-6 shrink-0 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
                  <span className="material-symbols-outlined text-xs">info</span>
                </div>
                <p className="text-xs text-gray-600 italic leading-relaxed">
                  "Type 1 Diabetic, allergic to penicillin. Location: 1450 Guy St, Montreal."
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <div className="size-6 shrink-0 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
                  <span className="material-symbols-outlined text-xs">sensors</span>
                </div>
                <p className="text-xs font-bold text-red-500">Relaying vitals...</p>
              </div>
            </div>
          </div>

          {/* End Call Button */}
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <span className="material-symbols-outlined rotate-[135deg]">call</span>
            End Emergency
          </button>

          {/* Status Footer */}
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-1.5 text-gray-400">
              <span className="material-symbols-outlined text-xs">mic</span>
              <span className="text-[9px] font-bold uppercase tracking-wider">Mic Active</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <span className="material-symbols-outlined text-xs">location_on</span>
              <span className="text-[9px] font-bold uppercase tracking-wider">GPS On</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white py-3 px-6 flex items-center justify-center border-t border-black/5">
          <div className="flex items-center gap-2 text-gray-300">
            <span className="material-symbols-outlined text-xs">verified_user</span>
            <span className="text-[9px] font-bold uppercase tracking-widest">E911 Certified • Health.me</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Emergency;
