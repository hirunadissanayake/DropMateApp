import { 
  getMessaging, 
  requestPermission, 
  getToken, 
  onMessage, 
  onNotificationOpenedApp, 
  getInitialNotification,
  AuthorizationStatus 
} from '@react-native-firebase/messaging';
import { updateFcmToken } from './notificationService';
import { Platform } from 'react-native';

export const requestUserPermission = async () => {
  const messaging = getMessaging();
  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    return true;
  }
  return false;
};

export const getFcmToken = async (userToken: string) => {
  try {
    const messaging = getMessaging();
    const fcmToken = await getToken(messaging);
    if (fcmToken) {
      console.log('FCM Token:', fcmToken);
      await updateFcmToken(userToken, fcmToken);
      return fcmToken;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
  return null;
};

import { navigate } from '../navigation/navigationRef';

import Toast from 'react-native-toast-message';

// Callback registry for request alert modal trigger
let onDeliveryRequestCallback: ((data: any) => void) | null = null;

export const setDeliveryRequestListener = (callback: ((data: any) => void) | null) => {
  onDeliveryRequestCallback = callback;
};

import { useAnnouncementStore } from '../store/announcementStore';

export const setupFcmListeners = () => {
  const messaging = getMessaging();

  const handleBroadcast = (remoteMessage: any) => {
    if (remoteMessage.data?.type === 'BROADCAST') {
      useAnnouncementStore.getState().addAnnouncement({
        id: remoteMessage.data.id || String(Date.now()),
        message: remoteMessage.notification?.body || remoteMessage.data.message || '',
        senderName: remoteMessage.data.senderName || 'System Admin',
        type: 'BROADCAST',
        createdAt: new Date().toISOString(),
      });
      return true;
    }
    return false;
  };

  // Foreground message handling
  const unsubscribeOnMessage = onMessage(messaging, async remoteMessage => {
    console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));

    const isBroadcast = handleBroadcast(remoteMessage);
    const notifType = remoteMessage.data?.type as string | undefined;

    // If this is a delivery request → trigger the request alert modal
    if (notifType === 'DELIVERY_REQUEST' || notifType === 'match_request') {
      if (onDeliveryRequestCallback) {
        onDeliveryRequestCallback({ ...remoteMessage.data, origin: 'foreground' });
      }
      return; 
    }

    // Show a beautiful in-app banner (Toast) for all other notifications
    if (remoteMessage.notification) {
      Toast.show({
        type: 'info',
        text1: remoteMessage.notification.title || 'New Notification',
        text2: remoteMessage.notification.body || '',
        onPress: () => {
          Toast.hide();
          navigate(isBroadcast ? 'Announcements' : 'Notifications');
        },
        visibilityTime: 4000,
        autoHide: true,
        topOffset: 50,
      });
    }
  });

  // Background/Quit state message handling
  onNotificationOpenedApp(messaging, remoteMessage => {
    console.log('Notification caused app to open from background state:', remoteMessage.notification);
    
    const isBroadcast = handleBroadcast(remoteMessage);
    const notifType = remoteMessage.data?.type as string | undefined;

    if (notifType === 'DELIVERY_REQUEST' || notifType === 'match_request') {
      if (onDeliveryRequestCallback) {
        onDeliveryRequestCallback({ ...remoteMessage.data, origin: 'background' });
      }
      navigate('TravelerHome' as any);
    } else {
      navigate(isBroadcast ? 'Announcements' : 'Notifications');
    }
  });

  // Check if the app was opened from a quit state
  getInitialNotification(messaging)
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('Notification caused app to open from quit state:', remoteMessage.notification);
        
        const isBroadcast = handleBroadcast(remoteMessage);
        const notifType = remoteMessage.data?.type as string | undefined;

        if (notifType === 'DELIVERY_REQUEST' || notifType === 'match_request') {
          navigate('TravelerHome' as any);
        } else {
          navigate(isBroadcast ? 'Announcements' : 'Notifications');
        }
      }
    });

  return unsubscribeOnMessage;
};
