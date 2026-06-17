import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl, Text, View, useColorScheme } from 'react-native';
import { getWorkerEarningsSummary, getWorkerSettlementDetail } from '@/actions/workerFinanceActions';
import { CommissionDuePaymentSheet } from '@/components/earnings/CommissionDuePaymentSheet';
import { DetailsTopBar } from '@/components/common/DetailsTopBar';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { ScrollablePillTabs } from '@/components/common/ScrollablePillTabs';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { EarningsSkeleton } from '@/components/earnings/EarningsSkeleton';
import { SettlementCommissionDueSummaryCard } from '@/components/earnings/SettlementCommissionDueSummaryCard';
import { SettlementCommissionPayBanner } from '@/components/earnings/SettlementCommissionPayBanner';
import { SettlementPayoutInvoiceCard } from '@/components/earnings/SettlementPayoutInvoiceCard';
import { SettlementJobRow } from '@/components/earnings/SettlementJobRow';
import { SettlementSummaryBlock } from '@/components/earnings/SettlementSummaryBlock';
import { useBottomSheetContext } from '@/contexts/BottomSheetContext';
import { useOnlinePaymentFlow } from '@/hooks/useOnlinePaymentFlow';
import { openProtectedRootRoute } from '@/navigation/navigationRef';
import { useWorkerSettlementDetailController } from '@/hooks/useWorkerSettlementDetailController';
import { createSettlementCommissionPaymentIntent } from '@/payments/api';
import { isRazorpayProviderAvailable } from '@/payments/paymentProvider';
import type { EarningsStackParamList } from '@/types/navigation';
import type { CommissionDuePaymentMethod, SettlementJobRow as SettlementJobRowType } from '@/types/worker-finance';
import { EARNINGS_STACK_SCREENS, JOB_STACK_SCREENS, PROFILE_SCREENS, ROOT_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { canShowCommissionOnlinePay } from '@/utils/online-payment';
import { getSettlementJobsBadgeLabel, parseAmount } from '@/utils/worker-finance';
import { showToast } from '@/utils/toast';
import { uiColors } from '@/utils/theme';

type SettlementDetailRoute = EarningsStackParamList[typeof EARNINGS_STACK_SCREENS.settlementDetail];

const SETTLEMENT_DETAIL_TABS = [
  { label: APP_TEXT.earnings.settlementTabPayout, value: 'PAYOUT', iconName: 'wallet-outline' as const },
  { label: APP_TEXT.earnings.settlementTabJobs, value: 'JOBS', iconName: 'briefcase-outline' as const },
] as const;

export function SettlementDetailScreen() {
  const isDark = useColorScheme() === 'dark';
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const navigation = useNavigation();
  const route = useRoute();
  const { settlementId } = route.params as SettlementDetailRoute;
  const { showCustomSheet } = useBottomSheetContext();
  const {
    detail,
    detailLoading,
    detailRefreshing,
    detailError,
    refresh,
  } = useWorkerSettlementDetailController(settlementId);
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;
  const commissionPayable = detail?.commissionDuePayable;
  const settlementPayAmount = commissionPayable?.amount ?? detail?.netSettlement.amount ?? '0.00';
  const paymentAmountRef = useRef(settlementPayAmount);
  const canShowSettlementPay = Boolean(
    detail
    && detail.status === 'COMMISSION_DUE'
    && detail.netSettlement.direction === 'WORKER_PAYS_DELLITE'
    && canShowCommissionOnlinePay(commissionPayable)
    && isRazorpayProviderAvailable(commissionPayable?.providers),
  );

  const { isBusy: isSettlementPayBusy, runPayment: runSettlementPayment } = useOnlinePaymentFlow({
    createIntent: () => createSettlementCommissionPaymentIntent(settlementId, {
      provider: 'RAZORPAY',
      amount: paymentAmountRef.current,
    }),
    fetchState: () => getWorkerSettlementDetail(settlementId),
    isPaymentDone: (settlement) => parseAmount(settlement.commissionDuePayable?.amount ?? '0.00') <= 0,
    onSettled: async (result) => {
      await refresh();
      await getWorkerEarningsSummary({ includeGrowthRate: true }).catch(() => undefined);
      if (result === 'processing') {
        showToast('info', APP_TEXT.earnings.commissionPaymentProcessing);
      }
      if (result === 'cancelled') {
        showToast('info', APP_TEXT.earnings.commissionPaymentCancelled);
      }
      if (result === 'failed') {
        showToast('error', APP_TEXT.earnings.commissionPaymentFailed);
      }
    },
  });

  const canShowCommissionDueSummary = Boolean(
    detail
    && !detail.payoutInvoice
    && detail.netSettlement.direction === 'WORKER_PAYS_DELLITE',
  );
  const [activeTab, setActiveTab] = useState<(typeof SETTLEMENT_DETAIL_TABS)[number]['value']>('PAYOUT');
  const hasPayoutContent = canShowCommissionDueSummary || Boolean(detail?.payoutInvoice) || canShowSettlementPay;
  const jobsCount = detail?.jobs.length ?? 0;
  const settlementTabs = useMemo(
    () => SETTLEMENT_DETAIL_TABS.map(tab => ({
      ...tab,
      label: tab.value === 'JOBS' && jobsCount > 0 ? `${tab.label} (${jobsCount})` : tab.label,
    })),
    [jobsCount],
  );

  const openPayoutDetails = useCallback(() => {
    openProtectedRootRoute(ROOT_SCREENS.mainTabsNavigator, ROOT_SCREENS.profileDetailsNavigator, {
      screen: PROFILE_SCREENS.payoutDetails,
    });
  }, []);

  const openSettlementPaySheet = useCallback(() => {
    if (!canShowSettlementPay || !commissionPayable) return;

    showCustomSheet({
      title: APP_TEXT.earnings.commissionPaySheetTitle,
      snapPoint: '58%',
      renderContent: ({ closeSheet }) => (
        <CommissionDuePaymentSheet
          amount={settlementPayAmount}
          providers={commissionPayable.providers}
          onClose={closeSheet}
          onPay={async (method: CommissionDuePaymentMethod) => {
            if (method !== 'RAZORPAY' || isSettlementPayBusy) return 'busy';
            paymentAmountRef.current = settlementPayAmount;
            return runSettlementPayment();
          }}
        />
      ),
    });
  }, [
    canShowSettlementPay,
    commissionPayable,
    isSettlementPayBusy,
    runSettlementPayment,
    settlementPayAmount,
    showCustomSheet,
  ]);

  const handleJobPress = (bookingId: string) => {
    openProtectedRootRoute(ROOT_SCREENS.mainTabsNavigator, ROOT_SCREENS.jobDetailsNavigator, {
      screen: JOB_STACK_SCREENS.details,
      params: { jobId: bookingId },
    });
  };

  return (
    <GradientScreen
      refreshControl={(
        <RefreshControl
          key={modeKey}
          refreshing={detailRefreshing}
          onRefresh={() => {
            void refresh();
          }}
          {...refreshProps}
        />
      )}
    >
      <DetailsTopBar onBack={() => navigation.goBack()} />

      <Text className="text-2xl font-black text-baseDark dark:text-white">
        {APP_TEXT.earnings.settlementDetailTitle}
      </Text>
      {detail ? (
        <Text className="mt-1 text-sm leading-5" style={{ color: mutedTextColor }}>
          {`${detail.displayDate} · ${getSettlementJobsBadgeLabel(detail.completedJobs)}`}
        </Text>
      ) : (
        <Text className="mt-1 text-sm leading-5" style={{ color: mutedTextColor }}>
          {APP_TEXT.earnings.settlementDetailSubtitle}
        </Text>
      )}

      {detailLoading ? <EarningsSkeleton /> : null}

      {!detailLoading && detailError ? (
        <ListEmptyState
          containerClassName="mt-4"
          title={APP_TEXT.earnings.retryErrorTitle}
          description={detailError}
          icon="alert-circle-outline"
          actionLabel={APP_TEXT.earnings.refreshAction}
          onAction={() => {
            void refresh();
          }}
        />
      ) : null}

      {!detailLoading && !detailError && detail ? (
        <>
          <View className="mt-4">
            <SettlementSummaryBlock settlement={detail} />
          </View>

          <ScrollablePillTabs
            items={settlementTabs}
            value={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === 'PAYOUT' ? (
            <View className="mt-4 gap-4">
              {canShowCommissionDueSummary ? (
                <SettlementCommissionDueSummaryCard
                  netSettlement={detail.netSettlement}
                  carriedForwardDueAmount={detail.carriedForwardDueAmount}
                  commissionRecoveredAmount={detail.commissionRecoveredAmount}
                />
              ) : null}

              {detail.payoutInvoice ? (
                <SettlementPayoutInvoiceCard
                  payoutInvoice={detail.payoutInvoice}
                  onOpenPayoutDetails={openPayoutDetails}
                />
              ) : null}

              {canShowSettlementPay ? (
                <SettlementCommissionPayBanner
                  amount={settlementPayAmount}
                  isBusy={isSettlementPayBusy}
                  onPress={openSettlementPaySheet}
                />
              ) : null}

              {!hasPayoutContent ? (
                <ListEmptyState
                  title={APP_TEXT.earnings.settlementPayoutEmptyTitle}
                  description={APP_TEXT.earnings.settlementPayoutEmptyDescription}
                  icon="wallet-outline"
                />
              ) : null}
            </View>
          ) : (
            <View className="mt-4">
              <Text className="text-lg font-black text-baseDark dark:text-white">
                {APP_TEXT.earnings.jobsInSettlementTitle}
              </Text>
              <Text className="mt-1 text-sm leading-5" style={{ color: mutedTextColor }}>
                {APP_TEXT.earnings.settlementDetailSubtitle}
              </Text>

              {detail.jobs.length === 0 ? (
                <ListEmptyState
                  containerClassName="mt-4"
                  title={APP_TEXT.earnings.jobsBreakdownUnavailable}
                  description=""
                  icon="document-text-outline"
                />
              ) : (
                <View className="mt-4 gap-3">
                  {detail.jobs.map((job: SettlementJobRowType) => (
                    <SettlementJobRow
                      key={job.bookingId}
                      job={job}
                      onPress={job.bookingId ? () => handleJobPress(job.bookingId) : undefined}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </>
      ) : null}
    </GradientScreen>
  );
}
