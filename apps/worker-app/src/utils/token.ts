export function toBearerToken(value: string): string {
  const trimmed = value.trim();
  return trimmed.toLowerCase().startsWith('bearer ') ? trimmed : `Bearer ${trimmed}`;
}

export function stripBearerPrefix(value: string): string {
  return value.trim().replace(/^Bearer\s+/i, '');
}
