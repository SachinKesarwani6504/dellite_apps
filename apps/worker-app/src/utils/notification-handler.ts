import * as Notifications from 'expo-notifications';

let notificationHandlerConfigured = false;

export function setupNotificationHandler() {
  if (notificationHandlerConfigured) {
    return;
  }

  notificationHandlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
