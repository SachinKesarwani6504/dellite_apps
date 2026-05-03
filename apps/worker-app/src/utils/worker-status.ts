import { theme } from '@/utils/theme';

function toTitleCase(value: string): string {
  return value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

export function resolveStatusTone(status?: string) {
  const normalized = String(status ?? '').trim().toUpperCase();
  if (normalized === 'APPROVED') {
    return { label: 'Approved', color: theme.colors.positive, icon: 'checkmark-circle-outline' as const };
  }
  if (normalized === 'REJECTED') {
    return { label: 'Rejected', color: theme.colors.negative, icon: 'close-circle-outline' as const };
  }
  if (normalized === 'PENDING_APPROVAL' || normalized === 'PENDING') {
    return { label: 'Pending Approval', color: theme.colors.caution, icon: 'time-outline' as const };
  }
  return {
    label: normalized ? toTitleCase(normalized.replace(/_/g, ' ')) : 'Status',
    color: theme.colors.primary,
    icon: 'information-circle-outline' as const,
  };
}

export function normalizeStatusLabel(value: unknown) {
  if (typeof value !== 'string' || value.trim().length === 0) return 'PENDING';
  return value.trim().replace(/_/g, ' ');
}

export function statusColor(status: string) {
  const normalized = status.trim().toUpperCase();
  if (normalized === 'APPROVED') return theme.colors.positive;
  if (normalized === 'REJECTED') return theme.colors.negative;
  return theme.colors.caution;
}

export function formatStatusTimestamp(createdAt?: string) {
  if (!createdAt) return '';
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
