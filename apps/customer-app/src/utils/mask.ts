export function maskPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) {
    return digits;
  }

  const visible = digits.slice(-3);
  const masked = '*'.repeat(Math.max(0, digits.length - 3));
  return `${masked}${visible}`;
}