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
  hasMore: boolean;
  setHasMore: (hasMore: boolean) => void;
  setMessages: (messages: SupportMessage[]) => void;
  addOlderMessages: (messages: SupportMessage[]) => void;
  addMessage: (message: SupportMessage) => void;
  clearUnread: () => void;
  incrementUnread: () => void;
}

export const useSupportStore = create<SupportState>((set) => ({
  messages: [],
  unreadCount: 0,
  hasMore: true,
  setHasMore: (hasMore) => set({ hasMore }),
  setMessages: (messages) => set({ messages }),
  addOlderMessages: (newMessages) => set((state) => {
    // Filter out duplicates
    const uniqueNew = newMessages.filter(
      msg => !state.messages.some(existing => existing.id === msg.id)
    );
    // Prepend to start (older messages go to top)
    return { messages: [...uniqueNew, ...state.messages] };
  }),
  addMessage: (message) => set((state) => {
    // Prevent duplicate messages
    if (state.messages.some(msg => msg.id === message.id)) {
      return state;
    }
    // Append to end (new messages go to bottom)
    return { messages: [...state.messages, message] };
  }),
  clearUnread: () => set({ unreadCount: 0 }),
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
}));
