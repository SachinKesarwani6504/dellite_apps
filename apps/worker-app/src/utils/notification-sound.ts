import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const notificationSound = require('@/assets/sounds/notifictaion.mp3');

let notificationPlayer: ReturnType<typeof createAudioPlayer> | null = null;
let audioModeReady = false;

async function ensureAudioMode() {
  if (audioModeReady) return;
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
    shouldPlayInBackground: false,
  });
  audioModeReady = true;
}

export async function playInAppNotificationSound() {
  try {
    await ensureAudioMode();
    if (!notificationPlayer) {
      notificationPlayer = createAudioPlayer(notificationSound);
      notificationPlayer.volume = 1;
    }
    await notificationPlayer.seekTo(0);
    notificationPlayer.play();
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[notification-sound][worker] play-failed', error);
    }
  }
}
