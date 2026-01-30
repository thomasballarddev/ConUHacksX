import React, { useState, useEffect } from 'react';
import cycling2 from '../assets/cycling2.jpg';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, saveUserProfile, UserProfile } from '../src/firestore';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const COMMON_ALLERGIES = ['Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Penicillin', 'Sulfa', 'Latex', 'Dust Mites', 'Pollen', 'Pet Dander'];
const COMMON_CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Arthritis', 'Depression', 'Anxiety', 'ADHD', 'Epilepsy', 'Thyroid Disorder'];

const HealthProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'profile' | 'records'>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

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
      setSaveMessage({ type: 'success', text: 'Profile updated!' });
      setIsEditing(false);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      getUserProfile(user.uid).then(p => p && setProfile(p));
    }
  };

  const toggleAllergy = (allergy: string) => {
    if (!profile) return;
    setProfile(prev => prev ? {
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy]
    } : null);
  };

  const toggleCondition = (condition: string) => {
    if (!profile) return;
    setProfile(prev => prev ? {
      ...prev,
      medicalConditions: {
        ...prev.medicalConditions,
        conditions: prev.medicalConditions.conditions.includes(condition)
          ? prev.medicalConditions.conditions.filter(c => c !== condition)
          : [...prev.medicalConditions.conditions, condition]
      }
    } : null);
  };

  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const records = [
    { name: 'Blood Panel - Annual Checkup', date: 'Jan 12, 2024', clinic: 'Clinique Médicale Privée UnionMD', type: 'Lab Result', icon: 'biotech', color: 'bg-blue-50 text-blue-500' },
    { name: 'Radiology Report - Lower Back', date: 'Dec 05, 2023', clinic: 'CuraMed', type: 'Imaging', icon: 'visibility', color: 'bg-purple-50 text-purple-500' },
    { name: 'Prescription: Lisinopril 10mg', date: 'Nov 20, 2023', clinic: 'Clinique Santé MD', type: 'Prescription', icon: 'medication', color: 'bg-orange-50 text-orange-500' },
    { name: 'Discharge Summary - Appendectomy', date: 'Aug 14, 2023', clinic: 'Centre Médical Westmount', type: 'Hospital Record', icon: 'description', color: 'bg-gray-50 text-gray-500' },
    { name: 'Immunization Record - 2023', date: 'Feb 10, 2023', clinic: 'Westmount Square Health Group', type: 'Vaccination', icon: 'vaccines', color: 'bg-green-50 text-green-500' },
  ];

  return (
    <div className="px-8 pb-32">
      <div className="w-full relative rounded-[24px] p-6 mb-8 overflow-hidden shadow-lg text-white min-h-[250px] flex flex-col justify-end">
        <div className="absolute inset-0">
          <img src={cycling2} alt="Cycling Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-end gap-4 flex-1 w-full">
          <div>
            <h1 className="serif-font text-3xl mb-2 font-medium tracking-tight">Health Profile</h1>
            <p className="text-white/80 text-sm max-w-xl font-light leading-relaxed">
              Your centralized biological data and real-time insights.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-1 rounded-xl flex gap-1">
              <button
                onClick={() => setActiveView('profile')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeView === 'profile' ? 'bg-white text-primary shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveView('records')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeView === 'records' ? 'bg-white text-primary shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                Records
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`max-w-6xl mx-auto mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300 ${
          saveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <span className="material-symbols-outlined">
            {saveMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-medium">{saveMessage.text}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <span className="material-symbols-outlined animate-spin text-4xl text-gray-400">progress_activity</span>
          </div>
        ) : activeView === 'profile' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

            {/* Edit Button */}
            {profile && (
              <div className="flex justify-end">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-black/10"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                    Edit Health Data
                  </button>
                ) : (
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
            )}

            {/* Combined Metrics Section */}
            <div className="bg-[#F5F2EA] rounded-[32px] p-8 shadow-sm border border-black/5">
              <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-primary opacity-80">
                <span className="material-symbols-outlined text-xl">bar_chart</span>
                Health Summary
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Blood Type */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="size-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shrink-0">
                    <span className="material-symbols-outlined text-xl">bloodtype</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Blood Type</p>
                    {isEditing ? (
                      <select
                        className="w-full mt-1 px-2 py-1 rounded-lg bg-gray-50 border border-black/10 text-sm font-bold text-primary"
                        value={profile?.bloodType || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, bloodType: e.target.value } : null)}
                      >
                        <option value="">Select</option>
                        {BLOOD_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-lg font-black text-primary">{profile?.bloodType || '—'}</p>
                    )}
                  </div>
                </div>

                {/* Weight */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                    <span className="material-symbols-outlined text-xl">scale</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Weight</p>
                    {isEditing ? (
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="text"
                          className="w-16 px-2 py-1 rounded-lg bg-gray-50 border border-black/10 text-sm font-bold text-primary"
                          value={profile?.physicalStats.weight || ''}
                          onChange={(e) => setProfile(prev => prev ? {
                            ...prev,
                            physicalStats: { ...prev.physicalStats, weight: e.target.value }
                          } : null)}
                          placeholder="165"
                        />
                        <span className="text-xs text-gray-400">lbs</span>
                      </div>
                    ) : (
                      <p className="text-lg font-black text-primary">
                        {profile?.physicalStats.weight ? `${profile.physicalStats.weight} lbs` : '—'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Height */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="size-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500 shrink-0">
                    <span className="material-symbols-outlined text-xl">straighten</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Height</p>
                    {isEditing ? (
                      <input
                        type="text"
                        className="w-full mt-1 px-2 py-1 rounded-lg bg-gray-50 border border-black/10 text-sm font-bold text-primary"
                        value={profile?.physicalStats.height || ''}
                        onChange={(e) => setProfile(prev => prev ? {
                          ...prev,
                          physicalStats: { ...prev.physicalStats, height: e.target.value }
                        } : null)}
                        placeholder="5'11&quot;"
                      />
                    ) : (
                      <p className="text-lg font-black text-primary">{profile?.physicalStats.height || '—'}</p>
                    )}
                  </div>
                </div>

                {/* Age */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="size-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                    <span className="material-symbols-outlined text-xl">event</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Age</p>
                    <p className="text-lg font-black text-primary">
                      {profile?.personalInfo.dateOfBirth ? `${calculateAge(profile.personalInfo.dateOfBirth)} yrs` : '—'}
                    </p>
                  </div>
                </div>

                {/* Heart Rate */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="size-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shrink-0">
                    <span className="material-symbols-outlined text-xl">favorite</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Heart Rate</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-black text-primary">72 <span className="text-xs text-gray-400/80 font-normal">bpm</span></p>
                      <span className="size-1.5 bg-red-500 rounded-full animate-pulse"></span>
                    </div>
                  </div>
                </div>

                {/* SpO2 */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                    <span className="material-symbols-outlined text-xl">air</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SpO2</p>
                    <p className="text-lg font-black text-primary">98 <span className="text-xs text-gray-400/80 font-normal">%</span></p>
                  </div>
                </div>

                {/* Blood Pressure */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="size-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 shrink-0">
                    <span className="material-symbols-outlined text-xl">speed</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Blood Pressure</p>
                    <p className="text-lg font-black text-primary">120/80</p>
                  </div>
                </div>

                {/* Temperature */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="size-10 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600 shrink-0">
                    <span className="material-symbols-outlined text-xl">thermostat</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Temp</p>
                    <p className="text-lg font-black text-primary">98.6°F</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Allergies & Conditions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Allergies */}
              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-[24px] border border-black/5 shadow-sm">
                <h3 className="text-xs font-black text-primary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-sm bg-red-50 p-1 rounded-md">warning</span>
                  Known Allergies
                </h3>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {COMMON_ALLERGIES.map(allergy => (
                      <button
                        key={allergy}
                        onClick={() => toggleAllergy(allergy)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          profile?.allergies.includes(allergy)
                            ? 'bg-red-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-black/5'
                        }`}
                      >
                        {allergy}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile?.allergies && profile.allergies.length > 0 ? (
                      profile.allergies.map(item => (
                        <span key={item} className="px-3 py-1.5 bg-white text-red-700 text-xs font-bold rounded-lg border border-red-100 shadow-sm">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No allergies recorded</span>
                    )}
                  </div>
                )}
              </div>

              {/* Medical Conditions */}
              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-[24px] border border-black/5 shadow-sm">
                <h3 className="text-xs font-black text-primary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm bg-primary/10 p-1 rounded-md">medical_information</span>
                  Medical Conditions
                </h3>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {COMMON_CONDITIONS.map(condition => (
                        <button
                          key={condition}
                          onClick={() => toggleCondition(condition)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            profile?.medicalConditions.conditions.includes(condition)
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-black/5'
                          }`}
                        >
                          {condition}
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-sm text-primary resize-none"
                      rows={2}
                      value={profile?.medicalConditions.notes || ''}
                      onChange={(e) => setProfile(prev => prev ? {
                        ...prev,
                        medicalConditions: { ...prev.medicalConditions, notes: e.target.value }
                      } : null)}
                      placeholder="Additional notes..."
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {profile?.medicalConditions.conditions && profile.medicalConditions.conditions.length > 0 ? (
                        profile.medicalConditions.conditions.map(item => (
                          <span key={item} className="px-3 py-1.5 bg-white text-primary text-xs font-bold rounded-lg border border-primary/20 shadow-sm">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">No conditions recorded</span>
                      )}
                    </div>
                    {profile?.medicalConditions.notes && (
                      <p className="text-xs text-gray-500 italic bg-white/50 rounded-lg p-2">{profile.medicalConditions.notes}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Device Source */}
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-[24px] border border-black/5 shadow-sm">
              <h3 className="text-xs font-black text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-500 text-sm bg-gray-50 p-1 rounded-md">watch</span>
                Connected Devices
              </h3>
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-black/5 shadow-sm">
                <div className="flex items-center gap-3">
                  <img className="size-5 object-contain" src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple Health" />
                  <span className="text-xs font-bold text-primary">Apple Watch Ultra</span>
                </div>
                <span className="size-1.5 rounded-full bg-green-500 pulse-green"></span>
              </div>
            </div>

            {/* Clinical Timeline */}
            <div>
              <h2 className="serif-font text-3xl text-primary mb-8 px-2">Clinical Timeline</h2>
              <div className="relative pl-8 border-l-2 border-gray-100 space-y-12">
                {[
                  { year: '2023', event: 'Appendectomy', clinic: 'Centre Médical Westmount', icon: 'content_cut', type: 'Surgery' },
                  { year: '2021', event: 'Type 2 Diabetes Diagnosis', clinic: 'Clinique Médicale Privée UnionMD', icon: 'medical_information', type: 'Diagnosis' },
                  { year: '2018', event: 'Left Wrist Fracture', clinic: 'Clinique Médicale Métro', icon: 'orthopedics', type: 'Injury' },
                ].map((item, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[41px] top-6 size-5 rounded-full border-[4px] border-white bg-primary shadow-sm"></div>
                    <div className="bg-white p-8 rounded-[32px] border border-black/5 flex items-center gap-6 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group shadow-sm">
                      <div className="flex flex-col items-center gap-2 mr-4">
                        <span className="text-2xl font-black serif-font text-primary/30 group-hover:text-primary transition-colors">{item.year}</span>
                      </div>

                      <div className="size-14 bg-bg-cream rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm flex-shrink-0">
                        <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                      </div>

                      <div className="flex-1">
                        <span className="inline-block px-3 py-1 rounded-lg bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">{item.type}</span>
                        <p className="font-black text-primary text-xl mb-1">{item.event}</p>
                        <p className="text-sm text-gray-400 font-medium">{item.clinic}</p>
                      </div>

                      <div className="size-10 rounded-full border border-black/5 flex items-center justify-center text-gray-300 group-hover:border-primary group-hover:text-primary transition-all">
                        <span className="material-symbols-outlined text-xl">arrow_forward</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-3 bg-primary text-white p-12 rounded-[48px] shadow-2xl relative overflow-hidden mb-6">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 max-w-3xl">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="material-symbols-outlined text-white/70 bg-white/10 p-2 rounded-xl">auto_awesome</span>
                    <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white/50">AI Health Insights</span>
                  </div>
                  <h2 className="serif-font text-4xl mb-8 leading-tight">"All clinical indicators are within nominal ranges. Your recent blood panel shows optimal LDL levels. Suggested next screening: April 2024."</h2>
                  <button className="bg-white text-primary py-4 px-10 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-2xl active:scale-95">
                    Generate Detailed Report
                  </button>
                </div>
              </div>

              {records.map((record, i) => (
                <div key={i} className="bg-white p-8 rounded-[40px] border border-black/5 shadow-sm hover:shadow-2xl transition-all group flex flex-col h-full">
                  <div className={`size-14 ${record.color} rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-2xl">{record.icon}</span>
                  </div>
                  <div className="flex-1 mb-10">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 leading-none">{record.type}</div>
                    <h3 className="font-black text-2xl text-primary mb-4 leading-tight group-hover:text-primary transition-colors pr-6">{record.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 font-bold mb-2">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      <span>{record.date}</span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium">{record.clinic}</p>
                  </div>
                  <div className="flex gap-4 mt-auto">
                    <button className="flex-1 bg-gray-50 text-primary py-4 rounded-2xl text-xs font-black border border-black/5 hover:bg-black hover:text-white transition-all shadow-sm">
                      Open Record
                    </button>
                    <button className="size-14 rounded-2xl border border-black/5 text-gray-400 hover:text-primary hover:bg-gray-50 transition-all flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-2xl">download</span>
                    </button>
                  </div>
                </div>
              ))}

              <button className="bg-transparent border-2 border-dashed border-black/10 p-10 rounded-[40px] flex flex-col items-center justify-center gap-6 hover:border-primary/40 hover:bg-white transition-all group min-h-[320px]">
                <div className="size-20 rounded-full bg-black/5 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                  <span className="material-symbols-outlined text-5xl">add</span>
                </div>
                <div className="text-center">
                  <p className="font-black text-gray-400 group-hover:text-primary transition-all text-sm uppercase tracking-widest mb-1">Upload Result</p>
                  <p className="text-[10px] text-gray-300 uppercase tracking-widest font-bold">PDF, JPEG, or HEIC</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthProfile;
