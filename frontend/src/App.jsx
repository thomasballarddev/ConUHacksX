import React, { useEffect, useState, useRef } from 'react';
import Calendar from './components/Calendar';

function App() {
  const [showCalendar, setShowCalendar] = useState(false);
  const [status, setStatus] = useState("Connected to User Agent System");
  const ws = useRef(null);

  useEffect(() => {
    // Connect to Backend WebSocket
    ws.current = new WebSocket('ws://localhost:3000');

    ws.current.onopen = () => {
      console.log('Connected to backend WS');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received:', data);
      
      if (data.type === 'show_calendar') {
        setShowCalendar(true);
        setStatus("Please select an appointment slot.");
      }
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  const handleSelectSlot = (slot) => {
    setShowCalendar(false);
    setStatus(`Selected: ${slot}. Notifying Phone Agent...`);
    
    // Send selection back to Backend
    if (ws.current) {
        ws.current.send(JSON.stringify({ type: 'slot_selected', slot }));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>ElevenLabs Multi-Agent Health System</h1>
      <p>Status: {status}</p>
      
      <div style={{ margin: '20px 0', padding: '20px', border: '1px solid #ccc' }}>
        <h3>User Agent Interface</h3>
        <p><em>(Placeholder for ElevenLabs Embedded Widget)</em></p>
        <button onClick={() => {
            // Simulate User Agent triggering the flow for testing
            if(ws.current) ws.current.send(JSON.stringify({ type: 'start_clinic_call', severity: 'normal' }));
        }}>
            Simulate "Standard Symptoms" (Call Clinic)
        </button>
        <div style={{ height: '10px' }}></div>
        <button onClick={() => {
            // Simulate User Agent triggering the flow for testing
            if(ws.current) ws.current.send(JSON.stringify({ type: 'start_clinic_call', severity: 'critical' }));
        }} style={{ backgroundColor: '#ffcccc', color: 'red' }}>
             Simulate "CRITICAL Symptoms" (Call Emergency)
        </button>
      </div>

      <Calendar isVisible={showCalendar} onSelect={handleSelectSlot} />
    </div>
  );
}

export default App;
