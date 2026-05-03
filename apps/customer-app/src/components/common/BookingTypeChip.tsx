import { Pressable, Text, View } from 'react-native';
import type { BookingTypeChipProps } from '@/types/component-types';
import { theme } from '@/utils/theme';

export function BookingTypeChip({ label, selected, onPress }: BookingTypeChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center rounded-lg px-4 py-3"
      style={{
        backgroundColor: selected ? theme.colors.primary : 'transparent',
      }}
    >
      <View
        className="mr-2 h-4 w-4 items-center justify-center rounded-full border"
        style={{ borderColor: selected ? '#FFFFFF' : '#9CA3AF' }}
      >
        {selected ? <View className="h-2 w-2 rounded-full bg-white" /> : null}
      </View>
      <Text className={`text-sm font-bold ${selected ? 'text-white' : 'text-baseDark dark:text-white'}`} style={selected ? undefined : { opacity: 0.75 }}>{label}</Text>
    </Pressable>
  );
}
