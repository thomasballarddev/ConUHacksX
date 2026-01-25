
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';

import healthImage from '../assets/health.jpg';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { requestLocation, isLoading } = useLocation();
  const { signInWithGoogle, user } = useAuth();
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRequestingLocation(true);
    
    // Request location permission
    await requestLocation();
    
    setIsRequestingLocation(false);
    onLogin();
    navigate('/chat');
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      await requestLocation();
      onLogin();
      navigate('/onboarding'); // Redirect to onboarding for new users
    } catch (error) {
      console.error('Google sign-in failed:', error);
    } finally {
      setIsGoogleLoading(false);
    }
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

            {/* OR Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs font-bold text-gray-400 uppercase">or</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Google Sign-In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-black/10 rounded-full py-3.5 px-6 text-primary font-bold hover:bg-gray-50 hover:border-primary/30 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

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
