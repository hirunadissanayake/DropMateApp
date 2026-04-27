import { io, Socket } from 'socket.io-client';
import { BASE_URL } from '../utils/endPoints';
import { useAnnouncementStore } from '../store/announcementStore';
import Toast from 'react-native-toast-message';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(BASE_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to Announcement Socket');
    });

    this.socket.on('global_message', (message: any) => {
      if (message.type === 'BROADCAST') {
        useAnnouncementStore.getState().addAnnouncement(message);
        
        // Show a visual toast in the app
        Toast.show({
          type: 'info',
          text1: 'New Announcement 📢',
          text2: message.message,
          visibilityTime: 6000,
          position: 'top',
        });
      }
    });

    this.socket.on('global_message_updated', (updatedMessage: any) => {
      if (updatedMessage.type === 'BROADCAST') {
        useAnnouncementStore.getState().updateAnnouncement(updatedMessage);
      }
    });

    this.socket.on('global_message_deleted', (id: string) => {
      useAnnouncementStore.getState().deleteAnnouncement(id);
    });

    this.socket.on('global_history', (history: any[]) => {
      const broadcasts = history.filter(m => m.type === 'BROADCAST');
      useAnnouncementStore.getState().setAnnouncements(broadcasts);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Announcement Socket');
    });
  }

  getHistory() {
    if (this.socket?.connected) {
      this.socket.emit('get_global_history');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
