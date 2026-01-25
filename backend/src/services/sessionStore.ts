import { mockSessions, Session, Message } from '../data/mockSessions.js';

// In-memory store for sessions
class SessionStore {
  private sessions: Map<number, Session>;

  constructor() {
    this.sessions = new Map();
    // Initialize with mock data
    mockSessions.forEach(session => {
      this.sessions.set(session.id, { ...session });
    });
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.id - a.id);
  }

  getSession(id: number): Session | undefined {
    return this.sessions.get(id);
  }

  createSession(title: string = 'New Conversation'): Session {
    const newId = Math.max(...Array.from(this.sessions.keys()), 0) + 1;
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const newSession: Session = {
      id: newId,
      title,
      date: 'Today',
      status: 'active',
      messages: []
    };
    
    this.sessions.set(newId, newSession);
    return newSession;
  }

  addMessage(sessionId: number, message: Message) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages.push(message);
      // Update status if needed, or date
    }
  }
}

export const sessionStore = new SessionStore();
