export const lottieRegistry = {
  // Add files here as you create assets in src/assets/lottie
  // exampleLoading: require('../assets/lottie/example-loading.json'),
} as const;

export type LottieName = keyof typeof lottieRegistry;
