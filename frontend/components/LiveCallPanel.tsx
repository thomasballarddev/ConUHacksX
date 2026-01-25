import React from 'react';

interface LiveCallPanelProps {
  onClose?: () => void;
  minimized?: boolean;
}

const LiveCallPanel: React.FC<LiveCallPanelProps> = ({ onClose, minimized = false }) => {
  return (
    <div className={`bg-soft-cream border-l border-black/5 flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 shadow-xl z-20 w-full transition-all ${
      minimized ? 'flex-shrink-0 border-t border-black/5' : 'h-full md:w-[400px] lg:w-[480px]'
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
           <div className="flex gap-3">
              <div className="size-8 rounded-full overflow-hidden border border-black/5 flex-shrink-0">
                 <img src="https://picsum.photos/seed/clinic/100/100" className="w-full h-full object-cover" alt="Clinic" />
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-black/5">
                 <p className="text-xs md:text-sm text-primary leading-relaxed">City Health Center, how can I help you today?</p>
              </div>
           </div>

           <div className="flex flex-row-reverse gap-3">
              <div className="size-8 bg-primary rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                 <span className="material-symbols-outlined text-white text-sm fill-1">smart_toy</span>
              </div>
              <div className="bg-primary p-4 rounded-2xl rounded-tr-none shadow-xl text-white">
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
      <div className={`bg-white ${minimized ? 'p-4 flex items-center justify-between gap-4' : 'p-6 md:p-8 border-t border-black/5'}`}>
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
           <div className="flex items-center gap-3">
             <div className="size-10 bg-green-50 rounded-full flex items-center justify-center border border-green-100 flex-shrink-0">
                <span className="size-2 rounded-full bg-green-500 pulse-green"></span>
             </div>
             <div>
               <p className="text-xs font-bold text-primary">Relay Call Active</p>
               <p className="text-[10px] text-gray-400 font-mono">02:14</p>
             </div>
           </div>
         )}

         <button 
           onClick={onClose}
           className={`bg-red-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-100 hover:bg-red-700 transition-all active:scale-95 ${
             minimized ? 'px-6 py-3 text-xs' : 'w-full py-3.5'
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
