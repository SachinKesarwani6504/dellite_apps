import type { DateTimeFieldMode } from '@/types/component-types';

export function parseDateTimeFieldValue(value: string, mode: DateTimeFieldMode) {
  if (mode === 'date') {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  const [hour = '09', minute = '00'] = value.split(':');
  const next = new Date();
  next.setHours(Number(hour), Number(minute), 0, 0);
  return Number.isNaN(next.getTime()) ? new Date() : next;
}

export function formatDateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function formatTimeValue(date: Date) {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

export function formatDateTimeFieldDisplayValue(value: string, mode: DateTimeFieldMode) {
  if (!value.trim()) return '';

  if (mode === 'date') {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(parsed);
  }

  const parsed = parseDateTimeFieldValue(value, 'time');
  return new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(parsed);
}
