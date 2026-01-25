import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import cyclingImage from '../assets/cycling.jpg';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [showAllSessions, setShowAllSessions] = useState(false);

  const allSessions = [
    { id: 1, title: 'General checkup followup', date: 'Today', status: 'active', preview: "I've been feeling much better, but I still have some mild fatigue in the afternoons..." },
    { id: 2, title: 'Lower back pain query', date: 'Yesterday', status: 'completed', preview: "I've been experiencing lower back pain for the past few days, especially when sitting..." },
    { id: 3, title: 'Prescription refill request', date: 'Jan 21', status: 'completed', preview: "I need to refill my blood pressure medication. I'm running low..." },
    { id: 4, title: 'Headache symptoms', date: 'Jan 19', status: 'completed', preview: "I've been having recurring headaches for the past week. They usually start in the afternoon..." },
    { id: 5, title: 'Annual physical booking', date: 'Jan 15', status: 'completed', preview: "I'd like to schedule my annual physical exam. What availability do you have..." },
  ];

  return (
    <>
    {/* View All Sessions Modal */}
    {showAllSessions && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAllSessions(false)}>
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b border-black/5 flex items-center justify-between">
            <h2 className="serif-font text-2xl text-primary">All Chat Sessions</h2>
            <button onClick={() => setShowAllSessions(false)} className="size-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3">
            {allSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => { setShowAllSessions(false); navigate(`/chat?session=${session.id}`); }}
                className="bg-gray-50 p-4 rounded-2xl border border-black/5 hover:bg-white hover:shadow-lg hover:border-primary/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-primary">{session.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{session.date}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider text-white px-2 py-1 rounded-lg ${
                      session.status === 'active' ? 'bg-blue-500' : 'bg-green-600'
                    }`}>
                      {session.status === 'active' ? 'Active' : 'Completed'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 line-clamp-1">"{session.preview}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    <div className="px-8 pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="serif-font text-5xl text-primary mb-4 leading-tight">Welcome, Alex!</h1>
          <p className="text-xl text-gray-500 max-w-2xl leading-relaxed">
            Your personal AI health assistant is ready to help. How are you feeling today?
          </p>
        </div>

        {/* Hero Section with Integrated Summary */}
        <div className="relative w-full min-h-[500px] rounded-[40px] overflow-hidden mb-12 shadow-lg group flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-500 z-10"></div>
          <img 
            src={cyclingImage} 
            alt="Active Lifestyle" 
            className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
          />
          
          <div className="relative z-30 p-6 md:p-8 pb-4 md:pb-6">
            {/* Daily Health Summary Overlay */}
            <div className="bg-card-beige/90 backdrop-blur-md p-8 rounded-3xl border border-black/5 shadow-xl">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">monitoring</span>
                Daily Health Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-4 bg-white/80 rounded-2xl shadow-sm border border-black/5 hover:border-blue-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                      <span className="material-symbols-outlined">water_drop</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Hydration</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">1.2L / 2.5L</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/80 rounded-2xl shadow-sm border border-black/5 hover:border-green-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="size-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
                      <span className="material-symbols-outlined">directions_walk</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Activity</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">4,582 steps</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/80 rounded-2xl shadow-sm border border-black/5 hover:border-red-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="size-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                      <span className="material-symbols-outlined">favorite</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Heart Rate</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">72 bpm</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/80 rounded-2xl shadow-sm border border-black/5 hover:border-purple-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="size-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500">
                      <span className="material-symbols-outlined">bedtime</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Sleep</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">7h 23m</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/80 rounded-2xl shadow-sm border border-black/5 hover:border-orange-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="size-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                      <span className="material-symbols-outlined">local_fire_department</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Calories</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">1,847 kcal</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/80 rounded-2xl shadow-sm border border-black/5 hover:border-teal-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="size-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-500">
                      <span className="material-symbols-outlined">speed</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Blood Pressure</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">120/80</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/80 rounded-2xl shadow-sm border border-black/5 hover:border-yellow-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="size-10 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600">
                      <span className="material-symbols-outlined">glucose</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Blood Sugar</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">95 mg/dL</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/80 rounded-2xl shadow-sm border border-black/5 hover:border-indigo-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="size-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                      <span className="material-symbols-outlined">thermostat</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Temperature</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">98.6°F</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Chat Sessions */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">forum</span>
              Recent Sessions
            </h3>
            <button
              onClick={() => setShowAllSessions(true)}
              className="text-xs font-bold text-primary hover:text-black transition-colors"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => navigate('/chat?session=1')}
              className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm hover:shadow-lg hover:border-primary/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400">Today</span>
                <span className="size-2 bg-blue-500 rounded-full"></span>
              </div>
              <h4 className="font-bold text-primary mb-2">General checkup followup</h4>
              <p className="text-sm text-gray-500 line-clamp-2">
                "I've been feeling much better, but I still have some mild fatigue in the afternoons..."
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-blue-500 px-2 py-1 rounded-lg">Active</span>
              </div>
            </div>

            <div
              onClick={() => navigate('/chat?session=2')}
              className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm hover:shadow-lg hover:border-primary/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400">Yesterday</span>
                <span className="size-2 bg-green-500 rounded-full"></span>
              </div>
              <h4 className="font-bold text-primary mb-2">Lower back pain query</h4>
              <p className="text-sm text-gray-500 line-clamp-2">
                "I've been experiencing lower back pain for the past few days, especially when sitting..."
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-green-600 px-2 py-1 rounded-lg">Completed</span>
              </div>
            </div>

            <div
              onClick={() => navigate('/chat?session=3')}
              className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm hover:shadow-lg hover:border-primary/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400">Jan 21</span>
                <span className="size-2 bg-green-500 rounded-full"></span>
              </div>
              <h4 className="font-bold text-primary mb-2">Prescription refill request</h4>
              <p className="text-sm text-gray-500 line-clamp-2">
                "I need to refill my blood pressure medication. I'm running low..."
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-green-600 px-2 py-1 rounded-lg">Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Health Summary */}
        <div className="bg-primary text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-white/70">analytics</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Weekly Health Summary</span>
            </div>

            <h2 className="serif-font text-3xl mb-6 leading-relaxed">
              This week you've been 12% more active than last week, averaging 4,582 steps per day. Your resting heart rate is steady at 68 bpm, which is within a healthy range.
            </h2>

            <p className="text-white/70 text-lg leading-relaxed mb-6">
              You're getting an average of 7.2 hours of sleep per night, and your blood pressure readings have remained stable at 120/80 mmHg. Your hydration could improve — you're only hitting about 48% of your daily water intake goal.
            </p>

            <p className="text-white/50 text-sm italic">
              Tip: Try setting hourly reminders to drink water throughout the day to reach your 2.5L goal.
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Dashboard;
