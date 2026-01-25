import React, { useState, useEffect } from 'react';

// Make sure to add this to your index.html or import in CSS:
// <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />

interface CalendarEvent {
  id: string;
  title: string;
  location: string;
  day: number; // 0 (Sun) - 6 (Sat)
  startHour: number; // 0-23
  endHour: number; // 0-23
  type: 'medical';
}

const Calendar: React.FC = () => {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const currentDayIndex = today.getDay(); // 0-6
  
  // Grid Configuration
  const START_HOUR = 8;
  const END_HOUR = 20; // 8 PM
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

  // Helper to get actual dates for the current week
  const getWeekDates = () => {
    const curr = new Date();
    const first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
    
    return weekDays.map((_, index) => {
      const next = new Date(curr.setDate(first + index));
      return next.getDate();
    });
  };

  const weekDates = getWeekDates();

  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: '1', title: 'Cardiology Follow-up', location: 'City Clinic', day: 1, startHour: 10, endHour: 11, type: 'medical' },
    { id: '2', title: 'Appt with Dr. Strange', location: 'General Hospital', day: 2, startHour: 14, endHour: 15, type: 'medical' },
    { id: '3', title: 'Annual Physical', location: 'Clinique Médicale', day: 4, startHour: 9, endHour: 10.5, type: 'medical' },
    { id: '4', title: 'Physiotherapy', location: 'Physio Extra', day: 3, startHour: 16.5, endHour: 17.5, type: 'medical' },
    { id: '5', title: 'Blood Work', location: 'CLSC Metro', day: 5, startHour: 8.5, endHour: 9, type: 'medical' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    day: currentDayIndex,
    startHour: 9,
    endHour: 10,
    type: 'medical'
  });

  // Calculate position based on start time relative to grid start
  const getEventStyle = (event: CalendarEvent) => {
    return {
      top: `${(event.startHour - START_HOUR) * 60}px`,
      height: `${(event.endHour - event.startHour) * 60}px`,
    };
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    return (currentHour - START_HOUR) * 60;
  };

  const colors = {
    medical: 'bg-red-50 border-red-100 text-red-700 hover:bg-red-100',
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || newEvent.day === undefined || newEvent.startHour === undefined || newEvent.endHour === undefined) return;

    const event: CalendarEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title: newEvent.title,
      location: newEvent.location || '',
      day: newEvent.day,
      startHour: Number(newEvent.startHour),
      endHour: Number(newEvent.endHour),
      type: 'medical',
    };

    setEvents([...events, event]);
    setIsModalOpen(false);
    // Reset form
    setNewEvent({ day: currentDayIndex, startHour: 9, endHour: 10, type: 'medical' });
  };

  return (
    <div className="h-full bg-soft-cream flex flex-col relative overflow-hidden font-sans">
      {/* Header */}
      <div className="p-8 pb-6 flex justify-between items-end">
        <div>
          <h1 className="serif-font text-4xl text-primary mb-2">Medical Schedule</h1>
          <p className="text-gray-500 text-sm">Manage your upcoming doctor's appointments</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white rounded-2xl px-6 py-3 font-bold text-sm shadow-lg hover:bg-black transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Add Appointment
        </button>
      </div>

      {/* Calendar Grid Container */}
      <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar">
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden flex flex-col min-w-[800px]">
          {/* Days Header */}
          <div className="grid grid-cols-8 border-b border-black/5 bg-gray-50/50 sticky top-0 z-30 backdrop-blur-sm">
            <div className="p-4 border-r border-black/5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest pt-6">
              Time
            </div>
            {weekDays.map((day, index) => (
              <div key={day} className={`p-4 border-r border-black/5 last:border-r-0 text-center ${index === currentDayIndex ? 'bg-primary/5' : ''}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${index === currentDayIndex ? 'text-primary' : 'text-gray-400'}`}>{day}</p>
                <div className={`size-10 mx-auto rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                  index === currentDayIndex ? 'bg-primary text-white shadow-md' : 'text-gray-700'
                }`}>
                  {weekDates[index]}
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="flex relative items-start">
             {/* Time Labels Column */}
            <div className="w-[12.5%] flex-shrink-0 border-r border-black/5 bg-gray-50/30">
              {hours.map((hour) => (
                <div key={hour} className="h-[60px] border-b border-black/5 px-4 py-2 text-right">
                  <span className="text-[11px] font-bold text-gray-400 block -mt-2.5">
                    {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </span>
                </div>
              ))}
            </div>

            {/* Days Columns */}
            <div className="flex-1 grid grid-cols-7 relative">
              {/* Columns for each day */}
              {weekDays.map((_, dayIndex) => (
                <div key={dayIndex} className={`border-r border-black/5 last:border-r-0 relative ${dayIndex === currentDayIndex ? 'bg-primary/5' : ''}`}>
                  {/* Horizontal Grid Lines */}
                  {hours.map((hour) => (
                    <div key={hour} className="h-[60px] border-b border-black/5"></div>
                  ))}

                  {/* Events for this day */}
                  {events.filter(e => e.day === dayIndex).map(event => (
                    <div
                      key={event.id}
                      className={`absolute left-1 right-1 rounded-xl p-2 border shadow-sm cursor-pointer transition-all hover:scale-[1.02] hover:z-20 hover:shadow-md flex flex-col overflow-hidden ${colors[event.type]}`}
                      style={getEventStyle(event)}
                    >
                      <p className="text-[11px] font-black leading-tight mb-0.5 truncate">{event.title}</p>
                      {event.location && (
                        <p className="text-[10px] font-medium opacity-90 truncate flex items-center gap-1 mb-1">
                          <span className="material-symbols-outlined text-[10px] leading-none">location_on</span>
                          {event.location}
                        </p>
                      )}
                      
                      {/* Stylized Time Range */}
                      <p className="text-[9px] font-bold mt-auto opacity-70">
                         {Math.floor(event.startHour)}:{((event.startHour % 1) * 60).toString().padStart(2, '0')} - {Math.floor(event.endHour)}:{((event.endHour % 1) * 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  ))}
                  
                  {/* Current time indicator (only shows if today and within grid hours) */}
                  {dayIndex === currentDayIndex && (
                     <div 
                       className="absolute left-0 right-0 border-t-2 border-red-500 z-10 pointer-events-none"
                       style={{ 
                         top: `${getCurrentTimePosition()}px`,
                         display: (new Date().getHours() < START_HOUR || new Date().getHours() > END_HOUR) ? 'none' : 'block'
                       }}
                     >
                       <div className="absolute -left-1.5 -top-1.5 size-3 rounded-full bg-red-500 ring-2 ring-white"></div>
                     </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-black/5 animate-in slide-in-from-bottom-4 duration-300">
            <h2 className="serif-font text-2xl text-primary mb-6">Add Appointment</h2>
            <form onSubmit={handleAddEvent}>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Appointment Title</label>
                  <input 
                    type="text" 
                    value={newEvent.title || ''}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-black/5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium text-sm"
                    placeholder="e.g. Cardiology Checkup"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Clinic / Location</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">location_on</span>
                    <input 
                      type="text" 
                      value={newEvent.location || ''}
                      onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-black/5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium text-sm"
                      placeholder="Add location"
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Day</label>
                   <select 
                     value={newEvent.day}
                     onChange={e => setNewEvent({...newEvent, day: Number(e.target.value)})}
                     className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-black/5 focus:ring-2 focus:ring-primary outline-none text-sm font-medium appearence-none"
                   >
                     {weekDays.map((d, i) => <option key={d} value={i}>{d}</option>)}
                   </select>
                </div>

                <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Type</label>
                   <select 
                     value={newEvent.type}
                     disabled
                     className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-black/5 outline-none text-sm font-medium text-gray-500"
                   >
                     <option value="medical">Medical</option>
                   </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Start Time (24h)</label>
                  <input 
                    type="number" 
                    min={START_HOUR} max={END_HOUR} step="0.5"
                    value={newEvent.startHour}
                    onChange={e => setNewEvent({...newEvent, startHour: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-black/5 focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">End Time (24h)</label>
                  <input 
                    type="number" 
                    min={START_HOUR} max={END_HOUR} step="0.5"
                    value={newEvent.endHour}
                    onChange={e => setNewEvent({...newEvent, endHour: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-black/5 focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold bg-primary text-white shadow-lg hover:bg-black transition-all text-sm"
                >
                  Create Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;