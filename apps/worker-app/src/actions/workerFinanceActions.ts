import { apiGet, apiPost } from '@/actions/http/httpClient';
import type { ApiEnvelope } from '@/types/api';
import type {
  EarningsApiPeriodType,
  NetSettlementDirection,
  SettlementCard,
  SettlementDetailResponse,
  SettlementJobRow,
  SettlementPayoutInvoice,
  SettlementPayoutInvoiceItem,
  SettlementStatus,
  WorkerCommissionDuePaymentPayload,
  WorkerCommissionDuesResponse,
  WorkerCommissionPayableBlock,
  WorkerEarningsDashboardResponse,
  WorkerEarningsPeriodFilterValue,
  WorkerEarningsResponse,
  WorkerEarningsSettlementsResponse,
  WorkerEarningsSummaryQuery,
  WorkerEarningsSummaryResponse,
  WorkerFinanceListQuery,
  EarningsGrowthApiPeriodType,
  WorkerEarningsComparisonDirection,
  WorkerEarningsGrowth,
  WorkerEarningsGrowthPeriod,
  WorkerPayoutDetailResponse,
  WorkerPayoutsResponse,
  WorkerWalletLedgerResponse,
  WorkerWalletResponse,
} from '@/types/worker-finance';

function unwrapData<T>(payload: T | ApiEnvelope<T>): T {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    return (envelope.data ?? ({} as T)) as T;
  }
  return payload as T;
}

function normalizeText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function normalizeAmount(value: unknown, fallback = '0.00'): string {
  if (typeof value === 'number' && Number.isFinite(value)) return value.toFixed(2);
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  return fallback;
}

function mapPeriodToApi(period?: WorkerEarningsPeriodFilterValue): EarningsApiPeriodType | undefined {
  if (!period) return undefined;
  const map: Record<WorkerEarningsPeriodFilterValue, EarningsApiPeriodType> = {
    TODAY: 'today',
    THIS_MONTH: 'this_month',
    THIS_YEAR: 'this_year',
    CUSTOM: 'custom',
  };
  return map[period];
}

function toListQueryString(query?: WorkerFinanceListQuery) {
  const params = new URLSearchParams();
  params.set('page', String(query?.page ?? 1));
  params.set('limit', String(query?.limit ?? 20));
  const apiPeriod = mapPeriodToApi(query?.period);
  if (apiPeriod) {
    params.set('period', apiPeriod);
  }
  if (query?.startDate) {
    params.set('startDate', query.startDate);
  }
  if (query?.endDate) {
    params.set('endDate', query.endDate);
  }
  return params.toString();
}

function mapPaymentModeBreakdown(raw: Record<string, unknown> | number | null | undefined) {
  if (typeof raw === 'number') {
    return { count: raw, amount: '0.00' };
  }
  const source = raw ?? {};
  return {
    count: typeof source.count === 'number' ? source.count : Number(source.count ?? 0) || 0,
    amount: normalizeAmount(source.amount ?? source.billAmount),
  };
}

function mapNetSettlementDirection(value: unknown): NetSettlementDirection {
  const normalized = normalizeText(value as string | null | undefined);
  if (normalized === 'DELLITE_PAYS_WORKER' || normalized === 'DELLITE_PAYS') return 'DELLITE_PAYS_WORKER';
  if (normalized === 'WORKER_PAYS_DELLITE' || normalized === 'WORKER_PAYS') return 'WORKER_PAYS_DELLITE';
  return 'NONE';
}

function mapSettlementStatus(value: unknown): SettlementStatus {
  const normalized = normalizeText(value as string | null | undefined)?.toUpperCase();
  if (
    normalized === 'COMMISSION_DUE'
    || normalized === 'DRAFT'
    || normalized === 'READY_FOR_PAYOUT'
    || normalized === 'PROCESSING'
    || normalized === 'PAID'
    || normalized === 'SETTLED'
  ) {
    return normalized;
  }
  return 'SETTLED';
}

function mapPayoutProvider(value: unknown): SettlementPayoutInvoice['provider'] {
  const normalized = normalizeText(value as string)?.toLowerCase();
  if (normalized === 'razorpayx' || normalized === 'razorpay') return 'razorpayx';
  if (normalized === 'phonepe') return 'phonepe';
  return null;
}

function mapPayoutMethod(value: unknown): SettlementPayoutInvoice['method'] {
  const normalized = normalizeText(value as string)?.toUpperCase();
  if (normalized === 'UPI') return 'UPI';
  if (normalized === 'BANK') return 'BANK';
  return null;
}

function mapPayoutStatus(value: unknown): SettlementPayoutInvoice['status'] {
  const normalized = normalizeText(value as string)?.toUpperCase();
  if (
    normalized === 'PENDING'
    || normalized === 'PROCESSING'
    || normalized === 'PAID'
    || normalized === 'FAILED'
    || normalized === 'BLOCKED'
  ) {
    return normalized;
  }
  return 'PENDING';
}

function mapPayoutInvoiceItem(raw: Record<string, unknown>): SettlementPayoutInvoiceItem {
  return {
    bookingId: normalizeText(raw.bookingId as string) ?? '',
    bookingCode: normalizeText(raw.bookingCode as string) ?? '',
    payoutAmount: normalizeAmount(raw.payoutAmount),
  };
}

function mapPayoutInvoice(value: unknown): SettlementPayoutInvoice | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const payoutId = normalizeText(source.payoutId as string);
  if (!payoutId) return null;

  const itemsRaw = Array.isArray(source.items) ? source.items as Record<string, unknown>[] : [];

  return {
    payoutId,
    payoutCode: normalizeText(source.payoutCode as string) ?? '',
    status: mapPayoutStatus(source.status),
    blockedReason: normalizeText(source.blockedReason as string),
    provider: mapPayoutProvider(source.provider),
    method: mapPayoutMethod(source.method),
    maskedDestination: normalizeText(source.maskedDestination as string),
    grossAmount: normalizeAmount(source.grossAmount),
    commissionAdjustedAmount: normalizeAmount(source.commissionAdjustedAmount),
    payoutAmount: normalizeAmount(source.payoutAmount),
    paidAt: normalizeText(source.paidAt as string),
    providerPayoutId: normalizeText(source.providerPayoutId as string),
    providerReference: normalizeText(source.providerReference as string),
    utr: normalizeText(source.utr as string),
    failureReason: normalizeText(source.failureReason as string),
    items: itemsRaw.map(item => mapPayoutInvoiceItem(item)),
  };
}

function mapSettlementCard(raw: Record<string, unknown>): SettlementCard {
  const paymentBreakdown = (raw.paymentBreakdown ?? {}) as Record<string, unknown>;
  const netSettlementRaw = (raw.netSettlement ?? {}) as Record<string, unknown>;
  const date = normalizeText(raw.date as string)
    ?? normalizeText(raw.jobCompletionDate as string)
    ?? '';

  return {
    id: normalizeText(raw.id as string) ?? '',
    date,
    displayDate: normalizeText(raw.displayDate as string) ?? date,
    completedJobs: typeof raw.completedJobs === 'number'
      ? raw.completedJobs
      : Number(raw.completedJobsCount ?? raw.completedJobs ?? 0) || 0,
    paymentBreakdown: {
      online: mapPaymentModeBreakdown(paymentBreakdown.online as Record<string, unknown>),
      cash: mapPaymentModeBreakdown(paymentBreakdown.cash as Record<string, unknown>),
      workerUpi: mapPaymentModeBreakdown(
        (paymentBreakdown.workerUpi ?? paymentBreakdown.upi) as Record<string, unknown> | number | null | undefined,
      ),
    },
    totalPayableAmount: normalizeAmount(raw.totalPayableAmount ?? raw.totalBill ?? raw.totalBillAmount),
    workerEarningAmount: normalizeAmount(raw.workerEarningAmount ?? raw.yourEarning),
    commissionAmount: normalizeAmount(raw.commissionAmount ?? raw.delliteCommission),
    onlineWorkerEarningAmount: normalizeAmount(raw.onlineWorkerEarningAmount ?? raw.onlineWorkerEarning),
    offlineCommissionDueAmount: normalizeAmount(raw.offlineCommissionDueAmount ?? raw.offlineCommissionDue),
    priorCommissionDueApplied: normalizeAmount(raw.priorCommissionDueApplied ?? raw.carriedForwardCommissionApplied),
    netSettlement: {
      direction: mapNetSettlementDirection(netSettlementRaw.direction ?? netSettlementRaw.type),
      amount: normalizeAmount(netSettlementRaw.amount),
      label: normalizeText(netSettlementRaw.label as string) ?? 'Settled',
      displayText: normalizeText(netSettlementRaw.displayText as string)
        ?? normalizeText(netSettlementRaw.label as string)
        ?? 'Settled',
    },
    status: mapSettlementStatus(raw.status),
  };
}

function mapSettlementJobServiceLine(raw: Record<string, unknown>): SettlementJobRow['services'][number] {
  const payableAmount = normalizeAmount(raw.payableAmount ?? raw.lineTotalAmount);
  return {
    id: normalizeText(raw.id as string) ?? '',
    serviceName: normalizeText(raw.serviceName as string) ?? '',
    categoryName: normalizeText(raw.categoryName as string) ?? '',
    subCategoryName: normalizeText(raw.subCategoryName as string) ?? '',
    quantity: typeof raw.quantity === 'number' ? raw.quantity : Number(raw.quantity ?? 1) || 1,
    durationLabel: normalizeText(raw.durationLabel as string) ?? '',
    lineTotalAmount: normalizeAmount(raw.lineTotalAmount ?? raw.payableAmount),
    payableAmount,
    paidAmount: normalizeAmount(raw.paidAmount ?? raw.payableAmount ?? raw.lineTotalAmount),
  };
}

function mapSettlementJobRow(raw: Record<string, unknown>): SettlementJobRow {
  const paymentModeRaw = normalizeText(raw.paymentMode as string)?.toUpperCase();
  let paymentMode: SettlementJobRow['paymentMode'] = 'ONLINE';
  if (paymentModeRaw === 'CASH' || paymentModeRaw === 'CASH_TO_WORKER') paymentMode = 'CASH';
  else if (paymentModeRaw === 'WORKER_UPI' || paymentModeRaw === 'UPI_TO_WORKER') paymentMode = 'WORKER_UPI';

  const servicesRaw = Array.isArray(raw.services) ? raw.services as Record<string, unknown>[] : [];
  const legacyServiceName = normalizeText(raw.serviceName as string);
  const services = servicesRaw.length > 0
    ? servicesRaw.map(item => mapSettlementJobServiceLine(item))
    : (legacyServiceName
      ? [{
        id: '',
        serviceName: legacyServiceName,
        categoryName: '',
        subCategoryName: '',
        quantity: 1,
        durationLabel: '',
        lineTotalAmount: normalizeAmount(raw.payableAmount ?? raw.totalBill),
        payableAmount: normalizeAmount(raw.payableAmount ?? raw.totalBill),
        paidAmount: normalizeAmount(raw.paidAmount ?? raw.payableAmount ?? raw.totalBill),
      }]
      : []);

  return {
    bookingId: normalizeText(raw.bookingId as string) ?? '',
    bookingCode: normalizeText(raw.bookingCode as string) ?? '',
    completedAt: normalizeText(raw.completedAt as string) ?? '',
    paymentMode,
    services,
    tipAmount: normalizeAmount(raw.tipAmount),
    payableAmount: normalizeAmount(raw.payableAmount ?? raw.totalBill),
    paidAmount: normalizeAmount(raw.paidAmount ?? raw.payableAmount ?? raw.totalBill),
    workerEarningAmount: normalizeAmount(raw.workerEarningAmount ?? raw.yourEarning),
    commissionAmount: normalizeAmount(raw.commissionAmount ?? raw.delliteCommission),
    status: 'COMPLETED',
  };
}

function mapSummaryPaymentBreakdown(raw: Record<string, unknown> | null | undefined) {
  const source = raw ?? {};
  const mapMode = (key: 'online' | 'cash' | 'workerUpi') => {
    const mode = (source[key] ?? (key === 'workerUpi' ? source.upi : undefined)) as Record<string, unknown> | undefined;
    if (typeof mode === 'number') {
      return { count: mode, billAmount: '0.00', yourEarning: '0.00' };
    }
    return {
      count: typeof mode?.count === 'number' ? mode.count : Number(mode?.count ?? 0) || 0,
      billAmount: normalizeAmount(mode?.billAmount),
      yourEarning: normalizeAmount(mode?.yourEarning),
    };
  };

  return {
    online: mapMode('online'),
    cash: mapMode('cash'),
    workerUpi: mapMode('workerUpi'),
  };
}

function mapCurrentPosition(raw: Record<string, unknown>): WorkerEarningsSummaryResponse['currentPosition'] {
  const walletBalances = (raw.balances ?? {}) as Record<string, unknown>;
  return {
    delliteOwesWorker: normalizeAmount(raw.delliteOwesWorker ?? walletBalances.availableBalance),
    workerOwesDellite: normalizeAmount(raw.workerOwesDellite ?? walletBalances.commissionDueBalance),
    payoutInProcess: normalizeAmount(raw.payoutInProcess ?? walletBalances.payoutProcessingBalance),
    totalPaidLifetimeByDellite: normalizeAmount(raw.totalPaidLifetimeByDellite ?? walletBalances.paidLifetimeAmount),
    pendingCommissionFromEarlierDays: normalizeAmount(
      raw.pendingCommissionFromEarlierDays ?? walletBalances.commissionDueBalance,
      '0.00',
    ),
  };
}

function mapGrowthDirection(value: unknown): WorkerEarningsComparisonDirection {
  const normalized = normalizeText(value as string)?.toUpperCase();
  if (normalized === 'UP') return 'UP';
  if (normalized === 'DOWN') return 'DOWN';
  return 'NONE';
}

function mapGrowthPercent(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const GROWTH_PERIOD_ALIASES: Record<string, EarningsGrowthApiPeriodType> = {
  today: 'today',
  this_month: 'this_month',
  thisMonth: 'this_month',
  'this-month': 'this_month',
  THIS_MONTH: 'this_month',
  this_year: 'this_year',
  thisYear: 'this_year',
  'this-year': 'this_year',
  THIS_YEAR: 'this_year',
};

function normalizeGrowthPeriodKey(key: string): EarningsGrowthApiPeriodType | null {
  return GROWTH_PERIOD_ALIASES[key] ?? null;
}

function mapGrowthPeriod(raw: Record<string, unknown>): WorkerEarningsGrowthPeriod {
  const period = (normalizeText(raw.period as string) ?? 'this_month') as EarningsGrowthApiPeriodType;
  return {
    period,
    label: normalizeText(raw.label as string) ?? 'This Month',
    previousPeriodLabel: normalizeText(raw.previousPeriodLabel as string) ?? 'last month',
    currentNetEarnings: normalizeAmount(raw.currentNetEarnings),
    previousNetEarnings: normalizeAmount(raw.previousNetEarnings),
    growthPercent: mapGrowthPercent(raw.growthPercent ?? raw.earningsGrowthPercent),
    direction: mapGrowthDirection(raw.direction),
    completedJobs: typeof raw.completedJobs === 'number'
      ? raw.completedJobs
      : Number(raw.completedJobs ?? 0) || 0,
    previousCompletedJobs: typeof raw.previousCompletedJobs === 'number'
      ? raw.previousCompletedJobs
      : Number(raw.previousCompletedJobs ?? 0) || 0,
    completedJobsDifference: typeof raw.completedJobsDifference === 'number'
      ? raw.completedJobsDifference
      : Number(raw.completedJobsDifference ?? 0) || 0,
  };
}

function mapGrowthPeriodsFromRecord(periodsRaw: Record<string, unknown>) {
  const periods: Partial<Record<EarningsGrowthApiPeriodType, WorkerEarningsGrowthPeriod>> = {};
  const fixedKeys: EarningsGrowthApiPeriodType[] = ['today', 'this_month', 'this_year'];

  for (const key of fixedKeys) {
    const periodRaw = periodsRaw[key];
    if (periodRaw && typeof periodRaw === 'object') {
      periods[key] = mapGrowthPeriod(periodRaw as Record<string, unknown>);
    }
  }

  for (const [key, periodRaw] of Object.entries(periodsRaw)) {
    const normalizedKey = normalizeGrowthPeriodKey(key);
    if (!normalizedKey || periods[normalizedKey] || !periodRaw || typeof periodRaw !== 'object') {
      continue;
    }
    periods[normalizedKey] = mapGrowthPeriod(periodRaw as Record<string, unknown>);
  }

  return periods;
}

function mapGrowthFromComparison(raw: unknown): WorkerEarningsGrowth | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const source = raw as Record<string, unknown>;
  const growthPercent = mapGrowthPercent(source.earningsGrowthPercent ?? source.growthPercent);
  if (growthPercent == null && source.direction == null) return undefined;

  return {
    periods: {
      this_month: mapGrowthPeriod({
        period: 'this_month',
        label: 'This Month',
        previousPeriodLabel: 'last month',
        growthPercent,
        direction: source.direction,
        currentNetEarnings: source.currentNetEarnings,
        previousNetEarnings: source.previousNetEarnings,
      }),
    },
  };
}

function mapGrowth(raw: unknown): WorkerEarningsGrowth | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const source = raw as Record<string, unknown>;
  const periodsRaw = source.periods as Record<string, unknown> | undefined;

  let periods: Partial<Record<EarningsGrowthApiPeriodType, WorkerEarningsGrowthPeriod>> = {};

  if (periodsRaw && typeof periodsRaw === 'object') {
    periods = mapGrowthPeriodsFromRecord(periodsRaw);
  } else {
    for (const key of ['today', 'this_month', 'this_year'] as EarningsGrowthApiPeriodType[]) {
      const periodRaw = source[key];
      if (periodRaw && typeof periodRaw === 'object') {
        periods[key] = mapGrowthPeriod(periodRaw as Record<string, unknown>);
      }
    }
    if (Object.keys(periods).length === 0 && ('growthPercent' in source || 'currentNetEarnings' in source || 'earningsGrowthPercent' in source)) {
      periods.this_month = mapGrowthPeriod(source);
    }
  }

  if (Object.keys(periods).length === 0) return undefined;
  return { periods };
}

function toSummaryQueryString(query?: WorkerEarningsSummaryQuery) {
  const params = new URLSearchParams();
  if (query?.includeGrowthRate) {
    params.set('includeGrowthRate', 'true');
  }
  if (query?.growthPeriod) {
    params.set('growthPeriod', query.growthPeriod);
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

function mapSettlementInfo(raw: Record<string, unknown> | null | undefined): WorkerEarningsSummaryResponse['settlementInfo'] {
  const source = raw ?? {};
  return {
    title: normalizeText(source.title as string) ?? 'Daily Settlement',
    badge: normalizeText(source.badge as string) ?? 'Processed once per day',
    description: normalizeText(source.description as string) ?? '',
  };
}

function mapPaymentProviders(value: unknown): WorkerCommissionPayableBlock['providers'] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => normalizeText(item as string)?.toUpperCase())
    .filter((item): item is 'RAZORPAY' | 'PHONEPE' => item === 'RAZORPAY' || item === 'PHONEPE');
}

function mapCommissionActiveIntent(value: unknown): WorkerCommissionPayableBlock['activeIntent'] {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const paymentId = normalizeText(source.paymentId as string);
  if (!paymentId) return null;

  return {
    paymentId,
    provider: normalizeText(source.provider as string),
    status: normalizeText(source.status as string) ?? 'PENDING',
    expiresAt: normalizeText(source.expiresAt as string),
    amount: normalizeAmount(source.amount),
  };
}

function mapCommissionPayableBlock(value: unknown): WorkerCommissionPayableBlock | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;

  return {
    amount: normalizeAmount(source.amount),
    openDueCount: typeof source.openDueCount === 'number'
      ? source.openDueCount
      : Number(source.openDueCount ?? 0) || 0,
    openDueJobCount: typeof source.openDueJobCount === 'number'
      ? source.openDueJobCount
      : Number(source.openDueJobCount ?? 0) || 0,
    canPayOnline: source.canPayOnline === true,
    providers: mapPaymentProviders(source.providers),
    activeIntent: mapCommissionActiveIntent(source.activeIntent),
  };
}

function mapSummaryResponse(raw: Record<string, unknown>): WorkerEarningsSummaryResponse {
  const lifetimeRaw = (raw.lifetime ?? {}) as Record<string, unknown>;
  return {
    currentPosition: mapCurrentPosition((raw.currentPosition ?? raw.wallet ?? {}) as Record<string, unknown>),
    lifetime: {
      netEarnings: normalizeAmount(lifetimeRaw.netEarnings),
      completedJobs: typeof lifetimeRaw.completedJobs === 'number'
        ? lifetimeRaw.completedJobs
        : Number(lifetimeRaw.completedJobs ?? 0) || 0,
      averageEarningPerJob: normalizeAmount(lifetimeRaw.averageEarningPerJob),
      totalBilled: normalizeAmount(lifetimeRaw.totalBilled ?? lifetimeRaw.totalBillAmount),
      totalCommission: normalizeAmount(lifetimeRaw.totalCommission),
    },
    settlementInfo: mapSettlementInfo(
      (raw.settlementInfo ?? raw.dailySettlementInfo ?? raw.settlement) as Record<string, unknown>,
    ),
    growth: mapGrowth(raw.growth ?? raw.growthRate)
      ?? mapGrowthFromComparison(raw.comparison)
      ?? null,
    payAllCommissionDue: mapCommissionPayableBlock(raw.payAllCommissionDue),
  };
}

function mapSettlementsResponse(raw: Record<string, unknown>): WorkerEarningsSettlementsResponse {
  const periodRaw = (raw.period ?? {}) as Record<string, unknown>;
  const periodSummaryRaw = (raw.periodSummary ?? raw.summary ?? {}) as Record<string, unknown>;
  const settlementsRaw: Record<string, unknown>[] = Array.isArray(raw.dailySettlements)
    ? raw.dailySettlements as Record<string, unknown>[]
    : (Array.isArray(raw.settlements) ? raw.settlements as Record<string, unknown>[] : []);

  return {
    period: {
      type: (normalizeText(periodRaw.type as string) ?? 'this_month') as EarningsApiPeriodType,
      startDate: normalizeText(periodRaw.startDate as string) ?? '',
      endDate: normalizeText(periodRaw.endDate as string) ?? '',
      timezone: 'Asia/Kolkata',
      label: normalizeText(periodRaw.label as string) ?? 'This Month',
    },
    periodSummary: {
      netEarnings: normalizeAmount(periodSummaryRaw.netEarnings),
      completedJobs: typeof periodSummaryRaw.completedJobs === 'number'
        ? periodSummaryRaw.completedJobs
        : Number(periodSummaryRaw.completedJobs ?? 0) || 0,
      totalBilled: normalizeAmount(periodSummaryRaw.totalBilled ?? periodSummaryRaw.totalBillAmount),
      totalCommission: normalizeAmount(periodSummaryRaw.totalCommission),
    },
    dailySettlementInfo: mapSettlementInfo(
      (raw.dailySettlementInfo ?? raw.settlementInfo ?? raw.settlement) as Record<string, unknown>,
    ),
    dailySettlements: settlementsRaw.map(item => mapSettlementCard(item)),
    pagination: (raw.pagination ?? {
      page: 1,
      limit: 20,
      total: 0,
      hasNextPage: false,
    }) as WorkerEarningsSettlementsResponse['pagination'],
  };
}

function mapDashboardResponse(raw: Record<string, unknown>): WorkerEarningsDashboardResponse {
  const periodRaw = (raw.period ?? {}) as Record<string, unknown>;
  const comparisonRaw = (raw.comparison ?? {}) as Record<string, unknown>;
  const summaryRaw = (raw.summary ?? {}) as Record<string, unknown>;
  const currentPositionRaw = (raw.currentPosition ?? raw.wallet ?? {}) as Record<string, unknown>;
  const walletBalances = (currentPositionRaw.balances ?? {}) as Record<string, unknown>;
  const settlementInfoRaw = (raw.settlementInfo ?? raw.dailySettlementInfo ?? raw.settlement ?? {}) as Record<string, unknown>;
  const settlementsRaw: Record<string, unknown>[] = Array.isArray(raw.settlements)
    ? raw.settlements as Record<string, unknown>[]
    : (Array.isArray((raw.dailySettlements as Record<string, unknown> | undefined)?.items)
      ? ((raw.dailySettlements as { items: Record<string, unknown>[] }).items)
      : []);

  const directionRaw = normalizeText(comparisonRaw.direction as string)?.toUpperCase();
  const direction = directionRaw === 'UP' || directionRaw === 'DOWN' || directionRaw === 'NONE'
    ? directionRaw
    : (comparisonRaw.value != null && Number(comparisonRaw.value) > 0
      ? 'UP'
      : (comparisonRaw.value != null && Number(comparisonRaw.value) < 0 ? 'DOWN' : 'NONE'));

  return {
    period: {
      type: (normalizeText(periodRaw.type as string) ?? 'this_month') as EarningsApiPeriodType,
      startDate: normalizeText(periodRaw.startDate as string) ?? '',
      endDate: normalizeText(periodRaw.endDate as string) ?? '',
      timezone: 'Asia/Kolkata',
      label: normalizeText(periodRaw.label as string) ?? 'This Month',
    },
    comparison: {
      previousStartDate: normalizeText(comparisonRaw.previousStartDate as string) ?? undefined,
      previousEndDate: normalizeText(comparisonRaw.previousEndDate as string) ?? undefined,
      earningsGrowthPercent: comparisonRaw.earningsGrowthPercent != null
        ? Number(comparisonRaw.earningsGrowthPercent)
        : (comparisonRaw.value != null ? Number(comparisonRaw.value) : null),
      completedJobsDifference: comparisonRaw.completedJobsDifference != null
        ? Number(comparisonRaw.completedJobsDifference)
        : null,
      avgEarningPerJobDifference: normalizeText(comparisonRaw.avgEarningPerJobDifference as string) ?? null,
      direction,
    },
    summary: {
      netEarnings: normalizeAmount(summaryRaw.netEarnings),
      completedJobs: typeof summaryRaw.completedJobs === 'number'
        ? summaryRaw.completedJobs
        : Number(summaryRaw.completedJobsCount ?? 0) || 0,
      averageEarningPerJob: normalizeAmount(summaryRaw.averageEarningPerJob),
      totalBillAmount: normalizeAmount(summaryRaw.totalBillAmount),
      totalCommission: normalizeAmount(summaryRaw.totalCommission),
      paymentBreakdown: mapSummaryPaymentBreakdown(summaryRaw.paymentBreakdown as Record<string, unknown>),
    },
    currentPosition: {
      delliteOwesWorker: normalizeAmount(
        currentPositionRaw.delliteOwesWorker ?? walletBalances.availableBalance,
      ),
      workerOwesDellite: normalizeAmount(
        currentPositionRaw.workerOwesDellite ?? walletBalances.commissionDueBalance,
      ),
      payoutInProcess: normalizeAmount(
        currentPositionRaw.payoutInProcess ?? walletBalances.payoutProcessingBalance,
      ),
      totalPaidLifetimeByDellite: normalizeAmount(
        currentPositionRaw.totalPaidLifetimeByDellite ?? walletBalances.paidLifetimeAmount,
      ),
      pendingCommissionFromEarlierDays: normalizeAmount(
        currentPositionRaw.pendingCommissionFromEarlierDays ?? walletBalances.commissionDueBalance,
      ),
    },
    settlementInfo: {
      title: normalizeText(settlementInfoRaw.title as string) ?? 'Daily Settlement',
      badge: normalizeText(settlementInfoRaw.badge as string) ?? 'Processed once per day',
      description: normalizeText(settlementInfoRaw.description as string) ?? '',
    },
    settlements: settlementsRaw.map(item => mapSettlementCard(item as Record<string, unknown>)),
    pagination: (raw.pagination ?? (raw.dailySettlements as Record<string, unknown> | undefined)?.pagination ?? {
      page: 1,
      limit: 20,
      total: 0,
      hasNextPage: false,
    }) as WorkerEarningsDashboardResponse['pagination'],
  };
}

function mapSettlementDetailResponse(raw: Record<string, unknown>): SettlementDetailResponse {
  const settlement = mapSettlementCard(raw);
  const jobsRaw = Array.isArray(raw.jobs) ? raw.jobs : [];
  return {
    ...settlement,
    commissionRecoveredAmount: normalizeAmount(raw.commissionRecoveredAmount),
    carriedForwardDueAmount: normalizeAmount(raw.carriedForwardDueAmount),
    jobs: jobsRaw.map(item => mapSettlementJobRow(item as Record<string, unknown>)),
    payoutInvoice: mapPayoutInvoice(raw.payoutInvoice),
    commissionDuePayable: mapCommissionPayableBlock(raw.commissionDuePayable),
  };
}

export async function getWorkerWallet(): Promise<WorkerWalletResponse> {
  const response = await apiGet<ApiEnvelope<WorkerWalletResponse> | WorkerWalletResponse>(
    '/worker/wallet',
    {
      auth: true,
      cache: 'no-store',
      toast: { showError: false },
    },
  );
  return unwrapData(response);
}

export async function getWorkerWalletLedger(query?: WorkerFinanceListQuery): Promise<WorkerWalletLedgerResponse> {
  const response = await apiGet<ApiEnvelope<WorkerWalletLedgerResponse> | WorkerWalletLedgerResponse>(
    `/worker/wallet/ledger?${toListQueryString(query)}`,
    {
      auth: true,
      cache: 'no-store',
      toast: { showError: false },
    },
  );
  return unwrapData(response);
}

export async function getWorkerEarnings(query?: WorkerFinanceListQuery): Promise<WorkerEarningsResponse> {
  const response = await apiGet<ApiEnvelope<WorkerEarningsResponse> | WorkerEarningsResponse>(
    `/worker/earnings?${toListQueryString(query)}`,
    {
      auth: true,
      cache: 'no-store',
      toast: { showError: false },
    },
  );
  return unwrapData(response);
}

export async function getWorkerEarningsSummary(
  query?: WorkerEarningsSummaryQuery,
): Promise<WorkerEarningsSummaryResponse> {
  const response = await apiGet<ApiEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/worker/earnings/summary${toSummaryQueryString(query)}`,
    {
      auth: true,
      cache: 'no-store',
      toast: { showError: false },
    },
  );
  return mapSummaryResponse(unwrapData(response));
}

export async function getWorkerEarningsSettlements(query?: WorkerFinanceListQuery): Promise<WorkerEarningsSettlementsResponse> {
  const response = await apiGet<ApiEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/worker/earnings/settlements?${toListQueryString(query)}`,
    {
      auth: true,
      cache: 'no-store',
      toast: { showError: false },
    },
  );
  return mapSettlementsResponse(unwrapData(response));
}

/** @deprecated Use getWorkerEarningsSummary + getWorkerEarningsSettlements */
export async function getWorkerEarningsDashboard(query?: WorkerFinanceListQuery): Promise<WorkerEarningsDashboardResponse> {
  const response = await apiGet<ApiEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/worker/earnings/dashboard?${toListQueryString(query)}`,
    {
      auth: true,
      cache: 'no-store',
      toast: { showError: false },
    },
  );
  return mapDashboardResponse(unwrapData(response));
}

/** @deprecated Use getWorkerEarningsDashboard */
export async function getWorkerEarningsOverview(query?: WorkerFinanceListQuery): Promise<WorkerEarningsDashboardResponse> {
  return getWorkerEarningsDashboard(query);
}

export async function getWorkerSettlementDetail(settlementId: string): Promise<SettlementDetailResponse> {
  const normalizedSettlementId = settlementId.trim();
  if (!normalizedSettlementId) {
    throw new Error('Settlement id is required.');
  }

  const response = await apiGet<ApiEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/worker/earnings/settlements/${encodeURIComponent(normalizedSettlementId)}`,
    {
      auth: true,
      cache: 'no-store',
      toast: { showError: false },
    },
  );
  return mapSettlementDetailResponse(unwrapData(response));
}

export async function getWorkerCommissionDues(query?: WorkerFinanceListQuery): Promise<WorkerCommissionDuesResponse> {
  const response = await apiGet<ApiEnvelope<WorkerCommissionDuesResponse> | WorkerCommissionDuesResponse>(
    `/worker/commission-dues?${toListQueryString(query)}`,
    {
      auth: true,
      cache: 'no-store',
      toast: { showError: false },
    },
  );
  return unwrapData(response);
}

export async function payWorkerCommissionDue(payload: WorkerCommissionDuePaymentPayload): Promise<WorkerCommissionDuesResponse> {
  const response = await apiPost<ApiEnvelope<WorkerCommissionDuesResponse> | WorkerCommissionDuesResponse, WorkerCommissionDuePaymentPayload>(
    '/worker/commission-dues/payment',
    payload,
    {
      auth: true,
      tokenType: 'access',
      toast: {
        successTitle: 'Commission Paid',
        successMessage: 'Commission payment was submitted.',
        errorTitle: 'Commission Payment Failed',
      },
    },
  );
  return unwrapData(response);
}

export async function getWorkerPayouts(query?: WorkerFinanceListQuery): Promise<WorkerPayoutsResponse> {
  const response = await apiGet<ApiEnvelope<WorkerPayoutsResponse> | WorkerPayoutsResponse>(
    `/worker/payouts?${toListQueryString(query)}`,
    {
      auth: true,
      cache: 'no-store',
      toast: { showError: false },
    },
  );
  return unwrapData(response);
}

export async function getWorkerPayoutDetail(payoutId: string): Promise<WorkerPayoutDetailResponse> {
  const normalizedPayoutId = payoutId.trim();
  if (!normalizedPayoutId) {
    throw new Error('Payout id is required.');
  }

  const response = await apiGet<ApiEnvelope<WorkerPayoutDetailResponse> | WorkerPayoutDetailResponse>(
    `/worker/payouts/${encodeURIComponent(normalizedPayoutId)}`,
    {
      auth: true,
      cache: 'no-store',
      toast: { showError: false },
    },
  );
  return unwrapData(response);
}
