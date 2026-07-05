import { useCallback, useMemo, useState } from 'react';
import {
  recordWorkerPaymentReceived,
  startWorkerBookingWithOtp,
  updateBookingInvite,
  updateWorkerAssignmentStatus,
} from '@/actions/workerActions';
import { apiPatch } from '@/actions/http/httpClient';
import { useApiGet } from '@/hooks/useApiGet';
import type { ApiEnvelope } from '@/types/api';
import { WORKER_JOB_INVITE_STATUS } from '@/types/booking';
import type {
  BookingDetailsResponse,
  BookingDetailsHistoryItem,
  BookingDetailsRole,
  BookingDetailsServiceLine,
  UpdateBookingPayload,
} from '@/types/booking-details';
import type { WorkerAssignmentStatusUpdate, WorkerPaymentReceivedMode } from '@/types/booking-actions';
import {
  BOOKING_DURATION_STEP_MINUTES,
  buildBookingDurationPatch,
  buildBookingQuantityPatch,
  getBookingDetailsPath,
  getBookingLineDurationMinutes,
  getBookingLineKey,
  getBookingLineQuantity,
} from '@/utils/booking-details';
import { APP_TEXT } from '@/utils/appText';
import { getErrorMessage } from '@/utils';
import { syncAppBadgeCountFromBackend } from '@/utils/appBadge';
import { showToast } from '@/utils/toast';

type InviteActionLoading = null | typeof WORKER_JOB_INVITE_STATUS.ACCEPTED | typeof WORKER_JOB_INVITE_STATUS.REJECTED;

export function useBookingDetailsController(
  bookingId: string,
  role: BookingDetailsRole,
  options?: {
    onInviteAccepted?: () => Promise<void> | void;
  },
) {
  const detailsPath = useMemo(() => getBookingDetailsPath(bookingId, role), [bookingId, role]);
  const {
    data,
    loading,
    error,
    isNotFound,
    refetch,
  } = useApiGet<BookingDetailsResponse>(detailsPath);
  const [updatingLineKey, setUpdatingLineKey] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [startOtp, setStartOtpState] = useState('');
  const [startOtpError, setStartOtpError] = useState<string | null>(null);
  const [startingJob, setStartingJob] = useState(false);
  const [inviteActionLoading, setInviteActionLoading] = useState<InviteActionLoading>(null);
  const [jobActionLoading, setJobActionLoading] = useState<string | null>(null);

  const normalizedDetails = useMemo(() => {
    if (!data) return null;
    const historyRaw = (data as { history?: unknown }).history;
    const history = Array.isArray(historyRaw)
      ? historyRaw
        .map((item): BookingDetailsHistoryItem | null => {
          if (!item || typeof item !== 'object') return null;
          const raw = item as Record<string, unknown>;
          const id = typeof raw.id === 'string' ? raw.id : null;
          const title = typeof raw.title === 'string' ? raw.title : null;
          const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : null;
          if (!id || !title || !createdAt) return null;
          return {
            id,
            title,
            description: typeof raw.description === 'string' ? raw.description : null,
            createdAt,
            metadata: raw.metadata && typeof raw.metadata === 'object'
              ? (raw.metadata as Record<string, unknown>)
              : null,
          };
        })
        .filter((item): item is BookingDetailsHistoryItem => Boolean(item))
      : [];
    return {
      ...data,
      history,
    };
  }, [data]);

  const patchBooking = useCallback(async (line: BookingDetailsServiceLine, payload: UpdateBookingPayload) => {
    const lineKey = getBookingLineKey(line);
    setUpdatingLineKey(lineKey);
    setUpdateError(null);
    try {
      await apiPatch<ApiEnvelope<BookingDetailsResponse>, UpdateBookingPayload>(
        `/booking/${encodeURIComponent(bookingId)}`,
        payload,
        { auth: true },
      );
      await refetch();
    } catch (patchError) {
      setUpdateError(getErrorMessage(patchError, 'Unable to update booking details.'));
    } finally {
      setUpdatingLineKey(null);
    }
  }, [bookingId, refetch]);

  const inviteId = useMemo(() => {
    const id = normalizedDetails?.invite?.id;
    return typeof id === 'string' && id.trim().length > 0 ? id.trim() : null;
  }, [normalizedDetails?.invite?.id]);

  const setStartOtp = useCallback((value: string) => {
    setStartOtpState(value);
    if (startOtpError) setStartOtpError(null);
  }, [startOtpError]);

  const acceptInvite = useCallback(async () => {
    if (!inviteId) {
      showToast('error', 'Invite id not found for this job.');
      return;
    }
    setInviteActionLoading(WORKER_JOB_INVITE_STATUS.ACCEPTED);
    try {
      await updateBookingInvite(inviteId, WORKER_JOB_INVITE_STATUS.ACCEPTED);
      if (options?.onInviteAccepted) {
        await options.onInviteAccepted();
      }
      try {
        await updateWorkerAssignmentStatus(bookingId, 'EN_ROUTE', {
          showSuccessToast: false,
          showErrorToast: false,
        });
      } catch (progressError) {
        showToast('info', getErrorMessage(progressError, APP_TEXT.jobs.acceptEnRouteSyncInfo));
      }
      void syncAppBadgeCountFromBackend(true);
      await refetch();
    } finally {
      setInviteActionLoading(null);
    }
  }, [bookingId, inviteId, options, refetch]);

  const rejectInvite = useCallback(async () => {
    if (!inviteId) {
      showToast('error', 'Invite id not found for this job.');
      return;
    }
    setInviteActionLoading(WORKER_JOB_INVITE_STATUS.REJECTED);
    try {
      await updateBookingInvite(inviteId, WORKER_JOB_INVITE_STATUS.REJECTED);
      void syncAppBadgeCountFromBackend(true);
      await refetch();
    } finally {
      setInviteActionLoading(null);
    }
  }, [inviteId, refetch]);

  const startBookingWithOtp = useCallback(async () => {
    const normalizedOtp = startOtp.trim();
    const normalizedBookingId = normalizedDetails?.booking.id ?? null;
    if (!normalizedBookingId) return;
    if (!/^\d{4}$/.test(normalizedOtp)) {
      setStartOtpError(APP_TEXT.jobs.startOtpInvalidLength);
      return;
    }

    setStartingJob(true);
    setStartOtpError(null);
    try {
      const response = await startWorkerBookingWithOtp(normalizedBookingId, normalizedOtp);
      setStartOtpState('');
      await refetch();
      if (typeof response.message === 'string' && response.message.trim().length > 0) {
        showToast('success', response.message);
      }
    } catch (startError) {
      const message = getErrorMessage(startError, APP_TEXT.auth.errors.tryAgain);
      if (message.toLowerCase().includes('already been started')) {
        setStartOtpState('');
        await refetch();
        showToast('success', message);
        return;
      }
      setStartOtpError(message);
    } finally {
      setStartingJob(false);
    }
  }, [normalizedDetails?.booking.id, refetch, startOtp]);

  const updateProgress = useCallback(async (assignmentStatus: WorkerAssignmentStatusUpdate) => {
    const normalizedBookingId = normalizedDetails?.booking.id ?? null;
    if (!normalizedBookingId || jobActionLoading) return;

    setJobActionLoading(assignmentStatus);
    try {
      await updateWorkerAssignmentStatus(normalizedBookingId, assignmentStatus);
      await refetch();
    } catch (progressError) {
      showToast('error', getErrorMessage(progressError, APP_TEXT.auth.errors.tryAgain));
    } finally {
      setJobActionLoading(null);
    }
  }, [jobActionLoading, normalizedDetails?.booking.id, refetch]);

  const confirmPaymentReceived = useCallback(async (mode: WorkerPaymentReceivedMode) => {
    const normalizedBookingId = normalizedDetails?.booking.id ?? null;
    if (!normalizedBookingId || jobActionLoading) return false;

    setJobActionLoading(mode);
    try {
      await recordWorkerPaymentReceived(normalizedBookingId, {
        mode,
      });
      await refetch();
      return true;
    } catch (paymentError) {
      showToast('error', getErrorMessage(paymentError, APP_TEXT.auth.errors.tryAgain));
      return false;
    } finally {
      setJobActionLoading(null);
    }
  }, [jobActionLoading, normalizedDetails?.booking.id, refetch]);

  const updateQuantity = useCallback(async (line: BookingDetailsServiceLine, nextQuantity: number) => {
    const quantity = Math.max(1, nextQuantity);
    await patchBooking(line, buildBookingQuantityPatch(line, quantity));
  }, [patchBooking]);

  const increaseQuantity = useCallback(async (line: BookingDetailsServiceLine) => {
    await updateQuantity(line, getBookingLineQuantity(line) + 1);
  }, [updateQuantity]);

  const decreaseQuantity = useCallback(async (line: BookingDetailsServiceLine) => {
    await updateQuantity(line, getBookingLineQuantity(line) - 1);
  }, [updateQuantity]);

  const updateDuration = useCallback(async (line: BookingDetailsServiceLine, nextMinutes: number) => {
    const minutes = Math.max(BOOKING_DURATION_STEP_MINUTES, nextMinutes);
    await patchBooking(line, buildBookingDurationPatch(line, minutes));
  }, [patchBooking]);

  const increaseDuration = useCallback(async (line: BookingDetailsServiceLine) => {
    const currentMinutes = getBookingLineDurationMinutes(line) ?? BOOKING_DURATION_STEP_MINUTES;
    await updateDuration(line, currentMinutes + BOOKING_DURATION_STEP_MINUTES);
  }, [updateDuration]);

  const decreaseDuration = useCallback(async (line: BookingDetailsServiceLine) => {
    const currentMinutes = getBookingLineDurationMinutes(line) ?? BOOKING_DURATION_STEP_MINUTES;
    await updateDuration(line, currentMinutes - BOOKING_DURATION_STEP_MINUTES);
  }, [updateDuration]);

  return {
    details: normalizedDetails,
    loading,
    error: error ?? updateError,
    isNotFound,
    updatingLineKey,
    inviteId,
    startOtp,
    startOtpError,
    startingJob,
    inviteActionLoading,
    jobActionLoading,
    refetch,
    setStartOtp,
    acceptInvite,
    rejectInvite,
    startBookingWithOtp,
    updateProgress,
    confirmPaymentReceived,
    increaseQuantity,
    decreaseQuantity,
    increaseDuration,
    decreaseDuration,
  };
}
