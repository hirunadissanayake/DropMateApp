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

export const setupFcmListeners = () => {
  const messaging = getMessaging();

  // Foreground message handling
  const unsubscribeOnMessage = onMessage(messaging, async remoteMessage => {
    console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
    
    // Show a beautiful in-app banner (Toast) when app is open
    if (remoteMessage.notification) {
      Toast.show({
        type: 'info',
        text1: remoteMessage.notification.title || 'New Notification',
        text2: remoteMessage.notification.body || '',
        onPress: () => {
          Toast.hide();
          navigate('Notifications');
        },
        visibilityTime: 4000,
        autoHide: true,
        topOffset: 50,
      });
    }
  });

  // Background/Quit state message handling
  onNotificationOpenedApp(messaging, remoteMessage => {
    console.log(
      'Notification caused app to open from background state:',
      remoteMessage.notification,
    );
    if (remoteMessage.data) {
        navigate('Notifications');
    }
  });

  // Check if the app was opened from a quit state
  getInitialNotification(messaging)
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log(
          'Notification caused app to open from quit state:',
          remoteMessage.notification,
        );
        // Handle initial notification
      }
    });

  return unsubscribeOnMessage;
};
