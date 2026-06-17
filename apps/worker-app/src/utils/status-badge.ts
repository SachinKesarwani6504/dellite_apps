import type { StatusBadgeConfig, StatusBadgeType } from '@/types/status-badge';

const fallbackStatusBadgeConfig: StatusBadgeConfig = {
  label: 'Unknown',
  textColor: '#4B5563',
  bgColor: '#F9FAFB',
  borderColor: '#D1D5DB',
};

const bookingStatusBadgeConfig: Record<string, StatusBadgeConfig> = {
  CREATED: {
    label: 'Booking Created',
    textColor: '#374151',
    bgColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  SEARCHING: {
    label: 'Finding Partner',
    textColor: '#C2410C',
    bgColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  CONFIRMED: {
    label: 'Booking Confirmed',
    textColor: '#047857',
    bgColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  IN_PROGRESS: {
    label: 'Work in Progress',
    textColor: '#1D4ED8',
    bgColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  COMPLETED: {
    label: 'Completed',
    textColor: '#047857',
    bgColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  CANCELLED: {
    label: 'Cancelled',
    textColor: '#B91C1C',
    bgColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  EXPIRED: {
    label: 'Expired',
    textColor: '#6B7280',
    bgColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
};

const paymentStatusBadgeConfig: Record<string, StatusBadgeConfig> = {
  PENDING: {
    label: 'Payment Pending',
    textColor: '#B45309',
    bgColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  PAID: {
    label: 'Paid',
    textColor: '#047857',
    bgColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  FAILED: {
    label: 'Payment Failed',
    textColor: '#B91C1C',
    bgColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  REFUND_PENDING: {
    label: 'Refund Pending',
    textColor: '#B45309',
    bgColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  REFUNDED: {
    label: 'Refunded',
    textColor: '#0369A1',
    bgColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  CASH_COLLECTED: {
    label: 'Cash Collected',
    textColor: '#047857',
    bgColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
};

const inviteStatusBadgeConfig: Record<string, StatusBadgeConfig> = {
  NEW_JOB_REQUEST: {
    label: 'New Request',
    textColor: '#C2410C',
    bgColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  VIEWED: {
    label: 'Viewed',
    textColor: '#4B5563',
    bgColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  ACCEPTED: {
    label: 'Accepted',
    textColor: '#047857',
    bgColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  REJECTED: {
    label: 'Rejected',
    textColor: '#B91C1C',
    bgColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  EXPIRED: {
    label: 'Expired',
    textColor: '#6B7280',
    bgColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  CANCELLED: {
    label: 'Cancelled',
    textColor: '#B91C1C',
    bgColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
};

const statusBadgeConfigByType = {
  booking: bookingStatusBadgeConfig,
  payment: paymentStatusBadgeConfig,
  invite: inviteStatusBadgeConfig,
} as const;

export function formatStatusBadgeFallbackLabel(status: string | null | undefined) {
  if (!status?.trim()) return fallbackStatusBadgeConfig.label;
  return status
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function inferStatusBadgeType(status: string): StatusBadgeType {
  if (paymentStatusBadgeConfig[status]) return 'payment';
  if (inviteStatusBadgeConfig[status]) return 'invite';
  return 'booking';
}

export function getStatusBadgeConfig(status: string | null | undefined, type?: StatusBadgeType): StatusBadgeConfig {
  const normalizedStatus = status?.trim() ?? '';
  const resolvedType = type ?? inferStatusBadgeType(normalizedStatus);
  const mappedConfig = statusBadgeConfigByType[resolvedType][normalizedStatus];
  if (mappedConfig) return mappedConfig;
  return {
    ...fallbackStatusBadgeConfig,
    label: formatStatusBadgeFallbackLabel(normalizedStatus),
  };
}

export function getStatusBadgeTextColor(status: string | null | undefined, type?: StatusBadgeType) {
  return getStatusBadgeConfig(status, type).textColor;
}

export function getStatusTileIconName(status: string | null | undefined) {
  const normalizedStatus = status?.trim() ?? '';
  if (['CANCELLED', 'EXPIRED', 'FAILED', 'REJECTED'].includes(normalizedStatus)) return 'close';
  if (['CREATED', 'SEARCHING', 'PENDING', 'REFUND_PENDING', 'NEW_JOB_REQUEST', 'VIEWED'].includes(normalizedStatus)) {
    return 'time-outline';
  }
  return 'checkmark';
}
