import type { AuthUser } from '@/types/auth';

function coerceToString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function resolveWorkerIdFromAuthUser(
  user: AuthUser | null | undefined,
  me?: Record<string, unknown> | null,
) {
  const links = (me?.links as Record<string, unknown> | undefined) ?? undefined;
  const workerFromLinks = (links?.worker as Record<string, unknown> | undefined) ?? undefined;
  const roleLink = (me?.roleLink as Record<string, unknown> | undefined) ?? undefined;
  const workerLink = (user?.workerLink as Record<string, unknown> | undefined) ?? undefined;
  const currentStatus = (workerLink?.currentStatus as Record<string, unknown> | undefined) ?? undefined;

  // For RTDB live-location we must prefer worker entity id, not user id.
  return coerceToString(workerFromLinks?.id)
    ?? coerceToString(workerFromLinks?.workerId)
    ?? coerceToString(workerFromLinks?.worker_id)
    ?? coerceToString(roleLink?.id)
    ?? coerceToString(roleLink?.workerId)
    ?? coerceToString(roleLink?.worker_id)
    ?? coerceToString(workerLink?.id)
    ?? coerceToString(workerLink?.workerId)
    ?? coerceToString(workerLink?.worker_id)
    ?? coerceToString(currentStatus?.workerId)
    ?? coerceToString(currentStatus?.worker_id);
}
