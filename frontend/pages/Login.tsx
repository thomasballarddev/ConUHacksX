
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
      <header className="fixed top-0 left-0 right-0 p-8 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="serif-font text-2xl font-semibold text-primary">Health.me</span>
        </div>
      </header>

      <div className="w-full max-w-[440px]">
        <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-black/5">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-bg-cream mb-6">
              <span className="material-symbols-outlined text-primary text-3xl">medical_services</span>
            </div>
            <h1 className="serif-font text-4xl text-primary mb-3 leading-tight">Welcome back</h1>
            <p className="text-gray-500 text-[15px]">Securely access your health profile and AI assistant.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1" htmlFor="email">Email Address</label>
              <input 
                className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all text-primary placeholder:text-gray-300 text-[15px]" 
                id="email" 
                placeholder="demo@health.me" 
                type="email" 
                defaultValue="demo@health.me"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1" htmlFor="password">Password</label>
              <input 
                className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all text-primary placeholder:text-gray-300 text-[15px]" 
                id="password" 
                placeholder="••••••••" 
                type="password"
                defaultValue="password"
                required
              />
            </div>
            <button 
              className="w-full bg-primary text-white font-bold py-4 rounded-full hover:bg-black transition-all transform active:scale-[0.99] mt-2 text-[15px] shadow-lg shadow-black/10" 
              type="submit"
            >
              Sign In
            </button>
          </form>

          <p className="mt-8 text-center text-[12px] text-gray-400">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      <footer className="py-12 text-center w-full mt-auto">
        <p className="serif-font text-gray-400 text-sm px-4">
          Trusted by over 50,000 users worldwide for secure health management.
        </p>
      </footer>
    </div>
  );
};

export default Login;
