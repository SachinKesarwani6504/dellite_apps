export function formatEnumLabel(value?: string) {
  if (!value?.trim()) return '';
  return value.trim().replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

export function formatDurationChip(minutes: number) {
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours}h`;
  }
  return `${minutes}m`;
}
