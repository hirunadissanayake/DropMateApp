import { create } from 'zustand';
import * as notificationService from '../services/notificationService';

interface NotificationState {
  unreadCount: number;
  loading: boolean;
  setUnreadCount: (count: number) => void;
  fetchUnreadCount: (token: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  loading: false,
  setUnreadCount: (count) => set({ unreadCount: count }),
  fetchUnreadCount: async (token) => {
    if (!token) return;
    set({ loading: true });
    try {
      const data = await notificationService.getNotifications(token);
      set({ unreadCount: data.unreadCount, loading: false });
    } catch (error) {
      console.error('Fetch unread count error:', error);
      set({ loading: false });
    }
  },
}));
