import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, saveUserProfile, UserProfile } from '../src/firestore';


const Settings: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Notification settings
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const userProfile = await getUserProfile(user.uid);
        if (userProfile) {
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await saveUserProfile(user.uid, profile);
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reload profile to discard changes
    if (user) {
      getUserProfile(user.uid).then(p => p && setProfile(p));
    }
  };

  const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full relative transition-all ${value ? 'bg-green-500' : 'bg-gray-200'}`}
    >
      <div className={`size-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${value ? 'left-6' : 'left-0.5'}`}></div>
    </button>
  );

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-8 flex items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined animate-spin text-4xl text-gray-400">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="serif-font text-4xl text-primary mb-2">Settings</h1>
          <p className="text-gray-500 text-sm">Manage your account and health profile</p>
        </div>
        {profile && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-black/10"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
            Edit Profile
          </button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
            >
              {isSaving && <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>}
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300 ${
          saveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <span className="material-symbols-outlined">
            {saveMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-medium">{saveMessage.text}</span>
        </div>
      )}

      {/* Account Section - Always Read Only */}
      <section className="mb-8">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-1">Account</h2>
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <div className="p-6 flex items-center gap-4">
            <div className="size-16 rounded-full overflow-hidden border-2 border-black/5 shadow-sm">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                  {user?.displayName?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-primary">{user?.displayName || 'User'}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
            <div className="px-3 py-1.5 bg-gray-50 rounded-xl border border-black/5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Google Account</span>
            </div>
          </div>
        </div>
      </section>

      {/* Health Profile */}
      {profile && (
        <>
          {/* Personal Details */}
          <section className="mb-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-1">Personal Details</h2>
            <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden divide-y divide-black/5">
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">badge</span>
                  </div>
                  <span className="text-sm font-medium text-primary">Full Name</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-48 px-4 py-2.5 rounded-xl bg-gray-50 border border-black/10 text-sm text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={profile.personalInfo.fullName || ''}
                    onChange={(e) => setProfile(prev => prev ? {
                      ...prev,
                      personalInfo: { ...prev.personalInfo, fullName: e.target.value }
                    } : null)}
                    placeholder="Your full name"
                  />
                ) : (
                  <span className="text-sm text-gray-500 font-medium">{profile.personalInfo.fullName || '—'}</span>
                )}
              </div>
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-500">phone</span>
                  </div>
                  <span className="text-sm font-medium text-primary">Phone</span>
                </div>
                {isEditing ? (
                  <input
                    type="tel"
                    className="w-48 px-4 py-2.5 rounded-xl bg-gray-50 border border-black/10 text-sm text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={profile.personalInfo.phone || ''}
                    onChange={(e) => setProfile(prev => prev ? {
                      ...prev,
                      personalInfo: { ...prev.personalInfo, phone: e.target.value }
                    } : null)}
                    placeholder="(555) 123-4567"
                  />
                ) : (
                  <span className="text-sm text-gray-500 font-medium">{profile.personalInfo.phone || '—'}</span>
                )}
              </div>
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-500">cake</span>
                  </div>
                  <span className="text-sm font-medium text-primary">Date of Birth</span>
                </div>
                {isEditing ? (
                  <input
                    type="date"
                    className="px-4 py-2.5 rounded-xl bg-gray-50 border border-black/10 text-sm text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={profile.personalInfo.dateOfBirth || ''}
                    onChange={(e) => setProfile(prev => prev ? {
                      ...prev,
                      personalInfo: { ...prev.personalInfo, dateOfBirth: e.target.value }
                    } : null)}
                  />
                ) : (
                  <span className="text-sm text-gray-500 font-medium">{profile.personalInfo.dateOfBirth || '—'}</span>
                )}
              </div>
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-pink-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-pink-500">wc</span>
                  </div>
                  <span className="text-sm font-medium text-primary">Gender</span>
                </div>
                {isEditing ? (
                  <div className="flex gap-2">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setProfile(prev => prev ? {
                          ...prev,
                          personalInfo: { ...prev.personalInfo, gender: g }
                        } : null)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          profile.personalInfo.gender === g
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-black/5'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500 font-medium">{profile.personalInfo.gender || '—'}</span>
                )}
              </div>
            </div>
          </section>


          {/* Emergency Contact */}
          <section className="mb-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-1">Emergency Contact</h2>
            <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden divide-y divide-black/5">
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-500">person</span>
                  </div>
                  <span className="text-sm font-medium text-primary">Name</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-48 px-4 py-2.5 rounded-xl bg-gray-50 border border-black/10 text-sm text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={profile.emergencyContact.name || ''}
                    onChange={(e) => setProfile(prev => prev ? {
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                    } : null)}
                    placeholder="Contact name"
                  />
                ) : (
                  <span className="text-sm text-gray-500 font-medium">{profile.emergencyContact.name || '—'}</span>
                )}
              </div>
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-teal-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-teal-500">family_restroom</span>
                  </div>
                  <span className="text-sm font-medium text-primary">Relationship</span>
                </div>
                {isEditing ? (
                  <div className="flex flex-wrap gap-1.5 justify-end max-w-[320px]">
                    {['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'].map((rel) => (
                      <button
                        key={rel}
                        onClick={() => setProfile(prev => prev ? {
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, relationship: rel }
                        } : null)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          profile.emergencyContact.relationship === rel
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-black/5'
                        }`}
                      >
                        {rel}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500 font-medium">{profile.emergencyContact.relationship || '—'}</span>
                )}
              </div>
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-indigo-500">call</span>
                  </div>
                  <span className="text-sm font-medium text-primary">Phone</span>
                </div>
                {isEditing ? (
                  <input
                    type="tel"
                    className="w-48 px-4 py-2.5 rounded-xl bg-gray-50 border border-black/10 text-sm text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={profile.emergencyContact.phone || ''}
                    onChange={(e) => setProfile(prev => prev ? {
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                    } : null)}
                    placeholder="(555) 123-4567"
                  />
                ) : (
                  <span className="text-sm text-gray-500 font-medium">{profile.emergencyContact.phone || '—'}</span>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Notifications */}
      <section className="mb-8">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-1">Notifications</h2>
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden divide-y divide-black/5">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-500">notifications</span>
              </div>
              <div>
                <p className="text-sm font-medium text-primary">Push Notifications</p>
                <p className="text-xs text-gray-400">Receive alerts on your device</p>
              </div>
            </div>
            <Toggle value={notifications} onChange={setNotifications} />
          </div>
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-green-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-500">mail</span>
              </div>
              <div>
                <p className="text-sm font-medium text-primary">Email Alerts</p>
                <p className="text-xs text-gray-400">Get updates via email</p>
              </div>
            </div>
            <Toggle value={emailAlerts} onChange={setEmailAlerts} />
          </div>
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-500">sms</span>
              </div>
              <div>
                <p className="text-sm font-medium text-primary">SMS Notifications</p>
                <p className="text-xs text-gray-400">Receive text message alerts</p>
              </div>
            </div>
            <Toggle value={smsAlerts} onChange={setSmsAlerts} />
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section className="mb-8">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-1">Preferences</h2>
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-500">language</span>
              </div>
              <div>
                <p className="text-sm font-medium text-primary">Language</p>
                <p className="text-xs text-gray-400">Select your preferred language</p>
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-50 border border-black/5 rounded-xl px-4 py-2.5 text-sm text-primary font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="mb-8">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-1">Legal</h2>
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden divide-y divide-black/5">
          <button className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-all group">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-500">description</span>
              </div>
              <span className="text-sm font-medium text-primary">Privacy Policy</span>
            </div>
            <span className="material-symbols-outlined text-gray-300 group-hover:text-gray-400 transition-colors">chevron_right</span>
          </button>
          <button className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-all group">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-500">gavel</span>
              </div>
              <span className="text-sm font-medium text-primary">Terms of Service</span>
            </div>
            <span className="material-symbols-outlined text-gray-300 group-hover:text-gray-400 transition-colors">chevron_right</span>
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-red-400 mb-4 px-1">Danger Zone</h2>
        <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">
          <button className="w-full p-5 flex items-center justify-between hover:bg-red-50 transition-all group">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500">delete</span>
              </div>
              <span className="text-sm font-medium text-red-500">Delete Account</span>
            </div>
            <span className="material-symbols-outlined text-red-300 group-hover:text-red-400 transition-colors">chevron_right</span>
          </button>
        </div>
      </section>

      {/* Version */}
      <div className="mt-12 text-center">
        <p className="text-xs text-gray-300 font-medium">Health.me v1.0.0</p>
      </div>
    </div>
  );
};

export default Settings;
