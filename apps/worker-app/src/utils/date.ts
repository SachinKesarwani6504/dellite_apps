export function formatMemberSince(createdAt?: string): string {
  if (!createdAt || !createdAt.trim()) {
    return 'Member since --';
  }

  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return 'Member since --';
  }

  const month = parsed.toLocaleString('en-US', { month: 'short' });
  const year = parsed.getFullYear();
  return `Member since ${month} ${year}`;
}
