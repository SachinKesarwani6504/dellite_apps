import type { BookingStatus } from '@/types/api';
import { StatusBadge } from '@/components/common/StatusBadge';

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <StatusBadge status={status} type="booking" showDot={false} />;
}
