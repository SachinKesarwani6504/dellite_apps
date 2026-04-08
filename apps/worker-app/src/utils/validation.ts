export function normalizePhoneNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

export function isValidPhoneNumber(value: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizePhoneNumber(value));
}

export function normalizeOtp(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}

export function isValidOtp(value: string): boolean {
  return /^\d{4}$/.test(normalizeOtp(value));
}

export function normalizePersonName(value: string): string {
  return value.replace(/\s+/g, ' ').trimStart();
}

export function isValidFirstName(value: string): boolean {
  return normalizePersonName(value).trim().length > 1;
}

export function isValidLastName(value: string): boolean {
  return normalizePersonName(value).trim().length > 0;
}

