
import React, { useState } from 'react';

const HealthProfile: React.FC = () => {
  const [activeView, setActiveView] = useState<'profile' | 'records'>('profile');

  const records = [
    { name: 'Blood Panel - Annual Checkup', date: 'Jan 12, 2024', clinic: 'Clinique Médicale Privée UnionMD', type: 'Lab Result', icon: 'biotech', color: 'bg-blue-50 text-blue-500' },
    { name: 'Radiology Report - Lower Back', date: 'Dec 05, 2023', clinic: 'CuraMed', type: 'Imaging', icon: 'visibility', color: 'bg-purple-50 text-purple-500' },
    { name: 'Prescription: Lisinopril 10mg', date: 'Nov 20, 2023', clinic: 'Clinique Santé MD', type: 'Prescription', icon: 'medication', color: 'bg-orange-50 text-orange-500' },
    { name: 'Discharge Summary - Appendectomy', date: 'Aug 14, 2023', clinic: 'Centre Médical Westmount', type: 'Hospital Record', icon: 'description', color: 'bg-gray-50 text-gray-500' },
    { name: 'Immunization Record - 2023', date: 'Feb 10, 2023', clinic: 'Westmount Square Health Group', type: 'Vaccination', icon: 'vaccines', color: 'bg-green-50 text-green-500' },
  ];

  return (
    <div className="px-8 pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="serif-font text-5xl text-primary mb-3">Health Profile</h1>
            <p className="text-gray-500 text-lg">Your core biological data and centralized medical history.</p>
          </div>
          
          <div className="bg-white border border-black/5 p-1.5 rounded-[22px] flex gap-1 shadow-sm">
            <button 
              onClick={() => setActiveView('profile')}
              className={`px-8 py-3 rounded-2xl text-sm font-black transition-all ${activeView === 'profile' ? 'bg-primary text-white shadow-xl' : 'text-gray-400 hover:text-primary hover:bg-gray-50'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveView('records')}
              className={`px-8 py-3 rounded-2xl text-sm font-black transition-all ${activeView === 'records' ? 'bg-primary text-white shadow-xl' : 'text-gray-400 hover:text-primary hover:bg-gray-50'}`}
            >
              Clinical Records
            </button>
          </div>
        </div>

        {activeView === 'profile' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <div className="lg:col-span-2 bg-card-beige rounded-[40px] p-10 border border-black/5 shadow-sm">
                <h2 className="font-bold text-xl mb-10 flex items-center gap-3 text-primary">
                  <span className="material-symbols-outlined text-primary bg-white size-10 flex items-center justify-center rounded-xl shadow-sm border border-black/5">analytics</span>
                  Baseline Biometrics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Blood Type', value: 'A+', icon: 'bloodtype', color: 'text-red-500' },
                    { label: 'Weight', value: '164 lbs', icon: 'scale', color: 'text-blue-500' },
                    { label: 'Height', value: "5'11\"", icon: 'straighten', color: 'text-green-500' },
                    { label: 'Age', value: '32 years', icon: 'event', color: 'text-orange-500' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm transition-transform hover:scale-[1.02]">
                      <span className={`material-symbols-outlined mb-4 ${stat.color}`}>{stat.icon}</span>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-xl font-black text-primary">{stat.value}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white/60 backdrop-blur-sm p-8 rounded-[32px] border border-black/5 shadow-sm">
                    <h3 className="text-sm font-black text-primary mb-6 flex items-center gap-3">
                      <span className="material-symbols-outlined text-red-500 text-lg bg-red-50 p-1.5 rounded-lg">warning</span>
                      Known Allergies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {['Peanuts', 'Penicillin', 'Dust Mites'].map(item => (
                        <span key={item} className="px-4 py-2 bg-white text-red-700 text-xs font-bold rounded-xl border border-red-100 shadow-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm p-8 rounded-[32px] border border-black/5 shadow-sm">
                    <h3 className="text-sm font-black text-primary mb-6 flex items-center gap-3">
                      <span className="material-symbols-outlined text-blue-500 text-lg bg-blue-50 p-1.5 rounded-lg">medication</span>
                      Medication Log
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-black/5">
                        <span className="text-xs font-bold text-primary">Lisinopril</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase">10mg Daily</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-black/5">
                        <span className="text-xs font-bold text-primary">Vitamin D3</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase">2000 IU Daily</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[40px] p-10 border border-black/5 shadow-sm flex flex-col">
                <h2 className="font-bold text-xl mb-10 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary bg-bg-cream size-10 flex items-center justify-center rounded-xl shadow-sm border border-black/5">favorite</span>
                  Connected Vitals
                </h2>
                <div className="space-y-8 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="size-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-sm">
                        <span className="material-symbols-outlined">ecg</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Heart Rate</p>
                        <p className="text-2xl font-black text-primary leading-none">72 <span className="text-[10px] font-normal text-gray-400 tracking-normal ml-1">BPM</span></p>
                      </div>
                    </div>
                    <div className="h-8 w-20 bg-red-50 rounded-lg overflow-hidden flex items-end gap-0.5 px-1.5 pb-1.5 shadow-inner">
                      {[4, 7, 5, 8, 6, 9, 7, 5].map((h, i) => (
                        <div key={i} className="flex-1 bg-red-400 rounded-t-sm" style={{ height: `${h * 10}%` }}></div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="size-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                        <span className="material-symbols-outlined">air</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">SpO2 Level</p>
                        <p className="text-2xl font-black text-primary leading-none">98 <span className="text-[10px] font-normal text-gray-400 tracking-normal ml-1">%</span></p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm border border-green-100">Optimal</span>
                  </div>

                  <div className="mt-12 pt-8 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-1">Active Hardware</p>
                    <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-black/5 group cursor-pointer hover:bg-white transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <img className="size-7 object-contain opacity-70 group-hover:opacity-100 transition-opacity" src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple Health" />
                        <span className="text-sm font-black text-primary">Apple Watch Ultra</span>
                      </div>
                      <span className="size-2.5 rounded-full bg-green-500 pulse-green"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="serif-font text-3xl text-primary mb-8 px-2">Clinical Timeline</h2>
              <div className="space-y-6">
                {[
                  { year: '2023', event: 'Appendectomy', clinic: 'Centre Médical Westmount', icon: 'content_cut' },
                  { year: '2021', event: 'Type 2 Diabetes Diagnosis', clinic: 'Clinique Médicale Privée UnionMD', icon: 'medical_information' },
                  { year: '2018', event: 'Left Wrist Fracture', clinic: 'Clinique Médicale Métro', icon: 'orthopedics' },
                ].map((item, i) => (
                  <div key={i} className="bg-white p-8 rounded-[32px] border border-black/5 flex items-center gap-8 hover:shadow-2xl hover:scale-[1.01] transition-all cursor-pointer group shadow-sm">
                    <div className="text-primary font-black serif-font text-3xl w-20 flex-shrink-0">{item.year}</div>
                    <div className="size-14 bg-bg-cream rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-primary text-xl mb-1">{item.event}</p>
                      <p className="text-sm text-gray-400 font-medium">{item.clinic}</p>
                    </div>
                    <span className="material-symbols-outlined text-gray-200 group-hover:text-primary transition-colors text-3xl">chevron_right</span>
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
