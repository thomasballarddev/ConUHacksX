import React, { useState } from 'react';

interface AppointmentSchedulerProps {
  onClose?: () => void;
  onConfirm?: (details: { day: string; date: string; time: string }) => void;
  availableSlots?: { day: string; date: string; time: string }[];
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({ onClose, onConfirm, availableSlots = [] }) => {
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; date: string; time: string } | null>(null);

  // If availableSlots are provided, use them to build the view
  const hasDynamicSlots = availableSlots && availableSlots.length > 0;

  const dynamicSlotsMap: Record<string, string[]> = {};
  const dynamicDaysSet = new Set<string>();
  const dynamicDays: { day: string; date: string }[] = [];

  if (hasDynamicSlots) {
    availableSlots.forEach(slot => {
      if (!dynamicSlotsMap[slot.day]) {
         dynamicSlotsMap[slot.day] = [];
         // Add to days list if new
         if (!dynamicDaysSet.has(slot.day)) {
            dynamicDaysSet.add(slot.day);
            dynamicDays.push({ day: slot.day, date: slot.date });
         }
      }
      if (!dynamicSlotsMap[slot.day].includes(slot.time)) {
        dynamicSlotsMap[slot.day].push(slot.time);
      }
    });

    // Sort days based on standard week order if needed, or just keep arrival order
    // Simple sort for demo:
    const weekOrder = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    dynamicDays.sort((a, b) => weekOrder.indexOf(a.day) - weekOrder.indexOf(b.day));
  }

  // Fallback / Default Data
  const defaultDays = [
    { day: 'SAT', date: '25' },
    { day: 'SUN', date: '26' },
    { day: 'MON', date: '27' },
    { day: 'TUE', date: '28' },
    { day: 'WED', date: '29' },
    { day: 'THU', date: '30' },
    { day: 'FRI', date: '31' },
  ];

  const defaultSlots: Record<string, string[]> = {
    'SAT': ['10:00 AM', '11:30 AM'],
    'SUN': ['09:00 AM', '01:00 PM'],
    'MON': ['09:00 AM', '10:30 AM', '02:00 PM'],
    'TUE': ['08:00 AM', '11:00 AM', '03:30 PM'],
    'WED': ['02:00 PM', '04:30 PM'],
    'THU': ['09:00 AM', '11:00 AM', '02:30 PM', '04:00 PM'],
    'FRI': ['09:15 AM', '03:00 PM', '05:00 PM'],
  };

  const days = hasDynamicSlots ? dynamicDays : defaultDays;
  const slots = hasDynamicSlots ? dynamicSlotsMap : defaultSlots;

  const handleSelectSlot = (day: string, date: string, time: string) => {
    setSelectedSlot({ day, date, time });
  };

  const handleConfirm = () => {
    if (selectedSlot && onConfirm) {
      onConfirm(selectedSlot);
    }
  };

  return (
    <div className="h-full bg-soft-cream flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 w-full">
      {/* Header */}
      <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white/50 backdrop-blur-sm flex-shrink-0">
        <div>
          <h2 className="serif-font text-3xl text-primary">Schedule Appointment</h2>
          <p className="text-gray-500 text-xs font-medium mt-1">
            January 2025 • Select an available time
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="size-8 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {/* Week View with All Slots */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <div className="grid grid-cols-7 gap-2">
          {days.map((dayItem) => (
            <div key={dayItem.day} className="flex flex-col">
              {/* Day Header */}
              <div className="text-center pb-2 border-b border-black/5 mb-2">
                <div className="text-[9px] font-black uppercase tracking-wider text-gray-400">{dayItem.day}</div>
                <div className="text-lg font-black text-primary">{dayItem.date}</div>
              </div>

              {/* Time Slots */}
              <div className="space-y-2">
                {slots[dayItem.day]?.map(time => {
                  const isSelected = selectedSlot?.day === dayItem.day && selectedSlot?.time === time;
                  return (
                    <button
                      key={time}
                      onClick={() => handleSelectSlot(dayItem.day, dayItem.date, time)}
                      className={`w-full py-2 px-1 rounded-xl text-[10px] font-bold transition-all ${isSelected
                          ? 'bg-primary text-white shadow-lg scale-105'
                          : 'bg-white border border-black/5 text-primary hover:border-primary hover:scale-102'
                        }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Slot Summary & Confirm */}
      <div className="p-4 border-t border-black/5 bg-white/50 backdrop-blur-sm flex-shrink-0 space-y-3">
        {selectedSlot ? (
          <div className="bg-white rounded-xl p-4 border border-black/5 flex items-center gap-3">
            <span className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">event</span>
            </span>
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Selected</p>
              <p className="font-bold text-primary text-sm">
                {selectedSlot.day}, Jan {selectedSlot.date} at {selectedSlot.time}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-gray-400 text-xs">
            Select a time slot above
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!selectedSlot}
          className={`w-full py-4 rounded-2xl text-sm font-black transition-all ${selectedSlot
              ? 'bg-primary text-white shadow-lg shadow-black/5 hover:bg-black active:scale-[0.98]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
        >
          Confirm Appointment
        </button>
      </div>
    </div>
  );
};

export default AppointmentScheduler;
