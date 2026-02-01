import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToChatSessions, ChatSession, getActiveChatId } from '../src/firestore';

interface SidebarProps {
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const { user, signOut } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to chat sessions
    const unsubscribe = subscribeToChatSessions(user.uid, (chatSessions) => {
      setSessions(chatSessions);
    });

    // Get active chat ID
    getActiveChatId(user.uid).then(setActiveChatId);

    return () => unsubscribe();
  }, [user]);

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-black/5 flex flex-col bg-bg-cream">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <span className="serif-font text-2xl font-semibold text-primary">Health.me</span>
        </div>

        <NavLink
          to="/settings"
          className="flex items-center space-x-3 p-2 mb-8 rounded-xl hover:bg-black/5 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-800 font-bold overflow-hidden border border-black/5 shadow-sm">
            {user?.photoURL ? (
              <img
                alt={user.displayName || 'User'}
                className="w-full h-full object-cover"
                src={user.photoURL}
              />
            ) : (
              <span>{user?.displayName?.charAt(0) || 'U'}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">{user?.displayName || 'User'}</p>
            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold">Pro Member</p>
          </div>
        </NavLink>

        <nav className="space-y-1">
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isActive ? 'bg-white shadow-sm text-primary font-medium border border-black/5' : 'text-gray-600 hover:bg-black/5'}`
            }
          >
            <span className="material-symbols-outlined text-xl">chat_bubble</span>
            <span className="text-sm">AI Chat</span>
          </NavLink>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isActive ? 'bg-white shadow-sm text-primary font-medium border border-black/5' : 'text-gray-600 hover:bg-black/5'}`
            }
          >
            <span className="material-symbols-outlined text-xl">home</span>
            <span className="text-sm">Home</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isActive ? 'bg-white shadow-sm text-primary font-medium border border-black/5' : 'text-gray-600 hover:bg-black/5'}`
            }
          >
            <span className="material-symbols-outlined text-xl">person</span>
            <span className="text-sm">Health Profile</span>
          </NavLink>
        </nav>
      </div>

      <div className="mt-4 px-6 flex-1 overflow-y-auto custom-scrollbar">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-4 px-2">Recent Sessions</p>
        <div className="space-y-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-gray-400 px-2">No conversations yet</p>
          ) : (
            sessions.map((session) => (
              <NavLink
                key={session.id}
                to={`/chat?session=${session.id}`}
                className="block cursor-pointer group p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-95"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 group-hover:text-primary transition-colors truncate font-medium">
                    {session.title}
                  </p>
                  <span className={`size-2 rounded-full flex-shrink-0 ${
                    session.id === activeChatId ? 'bg-blue-500' : 'bg-green-500'
                  }`}></span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(session.updatedAt)}</p>
              </NavLink>
            ))
          )}
        </div>
      </div>

      <div className="p-6 border-t border-black/5 space-y-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-full flex items-center space-x-3 px-2 py-2 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isActive ? 'text-primary font-medium' : 'text-gray-500 hover:text-primary'}`
          }
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="text-sm font-medium">Settings</span>
        </NavLink>
        <button
          onClick={() => {
            signOut();
            onLogout?.();
          }}
          className="w-full flex items-center justify-center space-x-3 bg-white border border-black/5 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 py-3 rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-sm font-bold text-sm"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
