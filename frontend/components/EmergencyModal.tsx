import React, { useEffect, useState } from 'react';

interface EmergencyModalProps {
  onCancel: () => void;
  onConfirm: () => void;
  countdownSeconds?: number;
}

const EmergencyModal: React.FC<EmergencyModalProps> = ({ onCancel, onConfirm, countdownSeconds = 7 }) => {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onConfirm();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onConfirm]);

  return (
    <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden w-full max-w-sm border-2 border-red-500 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
          <div 
            className="h-full bg-red-600 transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / countdownSeconds) * 100}%` }}
          />
        </div>

        <div className="p-8 text-center">
          <div className="size-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="material-symbols-outlined text-4xl text-red-600">e911_emergency</span>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2 leading-tight">Emergency Assistance</h2>
          <p className="text-gray-500 text-sm mb-6">Connecting to emergency dispatcher in</p>

          <div className="text-6xl font-black text-red-600 tabular-nums mb-8">
            {timeLeft}
          </div>

          <div className="space-y-3">
             <button 
               onClick={onConfirm}
               className="w-full bg-red-600 text-white rounded-2xl py-4 font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200"
             >
               Connect Now
             </button>
             <button 
               onClick={onCancel}
               className="w-full bg-gray-100 text-gray-500 rounded-2xl py-4 font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
             >
               Cancel
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyModal;
