
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../contexts/LocationContext';

import healthImage from '../assets/health.jpg';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { requestLocation, isLoading } = useLocation();
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRequestingLocation(true);
    
    // Request location permission
    await requestLocation();
    
    setIsRequestingLocation(false);
    onLogin();
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-white flex relative overflow-hidden">
      {/* Left: Image Section */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20 z-10"></div>
        <img 
          src={healthImage} 
          alt="Healthy Lifestyle" 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-12 left-12 z-20 text-white max-w-md">
          <div className="flex items-center space-x-2 mb-6">
             <span className="serif-font text-3xl font-semibold">Health.me</span>
          </div>
          <p className="serif-font text-4xl mb-4 leading-tight">
            "Your health journey encompasses mind, body, and spirit."
          </p>

        </div>
      </div>


      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-12 relative bg-bg-cream">
        <div className="w-full max-w-[440px]">
          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-black/5">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-bg-cream mb-6">
                <span className="material-symbols-outlined text-primary text-3xl">medical_services</span>
              </div>
              <h1 className="serif-font text-4xl text-primary mb-3 leading-tight">Welcome back</h1>
              <p className="text-gray-500 text-[15px]">Sign in to manage your health and appointments.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1" htmlFor="email">Email Address</label>
                <input 
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all text-primary placeholder:text-gray-300 text-[15px]" 
                  id="email" 
                  placeholder="name@example.com" 
                  type="email" 
                  defaultValue="demo@health.me"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                   <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400" htmlFor="password">Password</label>
                   <a href="#" className="text-[11px] font-bold text-gray-500 hover:text-primary">Forgot?</a>
                </div>
                <div className="relative">
                  <input 
                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all text-primary placeholder:text-gray-300 text-[15px]" 
                    id="password" 
                    placeholder="••••••••" 
                    type="password"
                    defaultValue="password"
                    required
                  />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary">
                    <span className="material-symbols-outlined text-lg">visibility</span>
                  </button>
                </div>
              </div>
              <button 
                className="w-full bg-primary text-white font-bold py-4 rounded-full hover:bg-black transition-all transform active:scale-[0.99] mt-2 text-[15px] shadow-lg shadow-black/10 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2" 
                type="submit"
                disabled={isRequestingLocation}
              >
                {isRequestingLocation ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Getting your location...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-[13px] text-gray-500">
              Don't have an account? <a href="#/signup" className="font-bold text-primary hover:underline">Sign up</a>
            </p>
          </div>

          <footer className="py-8 text-center w-full space-y-6">
            <p className="serif-font text-gray-400 italic text-lg px-4 opacity-80">
              "Health is everything. Don't settle."
            </p>
            <div className="flex justify-center gap-6 text-gray-300">
               <span className="material-symbols-outlined text-xl">verified_user</span>
               <span className="material-symbols-outlined text-xl">shield</span>
               <span className="material-symbols-outlined text-xl">info</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;
