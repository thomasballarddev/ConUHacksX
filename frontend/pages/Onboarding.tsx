import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import healthImage from '../assets/health.jpg';
import demoProfileData from '../assets/demoProfile.json';
import { useAuth } from '../contexts/AuthContext';
import { saveUserProfile } from '../src/firestore';

interface OnboardingProps {
  onComplete: () => void;
}

interface UserProfile {
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
  };
  physicalStats: {
    height: string;
    weight: string;
  };
  bloodType: string;
  allergies: string[];
  medicalConditions: {
    conditions: string[];
    notes: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMMON_ALLERGIES = ['Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Penicillin', 'Sulfa', 'Latex', 'Dust Mites', 'Pollen', 'Pet Dander'];
const COMMON_CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Arthritis', 'Depression', 'Anxiety', 'ADHD', 'Epilepsy', 'Thyroid Disorder'];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAutofillToast, setShowAutofillToast] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile>({
    personalInfo: { fullName: '', dateOfBirth: '', gender: '' },
    physicalStats: { height: '', weight: '' },
    bloodType: '',
    allergies: [],
    medicalConditions: { conditions: [], notes: '' },
    emergencyContact: { name: '', relationship: '', phone: '' }
  });

  const [customAllergy, setCustomAllergy] = useState('');

  const totalSteps = 6;
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  // Shift+A autofill handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        autofillCurrentStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  const autofillCurrentStep = () => {
    const demo = demoProfileData as UserProfile;
    
    switch (currentStep) {
      case 0:
        setProfile(prev => ({ ...prev, personalInfo: demo.personalInfo }));
        break;
      case 1:
        setProfile(prev => ({ ...prev, physicalStats: demo.physicalStats }));
        break;
      case 2:
        setProfile(prev => ({ ...prev, bloodType: demo.bloodType }));
        break;
      case 3:
        setProfile(prev => ({ ...prev, allergies: demo.allergies }));
        break;
      case 4:
        setProfile(prev => ({ ...prev, medicalConditions: demo.medicalConditions }));
        break;
      case 5:
        setProfile(prev => ({ ...prev, emergencyContact: demo.emergencyContact }));
        break;
    }
    
    // Show toast notification
    setShowAutofillToast(true);
    setTimeout(() => setShowAutofillToast(false), 2000);
  };

  const stepTitles = [
    { icon: 'person', title: 'Personal Information', subtitle: 'Let\'s start with the basics' },
    { icon: 'straighten', title: 'Physical Stats', subtitle: 'Help us understand your body' },
    { icon: 'bloodtype', title: 'Blood Type', subtitle: 'Select your blood type' },
    { icon: 'warning', title: 'Allergies', subtitle: 'Tell us about any allergies' },
    { icon: 'medical_information', title: 'Medical History', subtitle: 'Any existing conditions?' },
    { icon: 'emergency', title: 'Emergency Contact', subtitle: 'Someone we can reach in emergencies' }
  ];

  const handleNext = () => {
    if (isAnimating) return;
    if (currentStep < totalSteps - 1) {
      setDirection('next');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handlePrev = () => {
    if (isAnimating) return;
    if (currentStep > 0) {
      setDirection('prev');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleComplete = async () => {
    setShowConfetti(true);

    console.log('[Onboarding] handleComplete called. User:', user?.uid || 'NULL');
    console.log('[Onboarding] Profile data:', JSON.stringify(profile, null, 2));

    // Save profile to Firestore
    if (user) {
      try {
        console.log('[Onboarding] Attempting to save profile for user:', user.uid);
        await saveUserProfile(user.uid, {
          ...profile,
          createdAt: new Date().toISOString()
        });
        console.log('[Onboarding] ✅ Profile saved to Firestore successfully!');
        console.log('[Onboarding] Check Firestore at: users/' + user.uid + '/profile/data');
      } catch (error) {
        console.error('[Onboarding] ❌ Failed to save profile to Firestore:', error);
        // Show error to user but don't block navigation
        alert('Warning: Failed to save your profile. Please try updating it later in settings.');
      }
    } else {
      console.error('[Onboarding] ❌ Cannot save - user is null! Check AuthProvider.');
      alert('Warning: Not signed in. Please sign in and complete onboarding again.');
    }

    setTimeout(() => {
      onComplete();
      navigate('/chat');
    }, 2000);
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !profile.allergies.includes(customAllergy.trim())) {
      setProfile(prev => ({
        ...prev,
        allergies: [...prev.allergies, customAllergy.trim()]
      }));
      setCustomAllergy('');
    }
  };

  const toggleAllergy = (allergy: string) => {
    setProfile(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy]
    }));
  };

  const toggleCondition = (condition: string) => {
    setProfile(prev => ({
      ...prev,
      medicalConditions: {
        ...prev.medicalConditions,
        conditions: prev.medicalConditions.conditions.includes(condition)
          ? prev.medicalConditions.conditions.filter(c => c !== condition)
          : [...prev.medicalConditions.conditions, condition]
      }
    }));
  };

  const getAnimationClass = () => {
    if (!isAnimating) return 'animate-slideIn';
    return direction === 'next' ? 'animate-slideOutLeft' : 'animate-slideOutRight';
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
              <input
                className="w-full px-5 py-4 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all text-primary placeholder:text-gray-300 text-[15px]"
                placeholder="Enter your full name"
                value={profile.personalInfo.fullName}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  personalInfo: { ...prev.personalInfo, fullName: e.target.value }
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">Date of Birth</label>
              <input
                type="date"
                className="w-full px-5 py-4 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all text-primary text-[15px]"
                value={profile.personalInfo.dateOfBirth}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  personalInfo: { ...prev.personalInfo, dateOfBirth: e.target.value }
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">Gender</label>
              <div className="grid grid-cols-3 gap-3">
                {['Male', 'Female', 'Other'].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setProfile(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, gender }
                    }))}
                    className={`py-4 rounded-2xl font-bold text-sm transition-all ${
                      profile.personalInfo.gender === gender
                        ? 'bg-primary text-white shadow-lg scale-[1.02]'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">Height</label>
              <div className="flex gap-3">
                <input
                  className="flex-1 px-5 py-4 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all text-primary placeholder:text-gray-300 text-[15px]"
                  placeholder="e.g., 5'11"
                  value={profile.physicalStats.height}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    physicalStats: { ...prev.physicalStats, height: e.target.value }
                  }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">Weight (lbs)</label>
              <input
                type="number"
                className="w-full px-5 py-4 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all text-primary placeholder:text-gray-300 text-[15px]"
                placeholder="Enter your weight"
                value={profile.physicalStats.weight}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  physicalStats: { ...prev.physicalStats, weight: e.target.value }
                }))}
              />
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-500">info</span>
              <p className="text-sm text-blue-700">Your physical stats help us provide more accurate health recommendations.</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-3">
              {BLOOD_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setProfile(prev => ({ ...prev, bloodType: type }))}
                  className={`py-6 rounded-2xl font-black text-xl transition-all transform hover:scale-105 ${
                    profile.bloodType === type
                      ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-105'
                      : 'bg-white text-primary border-2 border-gray-100 hover:border-red-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setProfile(prev => ({ ...prev, bloodType: 'Unknown' }))}
              className={`w-full py-4 rounded-2xl font-bold text-sm transition-all ${
                profile.bloodType === 'Unknown'
                  ? 'bg-gray-200 text-primary'
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              I don't know my blood type
            </button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                className="flex-1 px-4 py-3 rounded-xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all text-primary placeholder:text-gray-300 text-sm"
                placeholder="Add custom allergy..."
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomAllergy()}
              />
              <button
                type="button"
                onClick={addCustomAllergy}
                className="px-4 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-black transition-all"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {COMMON_ALLERGIES.map((allergy) => (
                <button
                  key={allergy}
                  type="button"
                  onClick={() => toggleAllergy(allergy)}
                  className={`px-4 py-2.5 rounded-full font-bold text-xs transition-all ${
                    profile.allergies.includes(allergy)
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-red-300'
                  }`}
                >
                  {profile.allergies.includes(allergy) && (
                    <span className="material-symbols-outlined text-sm mr-1 align-middle">check</span>
                  )}
                  {allergy}
                </button>
              ))}
              {profile.allergies.filter(a => !COMMON_ALLERGIES.includes(a)).map((allergy) => (
                <button
                  key={allergy}
                  type="button"
                  onClick={() => toggleAllergy(allergy)}
                  className="px-4 py-2.5 rounded-full font-bold text-xs bg-red-500 text-white shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-sm mr-1 align-middle">check</span>
                  {allergy}
                </button>
              ))}
            </div>
            {profile.allergies.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">No allergies selected - tap to add</p>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
              {COMMON_CONDITIONS.map((condition) => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => toggleCondition(condition)}
                  className={`px-4 py-3 rounded-xl font-bold text-xs text-left transition-all flex items-center gap-2 ${
                    profile.medicalConditions.conditions.includes(condition)
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-primary'
                  }`}
                >
                  <span className={`material-symbols-outlined text-sm ${
                    profile.medicalConditions.conditions.includes(condition) ? 'opacity-100' : 'opacity-0'
                  }`}>check_circle</span>
                  {condition}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">Additional Notes</label>
              <textarea
                className="w-full px-4 py-3 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all text-primary placeholder:text-gray-300 text-sm resize-none"
                placeholder="Any other conditions or notes for your doctor..."
                rows={3}
                value={profile.medicalConditions.notes}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  medicalConditions: { ...prev.medicalConditions, notes: e.target.value }
                }))}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">Contact Name</label>
              <input
                className="w-full px-5 py-4 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all text-primary placeholder:text-gray-300 text-[15px]"
                placeholder="Full name of your emergency contact"
                value={profile.emergencyContact.name}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">Relationship</label>
              <div className="grid grid-cols-3 gap-2">
                {['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'].map((rel) => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => setProfile(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, relationship: rel }
                    }))}
                    className={`py-3 rounded-xl font-bold text-xs transition-all ${
                      profile.emergencyContact.relationship === rel
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {rel}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">Phone Number</label>
              <input
                type="tel"
                className="w-full px-5 py-4 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-primary transition-all text-primary placeholder:text-gray-300 text-[15px]"
                placeholder="(555) 123-4567"
                value={profile.emergencyContact.phone}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                }))}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex relative overflow-hidden">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][Math.floor(Math.random() * 6)],
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
              }}
            />
          ))}
        </div>
      )}

      {/* Autofill Toast */}
      {showAutofillToast && (
        <div className="fixed top-6 right-6 z-50 animate-slideIn">
          <div className="bg-primary text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-green-400">auto_fix_high</span>
            <span className="font-bold text-sm">Demo data autofilled!</span>
            <span className="text-xs text-white/60 ml-2">Shift+A</span>
          </div>
        </div>
      )}

      {/* Left: Image Section */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/30 z-10"></div>
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
            "Tell us about yourself so we can better care for you."
          </p>
        </div>
      </div>

      {/* Right: Onboarding Cards */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-12 relative bg-bg-cream">
        {/* Progress Bar */}
        <div className="absolute top-8 left-8 right-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-xs font-bold text-primary">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-primary to-gray-700 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Card Container */}
        <div className="w-full max-w-[480px] mt-16">
          <div className={`bg-white p-8 md:p-10 rounded-[40px] shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-black/5 ${getAnimationClass()}`}>
            {/* Card Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-bg-cream mb-5 animate-bounceIn">
                <span className="material-symbols-outlined text-primary text-3xl">{stepTitles[currentStep].icon}</span>
              </div>
              <h1 className="serif-font text-3xl text-primary mb-2 leading-tight">{stepTitles[currentStep].title}</h1>
              <p className="text-gray-500 text-[15px]">{stepTitles[currentStep].subtitle}</p>
            </div>

            {/* Step Content */}
            <div className="min-h-[280px]">
              {renderStep()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex-1 bg-gray-100 text-primary font-bold py-4 rounded-full hover:bg-gray-200 transition-all text-[15px] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Back
                </button>
              )}
              {currentStep < totalSteps - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex-1 bg-primary text-white font-bold py-4 rounded-full hover:bg-black transition-all text-[15px] shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                >
                  Continue
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-full hover:shadow-xl hover:scale-[1.02] transition-all text-[15px] shadow-lg shadow-green-200 flex items-center justify-center gap-2 animate-pulse-subtle"
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Complete Setup
                </button>
              )}
            </div>
          </div>

          {/* Skip Option */}
          <button
            onClick={() => { onComplete(); navigate('/chat'); }}
            className="w-full mt-6 text-center text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(60px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutLeft {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-60px); opacity: 0; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(60px); opacity: 0; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .animate-slideIn { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slideOutLeft { animation: slideOutLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slideOutRight { animation: slideOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-bounceIn { animation: bounceIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-confetti { animation: confetti 3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pulse-subtle { animation: pulse-subtle 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Onboarding;
