
import React, { useState } from 'react';

const Records: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');

  const records = [
    { name: 'Blood Panel - Annual Checkup', date: 'Jan 12, 2024', clinic: 'City Health Center', type: 'Lab Result', icon: 'biotech', color: 'bg-blue-50 text-blue-500' },
    { name: 'Radiology Report - Lower Back', date: 'Dec 05, 2023', clinic: 'St. Mary Diagnostics', type: 'Imaging', icon: 'visibility', color: 'bg-purple-50 text-purple-500' },
    { name: 'Prescription: Lisinopril 10mg', date: 'Nov 20, 2023', clinic: 'City Health Center', type: 'Prescription', icon: 'medication', color: 'bg-orange-50 text-orange-500' },
    { name: 'Discharge Summary - Appendectomy', date: 'Aug 14, 2023', clinic: 'SF General Hospital', type: 'Hospital Record', icon: 'description', color: 'bg-gray-50 text-gray-500' },
    { name: 'Immunization Record - 2023', date: 'Feb 10, 2023', clinic: 'Family Health Plus', type: 'Vaccination', icon: 'vaccines', color: 'bg-green-50 text-green-500' },
  ];

  return (
    <div className="px-8 pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="serif-font text-5xl text-primary mb-3">Medical Records</h1>
          <p className="text-gray-500 text-lg">Centralized access to all your clinical documents and results.</p>
        </div>

        <div className="flex items-center gap-6 mb-10 overflow-x-auto pb-2 no-scrollbar">
          {['All', 'Lab Results', 'Imaging', 'Prescriptions', 'Clinical Notes'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === tab ? 'bg-primary text-white' : 'bg-white border border-black/5 text-gray-500 hover:bg-gray-50'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* AI Insight Card */}
          <div className="lg:col-span-3 bg-primary text-white p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-white/70">auto_awesome</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Health.me AI Summary</span>
              </div>
              <h2 className="serif-font text-3xl mb-6 max-w-2xl leading-tight">Your overall health indicators are stable, but we should monitor your HDL cholesterol in the next panel.</h2>
              <button className="bg-white text-primary py-3 px-8 rounded-2xl font-bold text-sm hover:bg-bg-cream transition-all">
                Full AI Health Report
              </button>
            </div>
          </div>

          {/* Records Grid */}
          {records.map((record, i) => (
            <div key={i} className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
              <div className={`size-12 ${record.color} rounded-2xl flex items-center justify-center mb-6`}>
                <span className="material-symbols-outlined">{record.icon}</span>
              </div>
              <div className="flex-1 mb-6">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{record.type}</div>
                <h3 className="font-bold text-lg text-primary mb-2 leading-tight group-hover:text-primary transition-colors">{record.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  <span>{record.date}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{record.clinic}</p>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-gray-50 text-primary py-2.5 px-4 rounded-xl text-[13px] font-bold hover:bg-black hover:text-white transition-all">
                  View
                </button>
                <button className="p-2.5 rounded-xl border border-black/5 text-gray-400 hover:text-primary hover:bg-gray-50 transition-all">
                  <span className="material-symbols-outlined text-lg">download</span>
                </button>
              </div>
            </div>
          ))}

          {/* Add Record Card */}
          <button className="bg-transparent border-2 border-dashed border-black/10 p-6 rounded-[28px] flex flex-col items-center justify-center gap-4 hover:border-primary/40 hover:bg-white transition-all group min-h-[240px]">
            <div className="size-14 rounded-full bg-black/5 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-3xl">add</span>
            </div>
            <p className="font-bold text-gray-400 group-hover:text-primary transition-all">Upload New Record</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Records;
