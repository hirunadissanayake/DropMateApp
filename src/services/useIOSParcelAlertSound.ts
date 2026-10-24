import {useEffect} from 'react';
import {AppState, Platform} from 'react-native';
import {playAlertSound, stopAlertSound} from './soundService';

// On iOS a visible request can originate from a push, notification tap, or
// pending-request fetch. All three must ring while the app is active.
export const useIOSParcelAlertSound = (visible: boolean) => {
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const syncPlayback = (state: string | null) => {
      if (visible && state === 'active') {
        playAlertSound();
      } else {
        stopAlertSound();
      }
    };

    syncPlayback(AppState.currentState);
    const subscription = AppState.addEventListener('change', syncPlayback);
    return () => {
      subscription.remove();
      stopAlertSound();
    };
  }, [visible]);
};
