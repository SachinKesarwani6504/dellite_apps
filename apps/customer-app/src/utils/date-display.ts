type DisplayDateOptions = {
  fallback?: string;
  timeZone?: string;
};

type DisplayDateTimeOptions = DisplayDateOptions & {
  timeZone?: string;
};

function parseDisplayDateValue(value: string | number | Date | null | undefined): Date | null {
  if (value == null) {
    return null;
  }

  const normalized = typeof value === 'string' ? value.trim() : value;
  if (typeof normalized === 'string' && !normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayDateParts(date: Date, timeZone?: string) {
  const day = new Intl.DateTimeFormat('en-GB', { day: '2-digit', timeZone }).format(date);
  const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone }).format(date);
  const year = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone }).format(date);
  return `${day} ${month} ${year}`;
}

function formatDisplayTime(date: Date, timeZone?: string) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
  }).format(date);
}

export function formatDisplayDate(
  value: string | number | Date | null | undefined,
  options?: DisplayDateOptions,
): string {
  const fallback = options?.fallback ?? '--';
  const parsed = parseDisplayDateValue(value);
  if (!parsed) {
    return fallback;
  }

  return formatDisplayDateParts(parsed, options?.timeZone);
}

export function formatDisplayDateTime(
  value: string | number | Date | null | undefined,
  options?: DisplayDateTimeOptions,
): string {
  const fallback = options?.fallback ?? '--';
  const parsed = parseDisplayDateValue(value);
  if (!parsed) {
    return fallback;
  }

  const dateLabel = formatDisplayDateParts(parsed, options?.timeZone);
  const timeLabel = formatDisplayTime(parsed, options?.timeZone);
  return `${dateLabel}, ${timeLabel}`;
}
