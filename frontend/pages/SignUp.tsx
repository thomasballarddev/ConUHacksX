
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import healthImage from '../assets/health.jpg';

interface SignUpProps {
  onSignUp: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSignUp }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate signup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsSubmitting(false);
    onSignUp();
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-white flex relative overflow-hidden">
      {/* Left: Image Section */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden">
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
            "Your health journey starts here."
          </p>

        </div>
      </div>

      {/* Right: Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-12 relative bg-bg-cream">


        <div className="w-full max-w-[440px]">
          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-black/5">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-soft-cream mb-6">
                <span className="material-symbols-outlined text-primary text-3xl">person_add</span>
              </div>
              <h1 className="serif-font text-4xl text-primary mb-3 leading-tight">Create account</h1>
              <p className="text-gray-500 text-[15px]">Start managing your health journey today.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1" htmlFor="firstName">First Name</label>
                  <input 
                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all text-primary placeholder:text-gray-300 text-[15px]" 
                    id="firstName" 
                    placeholder="Alex" 
                    type="text" 
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1" htmlFor="lastName">Last Name</label>
                  <input 
                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all text-primary placeholder:text-gray-300 text-[15px]" 
                    id="lastName" 
                    placeholder="McGregor" 
                    type="text" 
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1" htmlFor="email">Email Address</label>
                <input 
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all text-primary placeholder:text-gray-300 text-[15px]" 
                  id="email" 
                  placeholder="name@example.com" 
                  type="email" 
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1" htmlFor="password">Password</label>
                <div className="relative">
                  <input 
                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all text-primary placeholder:text-gray-300 text-[15px]" 
                    id="password" 
                    placeholder="Min. 8 characters" 
                    type="password"
                    required
                  />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary">
                    <span className="material-symbols-outlined text-lg">visibility</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1" htmlFor="confirmPassword">Confirm Password</label>
                <input 
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all text-primary placeholder:text-gray-300 text-[15px]" 
                  id="confirmPassword" 
                  placeholder="••••••••" 
                  type="password"
                  required
                />
              </div>

              <div className="flex items-start gap-3 py-2">
                <input 
                  type="checkbox" 
                  id="terms" 
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  required
                />
                <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed">
                  I agree to the <a href="#" className="text-primary font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-primary font-bold hover:underline">Privacy Policy</a>
                </label>
              </div>

              <button 
                className="w-full bg-primary text-white font-bold py-4 rounded-full hover:bg-black transition-all transform active:scale-[0.99] text-[15px] shadow-lg shadow-black/10 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-[13px] text-gray-500">
              Already have an account? <a href="#/login" className="font-bold text-primary hover:underline">Sign in</a>
            </p>
          </div>
          
          <div className="mt-12 text-center">
             <div className="flex justify-center gap-6 text-gray-300 mb-4">
                <span className="material-symbols-outlined text-xl">verified_user</span>
                <span className="material-symbols-outlined text-xl">shield</span>
                <span className="material-symbols-outlined text-xl">info</span>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
