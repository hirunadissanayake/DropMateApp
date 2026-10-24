import Sound from 'react-native-sound';
import { Platform } from 'react-native';

// Enable playback in silence mode (iOS)
Sound.setCategory('Playback');

let alertSound: Sound | null = null;
let isPlaying = false;
let playbackRequested = false;

const playLoadedSound = () => {
  const sound = alertSound;
  if (!sound?.isLoaded() || !playbackRequested || isPlaying) return;

  try {
    if (Platform.OS === 'ios') {
      Sound.setCategory('Playback');
      Sound.setActive(true);
    }
    isPlaying = true;
    sound.play((success) => {
      if (alertSound !== sound) return;
      isPlaying = false;
      if (!success) console.log('[SoundService] Sound playback failed');
    });
  } catch (error) {
    isPlaying = false;
    console.log('[SoundService] Error playing sound:', error);
  }
};

/**
 * Initializes the sound object globally.
 * By keeping this outside the component lifecycle, we avoid native crashes
 * during component unmount/navigation.
 */
export const initSound = () => {
  if (alertSound) return;

  // RNSound on iOS uses NSURL URLWithString, which needs a file URL.
  const filename = Platform.OS === 'ios'
    ? encodeURI(`file://${Sound.MAIN_BUNDLE}/request_alert.mp3`)
    : 'request_alert.mp3';
  const sound = new Sound(filename, Platform.OS === 'ios' ? '' : Sound.MAIN_BUNDLE, (error) => {
    if (alertSound !== sound) {
      sound.release();
      return;
    }
    if (error) {
      console.log('[SoundService] Failed to load sound:', error);
      alertSound = null; // Allow the next request to retry loading.
      return;
    }
    console.log('[SoundService] Sound loaded successfully');
    sound.setVolume(1.0);
    sound.setNumberOfLoops(-1); // Infinite loop until stopped
    playLoadedSound();
  });
  alertSound = sound;
};

/**
 * Plays the alert sound if it's loaded and not already playing.
 */
export const playAlertSound = () => {
  playbackRequested = true;
  initSound();
  playLoadedSound();
};

/**
 * Stops the alert sound safely.
 */
export const stopAlertSound = () => {
  playbackRequested = false;
  if (!alertSound || !isPlaying) return;
  isPlaying = false;

  try {
    alertSound.stop();
  } catch (error) {
    console.log('[SoundService] Error stopping sound:', error);
    isPlaying = false;
  }
};

/**
 * Cleanup function for complete app shutdown (optional)
 */
export const releaseSound = () => {
  playbackRequested = false;
  if (alertSound) {
    alertSound.release();
    alertSound = null;
    isPlaying = false;
  }
};
