export const DEVICE_AUTH_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  UNLOCKED: 'unlocked',
  LOCKED: 'locked',
  UNAVAILABLE: 'unavailable',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type DeviceAuthStatus =
  (typeof DEVICE_AUTH_STATUS)[keyof typeof DEVICE_AUTH_STATUS];

export type DeviceAuthOptions = {
  promptMessage: string;
  promptSubtitle: string;
  cancelLabel: string;
};

export type DeviceAuthGuardResult = {
  status: DeviceAuthStatus;
  isUnlocked: boolean;
  authenticate: () => Promise<boolean>;
  lock: () => void;
};
