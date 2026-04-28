import { io, Socket } from 'socket.io-client';
import { BASE_URL } from '../utils/endPoints';
import { useAnnouncementStore } from '../store/announcementStore';
import { useSupportStore } from '../store/supportStore';
import { useAuthStore } from '../store/authStore';
import Toast from 'react-native-toast-message';

class SocketService {
  private socket: Socket | null = null;

  connect(userId?: string) {
    if (this.socket) {
      if (userId && this.socket.connected) {
        this.joinUserRoom(userId);
      } else if (userId) {
        // If socket exists but not connected yet, we can attach a one-time listener or rely on the existing connect listener
        // The existing connect listener in the constructor/init will handle joining the room once connected.
      }
      return;
    }

    this.socket = io(BASE_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to Socket');
      if (userId) {
        this.joinUserRoom(userId);
      }
    });

    this.socket.on('global_message', (message: any) => {
      if (message.type === 'BROADCAST') {
        useAnnouncementStore.getState().addAnnouncement(message);
        
        Toast.show({
          type: 'info',
          text1: 'New Announcement 📢',
          text2: message.message,
          visibilityTime: 6000,
          position: 'top',
        });
      }
    });

    this.socket.on('support_message', (message: any) => {
      useSupportStore.getState().addMessage(message);
      
      if (message.isAdmin) {
        // Only toast if it's from admin
        Toast.show({
          type: 'success',
          text1: 'Support Response 💬',
          text2: message.message,
          visibilityTime: 4000,
          position: 'top',
        });
      }
    });

    this.socket.on('support_history', (history: any[]) => {
      useSupportStore.getState().setMessages(history);
    });
    
    this.socket.on('user_status_updated', (updatedUser: any) => {
      useAuthStore.getState().setUser(updatedUser);
      console.log('User status updated via socket:', updatedUser.isBlocked);
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
      console.log('Disconnected from Socket');
    });
  }

  joinUserRoom(userId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join', userId);
      console.log(`Joined personal room: ${userId}`);
    }
  }

  sendSupportMessage(data: { userId: string, message: string, isAdmin: boolean, senderName?: string }) {
    if (this.socket?.connected) {
      this.socket.emit('send_support_message', data);
    }
  }

  getSupportHistory(userId: string) {
    if (this.socket?.connected) {
      this.socket.emit('get_support_history', userId);
    }
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
