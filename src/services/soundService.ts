import Sound from 'react-native-sound';

// Enable playback in silence mode (iOS)
Sound.setCategory('Playback');

let alertSound: Sound | null = null;
let isPlaying = false;

/**
 * Initializes the sound object globally.
 * By keeping this outside the component lifecycle, we avoid native crashes
 * during component unmount/navigation.
 */
export const initSound = () => {
  if (alertSound) return;

  alertSound = new Sound('request_alert.mp3', Sound.MAIN_BUNDLE, (error) => {
    if (error) {
      console.log('[SoundService] Failed to load sound:', error);
      return;
    }
    console.log('[SoundService] Sound loaded successfully');
    alertSound?.setVolume(1.0);
    alertSound?.setNumberOfLoops(-1); // Infinite loop until stopped
  });
};

/**
 * Plays the alert sound if it's loaded and not already playing.
 */
export const playAlertSound = () => {
  if (!alertSound || isPlaying) return;

  try {
    isPlaying = true;
    alertSound.play((success) => {
      if (!success) {
        console.log('[SoundService] Sound playback failed');
        isPlaying = false;
      }
    });
  } catch (error) {
    console.log('[SoundService] Error playing sound:', error);
    isPlaying = false;
  }
};

/**
 * Stops the alert sound safely.
 */
export const stopAlertSound = () => {
  if (!alertSound || !isPlaying) return;

  try {
    alertSound.stop(() => {
      isPlaying = false;
    });
  } catch (error) {
    console.log('[SoundService] Error stopping sound:', error);
    isPlaying = false;
  }
};

/**
 * Cleanup function for complete app shutdown (optional)
 */
export const releaseSound = () => {
  if (alertSound) {
    alertSound.release();
    alertSound = null;
    isPlaying = false;
  }
};
