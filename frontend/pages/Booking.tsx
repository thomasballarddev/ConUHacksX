
import React from 'react';

const Booking: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-soft-cream">
      {/* Scrollable Transcript Area */}
      <div className="flex-1 overflow-y-auto px-10 py-6 custom-scrollbar">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-8 border-b border-black/5">
            <div className="flex flex-col gap-2">
              <h2 className="serif-font text-4xl text-primary leading-tight">Booking Call with City Health Center</h2>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-bold text-green-700 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-green-500 pulse-green"></span>
                  Live Connected
                </span>
                <p className="text-sm text-gray-500">AI Transcription active • Dr. Aris Clinic</p>
              </div>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-white border border-black/5 px-5 py-3 text-sm font-bold tracking-wide text-primary hover:bg-black hover:text-white transition-all shadow-sm">
              <span className="material-symbols-outlined text-lg">pan_tool</span>
              Manual Intervention
            </button>
          </div>

          <div className="flex flex-col gap-6 pt-4">
            {/* Receptionist Message */}
            <div className="flex gap-4">
              <div className="size-10 flex-shrink-0 rounded-full bg-center bg-cover border-2 border-white shadow-sm overflow-hidden">
                <img src="https://picsum.photos/seed/receptionist/100/100" alt="Clinic" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary">Receptionist</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">10:02 AM</span>
                </div>
                <div className="max-w-2xl rounded-2xl rounded-tl-none bg-white p-4 shadow-sm border border-black/5">
                  <p className="text-[15px] leading-relaxed text-primary">City Health Center, how can I help you today?</p>
                </div>
              </div>
            </div>

            {/* AI Message */}
            <div className="flex flex-row-reverse gap-4">
              <div className="size-10 flex-shrink-0 rounded-full bg-primary flex items-center justify-center border-2 border-white shadow-sm">
                <span className="material-symbols-outlined text-white text-xl fill-1">smart_toy</span>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex flex-row-reverse items-center gap-3">
                  <span className="text-sm font-bold text-primary">AI Assistant</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">10:02 AM</span>
                </div>
                <div className="max-w-2xl rounded-2xl rounded-tr-none bg-primary p-4 shadow-sm text-white">
                  <p className="text-[15px] leading-relaxed">
                    Hello, I'm calling from Health.me to schedule an annual check-up for our member, Sarah Jenkins. Do you have any availability this Thursday morning or Friday afternoon?
                  </p>
                </div>
              </div>
            </div>

            {/* Receptionist Message */}
            <div className="flex gap-4">
              <div className="size-10 flex-shrink-0 rounded-full bg-center bg-cover border-2 border-white shadow-sm overflow-hidden">
                <img src="https://picsum.photos/seed/receptionist2/100/100" alt="Clinic" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary">Receptionist</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">10:03 AM</span>
                </div>
                <div className="max-w-2xl rounded-2xl rounded-tl-none bg-white p-4 shadow-sm border border-black/5">
                  <p className="text-[15px] leading-relaxed text-primary">Let me check. We have a slot at 9:30 AM on Thursday with Dr. Aris. Would that work for Sarah?</p>
                </div>
              </div>
            </div>

            {/* AI Message (Streaming) */}
            <div className="flex flex-row-reverse gap-4">
              <div className="size-10 flex-shrink-0 rounded-full bg-primary flex items-center justify-center border-2 border-white shadow-sm">
                <span className="material-symbols-outlined text-white text-xl fill-1">smart_toy</span>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex flex-row-reverse items-center gap-3">
                  <span className="text-sm font-bold text-primary">AI Assistant</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Just now</span>
                </div>
                <div className="max-w-2xl rounded-2xl rounded-tr-none bg-primary/90 p-4 shadow-sm text-white border border-white/10">
                  <p className="text-[15px] leading-relaxed italic opacity-90">
                    "One moment while I verify her calendar... Yes, Thursday at 9:30 AM works perfectly. Please book that in."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Waveform Visualizer */}
          <div className="flex items-center justify-center gap-1.5 py-12">
            {[0.1, 0.3, 0.5, 0.2, 0.4, 0.6, 0.3, 0.5, 0.1].map((delay, i) => (
              <div 
                key={i}
                className="waveform-bar w-1.5 rounded-full bg-primary" 
                style={{ animationDelay: `${delay}s` }}
              ></div>
            ))}
            <span className="ml-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">AI Processing Audio</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="p-8 pt-0">
        <div className="mx-auto w-full max-w-5xl rounded-3xl border border-black/5 bg-white p-5 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="relative inline-flex h-7 w-12 cursor-pointer items-center rounded-full bg-primary transition-colors">
                <span className="ml-1 size-5 translate-x-5 rounded-full bg-soft-cream shadow-sm transition-transform"></span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight">AI Automated Mode</span>
                <span className="text-[11px] text-gray-400 font-medium">Health.me AI is speaking</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex size-11 items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:text-primary transition-colors border border-black/5">
              <span className="material-symbols-outlined text-xl">mic_off</span>
            </button>
            <button className="flex size-11 items-center justify-center rounded-full bg-primary text-white transition-colors">
              <span className="material-symbols-outlined text-xl">volume_up</span>
            </button>
            <button className="flex size-11 items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:text-primary transition-colors border border-black/5">
              <span className="material-symbols-outlined text-xl">more_vert</span>
            </button>
          </div>

          <button className="flex items-center gap-2 rounded-2xl bg-red-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 hover:scale-[1.02] active:scale-95">
            <span className="material-symbols-outlined text-lg">call_end</span>
            End Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default Booking;
