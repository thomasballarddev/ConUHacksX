import React from 'react';

const availableSlots = [
  "2026-01-25 09:00",
  "2026-01-25 10:30",
  "2026-01-25 14:00",
  "2026-01-26 11:15"
];

function Calendar({ onSelect, isVisible }) {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      backgroundColor: 'white', padding: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.5)',
      borderRadius: '8px', zIndex: 1000
    }}>
      <h2>Select an Appointment</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {availableSlots.map(slot => (
          <button 
            key={slot} 
            onClick={() => onSelect(slot)}
            style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#e0e7ff', border: 'none', borderRadius: '4px' }}
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Calendar;
