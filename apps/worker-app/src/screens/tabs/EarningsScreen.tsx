import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useRef } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { getWorkerEarningsSummary } from '@/actions/workerFinanceActions';
import { CommissionDuePaymentSheet } from '@/components/earnings/CommissionDuePaymentSheet';
import { DailySettlementCard } from '@/components/earnings/DailySettlementCard';
import { DailySettlementInfoCard } from '@/components/earnings/DailySettlementInfoCard';
import { EarningsCommissionDueBanner } from '@/components/earnings/EarningsCommissionDueBanner';
import { EarningsPeriodFilterSheet } from '@/components/earnings/EarningsPeriodFilterSheet';
import { EarningsSettlementsHeader } from '@/components/earnings/EarningsSettlementsHeader';
import { EarningsSkeleton } from '@/components/earnings/EarningsSkeleton';
import { EarningsStatGrid } from '@/components/earnings/EarningsStatGrid';
import { EarningsSummaryCard } from '@/components/earnings/EarningsSummaryCard';
import { EarningsTabSwitcher } from '@/components/earnings/EarningsTabSwitcher';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { PermissionPromptCard } from '@/components/common/PermissionPromptCard';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBottomSheetContext } from '@/contexts/BottomSheetContext';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { useBrandRefreshControlProps } from '@/components/common/BrandRefreshControl';
import { useWorkerFinanceController } from '@/hooks/useWorkerFinanceController';
import { useOnlinePaymentFlow } from '@/hooks/useOnlinePaymentFlow';
import { createAllCommissionDuesPaymentIntent } from '@/payments/api';
import { isRazorpayProviderAvailable } from '@/payments/paymentProvider';
import type { EarningsStackParamList } from '@/types/navigation';
import type { CommissionDuePaymentMethod, WorkerEarningsPeriodFilterValue } from '@/types/worker-finance';
import { EARNINGS_STACK_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import {
  getSettlementsPeriodLabel,
  getWorkerEarningsLifetimeSummary,
  getWorkerEarningsStatCards,
  getWorkerEarningsSummaryGrowthBadge,
  isTodayPeriod,
  parseAmount,
} from '@/utils/worker-finance';
import { canShowCommissionOnlinePay } from '@/utils/online-payment';
import { showToast } from '@/utils/toast';

export function EarningsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EarningsStackParamList>>();
  const { showCustomSheet } = useBottomSheetContext();
  const { modeKey, refreshProps } = useBrandRefreshControlProps();
  const hasHandledInitialFocusRef = useRef(false);
  const { locationState } = useAuthContext();
  const { permissionStatus, initializeLocation, requestLocationPermission } = locationState;
  const shouldShowLocationPrompt = permissionStatus !== 'granted';
  const {
    activeTab,
    summaryData,
    settlementsData,
    settlementItems,
    selectedPeriod,
    hasMore,
    summaryLoading,
    settlementsLoading,
    summaryRefreshing,
    settlementsRefreshing,
    loadingMore,
    summaryError,
    settlementsError,
    changeTab,
    applyPeriodFilter,
    refresh,
    reloadSilently,
    loadMore,
  } = useWorkerFinanceController();
  const isSummaryTab = activeTab === 'SUMMARY';
  const tabLoading = isSummaryTab ? summaryLoading : settlementsLoading;
  const tabRefreshing = isSummaryTab ? summaryRefreshing : settlementsRefreshing;
  const tabError = isSummaryTab ? summaryError : settlementsError;
  const lifetimeSummary = getWorkerEarningsLifetimeSummary(summaryData);
  const summaryGrowthBadge = getWorkerEarningsSummaryGrowthBadge(summaryData, 'this_month');
  const statCards = getWorkerEarningsStatCards(summaryData?.currentPosition);
  const selectedPeriodLabel = getSettlementsPeriodLabel(settlementsData);
  const settlementInfo = summaryData?.settlementInfo ?? {
    title: APP_TEXT.earnings.dailySettlementTitle,
    badge: APP_TEXT.earnings.dailySettlementBadge,
    description: APP_TEXT.earnings.dailySettlementDescription,
  };
  const isToday = isTodayPeriod(selectedPeriod);
  const emptyTitle = isToday
    ? APP_TEXT.earnings.emptyTodaySettlementTitle
    : APP_TEXT.earnings.emptySettlementsTitle;
  const emptyDescription = isToday
    ? APP_TEXT.earnings.emptyTodaySettlementDescription
    : APP_TEXT.earnings.emptySettlementsDescription;
  const workerOwesDellite = summaryData?.currentPosition?.workerOwesDellite ?? '0.00';
  const payAllBlock = summaryData?.payAllCommissionDue;
  const payAllAmount = payAllBlock?.amount ?? workerOwesDellite;
  const paymentAmountRef = useRef(payAllAmount);
  const canShowPayAllBanner = parseAmount(workerOwesDellite) > 0
    && canShowCommissionOnlinePay(payAllBlock)
    && isRazorpayProviderAvailable(payAllBlock?.providers);

  const { isBusy: isPayAllBusy, runPayment: runPayAllPayment } = useOnlinePaymentFlow({
    createIntent: () => createAllCommissionDuesPaymentIntent({
      provider: 'RAZORPAY',
      amount: paymentAmountRef.current,
    }),
    fetchState: () => getWorkerEarningsSummary({ includeGrowthRate: true }),
    isPaymentDone: (summary) => {
      const block = summary.payAllCommissionDue;
      const dueAmount = block?.amount ?? summary.currentPosition.workerOwesDellite;
      return parseAmount(dueAmount) <= 0;
    },
    onSettled: async (result) => {
      await reloadSilently();
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

  useFocusEffect(useCallback(() => {
    if (!hasHandledInitialFocusRef.current) {
      hasHandledInitialFocusRef.current = true;
      return undefined;
    }

    void reloadSilently();
    return undefined;
  }, [reloadSilently]));

  const handleLocationPermissionAction = async () => {
    const status = await requestLocationPermission();
    if (status === 'granted') {
      await initializeLocation({ forceRefresh: true });
    }
  };

  const handleSettlementPress = (settlementId: string) => {
    navigation.navigate(EARNINGS_STACK_SCREENS.settlementDetail, {
      settlementId,
    });
  };

  const openPeriodFilterSheet = useCallback(() => {
    showCustomSheet({
      title: APP_TEXT.earnings.filterByPeriodTitle,
      snapPoint: '70%',
      renderContent: ({ closeSheet }) => (
        <EarningsPeriodFilterSheet
          selectedPeriod={selectedPeriod}
          onClose={closeSheet}
          onApply={(period: WorkerEarningsPeriodFilterValue) => {
            applyPeriodFilter(period);
          }}
        />
      ),
    });
  }, [applyPeriodFilter, selectedPeriod, showCustomSheet]);

  const openCommissionPaySheet = useCallback(() => {
    if (!canShowPayAllBanner) return;

    showCustomSheet({
      title: APP_TEXT.earnings.commissionPaySheetTitle,
      snapPoint: '58%',
      renderContent: ({ closeSheet }) => (
        <CommissionDuePaymentSheet
          amount={payAllAmount}
          providers={payAllBlock?.providers ?? ['RAZORPAY']}
          onClose={closeSheet}
          onPay={async (method: CommissionDuePaymentMethod) => {
            if (method !== 'RAZORPAY' || isPayAllBusy) return 'busy';
            paymentAmountRef.current = payAllAmount;
            return runPayAllPayment();
          }}
        />
      ),
    });
  }, [canShowPayAllBanner, isPayAllBusy, payAllAmount, payAllBlock?.providers, runPayAllPayment, showCustomSheet]);

  return (
    <GradientScreen
      refreshControl={(
        <RefreshControl
          key={modeKey}
          refreshing={tabRefreshing}
          onRefresh={() => {
            void refresh();
          }}
          {...refreshProps}
        />
      )}
    >
      {shouldShowLocationPrompt ? (
        <View className="mb-4">
          <PermissionPromptCard
            tone="location"
            title={APP_TEXT.home.locationAccess.title}
            subtitle={APP_TEXT.home.locationAccess.subtitle}
            actionLabel={APP_TEXT.home.locationAccess.actionLabel}
            onAction={() => {
              void handleLocationPermissionAction();
            }}
            helperText={APP_TEXT.home.locationAccess.helpText}
          />
        </View>
      ) : null}

      <Text className="text-2xl font-black text-baseDark dark:text-white">
        {`${APP_TEXT.earnings.titlePrefix} ${APP_TEXT.earnings.title}`}
      </Text>

      <View className="mt-4">
        <EarningsTabSwitcher activeTab={activeTab} onChangeTab={changeTab} />
      </View>

      {tabLoading ? (
        <EarningsSkeleton />
      ) : null}

      {!tabLoading && tabError ? (
        <ListEmptyState
          containerClassName="mt-4"
          title={APP_TEXT.earnings.retryErrorTitle}
          description={tabError}
          icon="alert-circle-outline"
          actionLabel={APP_TEXT.earnings.refreshAction}
          onAction={() => {
            void refresh();
          }}
        />
      ) : null}

      {!tabLoading && !tabError && isSummaryTab ? (
        <>
          <EarningsSummaryCard
            summary={lifetimeSummary}
            caption={APP_TEXT.earnings.netEarningsCaption}
            growthBadge={summaryGrowthBadge}
          />
          {canShowPayAllBanner ? (
            <EarningsCommissionDueBanner amount={payAllAmount} onPress={openCommissionPaySheet} />
          ) : null}
          <EarningsStatGrid cards={statCards} />
          <DailySettlementInfoCard settlementInfo={settlementInfo} />
        </>
      ) : null}

      {!tabLoading && !tabError && !isSummaryTab ? (
        <>
          <EarningsSettlementsHeader
            onOpenFilter={openPeriodFilterSheet}
            selectedPeriodLabel={selectedPeriodLabel}
          />

          {settlementItems.length === 0 ? (
            <ListEmptyState
              containerClassName="mt-4"
              title={emptyTitle}
              description={emptyDescription}
              icon="cash-outline"
            />
          ) : (
            <View className="mt-4 gap-3">
              {settlementItems.map(item => (
                <DailySettlementCard
                  key={item.id}
                  item={item}
                  onPress={() => handleSettlementPress(item.id)}
                />
              ))}

              {hasMore ? (
                <LoadMoreButton
                  containerClassName="mt-2"
                  label={loadingMore ? APP_TEXT.notifications.loadingMore : APP_TEXT.earnings.loadMoreAction}
                  loading={loadingMore}
                  disabled={loadingMore || settlementsRefreshing}
                  onPress={() => {
                    void loadMore();
                  }}
                />
              ) : null}
            </View>
          )}
        </>
      ) : null}
    </GradientScreen>
  );
}
