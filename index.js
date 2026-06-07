/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { stopAlertSound, initSound } from './src/services/soundService';

// Initialize sound globally for both Main and Headless tasks
initSound();

// Register background handler
const messaging = getMessaging();
setBackgroundMessageHandler(messaging, async remoteMessage => {
    console.log('Message handled in the background!', JSON.stringify(remoteMessage));
    
    const type = remoteMessage.data?.type;

    // Stop alert sound if customer withdrew the request
    if (type === 'MATCH_CANCELLED' || type === 'MATCH_EXPIRED') {
        console.log('Background: Stopping alert sound due to cancellation/expiry');
        stopAlertSound();
    }
});

AppRegistry.registerComponent(appName, () => App);
