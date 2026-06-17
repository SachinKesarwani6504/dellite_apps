import { createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';

const notificationSound = require('@/assets/sounds/notifictaion.mp3');

let notificationPlayer: ReturnType<typeof createAudioPlayer> | null = null;
let audioModeReady = false;
let playQueue: Promise<void> = Promise.resolve();

async function ensureAudioMode() {
  if (audioModeReady) {
    return;
  }

  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
    shouldPlayInBackground: false,
  });
  audioModeReady = true;
}

async function waitForPlayerLoad(player: ReturnType<typeof createAudioPlayer>, attempts = 12) {
  for (let index = 0; index < attempts; index += 1) {
    if (player.isLoaded) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

async function getNotificationPlayer() {
  if (!notificationPlayer) {
    notificationPlayer = createAudioPlayer(notificationSound, { downloadFirst: true });
    notificationPlayer.volume = 1;
    await waitForPlayerLoad(notificationPlayer);
  }
  return notificationPlayer;
}

export async function preloadInAppNotificationSound() {
  try {
    await ensureAudioMode();
    await setIsAudioActiveAsync(true);
    await getNotificationPlayer();
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[notification-sound][worker] preload-failed', error);
    }
  }
}

export async function playInAppNotificationSound() {
  playQueue = playQueue.then(async () => {
    try {
      await ensureAudioMode();
      await setIsAudioActiveAsync(true);
      const player = await getNotificationPlayer();

      if (player.playing) {
        player.pause();
      }

      await player.seekTo(0);
      player.play();
    } catch (error) {
      audioModeReady = false;
      notificationPlayer = null;
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[notification-sound][worker] play-failed', error);
      }
    }
  });

  await playQueue;
}
