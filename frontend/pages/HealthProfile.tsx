import React, { useState } from 'react';
import cycling2 from '../assets/cycling2.jpg';

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

      <div className="max-w-6xl mx-auto">
        {activeView === 'profile' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            
            {/* Combined Metrics Section for Density */}
            <div className="bg-[#F5F2EA] rounded-[32px] p-8 shadow-sm border border-black/5">
              <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-primary opacity-80">
                <span className="material-symbols-outlined text-xl">bar_chart</span>
                Daily Health Summary
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Blood Type */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex items-center gap-4 hover:shadow-md transition-all">
                   <div className="size-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shrink-0">
                      <span className="material-symbols-outlined text-xl">bloodtype</span>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Blood Type</p>
                      <p className="text-lg font-black text-primary">A+</p>
                   </div>
                </div>

                {/* 2. Weight */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex items-center gap-4 hover:shadow-md transition-all">
                   <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                      <span className="material-symbols-outlined text-xl">scale</span>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Weight</p>
                      <div className="flex items-center gap-2">
                         <p className="text-lg font-black text-primary">164 lbs</p>
                         <span className="text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-bold">-2.1</span>
                      </div>
                   </div>
                </div>

                {/* 3. Height */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex items-center gap-4 hover:shadow-md transition-all">
                   <div className="size-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500 shrink-0">
                      <span className="material-symbols-outlined text-xl">straighten</span>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Height</p>
                      <p className="text-lg font-black text-primary">5'11"</p>
                   </div>
                </div>

                {/* 4. Age */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex items-center gap-4 hover:shadow-md transition-all">
                   <div className="size-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                      <span className="material-symbols-outlined text-xl">event</span>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Age</p>
                      <p className="text-lg font-black text-primary">32 yrs</p>
                   </div>
                </div>

                {/* 5. Heart Rate (Moved here from Vitals) */}
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

                {/* 6. SpO2 (Moved here from Vitals) */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex items-center gap-4 hover:shadow-md transition-all">
                   <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                      <span className="material-symbols-outlined text-xl">air</span>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SpO2</p>
                      <p className="text-lg font-black text-primary">98 <span className="text-xs text-gray-400/80 font-normal">%</span></p>
                   </div>
                </div>

                {/* 7. Blood Pressure (New/Mocked to fill grid) */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex items-center gap-4 hover:shadow-md transition-all">
                   <div className="size-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 shrink-0">
                      <span className="material-symbols-outlined text-xl">speed</span>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Blood Pressure</p>
                      <p className="text-lg font-black text-primary">120/80</p>
                   </div>
                </div>

                {/* 8. Temperature (New/Mocked to fill grid) */}
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

            {/* Middle Section: Allergies & Meds + Device Source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/60 backdrop-blur-sm p-6 rounded-[24px] border border-black/5 shadow-sm">
                  <h3 className="text-xs font-black text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500 text-sm bg-red-50 p-1 rounded-md">warning</span>
                    Known Allergies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Peanuts', 'Penicillin', 'Dust Mites'].map(item => (
                      <span key={item} className="px-3 py-1.5 bg-white text-red-700 text-xs font-bold rounded-lg border border-red-100 shadow-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm p-6 rounded-[24px] border border-black/5 shadow-sm flex flex-col justify-between">
                   <h3 className="text-xs font-black text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-500 text-sm bg-gray-50 p-1 rounded-md">watch</span>
                    Active Source
                  </h3>
                   <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-black/5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <img className="size-5 object-contain" src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple Health" />
                        <span className="text-xs font-bold text-primary">Apple Watch Ultra</span>
                      </div>
                      <span className="size-1.5 rounded-full bg-green-500 pulse-green"></span>
                   </div>
                </div>
            </div>

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
