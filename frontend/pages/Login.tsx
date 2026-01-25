
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Immediate authentication bypass as requested
    onLogin();
    // Direct move to the chat page
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-bg-cream flex flex-col items-center justify-center p-4">
      <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="flex items-center space-x-2">
           <span className="material-symbols-outlined text-primary text-2xl">favorite</span>
          <span className="serif-font text-2xl font-semibold text-primary">Health.me</span>
        </div>
        <div className="flex items-center gap-6">
           <span className="text-sm font-medium text-gray-500 cursor-pointer hover:text-primary transition-colors">Resources</span>
           <button className="px-5 py-2.5 rounded-full border border-black/10 text-sm font-bold hover:bg-black hover:text-white transition-all">
             Get the app
           </button>
        </div>
      </header>

      <div className="w-full max-w-[440px] mt-24">
        <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-black/5 mt-12">
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
              className="w-full bg-primary text-white font-bold py-4 rounded-full hover:bg-black transition-all transform active:scale-[0.99] mt-2 text-[15px] shadow-lg shadow-black/10" 
              type="submit"
            >
              Sign In
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-gray-500">
            Don't have an account? <a href="#" className="font-bold text-primary hover:underline">Sign up</a>
          </p>
        </div>
      </div>

      <footer className="py-12 text-center w-full mt-auto space-y-6">
        <p className="serif-font text-gray-400 italic text-lg px-4 opacity-80">
          "Health is everything. Don't settle."
        </p>
        <div className="flex justify-center gap-6 text-gray-300">
           <span className="material-symbols-outlined text-xl">verified_user</span>
           <span className="material-symbols-outlined text-xl">shield</span>
           <span className="material-symbols-outlined text-xl">info</span>
        </div>
        <p className="text-[10px] text-gray-300">Trusted by the well-being of 50,000+ organizations worldwide.</p>
      </footer>
    </div>
  );
};

export default Login;
