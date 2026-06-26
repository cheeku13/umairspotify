/**
 * Runtime permission helper for Android storage access.
 * Handles the different permission models across Android versions:
 * - Android 13+ (API 33+): READ_MEDIA_AUDIO
 * - Android 10-12 (API 29-32): READ_EXTERNAL_STORAGE
 * - Android 9 and below: READ_EXTERNAL_STORAGE + WRITE_EXTERNAL_STORAGE
 */
import { PermissionsAndroid, Platform } from 'react-native';

export async function requestStoragePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // iOS doesn't need runtime storage permission for app-scoped files
  }

  const apiLevel = parseInt(Platform.Version as string, 10);

  try {
    // Android 13+ — use granular media permission
    if (apiLevel >= 33) {
      const granted = await PermissionsAndroid.request(
        'android.permission.READ_MEDIA_AUDIO' as any,
        {
          title: 'Music Access Permission',
          message: 'Harmony Player needs access to your music files to build your library.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    // Android 10-12
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'Harmony Player needs access to your storage to read music files.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('[HarmonyPlayer] Permission request error:', err);
    return false;
  }
}

/**
 * Check if storage permission is already granted without prompting.
 */
export async function hasStoragePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const apiLevel = parseInt(Platform.Version as string, 10);

  if (apiLevel >= 33) {
    const result = await PermissionsAndroid.check('android.permission.READ_MEDIA_AUDIO' as any);
    return result;
  }

  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
}
