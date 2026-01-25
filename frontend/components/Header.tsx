
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();
  return (
    <header className="p-8 pb-0 flex justify-between items-center bg-transparent">
      <div className="flex items-center space-x-4">
        {/* Mobile menu space */}
      </div>
      <div className="flex items-center space-x-3">
        <button className="p-2.5 rounded-full hover:bg-black/5 transition-colors text-gray-400 hover:text-primary">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <div className="h-6 w-[1px] bg-black/5 mx-1"></div>
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
