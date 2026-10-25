import { io, Socket } from 'socket.io-client';
import { BASE_URL } from '../utils/endPoints';
import { useAnnouncementStore } from '../store/announcementStore';
import { useSupportStore } from '../store/supportStore';
import { useAuthStore } from '../store/authStore';
import { closeParcelRequest } from './parcelRequestLifecycle';
import Toast from 'react-native-toast-message';

class SocketService {
  private userId: string | null = null;
  private socket: Socket | null = null;

  connect(userId?: string) {
    if (userId) {
      this.userId = userId;
    }

    if (this.socket) {
      if (this.userId && this.socket.connected) {
        this.joinUserRoom(this.userId);
      }
      return;
    }

    this.socket = io(BASE_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to Socket');
      if (this.userId) {
        this.joinUserRoom(this.userId);
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

    this.socket.on('support_history', (data: any) => {
      if (data.messages && Array.isArray(data.messages)) {
        if (data.page === 1) {
          useSupportStore.getState().setMessages(data.messages);
        } else {
          useSupportStore.getState().addOlderMessages(data.messages);
        }
        useSupportStore.getState().setHasMore(data.hasMore ?? false);
      } else if (Array.isArray(data)) {
        // Fallback for old version
        useSupportStore.getState().setMessages(data);
      }
    });

    this.socket.on('user_status_updated', (updatedUser: any) => {
      const prevUser = useAuthStore.getState().user;
      useAuthStore.getState().setUser(updatedUser);

      // If user is suddenly blocked
      if (!prevUser?.isBlocked && updatedUser.isBlocked) {
        Toast.show({
          type: 'error',
          text1: 'Account Restricted 🚫',
          text2: updatedUser.blockReason || 'Your account has been restricted.',
          visibilityTime: 5000,
        });
      }

      console.log('User status updated via socket:', updatedUser.isBlocked);
    });

    this.socket.on('wallet_update', (data: { walletBalance?: number, balance?: number, message?: string }) => {
      // Accept both field names for compatibility
      const newBalance = data.walletBalance ?? data.balance ?? 0;
      const prevUser = useAuthStore.getState().user;
      if (prevUser) {
        // Update the local user balance immediately
        useAuthStore.getState().setUser({ ...prevUser, walletBalance: newBalance });

        Toast.show({
          type: newBalance >= 0 ? 'success' : 'info',
          text1: 'Wallet Updated 💰',
          text2: data.message || `New Balance: LKR ${newBalance.toFixed(2)}`,
        });

        // ✅ Full server-sync: ensures AppNavigator Wallet Guard re-evaluates block status
        useAuthStore.getState().refreshUser();
      }
    });

    this.socket.on('payout_status_updated', (data: { status: string, amount: number }) => {
      Toast.show({
        type: data.status === 'COMPLETED' ? 'success' : 'info',
        text1: 'Payout Update 💸',
        text2: `Your payout of LKR ${data.amount} is ${data.status.toLowerCase()}.`,
      });
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

    this.socket.on('request_cancelled', ({matchId}: {matchId: string}) => {
      closeParcelRequest(matchId);
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
    } else {
      console.warn('Socket not connected, cannot send message');
      // Attempt to reconnect if needed
      this.connect(data.userId);
      // Wait a bit and try once more
      setTimeout(() => {
        if (this.socket?.connected) {
          this.socket.emit('send_support_message', data);
        }
      }, 2000);
    }
  }

  getSupportHistory(userId: string, page: number = 1, limit: number = 20) {
    if (this.socket?.connected) {
      this.socket.emit('get_support_history', { userId, page, limit });
    } else {
      console.warn('Socket not connected, cannot fetch history');
      this.connect(userId);
      setTimeout(() => {
        if (this.socket?.connected) {
          this.socket.emit('get_support_history', { userId, page, limit });
        }
      }, 2000);
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
