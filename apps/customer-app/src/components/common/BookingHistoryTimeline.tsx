import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import { LivePulseIndicator } from '@/components/common/LivePulseIndicator';
import type { BookingHistoryTimelineProps } from '@/types/history';
import { palette, theme, uiColors } from '@/utils/theme';

const TIMELINE_RAIL_WIDTH = 52;
const TIMELINE_RAIL_TO_CARD_GAP = 20;
const TIMELINE_ROW_GAP = 16;
const TIMELINE_ICON_SIZE = 36;
const TIMELINE_TOP_ACCENT_HEIGHT = 5;
const TIMELINE_RAIL_PADDING_Y = 12;
const TIMELINE_LIVE_PULSE_SIZE = 48;

export function BookingHistoryTimeline({ items }: BookingHistoryTimelineProps) {
  const isDark = useColorScheme() === 'dark';
  const railLineColor = isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight;
  const cardBorderColor = isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight;
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;
  const railBackground = isDark ? palette.dark.card : palette.light.card;
  const cardShadowStyle = {
    shadowColor: uiColors.shadow.base,
    shadowOpacity: isDark ? 0 : 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  };

  return (
    <View style={{ position: 'relative' }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: TIMELINE_RAIL_WIDTH,
        }}
      >
        {items.length > 1 ? (
          <View
            style={{
              position: 'absolute',
              left: TIMELINE_RAIL_WIDTH / 2,
              top: TIMELINE_RAIL_PADDING_Y + TIMELINE_ICON_SIZE / 2,
              bottom: TIMELINE_RAIL_PADDING_Y + TIMELINE_LIVE_PULSE_SIZE / 2,
              width: 0,
              marginLeft: -0.5,
              borderLeftWidth: 1,
              borderStyle: 'dashed',
              borderColor: railLineColor,
            }}
          />
        ) : null}
      </View>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <View
            key={item.id}
            className="flex-row"
            style={{
              marginBottom: isLast ? 0 : TIMELINE_ROW_GAP,
              zIndex: 1,
            }}
          >
            <View
              style={{
                width: TIMELINE_RAIL_WIDTH,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: TIMELINE_RAIL_PADDING_Y,
              }}
            >
              {isLast ? (
                <LivePulseIndicator />
              ) : (
                <View
                  className="items-center justify-center rounded-full border"
                  style={{
                    width: TIMELINE_ICON_SIZE,
                    height: TIMELINE_ICON_SIZE,
                    borderColor: railLineColor,
                    backgroundColor: isDark ? uiColors.surface.cardDefaultDark : palette.light.card,
                    zIndex: 1,
                  }}
                >
                  <Ionicons name={item.iconName} size={16} color={theme.colors.primary} />
                </View>
              )}
            </View>

            <View style={{ flex: 1, marginLeft: TIMELINE_RAIL_TO_CARD_GAP }}>
              <View
                className="overflow-hidden rounded-2xl border"
                style={{
                  borderColor: cardBorderColor,
                  backgroundColor: railBackground,
                  ...cardShadowStyle,
                }}
              >
                <View
                  style={{
                    height: TIMELINE_TOP_ACCENT_HEIGHT,
                    backgroundColor: theme.colors.primary,
                  }}
                />

                <View className="p-4">
                  <View className="flex-row items-start justify-between gap-2">
                    <Text className="flex-1 text-base font-extrabold leading-6 text-baseDark dark:text-white">
                      {item.title}
                    </Text>
                    {item.timestamp ? (
                      <Text className="text-xs font-semibold" style={{ color: mutedTextColor }}>
                        {item.timestamp}
                      </Text>
                    ) : null}
                  </View>
                  {item.subtitle ? (
                    <Text className="mt-1 text-sm leading-5" style={{ color: mutedTextColor }}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
