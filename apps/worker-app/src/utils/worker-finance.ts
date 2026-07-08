import type { Ionicons } from '@expo/vector-icons';
import type {
  EarningsApiPeriodType,
  EarningsGrowthApiPeriodType,
  SettlementCard,
  SettlementJobRow,
  SettlementJobServiceLine,
  SettlementNetSettlement,
  SettlementPayoutInvoice,
  SettlementPayoutProvider,
  SettlementPayoutStatus,
  SettlementStatus,
  WorkerEarningsComparisonDirection,
  WorkerEarningsCurrentPosition,
  WorkerEarningsDashboardResponse,
  WorkerEarningsDashboardSummary,
  WorkerEarningsGrowthBadgeData,
  WorkerEarningsGrowthPeriod,
  WorkerEarningsPeriodFilterValue,
  WorkerEarningsPeriodOption,
  WorkerEarningsSettlementsResponse,
  WorkerEarningsStatCardData,
  WorkerEarningsSummaryResponse,
  WorkerEarningsWalletCard,
} from '@/types/worker-finance';
import { APP_TEXT } from '@/utils/appText';
import { formatDisplayDate, formatDisplayDateTime } from '@/utils/date-display';
import { titleCase } from '@/utils/text';
import { theme, uiColors } from '@/utils/theme';

const IST_TIMEZONE = 'Asia/Kolkata';

export const WORKER_EARNINGS_PERIOD_OPTIONS: WorkerEarningsPeriodOption[] = [
  {
    value: 'TODAY',
    label: APP_TEXT.earnings.periodToday,
    iconName: 'today-outline',
    description: APP_TEXT.earnings.periodTodayDescription,
  },
  {
    value: 'THIS_MONTH',
    label: APP_TEXT.earnings.periodThisMonth,
    iconName: 'calendar-outline',
    description: APP_TEXT.earnings.periodThisMonthDescription,
  },
  {
    value: 'THIS_YEAR',
    label: APP_TEXT.earnings.periodThisYear,
    iconName: 'stats-chart-outline',
    description: APP_TEXT.earnings.periodThisYearDescription,
  },
];

export function parseAmount(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }
  return 0;
}

export function formatInr(amount: string | number | null | undefined): string {
  const parsed = parseAmount(amount);
  return `\u20B9${parsed.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function hasNonZeroFinanceAmount(amount: string | number | null | undefined): boolean {
  return parseAmount(amount) > 0;
}

export function getSettlementPayoutProofReference(invoice: SettlementPayoutInvoice): string | null {
  const utr = invoice.utr?.trim();
  if (utr) return utr;
  const providerReference = invoice.providerReference?.trim();
  return providerReference || null;
}

export function formatSettlementPayoutProvider(provider: SettlementPayoutProvider | null): string | null {
  if (provider === 'razorpayx') return 'RazorpayX';
  if (provider === 'phonepe') return 'PhonePe';
  return null;
}

export function getSettlementPayoutStatusTitle(status: SettlementPayoutStatus): string {
  const map: Record<SettlementPayoutStatus, string> = {
    PENDING: APP_TEXT.earnings.payoutStatusPendingTitle,
    PROCESSING: APP_TEXT.earnings.payoutStatusProcessingTitle,
    PAID: APP_TEXT.earnings.payoutStatusPaidTitle,
    FAILED: APP_TEXT.earnings.payoutStatusFailedTitle,
    BLOCKED: APP_TEXT.earnings.payoutStatusBlockedTitle,
  };
  return map[status] ?? status;
}

export function getSettlementPayoutStatusSubtitle(
  status: SettlementPayoutStatus,
  blockedReason?: string | null,
): string | null {
  if (status === 'PENDING') return APP_TEXT.earnings.payoutStatusPendingSubtitle;
  if (status === 'PROCESSING') return APP_TEXT.earnings.payoutStatusProcessingSubtitle;
  if (status === 'FAILED') return APP_TEXT.earnings.payoutStatusFailedHint;
  if (status === 'BLOCKED' && blockedReason?.toUpperCase() === 'BANK_INFO_MISSING') {
    return APP_TEXT.earnings.payoutStatusBlockedBankInfo;
  }
  return null;
}

export function getSettlementPayoutStatusTone(status: SettlementPayoutStatus, isDark: boolean) {
  if (status === 'PAID') {
    return {
      backgroundColor: isDark ? uiColors.status.successDark : uiColors.status.successLight,
      textColor: uiColors.status.successText,
    };
  }
  if (status === 'FAILED') {
    return {
      backgroundColor: isDark ? uiColors.status.dangerDark : uiColors.status.dangerLight,
      textColor: uiColors.status.dangerText,
    };
  }
  if (status === 'BLOCKED') {
    return {
      backgroundColor: isDark ? uiColors.status.warningDark : uiColors.status.warningLight,
      textColor: uiColors.status.warningText,
    };
  }
  return {
    backgroundColor: isDark ? uiColors.status.neutralDark : uiColors.status.neutralLight,
    textColor: uiColors.status.neutralText,
  };
}

export function getSettlementPayoutMethodLabel(method: SettlementPayoutInvoice['method']): string | null {
  if (method === 'UPI') return APP_TEXT.earnings.payoutMethodUpi;
  if (method === 'BANK') return APP_TEXT.earnings.payoutMethodBank;
  return null;
}

export function formatIstDate(date: string): string {
  const normalized = date.trim();
  if (!normalized) return '--';
  const parts = normalized.split('-').map(Number);
  if (parts.length !== 3 || parts.some(part => Number.isNaN(part))) {
    return normalized;
  }
  const [year, month, day] = parts;
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return formatDisplayDate(utcDate, { timeZone: IST_TIMEZONE });
}

export function formatIstDateTime(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return formatDisplayDateTime(parsed, { timeZone: IST_TIMEZONE });
}

export function getWorkerEarningsWalletCardIconName(card: WorkerEarningsWalletCard): keyof typeof Ionicons.glyphMap {
  const key = typeof card.key === 'string' ? card.key.trim() : null;
  if (key === 'commissionDueBalance') return 'receipt-outline';
  if (key === 'payoutProcessingBalance') return 'card-outline';
  return 'wallet-outline';
}

export function formatGrowthVsLabel(previousPeriodLabel: string | null | undefined): string {
  const label = previousPeriodLabel?.trim();
  return label ? `vs ${label}` : '';
}

export function getWorkerEarningsGrowthBadgeFromPeriod(
  growth: WorkerEarningsGrowthPeriod | null | undefined,
): WorkerEarningsGrowthBadgeData | null {
  if (!growth) return null;
  if (growth.growthPercent == null) return null;

  const vsSuffix = formatGrowthVsLabel(growth.previousPeriodLabel);

  if (growth.direction === 'UP') {
    return {
      label: vsSuffix
        ? `\u2191 ${growth.growthPercent}% ${vsSuffix}`
        : `\u2191 ${growth.growthPercent}%`,
      direction: 'UP',
    };
  }
  if (growth.direction === 'DOWN') {
    const percent = Math.abs(growth.growthPercent);
    return {
      label: vsSuffix
        ? `\u2193 ${percent}% ${vsSuffix}`
        : `\u2193 ${percent}%`,
      direction: 'DOWN',
    };
  }
  return {
    label: vsSuffix
      ? `${APP_TEXT.earnings.growthNoChange} ${vsSuffix}`
      : APP_TEXT.earnings.growthNoChange,
    direction: 'NONE',
  };
}

export function getWorkerEarningsSummaryGrowthPeriod(
  summary: WorkerEarningsSummaryResponse | null,
  period: EarningsGrowthApiPeriodType = 'this_month',
): WorkerEarningsGrowthPeriod | null {
  const periods = summary?.growth?.periods;
  if (!periods) return null;
  return periods[period]
    ?? periods.this_month
    ?? periods.today
    ?? periods.this_year
    ?? null;
}

export function getWorkerEarningsSummaryGrowthBadge(
  summary: WorkerEarningsSummaryResponse | null,
  period: EarningsGrowthApiPeriodType = 'this_month',
): WorkerEarningsGrowthBadgeData | null {
  return getWorkerEarningsGrowthBadgeFromPeriod(getWorkerEarningsSummaryGrowthPeriod(summary, period));
}

export function getWorkerEarningsGrowthDirection(
  dashboard: WorkerEarningsDashboardResponse | null,
): WorkerEarningsComparisonDirection | null {
  if (dashboard?.comparison?.earningsGrowthPercent == null) return null;
  return dashboard.comparison.direction ?? 'NONE';
}

export function getGrowthCompareSuffix(periodType: EarningsApiPeriodType | undefined): string {
  if (periodType === 'today') return APP_TEXT.earnings.growthVsYesterdaySuffix;
  if (periodType === 'this_year') return APP_TEXT.earnings.growthVsLastYearSuffix;
  if (periodType === 'custom') return APP_TEXT.earnings.growthVsPreviousRangeSuffix;
  return APP_TEXT.earnings.growthVsLastMonthSuffix;
}

export function getWorkerEarningsGrowthLabel(dashboard: WorkerEarningsDashboardResponse | null): string | null {
  const growthPercent = dashboard?.comparison?.earningsGrowthPercent;
  if (growthPercent == null) return null;

  const direction = dashboard?.comparison?.direction ?? 'NONE';
  const suffix = getGrowthCompareSuffix(dashboard?.period?.type);

  if (direction === 'UP') return `\u2191 ${growthPercent}% ${suffix}`;
  if (direction === 'DOWN') return `\u2193 ${Math.abs(growthPercent)}% ${suffix}`;
  return APP_TEXT.earnings.growthNoChange;
}

export function getWorkerEarningsLifetimeSummary(
  summary: WorkerEarningsSummaryResponse | null,
): Pick<WorkerEarningsDashboardSummary, 'netEarnings' | 'completedJobs' | 'averageEarningPerJob'> {
  return {
    netEarnings: summary?.lifetime?.netEarnings ?? '0.00',
    completedJobs: summary?.lifetime?.completedJobs ?? 0,
    averageEarningPerJob: summary?.lifetime?.averageEarningPerJob ?? '0.00',
  };
}

export function getSettlementsPeriodSummary(
  settlements: WorkerEarningsSettlementsResponse | null,
): Pick<WorkerEarningsDashboardSummary, 'netEarnings' | 'completedJobs' | 'averageEarningPerJob'> {
  return {
    netEarnings: settlements?.periodSummary?.netEarnings ?? '0.00',
    completedJobs: settlements?.periodSummary?.completedJobs ?? 0,
    averageEarningPerJob: '0.00',
  };
}

export function getSettlementsPeriodLabel(
  settlements: WorkerEarningsSettlementsResponse | null,
): string {
  return settlements?.period?.label ?? APP_TEXT.earnings.periodThisMonth;
}

export function formatNetSettlementCardLabel(settlement: SettlementNetSettlement | null | undefined): string {
  const direction = settlement?.direction ?? 'NONE';
  const amount = formatInr(settlement?.amount ?? '0.00');
  if (direction === 'DELLITE_PAYS_WORKER') {
    return `${APP_TEXT.earnings.dellitePaysPrefix} ${amount}`;
  }
  if (direction === 'WORKER_PAYS_DELLITE') {
    return `${APP_TEXT.earnings.youPayDellitePrefix} ${amount}`;
  }
  return amount;
}

export function formatSettlementJobServicesLabel(services: SettlementJobServiceLine[]): string {
  return services
    .map(service => titleCase(service.serviceName))
    .filter(Boolean)
    .join(' · ');
}

export function getSettlementJobsBadgeLabel(count: number | null | undefined): string {
  const normalized = count ?? 0;
  const suffix = normalized === 1 ? APP_TEXT.earnings.jobSingularSuffix : APP_TEXT.earnings.jobsSuffix;
  return `${normalized} ${suffix}`;
}

export function getEarningsCardShadowStyle(isDark: boolean) {
  return {
    shadowColor: uiColors.shadow.base,
    shadowOpacity: isDark ? 0.24 : 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  };
}

export function getWorkerEarningsPeriodSummary(
  dashboard: WorkerEarningsDashboardResponse | null,
): Pick<WorkerEarningsDashboardSummary, 'netEarnings' | 'completedJobs' | 'averageEarningPerJob'> {
  return {
    netEarnings: dashboard?.summary?.netEarnings ?? '0.00',
    completedJobs: dashboard?.summary?.completedJobs ?? 0,
    averageEarningPerJob: dashboard?.summary?.averageEarningPerJob ?? '0.00',
  };
}

export function getWorkerEarningsStatCards(
  currentPosition: WorkerEarningsCurrentPosition | null | undefined,
): WorkerEarningsStatCardData[] {
  return [
    {
      key: 'ready-for-payout',
      title: APP_TEXT.earnings.readyForPayoutTitle,
      amount: currentPosition?.delliteOwesWorker ?? '0.00',
      helperText: APP_TEXT.earnings.readyForPayoutHelper,
      tone: 'success',
      iconName: 'wallet-outline',
    },
    {
      key: 'commission-due',
      title: APP_TEXT.earnings.commissionDueTitle,
      amount: currentPosition?.workerOwesDellite ?? '0.00',
      helperText: APP_TEXT.earnings.commissionDueHelper,
      tone: parseAmount(currentPosition?.workerOwesDellite) > 0 ? 'warning' : 'warning',
      iconName: 'receipt-outline',
    },
    {
      key: 'payout-process',
      title: APP_TEXT.earnings.payoutInProcessTitle,
      amount: currentPosition?.payoutInProcess ?? '0.00',
      helperText: APP_TEXT.earnings.payoutInProcessHelper,
      tone: 'info',
      iconName: 'card-outline',
    },
    {
      key: 'paid-by-dellite',
      title: APP_TEXT.earnings.totalPaidByDelliteTitle,
      amount: currentPosition?.totalPaidLifetimeByDellite ?? '0.00',
      helperText: APP_TEXT.earnings.totalPaidByDelliteHelper,
      tone: 'paid',
      iconName: 'checkmark-done-outline',
    },
  ];
}

export function getWorkerEarningsJobCountLabel(count: number | null | undefined) {
  return `${count ?? 0} ${APP_TEXT.earnings.jobsSuffix}`;
}

export function getWorkerEarningsNetSettlementLabel(settlement: SettlementNetSettlement | null | undefined) {
  if (settlement?.displayText) return settlement.displayText;
  if (settlement?.label) return settlement.label;
  return APP_TEXT.earnings.settledLabel;
}

export function getWorkerEarningsNetSettlementDirection(settlement: SettlementNetSettlement | null | undefined) {
  return settlement?.direction ?? 'NONE';
}

export function getWorkerEarningsGrowthTone(direction: WorkerEarningsComparisonDirection, isDark: boolean) {
  if (direction === 'UP') {
    return {
      backgroundColor: isDark ? uiColors.status.successDark : uiColors.status.successLight,
      textColor: uiColors.status.successText,
      iconName: 'trending-up-outline',
    };
  }
  if (direction === 'DOWN') {
    return {
      backgroundColor: isDark ? uiColors.status.dangerDark : uiColors.status.dangerLight,
      textColor: uiColors.status.dangerText,
      iconName: 'trending-down-outline',
    };
  }
  return {
    backgroundColor: isDark ? uiColors.status.neutralDark : uiColors.status.neutralLight,
    textColor: uiColors.status.neutralText,
    iconName: 'remove-outline',
  };
}

export function getWorkerEarningsStatTone(tone: string, isDark: boolean) {
  if (tone === 'success') {
    return {
      backgroundColor: isDark ? uiColors.status.successDark : uiColors.status.successLight,
      textColor: uiColors.status.successText,
      iconColor: uiColors.status.successText,
    };
  }
  if (tone === 'warning') {
    return {
      backgroundColor: isDark ? uiColors.status.dangerDark : uiColors.status.dangerLight,
      textColor: uiColors.status.dangerText,
      iconColor: uiColors.status.dangerText,
    };
  }
  if (tone === 'info') {
    return {
      backgroundColor: isDark ? uiColors.status.infoDark : uiColors.status.infoLight,
      textColor: uiColors.status.infoText,
      iconColor: uiColors.status.infoText,
    };
  }
  return {
    backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20,
    textColor: theme.colors.primary,
    iconColor: theme.colors.primary,
  };
}

export function getWorkerEarningsPaymentModeTone(tone: string, isDark: boolean) {
  if (tone === 'online') {
    return {
      backgroundColor: isDark ? uiColors.status.infoDark : '#E8F1FF',
      borderColor: isDark ? uiColors.status.infoText : '#8CB8FF',
      textColor: isDark ? uiColors.status.infoText : '#2563EB',
      iconName: 'globe-outline',
    };
  }
  if (tone === 'upi') {
    return {
      backgroundColor: isDark ? uiColors.status.successDark : '#E8F8EF',
      borderColor: isDark ? uiColors.status.successText : '#7FD4A0',
      textColor: isDark ? uiColors.status.successText : '#15803D',
      iconName: 'swap-horizontal-outline',
    };
  }
  return {
    backgroundColor: isDark ? uiColors.status.warningDark : '#FFF4E8',
    borderColor: isDark ? uiColors.status.warningText : '#F5B56B',
    textColor: isDark ? uiColors.status.warningText : '#C2410C',
    iconName: 'cash-outline',
  };
}

export function getWorkerEarningsNetSettlementTone(direction: string, isDark: boolean) {
  if (direction === 'DELLITE_PAYS_WORKER') {
    return {
      backgroundColor: isDark ? uiColors.status.successDark : uiColors.status.successLight,
      textColor: uiColors.status.successText,
      iconName: 'arrow-up-outline',
    };
  }
  if (direction === 'WORKER_PAYS_DELLITE') {
    return {
      backgroundColor: isDark ? uiColors.status.dangerDark : uiColors.status.dangerLight,
      textColor: uiColors.status.dangerText,
      iconName: 'warning-outline',
    };
  }
  return {
    backgroundColor: isDark ? uiColors.status.neutralDark : uiColors.status.neutralLight,
    textColor: uiColors.status.neutralText,
    iconName: 'checkmark-circle-outline',
  };
}

export function getSettlementStatusLabel(status: SettlementStatus): string {
  const map: Record<SettlementStatus, string> = {
    COMMISSION_DUE: APP_TEXT.earnings.statusCommissionDue,
    DRAFT: APP_TEXT.earnings.statusDraft,
    READY_FOR_PAYOUT: APP_TEXT.earnings.statusReady,
    PROCESSING: APP_TEXT.earnings.statusProcessing,
    PAID: APP_TEXT.earnings.statusPaid,
    SETTLED: APP_TEXT.earnings.statusSettled,
  };
  return map[status] ?? status;
}

export function getSettlementStatusTone(status: SettlementStatus, isDark: boolean) {
  if (status === 'COMMISSION_DUE') {
    return {
      backgroundColor: isDark ? uiColors.status.dangerDark : uiColors.status.dangerLight,
      textColor: uiColors.status.dangerText,
    };
  }
  if (status === 'READY_FOR_PAYOUT' || status === 'PAID') {
    return {
      backgroundColor: isDark ? uiColors.status.successDark : uiColors.status.successLight,
      textColor: uiColors.status.successText,
    };
  }
  if (status === 'PROCESSING') {
    return {
      backgroundColor: isDark ? uiColors.status.infoDark : uiColors.status.infoLight,
      textColor: uiColors.status.infoText,
    };
  }
  return {
    backgroundColor: isDark ? uiColors.status.neutralDark : uiColors.status.neutralLight,
    textColor: uiColors.status.neutralText,
  };
}

export function getSettlementJobPaymentModeLabel(mode: SettlementJobRow['paymentMode']): string {
  if (mode === 'CASH') return APP_TEXT.earnings.cashModeLabel;
  if (mode === 'WORKER_UPI') return APP_TEXT.earnings.upiModeLabel;
  return APP_TEXT.earnings.onlineModeLabel;
}

export function getSettlementJobPaymentModeTone(mode: SettlementJobRow['paymentMode'], isDark: boolean) {
  if (mode === 'CASH') return getWorkerEarningsPaymentModeTone('cash', isDark);
  if (mode === 'WORKER_UPI') return getWorkerEarningsPaymentModeTone('upi', isDark);
  return getWorkerEarningsPaymentModeTone('online', isDark);
}

export function getSettlementExplanation(
  direction: SettlementNetSettlement['direction'],
  priorCommissionDueApplied: string,
): string[] {
  const messages: string[] = [];

  if (direction === 'WORKER_PAYS_DELLITE') {
    messages.push(APP_TEXT.earnings.explanationWorkerPays);
  } else if (direction === 'DELLITE_PAYS_WORKER') {
    messages.push(APP_TEXT.earnings.explanationDellitePays);
  }

  if (parseAmount(priorCommissionDueApplied) > 0) {
    messages.push(APP_TEXT.earnings.explanationCarriedForward);
  }

  return messages;
}

export function isTodayPeriod(period: WorkerEarningsPeriodFilterValue | undefined): boolean {
  return period === 'TODAY';
}

export function validateDateRangeInput(startDate: string, endDate: string): string | null {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
    return APP_TEXT.earnings.customDateInvalidFormat;
  }
  if (startDate > endDate) {
    return APP_TEXT.earnings.customDateRangeInvalid;
  }
  return null;
}
