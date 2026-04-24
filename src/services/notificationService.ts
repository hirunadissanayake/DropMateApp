import axios from 'axios';
import { ENDPOINTS } from '../utils/endPoints';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  metadata: any;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}

export const getNotifications = async (token: string): Promise<NotificationResponse> => {
  try {
    const response = await axios.get(ENDPOINTS.NOTIFICATIONS.GET_ALL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};

export const markAsRead = async (token: string, id: string) => {
  try {
    const response = await axios.patch(ENDPOINTS.NOTIFICATIONS.MARK_READ(id), {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};

export const markAllAsRead = async (token: string) => {
  try {
    const response = await axios.patch(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};

export const deleteNotification = async (token: string, id: string) => {
  try {
    const response = await axios.delete(ENDPOINTS.NOTIFICATIONS.DELETE(id), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};

export const updateFcmToken = async (token: string, fcmToken: string) => {
  try {
    const response = await axios.patch(ENDPOINTS.AUTH.UPDATE_FCM_TOKEN, { fcmToken }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};
