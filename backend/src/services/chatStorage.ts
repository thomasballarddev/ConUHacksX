import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Chat {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
}

interface Database {
  currentChatId: string | null;
  chats: Record<string, Chat>;
}

function readDb(): Database {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { currentChatId: null, chats: {} };
  }
}

function writeDb(db: Database): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

/**
 * Get or create the current active chat
 */
export function getCurrentChat(): Chat {
  const db = readDb();

  if (db.currentChatId && db.chats[db.currentChatId]) {
    return db.chats[db.currentChatId];
  }

  // Create new chat
  const chatId = `chat_${Date.now()}`;
  const newChat: Chat = {
    id: chatId,
    messages: [],
    createdAt: new Date().toISOString()
  };

  db.currentChatId = chatId;
  db.chats[chatId] = newChat;
  writeDb(db);

  console.log(`[ChatStorage] Created new chat: ${chatId}`);
  return newChat;
}

/**
 * Add a message to the current chat
 */
export function addMessage(role: 'user' | 'assistant', content: string): void {
  const db = readDb();
  const chat = getCurrentChat();

  const message: ChatMessage = {
    role,
    content,
    timestamp: new Date().toISOString()
  };

  db.chats[chat.id].messages.push(message);
  writeDb(db);

  console.log(`[ChatStorage] Added ${role} message to chat ${chat.id}. Total messages: ${db.chats[chat.id].messages.length}`);
}

/**
 * Get all messages from current chat
 */
export function getAllMessages(): ChatMessage[] {
  const chat = getCurrentChat();
  return chat.messages;
}

/**
 * Get conversation as formatted text for Gemini
 */
export function getConversationText(): string {
  const messages = getAllMessages();
  return messages
    .map(msg => `${msg.role === 'user' ? 'Patient' : 'Assistant'}: ${msg.content}`)
    .join('\n');
}

/**
 * Start a new chat (resets current)
 */
export function startNewChat(): Chat {
  const db = readDb();

  const chatId = `chat_${Date.now()}`;
  const newChat: Chat = {
    id: chatId,
    messages: [],
    createdAt: new Date().toISOString()
  };

  db.currentChatId = chatId;
  db.chats[chatId] = newChat;
  writeDb(db);

  console.log(`[ChatStorage] Started new chat: ${chatId}`);
  return newChat;
}

/**
 * Debug: log current state
 */
export function debugState(): void {
  const db = readDb();
  const chat = db.currentChatId ? db.chats[db.currentChatId] : null;
  console.log('[ChatStorage] ===== DB STATE =====');
  console.log(`[ChatStorage] Current chat ID: ${db.currentChatId}`);
  console.log(`[ChatStorage] Message count: ${chat?.messages.length || 0}`);
  if (chat?.messages.length) {
    chat.messages.forEach((msg, i) => {
      console.log(`  [${i}] ${msg.role}: ${msg.content.substring(0, 80)}${msg.content.length > 80 ? '...' : ''}`);
    });
  }
  console.log('[ChatStorage] ====================');
}
