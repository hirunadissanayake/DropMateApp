import { Platform, PermissionsAndroid, Linking } from 'react-native';
import Toast from 'react-native-toast-message';

/**
 * Requests gallery/photo library read permission on Android.
 * On Android 13+ (API 33), requests READ_MEDIA_IMAGES.
 * On Android 12 and below, requests READ_EXTERNAL_STORAGE.
 * On iOS, react-native-image-picker handles permissions internally.
 *
 * @returns true if permission is granted, false otherwise.
 */
export const requestGalleryPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  const apiLevel = Platform.Version as number;

  /**
   * On Android 13+ (API 33+), we don't need to request READ_EXTERNAL_STORAGE.
   * Instead, apps should use the System Photo Picker (which react-native-image-picker does).
   * The Photo Picker does NOT require any manifest permissions.
   * If we try to request READ_MEDIA_IMAGES without it being in the manifest, it will fail.
   */
  if (apiLevel >= 33) {
    return true;
  }

  // Android 12 and below still need READ_EXTERNAL_STORAGE
  const permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

  const alreadyGranted = await PermissionsAndroid.check(permission);
  if (alreadyGranted) return true;

  const result = await PermissionsAndroid.request(permission, {
    title: 'Gallery Access Required',
    message: 'DropMate needs access to your gallery to upload images.',
    buttonNeutral: 'Later',
    buttonNegative: 'Deny',
    buttonPositive: 'Allow Access',
  });

  if (result === PermissionsAndroid.RESULTS.GRANTED) return true;

  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    Toast.show({
      type: 'error',
      text1: 'Permission Required',
      text2: 'Gallery access is disabled. Please enable it in Settings.',
      onPress: () => Linking.openSettings(),
    });
  }

  return false;
};
