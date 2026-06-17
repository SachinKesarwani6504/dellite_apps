import type { AuthUser } from '@/types/auth';

function coerceToString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function resolveCustomerIdFromAuthUser(user: AuthUser | null | undefined) {
  const roleLink = (user?.roleLink as Record<string, unknown> | undefined) ?? undefined;

  return coerceToString(roleLink?.id)
    ?? coerceToString(roleLink?.customerId)
    ?? coerceToString(roleLink?.customer_id)
    ?? coerceToString(user?.id);
}
