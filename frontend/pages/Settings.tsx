import React, { useState } from 'react';

const Settings: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [language, setLanguage] = useState('en');

  const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
    <button 
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full relative transition-all ${value ? 'bg-green-500' : 'bg-gray-200'}`}
    >
      <div className={`size-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${value ? 'left-6' : 'left-0.5'}`}></div>
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto p-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="serif-font text-4xl text-primary mb-2">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your account preferences and app settings</p>
      </div>

      {/* Account Section */}
      <section className="mb-10">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-1">Account</h2>
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <div className="p-6 flex items-center gap-4 border-b border-black/5">
            <div className="size-16 rounded-full overflow-hidden border-2 border-black/5">
              <img src="https://picsum.photos/seed/alex/200/200" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-primary">Alex McGregor</p>
              <p className="text-sm text-gray-400">alex.mcgregor@email.com</p>
            </div>
            <button className="px-4 py-2 bg-gray-50 text-primary text-xs font-bold rounded-xl hover:bg-gray-100 transition-all">
              Edit Profile
            </button>
          </div>
          
          <div className="divide-y divide-black/5">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">email</span>
                <span className="text-sm font-medium text-primary">Email</span>
              </div>
              <span className="text-sm text-gray-400">alex.mcgregor@email.com</span>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">phone</span>
                <span className="text-sm font-medium text-primary">Phone</span>
              </div>
              <span className="text-sm text-gray-400">+1 (514) 555-0123</span>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">location_on</span>
                <span className="text-sm font-medium text-primary">Location</span>
              </div>
              <span className="text-sm text-gray-400">Montreal, QC</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Notifications Section */}
      <section className="mb-10">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-1">Notifications</h2>
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden divide-y divide-black/5">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Push Notifications</p>
              <p className="text-xs text-gray-400 mt-0.5">Receive alerts on your device</p>
            </div>
            <Toggle value={notifications} onChange={setNotifications} />
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Email Alerts</p>
              <p className="text-xs text-gray-400 mt-0.5">Get updates via email</p>
            </div>
            <Toggle value={emailAlerts} onChange={setEmailAlerts} />
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">SMS Notifications</p>
              <p className="text-xs text-gray-400 mt-0.5">Receive text message alerts</p>
            </div>
            <Toggle value={smsAlerts} onChange={setSmsAlerts} />
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="mb-10">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-1">Preferences</h2>
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden divide-y divide-black/5">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Language</p>
              <p className="text-xs text-gray-400 mt-0.5">Select your preferred language</p>
            </div>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-50 border border-black/5 rounded-xl px-6.5 py-2 text-sm text-primary font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
      </section>

      {/* Privacy & Security Section */}
      <section className="mb-10">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-1">Privacy & Security</h2>
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden divide-y divide-black/5">
          <button className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gray-400">lock</span>
              <span className="text-sm font-medium text-primary">Change Password</span>
            </div>
            <span className="material-symbols-outlined text-gray-300">chevron_right</span>
          </button>
          <button className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gray-400">security</span>
              <span className="text-sm font-medium text-primary">Two-Factor Authentication</span>
            </div>
            <span className="material-symbols-outlined text-gray-300">chevron_right</span>
          </button>
          <button className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gray-400">description</span>
              <span className="text-sm font-medium text-primary">Privacy Policy</span>
            </div>
            <span className="material-symbols-outlined text-gray-300">chevron_right</span>
          </button>
          <button className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gray-400">gavel</span>
              <span className="text-sm font-medium text-primary">Terms of Service</span>
            </div>
            <span className="material-symbols-outlined text-gray-300">chevron_right</span>
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-red-400 mb-4 px-1">Danger Zone</h2>
        <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">
          <button className="w-full p-5 flex items-center justify-between hover:bg-red-50 transition-all group">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400">delete</span>
              <span className="text-sm font-medium text-red-500">Delete Account</span>
            </div>
            <span className="material-symbols-outlined text-red-300 group-hover:text-red-400">chevron_right</span>
          </button>
        </div>
      </section>

      {/* Version Info */}
      <div className="mt-12 text-center">
        <p className="text-xs text-gray-300 font-medium">Health.me v1.0.0</p>
      </div>
    </div>
  );
};

export default Settings;
