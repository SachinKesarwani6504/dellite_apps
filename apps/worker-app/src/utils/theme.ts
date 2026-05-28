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
  status: tokens.ui.status,
  map: tokens.ui.map,
  live: tokens.ui.live,
  mapPin: tokens.ui.mapPin,
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

export const statusToneColors = {
  success: { light: uiColors.status.successLight, dark: uiColors.status.successDark, text: uiColors.status.successText },
  danger: { light: uiColors.status.dangerLight, dark: uiColors.status.dangerDark, text: uiColors.status.dangerText },
  warning: { light: uiColors.status.warningLight, dark: uiColors.status.warningDark, text: uiColors.status.warningText },
  info: { light: uiColors.status.infoLight, dark: uiColors.status.infoDark, text: uiColors.status.infoText },
  neutral: { light: uiColors.status.neutralLight, dark: uiColors.status.neutralDark, text: uiColors.status.neutralText },
} as const;

export const workerStatusBadgeToneMap = {
  ONGOING: 'success',
  COMPLETED: 'info',
  CANCELLED: 'danger',
  PENDING: 'warning',
  NEW_JOB_REQUEST: 'warning',
  VIEWED: 'info',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'danger',
} as const;

export const liveTrackingToneMap = {
  success: 'success',
  warning: 'warning',
  neutral: 'neutral',
  offline: 'danger',
} as const;

export function getStatusToneColors(tone: keyof typeof statusToneColors, isDark: boolean) {
  const colors = statusToneColors[tone];
  return {
    background: isDark ? colors.dark : colors.light,
    text: colors.text,
    icon: colors.text,
  };
}

export function getWorkerStatusBadgeColors(status: string, isDark: boolean) {
  const tone = workerStatusBadgeToneMap[status as keyof typeof workerStatusBadgeToneMap] ?? 'neutral';
  return getStatusToneColors(tone, isDark);
}

export function getLiveTrackingToneColors(tone: keyof typeof liveTrackingToneMap, isDark: boolean) {
  return getStatusToneColors(liveTrackingToneMap[tone], isDark);
}
