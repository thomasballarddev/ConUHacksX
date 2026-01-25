import React from 'react';

interface LiveCallPanelProps {
  onClose?: () => void;
  minimized?: boolean;
}

const LiveCallPanel: React.FC<LiveCallPanelProps> = ({ onClose, minimized = false }) => {
  return (
    <div className={`w-full animate-in slide-in-from-right duration-500 shadow-xl z-20 flex flex-col ${
      minimized ? 'bg-green-600' : 'h-full'
    }`}>
      {/* Full Call Preview - Only when not minimized, shown at top */}
      {!minimized && (
        <div className="flex-1 bg-soft-cream overflow-y-auto">
          {/* Transcript Area */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex gap-3">
              <div className="size-8 rounded-full overflow-hidden border border-black/5 flex-shrink-0">
                <img src="https://picsum.photos/seed/clinic/100/100" className="w-full h-full object-cover" alt="Clinic" />
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-black/5">
                <p className="text-xs md:text-sm text-primary leading-relaxed">City Health Center, how can I help you today?</p>
              </div>
            </div>

            <div className="flex flex-row-reverse gap-3">
              <div className="size-8 bg-green-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                <span className="material-symbols-outlined text-white text-sm fill-1">smart_toy</span>
              </div>
              <div className="bg-green-600 p-4 rounded-2xl rounded-tr-none shadow-xl text-white">
                <p className="text-xs md:text-sm leading-relaxed">Hello, I'm calling from Health.me for Sam Smith. We'd like to book an appointment for Tuesday at 08:00 AM.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="size-8 rounded-full overflow-hidden border border-black/5 flex-shrink-0">
                <img src="https://picsum.photos/seed/clinic/100/100" className="w-full h-full object-cover" alt="Clinic" />
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-black/5">
                <p className="text-xs md:text-sm text-primary leading-relaxed">Checking now... Yes, we have that slot open with Dr. Aris.</p>
              </div>
            </div>

            {/* Voice Waveform Animation */}
            <div className="flex justify-center items-center gap-1 py-8">
              <span className="text-[9px] font-bold uppercase tracking-widest text-green-600 mr-3">Voice Activity</span>
              {[0.1, 0.4, 0.2, 0.6, 0.3, 0.5, 0.2].map((d, i) => (
                <div key={i} className="waveform-bar w-1 bg-green-500 rounded-full h-6" style={{ animationDelay: `${d}s` }}></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Green Header Bar - At the bottom */}
      <div className="bg-green-600 p-4 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div className="size-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0 animate-pulse">
            <span className="material-symbols-outlined text-white text-xl">phone_in_talk</span>
          </div>
          <div>
            <p className="text-sm font-black text-white">Relay Call Active</p>
            <p className="text-[11px] text-white/80 font-mono mt-0.5">Recording • 02:14</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="bg-white text-green-600 rounded-2xl font-black text-xs px-5 py-3 flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-lg rotate-[135deg]">call</span>
          End
        </button>
      </div>
    </div>
  );
};

export default LiveCallPanel;
