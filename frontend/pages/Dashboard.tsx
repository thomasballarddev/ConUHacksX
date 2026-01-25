
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="px-8 pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="serif-font text-5xl text-primary mb-4 leading-tight">Welcome, Sam! 👋</h1>
          <p className="text-xl text-gray-500 max-w-2xl leading-relaxed">
            Your personal AI health assistant is ready to help. How are you feeling today?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Quick Stats */}
          <div className="bg-card-beige p-8 rounded-3xl border border-black/5 shadow-sm">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">monitoring</span>
              Daily Health Summary
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                    <span className="material-symbols-outlined">water_drop</span>
                  </div>
                  <span className="text-sm font-semibold">Hydration</span>
                </div>
                <span className="text-sm font-black">1.2L / 2.5L</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="size-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
                    <span className="material-symbols-outlined">directions_walk</span>
                  </div>
                  <span className="text-sm font-semibold">Activity</span>
                </div>
                <span className="text-sm font-black">4,582 steps</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full pulse-red"></div>
                <h3 className="font-bold text-lg">Active AI Booking</h3>
              </div>
              <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Live Relay</span>
            </div>
            <div className="flex-1 bg-gray-50 rounded-2xl p-5 mb-6 overflow-hidden border border-black/5">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">AI</div>
                  <p className="text-xs text-gray-600 leading-relaxed italic">"Hello, I'm calling from Health.me for Sam Smith. We need to schedule a checkup for tomorrow morning..."</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-bg-cream rounded-2xl border border-black/5">
              <div className="flex items-center space-x-3">
                <span className="material-symbols-outlined text-primary text-xl">phone_in_talk</span>
                <span className="text-xs font-bold uppercase tracking-wider">Clinic: City Health</span>
              </div>
              <button 
                onClick={() => navigate('/booking')}
                className="text-[10px] font-black text-primary hover:text-red-500 uppercase transition-colors"
              >
                View Call
              </button>
            </div>
          </div>
        </div>

        {/* AI Action Card */}
        <div 
          onClick={() => navigate('/chat')}
          className="bg-primary text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-all duration-500"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-white/70">auto_awesome</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Your Health Intelligence</span>
              </div>
              <h2 className="serif-font text-4xl mb-4 leading-tight">Need a medical advice or a quick booking?</h2>
              <p className="text-white/70 text-lg">Our AI is locked in and ready to assist with symptoms, records, or finding the nearest care center.</p>
            </div>
            <button className="bg-white text-primary px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">
              Chat with AI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
