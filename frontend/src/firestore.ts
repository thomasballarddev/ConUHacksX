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
    
    // Update chat session's updatedAt (and title only if not already set)
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);
    const existingTitle = chatDoc.exists() ? chatDoc.data().title : null;
    
    // Only set title on first user message (when title is "New Conversation" or empty)
    const shouldSetTitle = message.role === 'user' && 
      (!existingTitle || existingTitle === 'New Conversation');
    
    await setDoc(chatRef, { 
      updatedAt: serverTimestamp(),
      ...(shouldSetTitle && { title: message.text.slice(0, 50) })
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
 * Always creates a new chat on login for a fresh start
 */
export const getOrCreateActiveChat = async (userId: string): Promise<string> => {
  const activeChatRef = doc(db, 'users', userId, 'activeChat', 'current');
  
  // Always create a new chat session on login
  const chatId = await createChatSession(userId);
  await setDoc(activeChatRef, { chatId });
  return chatId;
};

/**
 * Subscribe to user's chat sessions (for sidebar)
 */
export const subscribeToChatSessions = (
  userId: string,
  callback: (sessions: ChatSession[]) => void
): (() => void) => {
  const chatsRef = collection(db, 'users', userId, 'chats');
  const q = query(chatsRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const sessions: ChatSession[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        title: data.title || 'New Conversation',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });
    callback(sessions);
  });
};

/**
 * Get the current active chat ID for a user
 */
export const getActiveChatId = async (userId: string): Promise<string | null> => {
  const activeChatRef = doc(db, 'users', userId, 'activeChat', 'current');
  const activeChat = await getDoc(activeChatRef);

  if (activeChat.exists() && activeChat.data().chatId) {
    return activeChat.data().chatId;
  }
  return null;
};

/**
 * Set the active chat ID for a user
 */
export const setActiveChatId = async (userId: string, chatId: string): Promise<void> => {
  const activeChatRef = doc(db, 'users', userId, 'activeChat', 'current');
  await setDoc(activeChatRef, { chatId });
};

// =====================
// USER PROFILE FUNCTIONS
// =====================

export interface UserProfile {
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
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

    const dataToSave = {
      ...profileData,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString()
    };

    console.log('[Firestore] About to write to:', profileRef.path);
    console.log('[Firestore] Data to save:', JSON.stringify(dataToSave, null, 2));

    await setDoc(profileRef, dataToSave, { merge: true });

    console.log('[Firestore] setDoc completed. Verifying write...');

    // Verify the write was successful by reading it back
    const verifySnap = await getDoc(profileRef);
    if (verifySnap.exists()) {
      console.log('[Firestore]  Verification successful! Data exists in Firestore');
      console.log('[Firestore] Saved data:', verifySnap.data());
    } else {
      console.error('[Firestore]  Verification FAILED! Document does not exist after write');
      throw new Error('Profile write failed - document not found after save');
    }
  } catch (error) {
    console.error('[Firestore] Error saving user profile:', error);
    console.error('[Firestore] Error details:', JSON.stringify(error, null, 2));
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
