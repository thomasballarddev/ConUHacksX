import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, icon: 'event', title: 'Appointment Reminder', message: 'Your appointment with Dr. Aris is tomorrow at 10:00 AM', time: '2h ago', unread: true },
    { id: 2, icon: 'medication', title: 'Medication Due', message: 'Time to take your daily vitamin D supplement', time: '4h ago', unread: true },
    { id: 3, icon: 'favorite', title: 'Health Insight', message: 'Your resting heart rate has improved by 5% this week', time: '1d ago', unread: false },
    { id: 4, icon: 'check_circle', title: 'Lab Results Ready', message: 'Your blood test results are now available', time: '2d ago', unread: false },
  ];

  return (
    <header className="p-8 pb-0 flex justify-between items-center bg-transparent relative">
      <div className="flex items-center space-x-4">
        {/* Mobile menu space */}
      </div>
      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-full hover:bg-black/5 transition-colors text-gray-400 hover:text-primary relative"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1 right-1 size-2.5 bg-red-500 rounded-full border-2 border-soft-cream"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 top-12 w-80 bg-soft-cream rounded-3xl shadow-2xl border border-black/5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-5 border-b border-black/5 flex justify-between items-center bg-white/50">
                  <h3 className="serif-font text-xl text-primary">Notifications</h3>
                  <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-1 rounded-full uppercase tracking-wider">2 New</span>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar p-3 space-y-2">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl cursor-pointer transition-all border ${notif.unread ? 'bg-white border-primary/20 shadow-sm' : 'bg-white/50 border-black/5 hover:bg-white'}`}
                    >
                      <div className="flex gap-3">
                        <div className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.unread ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <span className="material-symbols-outlined text-lg">{notif.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-bold text-sm text-primary truncate">{notif.title}</p>
                            <span className="text-[9px] text-gray-400 whitespace-nowrap font-medium">{notif.time}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile */}
        <button
          onClick={() => navigate('/settings')}
          className="size-9 rounded-full overflow-hidden border-2 border-black/5 hover:border-primary transition-all"
        >
          <img src="https://picsum.photos/seed/alex/200/200" alt="Profile" className="w-full h-full object-cover" />
        </button>

        <div className="h-6 w-[1px] bg-black/5 mx-1"></div>

        {/* Emergency Button */}
        <button
          onClick={() => navigate('/emergency')}
          className="group flex items-center gap-2 bg-white border border-red-100 hover:border-red-500 px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-md"
        >
          <span className="material-symbols-outlined text-emergency text-[14px] fill-1">star</span>
          <span className="text-[11px] font-black text-emergency uppercase tracking-[0.1em]">Emergency</span>
          <span className="material-symbols-outlined text-emergency text-lg group-hover:scale-110 transition-transform">radio_button_checked</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
