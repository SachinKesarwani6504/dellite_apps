import tokens from '@/utils/theme.tokens.json';

type GradientTuple = readonly [string, string, ...string[]];

export const theme = {
  colors: tokens.colors,
  gradients: {
    app: tokens.gradients.app as unknown as GradientTuple,
    hero: tokens.gradients.hero as unknown as GradientTuple,
    cta: tokens.gradients.cta as unknown as GradientTuple,
  },
};

export const palette = tokens.palette;

export const uiColors = {
  text: tokens.ui.text,
  surface: tokens.ui.surface,
  shadow: tokens.ui.shadow,
  toast: tokens.ui.toast,
  refresh: {
    lightSpinner: tokens.colors.primary,
    darkSpinner: tokens.colors.accent,
    lightTrack: tokens.colors.surfaceSoft,
    darkTrack: tokens.palette.dark.card,
  },
  onboarding: {
    loader: tokens.colors.primary,
    status: tokens.colors.primary,
  },
};
