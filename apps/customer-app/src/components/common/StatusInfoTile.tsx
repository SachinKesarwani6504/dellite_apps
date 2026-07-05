import { Ionicons } from '@expo/vector-icons';
import { Text, View, useColorScheme } from 'react-native';
import type { StatusBadgeType } from '@/types/status-badge';
import { getStatusBadgeConfig, getStatusTileIconName } from '@/utils/status-badge';

type StatusInfoTileProps = {
  status: string;
  type: StatusBadgeType;
  subtitle: string;
};

export function StatusInfoTile({ status, type, subtitle }: StatusInfoTileProps) {
  const isDark = useColorScheme() === 'dark';
  const config = getStatusBadgeConfig(status, type);

  return (
    <View
      className="flex-1 flex-row items-center rounded-xl border px-3 py-2.5"
      style={{
        borderColor: config.borderColor,
        backgroundColor: isDark ? `${config.textColor}24` : config.bgColor,
      }}
    >
      <View
        className="h-7 w-7 items-center justify-center rounded-full"
        style={{ backgroundColor: config.textColor }}
      >
        <Ionicons name={getStatusTileIconName(status)} size={17} color="#FFFFFF" />
      </View>
      <View className="ml-2 flex-1">
        <Text className="text-sm font-extrabold" numberOfLines={1} style={{ color: config.textColor }}>
          {config.label}
        </Text>
        <Text className="mt-0.5 text-[11px] text-baseDark/50 dark:text-white/60" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
