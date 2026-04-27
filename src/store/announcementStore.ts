import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Announcement {
  id: string;
  senderName: string;
  message: string;
  type: 'BROADCAST';
  createdAt: string;
}

interface AnnouncementState {
  announcements: Announcement[];
  unreadCount: number;
  addAnnouncement: (announcement: Announcement) => void;
  updateAnnouncement: (announcement: Announcement) => void;
  deleteAnnouncement: (id: string) => void;
  setAnnouncements: (announcements: Announcement[]) => void;
  clearUnread: () => void;
}

export const useAnnouncementStore = create<AnnouncementState>()(
  persist(
    (set) => ({
      announcements: [],
      unreadCount: 0,
      addAnnouncement: (announcement) => set((state) => {
        const exists = state.announcements.some((a) => a.id === announcement.id);
        if (exists) return state;
        
        return {
          announcements: [announcement, ...state.announcements].slice(0, 50),
          unreadCount: state.unreadCount + 1,
        };
      }),
      updateAnnouncement: (announcement) => set((state) => ({
        announcements: state.announcements.map((a) => a.id === announcement.id ? announcement : a),
      })),
      deleteAnnouncement: (id) => set((state) => ({
        announcements: state.announcements.filter((a) => a.id !== id),
      })),
      setAnnouncements: (announcements) => set({ announcements }),
      clearUnread: () => set({ unreadCount: 0 }),
    }),
    {
      name: 'announcement-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
