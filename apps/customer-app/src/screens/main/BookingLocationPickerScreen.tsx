import { Text, View } from 'react-native';
import { Button } from '@/components/common/Button';
import { CardWrapper } from '@/components/common/CardWrapper';
import { DetailsTopBar } from '@/components/common/DetailsTopBar';
import { GradientScreen } from '@/components/common/GradientScreen';
import { PinnedLocationMapPicker } from '@/components/common/PinnedLocationMapPicker';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { useBookingLocationPickerScreenController } from '@/hooks/useBookingLocationPickerScreenController';
import type { BookingLocationPickerScreenProps } from '@/types/main-screens';
import { APP_TEXT } from '@/utils/appText';
import { theme, uiColors } from '@/utils/theme';
import { titleCase } from '@/utils';

export function BookingLocationPickerScreen({ navigation }: BookingLocationPickerScreenProps) {
  const {
    isDark,
    coordinates,
    selectedLocationSummary,
    selectedLocationPrimaryLine,
    isResolving,
    error,
    canSelectLocation,
    resolvePinnedLocation,
    selectLocation,
  } = useBookingLocationPickerScreenController({
    onSelectLocation: () => navigation.goBack(),
  });

  return (
    <GradientScreen contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}>
      <DetailsTopBar onBack={() => navigation.goBack()} />

      <SplitGradientTitle
        prefix={APP_TEXT.main.bookingFlow.locationPickerTitlePrefix}
        highlight={APP_TEXT.main.bookingFlow.locationPickerTitleHighlight}
      />

      <View className="mt-5">
        <PinnedLocationMapPicker
          coordinates={coordinates}
          addressTitle={titleCase(selectedLocationPrimaryLine)}
          addressSummary={selectedLocationSummary}
          isDark={isDark}
          isResolving={isResolving}
          error={error}
          mapHeight={430}
          showAddressPreview={false}
          onRegionChangeComplete={(nextCoordinates) => {
            void resolvePinnedLocation(nextCoordinates);
          }}
        />
      </View>

      <CardWrapper isDark={isDark} className="mt-4 rounded-lg border p-4">
        <Text className="text-sm font-extrabold text-baseDark dark:text-white">
          {titleCase(selectedLocationPrimaryLine)}
        </Text>
        <Text className="mt-2 text-xs leading-5" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {selectedLocationSummary}
        </Text>
        {error ? (
          <Text className="mt-2 text-xs font-semibold" style={{ color: theme.colors.negative }}>
            {error}
          </Text>
        ) : null}
      </CardWrapper>

      <View className="mt-5">
        <Button
          label={isResolving ? APP_TEXT.main.bookingFlow.pinLocationResolvingLabel : APP_TEXT.main.bookingFlow.selectLocationCta}
          disabled={!canSelectLocation}
          onPress={selectLocation}
        />
      </View>
    </GradientScreen>
  );
}
