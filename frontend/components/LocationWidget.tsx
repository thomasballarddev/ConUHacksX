import React from 'react';

interface LocationWidgetProps {
  onClose?: () => void;
  onSelect?: () => void;
}

const LocationWidget: React.FC<LocationWidgetProps> = ({ onClose, onSelect }) => {
  return (
    <div className="h-full bg-soft-cream flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 w-full">
      <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white/50 backdrop-blur-sm flex-shrink-0">
        <div>
          <h2 className="serif-font text-3xl text-primary">Find Nearby Doctors</h2>
          <p className="text-gray-500 text-xs font-medium mt-1">Showing clinics within 5 miles</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="size-8 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Map Placeholder */}
        <div className="h-1/2 bg-gray-100 relative grayscale opacity-80 flex-shrink-0">
           <img src="https://picsum.photos/seed/sfmap/800/400" className="w-full h-full object-cover" alt="Map" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
             <div className="size-6 bg-primary rounded-full border-4 border-white shadow-2xl pulse-red"></div>
           </div>
        </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
           {[
             { name: 'City Health Center', dist: '0.8 miles', rate: '4.8', tags: ['GP', 'Urgent Care'] },
             { name: 'Prime Care Medical', dist: '1.2 miles', rate: '4.5', tags: ['Diagnostics'] },
             { name: 'St. Mary Diagnostics', dist: '2.4 miles', rate: '4.9', tags: ['Cardiology'] }
           ].map(clinic => (
             <div key={clinic.name} className="bg-white p-6 rounded-[32px] border border-black/5 hover:border-primary transition-all group cursor-pointer shadow-sm hover:shadow-md">
               <div className="flex justify-between items-start mb-3">
                 <h3 className="font-black text-xl text-primary leading-tight">{clinic.name}</h3>
                 <span className="text-xs font-bold text-gray-400 whitespace-nowrap ml-2 bg-gray-50 px-2 py-1 rounded-lg">{clinic.dist}</span>
               </div>
               <div className="flex items-center gap-1 text-orange-500 mb-4">
                 <span className="material-symbols-outlined text-[16px] fill-1">star</span>
                 <span className="text-sm font-black">{clinic.rate}</span>
               </div>
               <div className="flex flex-wrap gap-2 mb-5">
                 {clinic.tags.map(t => <span key={t} className="px-3 py-1.5 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-xl">{t}</span>)}
               </div>
               <button onClick={onSelect} className="w-full bg-primary text-white py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-black/5 hover:bg-black transition-all">
                 Select This Center
               </button>
             </div>
           ))}
      </div>
      </div>
    </div>
  );
};

export default LocationWidget;
