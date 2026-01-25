export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface Session {
  id: number;
  title: string;
  date: string;
  status: 'active' | 'completed';
  messages: Message[];
}

export const mockSessions: Session[] = [
  {
    id: 1,
    title: 'General checkup followup',
    date: 'Today',
    status: 'active',
    messages: [
      { role: 'model', text: 'Hello! I see you had a general checkup last week. How are you feeling since then?' },
      { role: 'user', text: "I've been feeling much better, but I still have some mild fatigue in the afternoons." },
      { role: 'model', text: "That's good to hear you're improving! Mild afternoon fatigue can be normal during recovery. Make sure you're staying hydrated and getting adequate sleep. If the fatigue persists beyond another week, we should schedule a follow-up." },
    ]
  },
  {
    id: 2,
    title: 'Lower back pain query',
    date: 'Yesterday',
    status: 'completed',
    messages: [
      { role: 'model', text: 'Hello! How can I help you today?' },
      { role: 'user', text: "I've been experiencing lower back pain for the past few days, especially when sitting for long periods." },
      { role: 'model', text: "Lower back pain from prolonged sitting is quite common. I recommend taking breaks every 30 minutes to stretch, ensuring your chair provides proper lumbar support, and doing gentle stretches. Would you like me to find a nearby clinic if the pain persists?" },
    ]
  },
  {
    id: 3,
    title: 'Prescription refill request',
    date: 'Jan 21',
    status: 'completed',
    messages: [
      { role: 'model', text: 'Hello! How can I assist you today?' },
      { role: 'user', text: "I need to refill my blood pressure medication. I'm running low." },
      { role: 'model', text: "I can help you with that. I see you're on Lisinopril 10mg. I've sent a refill request to your pharmacy. It should be ready for pickup within 24 hours. Remember to take it at the same time each day." },
    ]
  },
  {
    id: 4,
    title: 'Headache symptoms',
    date: 'Jan 19',
    status: 'completed',
    messages: [
      { role: 'model', text: 'Hello! What brings you in today?' },
      { role: 'user', text: "I've been having recurring headaches for the past week. They usually start in the afternoon." },
      { role: 'model', text: "Recurring afternoon headaches could be related to eye strain, dehydration, or tension. Are you spending a lot of time on screens? Try the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds. Also ensure you're drinking enough water." },
    ]
  },
  {
    id: 5,
    title: 'Annual physical booking',
    date: 'Jan 15',
    status: 'completed',
    messages: [
      { role: 'model', text: 'Hello! How can I help you today?' },
      { role: 'user', text: "I'd like to schedule my annual physical exam." },
      { role: 'model', text: "I'd be happy to help you book your annual physical. I found several clinics near you with availability this week. Would you like me to show you the options?" },
      { role: 'user', text: 'Yes please!' },
      { role: 'model', text: "I've found City Health Center with openings on Thursday and Friday morning. Shall I book one of those slots for you?" },
    ]
  },
];
