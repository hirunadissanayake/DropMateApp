import { create } from 'zustand';

export interface SupportMessage {
  id: string;
  userId: string;
  isAdmin: boolean;
  senderName?: string;
  message: string;
  createdAt: string;
}

interface SupportState {
  messages: SupportMessage[];
  unreadCount: number;
  setMessages: (messages: SupportMessage[]) => void;
  addMessage: (message: SupportMessage) => void;
  clearUnread: () => void;
  incrementUnread: () => void;
}

export const useSupportStore = create<SupportState>((set) => ({
  messages: [],
  unreadCount: 0,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => {
    // Prevent duplicate messages
    if (state.messages.some(msg => msg.id === message.id)) {
      return state;
    }
    return { messages: [...state.messages, message] };
  }),
  clearUnread: () => set({ unreadCount: 0 }),
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
}));
