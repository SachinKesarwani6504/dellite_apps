import type { AuthMeResponse, CustomerBookingCounts } from '@/types/auth';

const DEFAULT_CUSTOMER_BOOKING_COUNTS: CustomerBookingCounts = {
  totalBookingsCount: 0,
  activeBookingsCount: 0,
  completedBookingsCount: 0,
};

function normalizeCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return 0;
}

export function normalizeCustomerBookingCounts(value: unknown): CustomerBookingCounts {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_CUSTOMER_BOOKING_COUNTS };
  }
  const raw = value as Record<string, unknown>;
  return {
    totalBookingsCount: normalizeCount(raw.totalBookingsCount),
    activeBookingsCount: normalizeCount(raw.activeBookingsCount),
    completedBookingsCount: normalizeCount(raw.completedBookingsCount),
  };
}

export function resolveCustomerBookingCountsFromMeResponse(me: AuthMeResponse): CustomerBookingCounts {
  return normalizeCustomerBookingCounts(me.bookingCounts ?? me.roleLink?.bookingCounts);
}

