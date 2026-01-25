import React, { useState } from 'react';

interface AppointmentSchedulerProps {
  onClose?: () => void;
  onConfirm?: (details: { day: string; date: string; time: string }) => void;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({ onClose, onConfirm }) => {
  const [selectedDay, setSelectedDay] = useState('Tue');
  const [selectedTime, setSelectedTime] = useState('08:00 AM');

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

  const handleConfirm = () => {
    const dayObj = days.find(d => d.day === selectedDay);
    if (dayObj && onConfirm) {
      onConfirm({
        day: dayObj.day,
        date: dayObj.date,
        time: selectedTime
      });
    }
  };

  return (
    <div className="bg-card-beige w-full max-w-5xl rounded-[40px] shadow-2xl border border-black/5 p-8 md:p-12 overflow-hidden relative animate-in zoom-in-95 duration-300">
      {onClose && (
        <button onClick={onClose} className="absolute top-8 right-8 size-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-black/5 hover:bg-primary hover:text-white transition-all z-10">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      )}
      
      <div className="flex justify-between items-start mb-12">
        <div>
          <h2 className="serif-font text-3xl md:text-4xl text-primary mb-2">Select Appointment Time</h2>
          <p className="text-gray-400 font-medium">Confirmed with City Health Center</p>
        </div>
        <div className="flex gap-2 hidden md:flex">
          <button className="size-12 bg-white rounded-full flex items-center justify-center border border-black/5 hover:shadow-md transition-all">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="size-12 bg-white rounded-full flex items-center justify-center border border-black/5 hover:shadow-md transition-all">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-7 gap-y-8 gap-x-2 md:gap-4 mb-16">
        {days.map((item) => (
          <div key={item.date} className="flex flex-col items-center">
            <div className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest mb-3 ${item.disabled ? 'text-gray-200' : 'text-gray-400'}`}>
              {item.day}
            </div>
            <div 
              onClick={() => !item.disabled && setSelectedDay(item.day)}
              className={`text-xl md:text-2xl font-black mb-6 cursor-pointer transition-all ${
                item.day === selectedDay ? 'text-primary scale-110' : item.disabled ? 'text-gray-200 cursor-default' : 'text-primary opacity-40 hover:opacity-100'
              }`}
            >
              {item.date}
            </div>
            
            <div className="flex flex-col gap-2 md:gap-3 w-full px-1">
              {item.disabled ? (
                <div className="text-[10px] md:text-[11px] italic text-gray-300 font-medium mt-2 text-center">No slots</div>
              ) : (
                slots[item.day]?.map(time => (
                  <button
                    key={time}
                    onClick={() => { setSelectedDay(item.day); setSelectedTime(time); }}
                    className={`w-full py-2.5 md:py-4 rounded-2xl md:rounded-3xl border text-[11px] md:text-[13px] font-bold transition-all whitespace-nowrap ${
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
        onClick={handleConfirm}
        className="w-full bg-primary text-white py-6 md:py-8 rounded-[28px] text-base md:text-lg font-black shadow-2xl hover:bg-black transition-all active:scale-[0.98]"
      >
        Confirm Appointment — {days.find(d => d.day === selectedDay)?.day}, Oct {days.find(d => d.day === selectedDay)?.date} at {selectedTime}
      </button>
    </div>
  );
};

export default AppointmentScheduler;
