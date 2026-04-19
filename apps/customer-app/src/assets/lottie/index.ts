export const lottieRegistry = {
  dellitePrayagrajHeader: require('./dellite-prayagraj-header.json'),
} as const;

export type LottieName = keyof typeof lottieRegistry;
