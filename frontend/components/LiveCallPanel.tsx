import React, { useEffect, useRef } from 'react';

interface LiveCallPanelProps {
  onClose?: () => void;
  minimized?: boolean;
  transcript?: string[];
}

const LiveCallPanel: React.FC<LiveCallPanelProps> = ({ onClose, minimized = false, transcript = [] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when transcript updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const getMessageRole = (line: string): 'ai' | 'other' => {
    const lower = line.toLowerCase();
    if (lower.startsWith('assistant:') || lower.startsWith('ai:') || lower.startsWith('me:') || lower.startsWith('health.me:') || lower.startsWith('agent:')) {
      return 'ai';
    }
    return 'other';
  };

  const cleanMessage = (line: string) => {
    // Remove the "Role: " prefix if present
    return line.replace(/^(assistant|ai|me|health\.me|receptionist|clinic|user|agent):\s*/i, '');
  };

  return (
    <div className={`w-full animate-in slide-in-from-right duration-500 shadow-xl z-20 flex flex-col ${minimized ? 'bg-green-600' : 'h-full bg-soft-cream'
      }`}>
      {/* Full Call Preview - Only when not minimized, shown at top */}
      {!minimized && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Scrollable Transcript Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {transcript.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                <span className="material-symbols-outlined text-4xl mb-2">graphic_eq</span>
                <p className="text-sm font-medium">Waiting for conversation...</p>
              </div>
            ) : (
              transcript.map((line, index) => {
                const role = getMessageRole(line);
                const text = cleanMessage(line);
                
                if (role === 'ai') {
                  return (
                    <div key={index} className="flex flex-row-reverse gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="size-8 bg-green-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                        <span className="material-symbols-outlined text-white text-sm fill-1">smart_toy</span>
                      </div>
                      <div className="bg-green-600 p-4 rounded-2xl rounded-tr-none shadow-xl text-white max-w-[85%]">
                        <p className="text-xs md:text-sm leading-relaxed">{text}</p>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={index} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="size-8 rounded-full overflow-hidden border border-black/5 flex-shrink-0 bg-white flex items-center justify-center">
                         <span className="material-symbols-outlined text-gray-500 text-sm">support_agent</span>
                      </div>
                      <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-black/5 max-w-[85%]">
                        <p className="text-xs md:text-sm text-primary leading-relaxed">{text}</p>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>

          {/* Persistent Voice Waveform Animation */}
          <div className="flex justify-center items-center gap-1 py-6 bg-soft-cream/95 backdrop-blur-sm border-t border-black/5 shrink-0 z-10">
            {/* Removed text as requested */}
            {/* <span className="text-[9px] font-bold uppercase tracking-widest text-green-600 mr-3">Voice ActivityLink</span> */}
            {[0.1, 0.4, 0.2, 0.6, 0.3, 0.5, 0.2].map((d, i) => (
              <div key={i} className="waveform-bar w-1 bg-green-500 rounded-full h-6 animate-pulse" style={{ animationDuration: '1s', animationDelay: `${d}s` }}></div>
            ))}
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
            <p className="text-[11px] text-white/80 font-mono mt-0.5">Recording • Live</p>
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
