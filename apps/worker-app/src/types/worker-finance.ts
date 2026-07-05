import type { OnlinePaymentFlowResult } from '@/payments/types';

export type WorkerFinanceAmount = string | number | null;

export type WorkerFinancePagination = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
};

export type WorkerFinanceListQuery = {
  page?: number;
  limit?: number;
  period?: WorkerEarningsPeriodFilterValue;
  startDate?: string;
  endDate?: string;
};

export type WorkerFinanceLoadArgs = {
  isRefresh?: boolean;
  page?: number;
  append?: boolean;
};

export type WorkerWallet = {
  workerId?: string | null;
  commissionDueBalance?: WorkerFinanceAmount;
  availableBalance?: WorkerFinanceAmount;
};

export type WorkerEarningsWalletBalances = {
  pendingBalance?: WorkerFinanceAmount;
  availableBalance?: WorkerFinanceAmount;
  commissionDueBalance?: WorkerFinanceAmount;
  payoutProcessingBalance?: WorkerFinanceAmount;
  paidLifetimeAmount?: WorkerFinanceAmount;
};

export type WorkerEarningsWalletCard = {
  key?: string | null;
  title?: string | null;
  amount?: WorkerFinanceAmount;
  description?: string | null;
};

export type WorkerEarningsPeriodFilterValue = 'TODAY' | 'THIS_MONTH' | 'THIS_YEAR' | 'CUSTOM';

export type EarningsApiPeriodType = 'today' | 'this_month' | 'this_year' | 'custom';

export type WorkerEarningsComparisonDirection = 'UP' | 'DOWN' | 'NONE';

export type WorkerEarningsComparison = {
  previousStartDate?: string;
  previousEndDate?: string;
  earningsGrowthPercent?: number | null;
  completedJobsDifference?: number | null;
  avgEarningPerJobDifference?: string | null;
  direction?: WorkerEarningsComparisonDirection | null;
};

export type WorkerEarningsPeriodInfo = {
  type: EarningsApiPeriodType;
  startDate: string;
  endDate: string;
  timezone: 'Asia/Kolkata';
  label: string;
};

export type WorkerEarningsDashboardSummary = {
  netEarnings: string;
  completedJobs: number;
  averageEarningPerJob: string;
  totalBillAmount: string;
  totalCommission: string;
  paymentBreakdown: {
    online: { count: number; billAmount: string; yourEarning: string };
    cash: { count: number; billAmount: string; yourEarning: string };
    workerUpi: { count: number; billAmount: string; yourEarning: string };
  };
};

export type WorkerEarningsCurrentPosition = {
  delliteOwesWorker: string;
  workerOwesDellite: string;
  payoutInProcess: string;
  totalPaidLifetimeByDellite: string;
  pendingCommissionFromEarlierDays?: string;
};

export type WorkerEarningsLifetime = {
  netEarnings: string;
  completedJobs: number;
  averageEarningPerJob: string;
  totalBilled: string;
  totalCommission: string;
};

export type EarningsGrowthApiPeriodType = 'today' | 'this_month' | 'this_year';

export type WorkerEarningsGrowthPeriod = {
  period: EarningsGrowthApiPeriodType;
  label: string;
  previousPeriodLabel: string;
  currentNetEarnings: string;
  previousNetEarnings: string;
  growthPercent: number | null;
  direction: WorkerEarningsComparisonDirection;
  completedJobs: number;
  previousCompletedJobs: number;
  completedJobsDifference: number;
};

export type WorkerEarningsGrowth = {
  periods: Partial<Record<EarningsGrowthApiPeriodType, WorkerEarningsGrowthPeriod>>;
};

export type WorkerEarningsSummaryQuery = {
  includeGrowthRate?: boolean;
  growthPeriod?: EarningsGrowthApiPeriodType;
};

export type WorkerEarningsSummaryResponse = {
  currentPosition: WorkerEarningsCurrentPosition;
  lifetime: WorkerEarningsLifetime;
  settlementInfo: WorkerEarningsSettlementInfo;
  growth?: WorkerEarningsGrowth | null;
  payAllCommissionDue?: WorkerCommissionPayableBlock | null;
};

export type WorkerCommissionPayableBlock = {
  amount: string;
  openDueCount?: number;
  openDueJobCount?: number;
  canPayOnline: boolean;
  providers: Array<'RAZORPAY' | 'PHONEPE'>;
  activeIntent: WorkerCommissionActiveIntent | null;
};

export type WorkerCommissionActiveIntent = {
  paymentId: string;
  provider: string | null;
  status: string;
  expiresAt: string | null;
  amount: string;
};

export type WorkerEarningsGrowthBadgeData = {
  label: string;
  direction: WorkerEarningsComparisonDirection;
};

export type WorkerEarningsPeriodSummary = {
  netEarnings: string;
  completedJobs: number;
  totalBilled: string;
  totalCommission: string;
};

export type WorkerEarningsSettlementsResponse = {
  period: WorkerEarningsPeriodInfo;
  periodSummary: WorkerEarningsPeriodSummary;
  dailySettlementInfo: WorkerEarningsSettlementInfo;
  dailySettlements: SettlementCard[];
  pagination: WorkerFinancePagination;
};

export type WorkerEarningsTabValue = 'SUMMARY' | 'SETTLEMENTS';

export type WorkerEarningsSettlementInfo = {
  title: string;
  badge: string;
  description: string;
};

export type SettlementPaymentModeBreakdown = {
  count: number;
  amount: string;
};

export type SettlementStatus =
  | 'COMMISSION_DUE'
  | 'DRAFT'
  | 'READY_FOR_PAYOUT'
  | 'PROCESSING'
  | 'PAID'
  | 'SETTLED';

export type SettlementPayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'BLOCKED';

export type SettlementPayoutProvider = 'razorpayx' | 'phonepe';

export type SettlementPayoutMethod = 'UPI' | 'BANK';

export type SettlementPayoutInvoiceItem = {
  bookingId: string;
  bookingCode: string;
  payoutAmount: string;
};

export type SettlementPayoutInvoice = {
  payoutId: string;
  payoutCode: string;
  status: SettlementPayoutStatus;
  blockedReason: string | null;
  provider: SettlementPayoutProvider | null;
  method: SettlementPayoutMethod | null;
  maskedDestination: string | null;
  grossAmount: string;
  commissionAdjustedAmount: string;
  payoutAmount: string;
  paidAt: string | null;
  providerPayoutId: string | null;
  providerReference: string | null;
  utr: string | null;
  failureReason: string | null;
  items: SettlementPayoutInvoiceItem[];
};

export type NetSettlementDirection = 'DELLITE_PAYS_WORKER' | 'WORKER_PAYS_DELLITE' | 'NONE';

export type SettlementNetSettlement = {
  direction: NetSettlementDirection;
  amount: string;
  label: string;
  displayText: string;
};

export type SettlementCard = {
  id: string;
  date: string;
  displayDate: string;
  completedJobs: number;
  paymentBreakdown: {
    online: SettlementPaymentModeBreakdown;
    cash: SettlementPaymentModeBreakdown;
    workerUpi: SettlementPaymentModeBreakdown;
  };
  totalPayableAmount: string;
  workerEarningAmount: string;
  commissionAmount: string;
  onlineWorkerEarningAmount: string;
  offlineCommissionDueAmount: string;
  priorCommissionDueApplied: string;
  netSettlement: SettlementNetSettlement;
  status: SettlementStatus;
};

export type SettlementJobPaymentMode = 'ONLINE' | 'CASH' | 'WORKER_UPI';

export type SettlementJobServiceLine = {
  id: string;
  serviceName: string;
  categoryName: string;
  subCategoryName: string;
  quantity: number;
  durationLabel: string;
  lineTotalAmount: string;
  payableAmount: string;
  paidAmount: string;
};

export type SettlementJobRow = {
  bookingId: string;
  bookingCode: string;
  completedAt: string;
  paymentMode: SettlementJobPaymentMode;
  services: SettlementJobServiceLine[];
  tipAmount: string;
  payableAmount: string;
  paidAmount: string;
  workerEarningAmount: string;
  commissionAmount: string;
  status: 'COMPLETED';
};

export type SettlementDetailResponse = SettlementCard & {
  commissionRecoveredAmount: string;
  carriedForwardDueAmount: string;
  jobs: SettlementJobRow[];
  payoutInvoice: SettlementPayoutInvoice | null;
  commissionDuePayable?: WorkerCommissionPayableBlock | null;
};

export type SettlementPayoutInvoiceCardProps = {
  payoutInvoice: SettlementPayoutInvoice;
  onOpenPayoutDetails?: () => void;
};

export type SettlementCommissionDueSummaryCardProps = {
  netSettlement: SettlementNetSettlement;
  carriedForwardDueAmount: string;
  commissionRecoveredAmount: string;
};

export type WorkerEarningsDashboardResponse = {
  period: WorkerEarningsPeriodInfo;
  comparison: WorkerEarningsComparison;
  summary: WorkerEarningsDashboardSummary;
  currentPosition: WorkerEarningsCurrentPosition;
  settlementInfo: WorkerEarningsSettlementInfo;
  settlements: SettlementCard[];
  pagination: WorkerFinancePagination;
};

/** @deprecated Legacy shape — mapped to SettlementCard in API layer */
export type WorkerEarningsDailySettlement = SettlementCard;

/** @deprecated Legacy shape — use SettlementNetSettlement */
export type WorkerEarningsDailyNetSettlement = SettlementNetSettlement;

export type WorkerEarningsOverviewWallet = {
  currency?: string | null;
  balances?: WorkerEarningsWalletBalances | null;
  cards?: WorkerEarningsWalletCard[];
  helperText?: string | null;
};

export type WorkerEarningsSettlement = {
  cycle?: string | null;
  title?: string | null;
  description?: string | null;
  payoutWindowLabel?: string | null;
};

export type WorkerEarningsBookingCustomer = {
  id?: string | null;
  name?: string | null;
  profileImageUrl?: string | null;
};

export type WorkerEarningsBookingInfo = {
  id?: string | null;
  bookingCode?: string | null;
  bookingStatus?: string | null;
  scheduledStartAt?: string | null;
  cityName?: string | null;
  area?: string | null;
  addressLine1?: string | null;
  primaryServiceName?: string | null;
  serviceCount?: number | null;
  customer?: WorkerEarningsBookingCustomer | null;
};

export type WorkerEarningsBookingPayment = {
  paymentStatus?: string | null;
  paymentMode?: string | null;
  payableAmount?: WorkerFinanceAmount;
  paidAmount?: WorkerFinanceAmount;
  tipAmount?: WorkerFinanceAmount;
  commissionSettlementStatus?: string | null;
  paidAt?: string | null;
};

export type WorkerEarningsBookingPayout = {
  payoutCode?: string | null;
  status?: string | null;
  method?: string | null;
  payoutAmount?: WorkerFinanceAmount;
  scheduledFor?: string | null;
};

export type WorkerEarningsOverviewItem = {
  id?: string | null;
  bookingId?: string | null;
  bookingCode?: string | null;
  bookingInfo?: WorkerEarningsBookingInfo | null;
  status?: string | null;
  statusTitle?: string | null;
  statusDescription?: string | null;
  amountTitle?: string | null;
  serviceAmount?: WorkerFinanceAmount;
  extraAmount?: WorkerFinanceAmount;
  tipAmount?: WorkerFinanceAmount;
  commissionAmount?: WorkerFinanceAmount;
  commissionDiscountAmount?: WorkerFinanceAmount;
  netEarningAmount?: WorkerFinanceAmount;
  availableAt?: string | null;
  paidAt?: string | null;
  bookingPayment?: WorkerEarningsBookingPayment | null;
  payout?: WorkerEarningsBookingPayout | null;
};

export type WorkerEarningsOverviewSettlements = {
  items?: WorkerEarningsOverviewItem[];
  pagination?: WorkerFinancePagination;
};

/** @deprecated Use WorkerEarningsDashboardResponse */
export type WorkerEarningsOverviewResponse = WorkerEarningsDashboardResponse;

export type WorkerEarningsPeriodOption = {
  value: WorkerEarningsPeriodFilterValue;
  label: string;
  iconName?: string;
  description?: string;
};

export type SettlementCommissionPayBannerProps = {
  amount: string;
  onPress?: () => void;
  isBusy?: boolean;
};

export type SettlementDayCardLayoutProps = {
  settlement: SettlementCard;
  showStatus?: boolean;
};

export type SettlementCardHeaderProps = {
  displayDate: string;
  status: SettlementStatus;
  showStatus?: boolean;
};

export type CommissionDuePaymentMethod = 'PHONEPE' | 'RAZORPAY';

export type CommissionDuePaymentSheetProps = {
  amount: string;
  providers: Array<'RAZORPAY' | 'PHONEPE'>;
  onClose: () => void;
  onPay: (method: CommissionDuePaymentMethod) => Promise<OnlinePaymentFlowResult>;
};

export type WorkerEarningsPeriodFilterProps = {
  selectedPeriod: WorkerEarningsPeriodFilterValue;
  growthLabel: string | null;
  growthDirection: WorkerEarningsComparisonDirection | null;
  onSelectPeriod: (period: WorkerEarningsPeriodFilterValue) => void;
};

export type WorkerEarningsSummaryCardProps = {
  summary: Pick<WorkerEarningsDashboardSummary, 'netEarnings' | 'completedJobs' | 'averageEarningPerJob'>;
  caption?: string;
  showAveragePerJob?: boolean;
  growthBadge?: WorkerEarningsGrowthBadgeData | null;
};

export type EarningsSettlementsHeaderProps = {
  onOpenFilter: () => void;
  selectedPeriodLabel: string;
};

export type EarningsPeriodFilterSheetProps = {
  selectedPeriod: WorkerEarningsPeriodFilterValue;
  onApply: (period: WorkerEarningsPeriodFilterValue) => void;
  onClose: () => void;
};

export type EarningsTabSwitcherProps = {
  activeTab: WorkerEarningsTabValue;
  onChangeTab: (tab: WorkerEarningsTabValue) => void;
};

export type EarningsCommissionDueBannerProps = {
  amount: string;
  onPress?: () => void;
};

export type WorkerEarningsStatCardTone = 'success' | 'warning' | 'info' | 'paid';

export type WorkerEarningsStatCardData = {
  key: string;
  title: string;
  amount: WorkerFinanceAmount;
  helperText: string;
  tone: WorkerEarningsStatCardTone;
  iconName: string;
};

export type WorkerEarningsStatCardProps = {
  item: WorkerEarningsStatCardData;
  footerText?: string | null;
};

export type WorkerEarningsStatGridProps = {
  cards: WorkerEarningsStatCardData[];
  carriedForwardCommission?: string | null;
};

export type WorkerEarningsPaymentModeChipTone = 'online' | 'cash' | 'upi';

export type WorkerEarningsPaymentModeChipProps = {
  tone: WorkerEarningsPaymentModeChipTone;
  label: string;
  count: number;
};

export type WorkerEarningsNetSettlementPillProps = {
  settlement: SettlementNetSettlement | null | undefined;
  compact?: boolean;
};

export type WorkerEarningsDailySettlementCardProps = {
  item: SettlementCard;
  onPress?: () => void;
};

export type DailySettlementInfoCardProps = {
  settlementInfo: WorkerEarningsSettlementInfo;
};

export type SettlementStatusBadgeProps = {
  status: SettlementStatus;
};

export type SettlementJobRowProps = {
  job: SettlementJobRow;
  onPress?: () => void;
};

export type EarningsDateRangeModalProps = {
  visible: boolean;
  initialStartDate?: string;
  initialEndDate?: string;
  onClose: () => void;
  onApply: (startDate: string, endDate: string) => void;
};

export type WorkerWalletResponse = {
  wallet?: WorkerWallet | null;
};

export type WorkerWalletLedgerItem = {
  id?: string | null;
  amount?: WorkerFinanceAmount;
  direction?: string | null;
  entryType?: string | null;
  bookingId?: string | null;
  bookingCode?: string | null;
  paymentId?: string | null;
  payoutId?: string | null;
  reference?: string | null;
  createdAt?: string | null;
};

export type WorkerWalletLedgerResponse = {
  items?: WorkerWalletLedgerItem[];
  pagination?: WorkerFinancePagination;
};

export type WorkerEarningItem = {
  id?: string | null;
  bookingId?: string | null;
  bookingCode?: string | null;
  grossAmount?: WorkerFinanceAmount;
  tipAmount?: WorkerFinanceAmount;
  commissionAmount?: WorkerFinanceAmount;
  netEarning?: WorkerFinanceAmount;
  status?: string | null;
  createdAt?: string | null;
  paidAt?: string | null;
};

export type WorkerEarningsResponse = {
  items?: WorkerEarningItem[];
  pagination?: WorkerFinancePagination;
};

export type WorkerCommissionDueItem = {
  id?: string | null;
  bookingId?: string | null;
  bookingCode?: string | null;
  dueAmount?: WorkerFinanceAmount;
  paidAmount?: WorkerFinanceAmount;
  remainingAmount?: WorkerFinanceAmount;
  status?: string | null;
  createdAt?: string | null;
};

export type WorkerCommissionDuesResponse = {
  items?: WorkerCommissionDueItem[];
  pagination?: WorkerFinancePagination;
};

export type WorkerCommissionDuePaymentPayload = {
  amount: string;
  reference?: string;
};

export type WorkerPayoutItem = {
  id?: string | null;
  amount?: WorkerFinanceAmount;
  status?: string | null;
  reference?: string | null;
  method?: string | null;
  createdAt?: string | null;
  paidAt?: string | null;
};

export type WorkerPayoutsResponse = {
  items?: WorkerPayoutItem[];
  pagination?: WorkerFinancePagination;
};

export type WorkerPayoutDetailItem = {
  id?: string | null;
  bookingId?: string | null;
  bookingCode?: string | null;
  amount?: WorkerFinanceAmount;
  status?: string | null;
  createdAt?: string | null;
};

export type WorkerPayoutDetailResponse = {
  payout?: WorkerPayoutItem | null;
  items?: WorkerPayoutDetailItem[];
};

export type WorkerFinanceTabValue = 'LEDGER' | 'EARNINGS' | 'COMMISSION_DUES' | 'PAYOUTS';
