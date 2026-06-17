import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import type { StatusBadgeProps } from '@/types/status-badge';
import { getStatusBadgeConfig, getStatusBadgeTextColor } from '@/utils/status-badge';

export function StatusBadge({ status, type, label, dotColor, iconName, showDot = true }: StatusBadgeProps) {
  const isDark = useColorScheme() === 'dark';
  const config = getStatusBadgeConfig(status, type);
  const backgroundColor = isDark ? `${config.textColor}24` : config.bgColor;
  const shouldShowDot = showDot && !iconName;

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        paddingHorizontal: 7,
        paddingVertical: 3.5,
        backgroundColor,
        borderWidth: 1,
        borderColor: config.borderColor,
      }}
    >
      {shouldShowDot ? (
        <View style={{ marginRight: 5, height: 6, width: 6, borderRadius: 3, backgroundColor: dotColor ?? config.textColor }} />
      ) : null}
      {iconName ? (
        <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={11} color={config.textColor} style={{ marginRight: 5 }} />
      ) : null}
      <Text style={{ color: config.textColor, fontSize: 11, fontWeight: '600' }}>
        {label ?? config.label}
      </Text>
    </View>
  );
}

export { getStatusBadgeTextColor };
