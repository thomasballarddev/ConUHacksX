
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LocationProvider } from './contexts/LocationContext';
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

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return (
      <div className="h-screen flex overflow-hidden bg-bg-cream transition-colors duration-300">
        <Sidebar onLogout={() => setIsAuthenticated(false)} />
        <main className="flex-1 flex flex-col relative overflow-hidden bg-soft-cream">
          <Header />
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
    );
  };

  return (
    <LocationProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
          <Route path="/signup" element={<SignUp onSignUp={() => setIsAuthenticated(true)} />} />
          <Route path="/onboarding" element={
            isAuthenticated ? (
              <Onboarding onComplete={() => setHasCompletedOnboarding(true)} />
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
      </Router>
    </LocationProvider>
  );
};

export default App;

