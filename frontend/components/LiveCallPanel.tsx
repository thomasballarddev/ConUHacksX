import React from 'react';

interface LiveCallPanelProps {
  onClose?: () => void;
  minimized?: boolean;
  transcript?: string[];
}

const LiveCallPanel: React.FC<LiveCallPanelProps> = ({ onClose, minimized = false, transcript = [] }) => {
  return (
    <div className={`border-l border-black/5 flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 shadow-xl z-20 w-full transition-all ${
      minimized ? 'flex-shrink-0 border-t border-black/5 bg-red-600' : 'h-full bg-soft-cream'
    }`}>
      {/* Call Header */}
      {!minimized && (
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-transparent flex-shrink-0">
          <div>
            <h2 className="serif-font text-2xl text-primary mb-2">Relay Call</h2>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 px-2.5 py-1 bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-widest rounded-full border border-green-100">
                <span className="size-1.5 rounded-full bg-green-500 pulse-green"></span>
                AI Connected
              </span>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="size-10 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      )}

       {/* Transcript Area - Hidden when minimized */}
      {!minimized && (
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar bg-soft-cream/50">
           {transcript.length === 0 ? (
             <div className="text-center text-gray-400 italic mt-10">Connecting to clinic...</div>
           ) : (
             transcript.map((line, i) => {
               const isAgent = line.startsWith('Agent:') || line.startsWith('Health.me:');
               const content = line.split(':').slice(1).join(':').trim() || line;
               
               return (
                 <div key={i} className={`flex gap-3 ${isAgent ? 'flex-row-reverse' : ''}`}>
                    <div className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 border border-black/5 overflow-hidden ${isAgent ? 'bg-primary text-white shadow-md' : 'bg-white'}`}>
                       {isAgent ? <span className="material-symbols-outlined text-sm fill-1">smart_toy</span> : <img src="https://picsum.photos/seed/clinic/100/100" className="w-full h-full object-cover" alt="Clinic" />}
                    </div>
                    <div className={`p-4 rounded-2xl shadow-sm border border-black/5 max-w-[80%] ${isAgent ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-primary rounded-tl-none'}`}>
                       <p className="text-xs md:text-sm leading-relaxed">{content}</p>
                    </div>
                 </div>
               );
             })
           )}

           {/* Waveform */}
           <div className="flex justify-center items-center gap-1 py-8 opacity-60">
             <span className="text-[9px] font-bold uppercase tracking-widest text-primary mr-3">Voice Activity</span>
             {[0.1, 0.4, 0.2, 0.6, 0.3, 0.5, 0.2].map((d, i) => (
               <div key={i} className="waveform-bar w-1 bg-primary rounded-full h-6" style={{ animationDelay: `${d}s` }}></div>
             ))}
           </div>
        </div>
      )}

      {/* Call Footer / Minimized View */}
      <div className={`${minimized ? 'p-4 flex items-center justify-between gap-4 bg-red-600' : 'p-6 md:p-8 border-t border-black/5 bg-white'}`}>
         {!minimized && (
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-5 bg-primary rounded-full relative p-0.5 cursor-pointer">
                    <div className="size-4 bg-white rounded-full translate-x-5 transition-transform"></div>
                 </div>
                 <span className="text-[10px] font-bold uppercase tracking-wider text-primary">AI Control</span>
              </div>
              <span className="text-xs font-mono text-gray-400">02:14</span>
           </div>
         )}
         
         {minimized && (
           <div className="flex items-center gap-4 flex-1">
             <div className="size-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0 animate-pulse">
                <span className="material-symbols-outlined text-white text-xl">phone_in_talk</span>
             </div>
             <div>
               <p className="text-sm font-black text-white">Relay Call Active</p>
               <p className="text-[11px] text-white/80 font-mono mt-0.5">Recording • 02:14</p>
             </div>
           </div>
         )}

         <button 
           onClick={onClose}
           className={`bg-white text-red-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-gray-100 transition-all active:scale-95 ${
             minimized ? 'px-6 py-3 text-xs shadow-none' : 'w-full py-3.5 shadow-red-100'
           }`}
         >
           <span className="material-symbols-outlined text-lg">call_end</span>
           {!minimized && "End Call"}
         </button>
      </div>
    </div>
  );
};

export default LiveCallPanel;
