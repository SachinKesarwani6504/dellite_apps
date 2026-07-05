import { Ionicons } from '@expo/vector-icons';
import { View, Text, useColorScheme } from 'react-native';
import { Button } from '@/components/common/Button';
import { ListEmptyState } from '@/components/common/ListEmptyState';
import { BookingPaymentDetailsCard } from '@/components/booking-details/BookingPaymentDetailsCard';
import { useBottomSheetContext } from '@/contexts/BottomSheetContext';
import type { WorkerBookingDetailsPaymentTabProps } from '@/types/booking-details';
import { APP_TEXT } from '@/utils/appText';
import { getBookingPaymentInfo } from '@/utils/booking-details';
import {
  getWorkerPaymentCopy,
  getWorkerPaymentRecordDisabledReason,
  getWorkerPaymentStatus,
  shouldShowWorkerPaymentRecordSection,
} from '@/utils/job-actions';
import { palette, theme, uiColors } from '@/utils/theme';

export function BookingDetailsPaymentTab({
  details,
  canRecordPayment,
  jobActionLoading,
  onConfirmPaymentReceived,
}: WorkerBookingDetailsPaymentTabProps) {
  const isDark = useColorScheme() === 'dark';
  const { showCustomSheet } = useBottomSheetContext();
  const paymentStatus = getWorkerPaymentStatus(details);
  const payment = getBookingPaymentInfo(details);
  const paymentCopy = getWorkerPaymentCopy(paymentStatus);
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;
  const disabledReason = getWorkerPaymentRecordDisabledReason(details);
  const showRecordSection = shouldShowWorkerPaymentRecordSection(details);
  const cardStyle = {
    borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
    backgroundColor: isDark ? palette.dark.card : palette.light.card,
  };
  const renderRecordSection = () => {
    if (!showRecordSection) return null;
    const isRecordActionDisabled = !canRecordPayment || Boolean(jobActionLoading);

    return (
      <View className="rounded-2xl border p-4" style={cardStyle}>
        <Text className="text-base font-extrabold text-baseDark dark:text-white">
          {APP_TEXT.jobs.paymentReceivedMoneyTitle}
        </Text>
        <Text className="mt-1 text-sm leading-5" style={{ color: mutedTextColor }}>
          {canRecordPayment
            ? APP_TEXT.jobs.paymentReceivedMoneyReadySubtitle
            : APP_TEXT.jobs.paymentReceivedMoneySubtitle}
        </Text>
        {disabledReason ? (
          <View
            className="mt-3 flex-row items-start rounded-xl px-3 py-3"
            style={{
              backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,
            }}
          >
            <Ionicons name="information-circle-outline" size={16} color={theme.colors.primary} />
            <Text className="ml-2 flex-1 text-xs font-semibold leading-4" style={{ color: mutedTextColor }}>
              {disabledReason}
            </Text>
          </View>
        ) : null}
        <View className="mt-3">
          <Button
            label={APP_TEXT.jobs.paymentReceivedMoneyAction}
            loading={Boolean(jobActionLoading)}
            disabled={isRecordActionDisabled}
            onPress={() => {
              showCustomSheet({
                title: APP_TEXT.jobs.paymentReceivedMoneyTitle,
                subtitle: APP_TEXT.jobs.paymentReceivedMoneyReadySubtitle,
                renderContent: ({ closeSheet }) => (
                  <View className="gap-3">
                    <View className="flex-row" style={{ gap: 10 }}>
                      <View className="flex-1">
                        <Button
                          label={APP_TEXT.jobs.paymentReceivedCash}
                          loading={jobActionLoading === 'CASH_TO_WORKER'}
                          disabled={Boolean(jobActionLoading)}
                          onPress={async () => {
                            const success = await onConfirmPaymentReceived('CASH_TO_WORKER');
                            if (success) {
                              closeSheet();
                            }
                          }}
                        />
                      </View>
                      <View className="flex-1">
                        <Button
                          label={APP_TEXT.jobs.paymentReceivedUpi}
                          variant="secondary"
                          loading={jobActionLoading === 'UPI_TO_WORKER'}
                          disabled={Boolean(jobActionLoading)}
                          onPress={async () => {
                            const success = await onConfirmPaymentReceived('UPI_TO_WORKER');
                            if (success) {
                              closeSheet();
                            }
                          }}
                        />
                      </View>
                    </View>
                    <Text className="text-center text-xs leading-4" style={{ color: mutedTextColor }}>
                      {APP_TEXT.jobs.paymentReceivedMoneySheetHint}
                    </Text>
                  </View>
                ),
              });
            }}
          />
        </View>
      </View>
    );
  };

  if (!payment) {
    return (
      <View className="mt-4 gap-3">
        <ListEmptyState
          title={APP_TEXT.jobs.paymentDetailsTitle}
          description={paymentCopy.description}
          icon="card-outline"
        />
        {renderRecordSection()}
      </View>
    );
  }

  return (
    <View className="mt-4 gap-3">
      <BookingPaymentDetailsCard
        paymentStatus={paymentStatus}
        payment={payment}
        statusCopy={paymentCopy}
      />

      {renderRecordSection()}
    </View>
  );
}
