import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Timestamp;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Save a message to Firestore
 */
export const saveMessage = async (
  userId: string,
  chatId: string,
  message: { role: 'user' | 'model'; text: string }
): Promise<void> => {
  try {
    const messagesRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      ...message,
      timestamp: serverTimestamp()
    });
    
    // Update chat session's updatedAt
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    await setDoc(chatRef, { 
      updatedAt: serverTimestamp(),
      title: message.role === 'user' ? message.text.slice(0, 50) : undefined 
    }, { merge: true });
  } catch (error) {
    console.error('Error saving message to Firestore:', error);
  }
};

/**
 * Create a new chat session
 */
export const createChatSession = async (userId: string): Promise<string> => {
  const chatsRef = collection(db, 'users', userId, 'chats');
  const newChat = await addDoc(chatsRef, {
    title: 'New Conversation',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return newChat.id;
};

/**
 * Subscribe to messages in a chat session
 */
export const subscribeToMessages = (
  userId: string,
  chatId: string,
  callback: (messages: ChatMessage[]) => void
): (() => void) => {
  const messagesRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((doc) => {
      messages.push(doc.data() as ChatMessage);
    });
    callback(messages);
  });
};

/**
 * Get or create the current active chat for a user
 */
export const getOrCreateActiveChat = async (userId: string): Promise<string> => {
  // For simplicity, we'll use a fixed "active" chat ID
  // In production, you might want to track the active chat differently
  const activeChatRef = doc(db, 'users', userId, 'activeChat', 'current');
  const activeChat = await getDoc(activeChatRef);
  
  if (activeChat.exists() && activeChat.data().chatId) {
    return activeChat.data().chatId;
  }
  
  // Create new chat session
  const chatId = await createChatSession(userId);
  await setDoc(activeChatRef, { chatId });
  return chatId;
};

// =====================
// USER PROFILE FUNCTIONS
// =====================

export interface UserProfile {
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
  };
  physicalStats: {
    height: string;
    weight: string;
  };
  medicalConditions: {
    conditions: string[];
    notes: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const profileRef = doc(db, 'users', userId, 'profile', 'data');
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      return profileSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Save user profile to Firestore
 */
export const saveUserProfile = async (
  userId: string,
  profileData: Partial<UserProfile>
): Promise<void> => {
  try {
    const profileRef = doc(db, 'users', userId, 'profile', 'data');
    await setDoc(profileRef, {
      ...profileData,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('[Firestore] User profile saved successfully');
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

/**
 * Check if user has completed onboarding
 */
export const hasCompletedOnboarding = async (userId: string): Promise<boolean> => {
  const profile = await getUserProfile(userId);
  return profile?.onboardingCompleted === true;
};
