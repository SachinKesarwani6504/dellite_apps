export function formatEnumLabel(value?: string) {
  if (!value?.trim()) return '';
  return value.trim().replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

export function formatDurationChip(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return '';
  }

  const roundedMinutes = Math.round(minutes);
  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${remainingMinutes}m`;
}

export function formatDurationSummaryLabel(minutes?: number | null) {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    return null;
  }

  const roundedMinutes = Math.round(minutes);
  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;
  const hourLabel = hours === 1 ? '1 hr' : `${hours} hrs`;
  const minuteLabel = remainingMinutes === 1 ? '1 min' : `${remainingMinutes} min`;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hourLabel} ${minuteLabel}`;
  }

  if (hours > 0) {
    return hourLabel;
  }

  return minuteLabel;
}

export function formatEstimatedDurationLabel(minutes?: number | null) {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    return null;
  }

  return formatDurationChip(minutes);
}
