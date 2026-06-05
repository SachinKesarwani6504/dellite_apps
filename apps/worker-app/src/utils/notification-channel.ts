import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const DEFAULT_NOTIFICATION_CHANNEL_ID = 'default-notifications-v2';
export const DEFAULT_NOTIFICATION_CHANNEL_NAME = 'Notifications';
export const DEFAULT_NOTIFICATION_SOUND = 'notifictaion.mp3';
export const DEFAULT_NOTIFICATION_SOUND_PATH = './src/assets/sounds/notifictaion.mp3';

let notificationChannelsConfigured = false;
let notificationChannelsSetupPromise: Promise<void> | null = null;

export async function setupNotificationChannels() {
  if (Platform.OS !== 'android') {
    return;
  }

  if (notificationChannelsConfigured) {
    return;
  }

  if (!notificationChannelsSetupPromise) {
    notificationChannelsSetupPromise = (async () => {
      await Notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL_ID, {
        name: DEFAULT_NOTIFICATION_CHANNEL_NAME,
        importance: Notifications.AndroidImportance.MAX,
        sound: DEFAULT_NOTIFICATION_SOUND,
        vibrationPattern: [0, 300, 200, 300],
      });
      notificationChannelsConfigured = true;
    })().finally(() => {
      notificationChannelsSetupPromise = null;
    });
  }

  await notificationChannelsSetupPromise;
}
