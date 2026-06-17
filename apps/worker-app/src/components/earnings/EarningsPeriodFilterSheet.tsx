import { Ionicons } from '@expo/vector-icons';

import { useState } from 'react';

import { Pressable, Text, View, useColorScheme } from 'react-native';

import type { EarningsPeriodFilterSheetProps, WorkerEarningsPeriodFilterValue } from '@/types/worker-finance';

import { APP_TEXT } from '@/utils/appText';

import { WORKER_EARNINGS_PERIOD_OPTIONS } from '@/utils/worker-finance';

import { palette, theme, uiColors } from '@/utils/theme';



export function EarningsPeriodFilterSheet({

  selectedPeriod,

  onApply,

  onClose,

}: EarningsPeriodFilterSheetProps) {

  const isDark = useColorScheme() === 'dark';

  const [draftPeriod, setDraftPeriod] = useState<WorkerEarningsPeriodFilterValue>(selectedPeriod);

  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;

  const rowBorderColor = isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight;



  const handleApply = () => {

    onApply(draftPeriod);

    onClose();

  };



  return (

    <View className="gap-4">

      <Text className="text-sm leading-5" style={{ color: mutedTextColor }}>

        {APP_TEXT.earnings.periodFilterSheetSubtitle}

      </Text>



      {WORKER_EARNINGS_PERIOD_OPTIONS.map(option => {

        const isSelected = draftPeriod === option.value;

        return (

          <Pressable

            key={option.value}

            onPress={() => setDraftPeriod(option.value)}

            className="rounded-2xl border p-4"

            style={{

              borderColor: isSelected ? theme.colors.primary : rowBorderColor,

              backgroundColor: isSelected

                ? (isDark ? uiColors.surface.overlayDark10 : uiColors.surface.accentSoft20)

                : (isDark ? uiColors.surface.overlayDark08 : palette.light.card),

            }}

          >

            <View className="flex-row items-center">

              <View

                className="mr-3 h-11 w-11 items-center justify-center rounded-2xl"

                style={{

                  backgroundColor: isSelected

                    ? theme.colors.primary

                    : (isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95),

                }}

              >

                {option.iconName ? (

                  <Ionicons

                    name={option.iconName as keyof typeof Ionicons.glyphMap}

                    size={20}

                    color={isSelected ? theme.colors.onPrimary : theme.colors.primary}

                  />

                ) : null}

              </View>

              <View className="flex-1">

                <Text className="text-base font-extrabold text-baseDark dark:text-white">

                  {option.label}

                </Text>

                {option.description ? (

                  <Text className="mt-0.5 text-xs leading-5" style={{ color: mutedTextColor }}>

                    {option.description}

                  </Text>

                ) : null}

              </View>

              <View

                className="h-6 w-6 items-center justify-center rounded-full border"

                style={{

                  borderColor: isSelected ? theme.colors.primary : rowBorderColor,

                  backgroundColor: isSelected ? theme.colors.primary : 'transparent',

                }}

              >

                {isSelected ? (

                  <Ionicons name="checkmark" size={14} color={theme.colors.onPrimary} />

                ) : null}

              </View>

            </View>

          </Pressable>

        );

      })}



      <View className="flex-row" style={{ gap: 10 }}>

        <Pressable

          onPress={onClose}

          className="flex-1 items-center justify-center rounded-2xl border px-4 py-3.5"

          style={{

            borderColor: rowBorderColor,

            backgroundColor: isDark ? uiColors.surface.overlayDark08 : uiColors.surface.overlayLight95,

          }}

        >

          <Text className="text-sm font-extrabold" style={{ color: mutedTextColor }}>

            {APP_TEXT.earnings.periodFilterCancelAction}

          </Text>

        </Pressable>

        <Pressable

          onPress={handleApply}

          className="flex-1 items-center justify-center rounded-2xl px-4 py-3.5"

          style={{ backgroundColor: theme.colors.primary }}

        >

          <Text className="text-sm font-extrabold" style={{ color: theme.colors.onPrimary }}>

            {APP_TEXT.earnings.periodFilterApplyAction}

          </Text>

        </Pressable>

      </View>

    </View>

  );

}

