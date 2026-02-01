import React, { useState, useMemo } from 'react';

interface AppointmentSchedulerProps {
  onClose?: () => void;
  onConfirm?: (details: { day: string; date: string; time: string }) => void;
  availableSlots?: { day: string; date: string; time: string; month?: string }[];
}

// Helper function to get upcoming days (14 days to cover 2 weeks for LLM flexibility)
const getUpcomingDays = (): { day: string; date: string; month: string; fullDate: Date }[] => {
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();
  const upcomingDays: { day: string; date: string; month: string; fullDate: Date }[] = [];

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    upcomingDays.push({
      day: dayNames[date.getDay()],
      date: date.getDate().toString(),
      month: monthNames[date.getMonth()],
      fullDate: date
    });
  }

  return upcomingDays;
};

// Helper to validate/use the slot's date
// If the slot's date exists in our window with matching day, use our calculated date
// Otherwise, trust the backend's date (for dates outside our 14-day window)
const findDateForSlot = (slot: { day: string; date: string }, upcomingDays: { day: string; date: string; fullDate: Date }[]): string => {
  // Check if this exact combination exists in our upcoming days
  const exactMatch = upcomingDays.find(d => d.day === slot.day && d.date === slot.date);
  if (exactMatch) return exactMatch.date;
  
  // If the slot's date doesn't match any day in our window, trust the backend's date
  // This handles dates that are further out (e.g., Feb 23rd when we only calculate 14 days)
  return slot.date;
};

// Helper function to format month and year
const getMonthYearString = (dates: { fullDate: Date }[]): string => {
  if (dates.length === 0) return '';
  
  const firstDate = dates[0].fullDate;
  const lastDate = dates[dates.length - 1].fullDate;
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
  
  const firstMonth = monthNames[firstDate.getMonth()];
  const lastMonth = monthNames[lastDate.getMonth()];
  const year = firstDate.getFullYear();
  
  // If the week spans two months
  if (firstMonth !== lastMonth) {
    return `${firstMonth} - ${lastMonth} ${year}`;
  }
  
  return `${firstMonth} ${year}`;
};

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({ onClose, onConfirm, availableSlots = [] }) => {
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; date: string; time: string } | null>(null);

  // Get upcoming days (14 days to handle this week and next week)
  const upcomingDays = useMemo(() => getUpcomingDays(), []);
  // For the default view and month string, we use the first 7 days
  const currentWeekDays = useMemo(() => upcomingDays.slice(0, 7), [upcomingDays]);
  const monthYearString = useMemo(() => getMonthYearString(currentWeekDays), [currentWeekDays]);

  // If availableSlots are provided, use them to build the view
  const hasDynamicSlots = availableSlots && availableSlots.length > 0;

  const dynamicSlotsMap: Record<string, string[]> = {};
  const dynamicDaysSet = new Set<string>();
  const dynamicDays: { day: string; date: string; month: string }[] = [];

  // Helper to get month for a date
  const getMonthForDate = (day: string, date: string): string => {
    const found = upcomingDays.find(d => d.day === day && d.date === date);
    if (found) return found.month;
    // For dates outside our window, try to calculate based on current month
    const today = new Date();
    const dayNum = parseInt(date);
    // If the date is smaller than today's date, it's likely next month
    if (dayNum < today.getDate()) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthNames[(today.getMonth() + 1) % 12];
    }
    return upcomingDays[0]?.month || 'Jan';
  };

  if (hasDynamicSlots) {
    availableSlots.forEach(slot => {
      // Create a unique key combining day and date to handle same day in different weeks
      const correctDate = findDateForSlot(slot, upcomingDays);
      const slotKey = `${slot.day}-${correctDate}`;
      
      if (!dynamicSlotsMap[slotKey]) {
         dynamicSlotsMap[slotKey] = [];
         // Add to days list if new - use smart date matching
         if (!dynamicDaysSet.has(slotKey)) {
            dynamicDaysSet.add(slotKey);
            // Use month from slot if provided by backend, otherwise calculate
            const month = slot.month || getMonthForDate(slot.day, correctDate);
            dynamicDays.push({ day: slot.day, date: correctDate, month });
         }
      }
      if (!dynamicSlotsMap[slotKey].includes(slot.time)) {
        dynamicSlotsMap[slotKey].push(slot.time);
      }
    });

    // Sort days by their position in the upcomingDays array (chronological order)
    dynamicDays.sort((a, b) => {
      const aIndex = upcomingDays.findIndex(d => d.day === a.day && d.date === a.date);
      const bIndex = upcomingDays.findIndex(d => d.day === b.day && d.date === b.date);
      // If not in upcomingDays, sort by date number
      if (aIndex === -1 && bIndex === -1) {
        return parseInt(a.date) - parseInt(b.date);
      }
      return aIndex - bIndex;
    });
  }

  // Default days use the first 7 days (current week starting today)
  const defaultDays = currentWeekDays.map(d => ({ day: d.day, date: d.date, month: d.month }));

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
            {monthYearString} • Select an available time
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
          {days.map((dayItem) => {
            // Use the correct key format for looking up slots
            const slotKey = hasDynamicSlots ? `${dayItem.day}-${dayItem.date}` : dayItem.day;
            const daySlots = slots[slotKey] || [];
            
            return (
            <div key={`${dayItem.day}-${dayItem.date}`} className="flex flex-col">
              {/* Day Header */}
              <div className="text-center pb-2 border-b border-black/5 mb-2">
                <div className="text-[9px] font-black uppercase tracking-wider text-gray-400">{dayItem.day}</div>
                <div className="text-sm font-bold text-primary/60">{dayItem.month}</div>
                <div className="text-xl font-black text-primary">{dayItem.date}</div>
              </div>

              {/* Time Slots */}
              <div className="space-y-2">
                {daySlots.map(time => {
                  const isSelected = selectedSlot?.day === dayItem.day && selectedSlot?.date === dayItem.date && selectedSlot?.time === time;
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
            );
          })}
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
                {selectedSlot.day}, {days.find(d => d.date === selectedSlot.date && d.day === selectedSlot.day)?.month || getMonthForDate(selectedSlot.day, selectedSlot.date)} {selectedSlot.date} at {selectedSlot.time}
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
