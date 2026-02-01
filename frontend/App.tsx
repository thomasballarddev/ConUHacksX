import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LocationProvider } from './contexts/LocationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { hasCompletedOnboarding } from './src/firestore';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Emergency from './pages/Emergency';
import Login from './pages/Login';
import HealthProfile from './pages/HealthProfile';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import SignUp from './pages/SignUp';
import Calendar from './pages/Calendar';
import Onboarding from './pages/Onboarding';

// Inner app component that can use auth context
const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Check onboarding status when user changes
  useEffect(() => {
    const checkOnboarding = async () => {
      if (user) {
        setCheckingOnboarding(true);
        const completed = await hasCompletedOnboarding(user.uid);
        setOnboardingComplete(completed);
        setCheckingOnboarding(false);
      } else {
        setOnboardingComplete(null);
        setCheckingOnboarding(false);
      }
    };

    if (!loading) {
      checkOnboarding();
    }
  }, [user, loading]);

  const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (loading || checkingOnboarding) {
      return (
        <div className="h-screen flex items-center justify-center bg-bg-cream">
          <span className="material-symbols-outlined animate-spin text-4xl text-gray-400">progress_activity</span>
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    // Redirect to onboarding if not completed
    if (onboardingComplete === false) {
      return <Navigate to="/onboarding" replace />;
    }

    return (
      <div className="h-screen flex overflow-hidden bg-bg-cream transition-colors duration-300">
        <Sidebar onLogout={() => {}} />
        <main className="flex-1 flex flex-col relative overflow-hidden bg-soft-cream">
          <Header />
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-cream">
        <span className="material-symbols-outlined animate-spin text-4xl text-gray-400">progress_activity</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/" replace /> : <Login onLogin={() => {}} />
      } />
      <Route path="/signup" element={
        user ? <Navigate to="/" replace /> : <SignUp onSignUp={() => {}} />
      } />
      <Route path="/onboarding" element={
        user ? (
          onboardingComplete ? (
            <Navigate to="/" replace />
          ) : (
            <Onboarding onComplete={() => setOnboardingComplete(true)} />
          )
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/chat" element={<ProtectedLayout><Chat /></ProtectedLayout>} />
      <Route path="/emergency" element={<ProtectedLayout><Emergency /></ProtectedLayout>} />
      <Route path="/profile" element={<ProtectedLayout><HealthProfile /></ProtectedLayout>} />
      <Route path="/calendar" element={<ProtectedLayout><Calendar /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LocationProvider>
        <Router>
          <AppRoutes />
        </Router>
      </LocationProvider>
    </AuthProvider>
  );
};

export default App;
