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
  const workerLink = (user?.workerLink as Record<string, unknown> | undefined) ?? undefined;
  const currentStatus = (workerLink?.currentStatus as Record<string, unknown> | undefined) ?? undefined;

  return coerceToString(user?.id)
    ?? coerceToString((user as Record<string, unknown> | undefined)?.userId)
    ?? coerceToString((user as Record<string, unknown> | undefined)?.user_uuid)
    ?? coerceToString(workerFromLinks?.workerId)
    ?? coerceToString(workerFromLinks?.worker_id)
    ?? coerceToString(workerLink?.workerId)
    ?? coerceToString(workerLink?.worker_id)
    ?? coerceToString(currentStatus?.workerId)
    ?? coerceToString(currentStatus?.worker_id);
}
