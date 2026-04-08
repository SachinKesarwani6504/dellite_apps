import { Text, View } from 'react-native';
import { theme } from '@/utils/theme';

type GradientWordProps = {
  word?: string;
  className?: string;
  palette?: readonly string[];
};

const DEFAULT_PALETTE = theme.gradients.cta;

export function GradientWord({ word = '', className = 'text-[44px] font-extrabold leading-[45px]', palette = DEFAULT_PALETTE }: GradientWordProps) {
  const letters = String(word).split('');
  const colors = letters.map((_, index) => {
    const paletteIndex = Math.round((index / Math.max(letters.length - 1, 1)) * (palette.length - 1));
    return palette[paletteIndex] ?? palette[palette.length - 1] ?? theme.colors.primary;
  });

  return (
    <View className="flex-row">
      {letters.map((char, index) => (
        <Text key={`${char}-${index}`} className={className} style={{ color: colors[index] }}>
          {char}
        </Text>
      ))}
    </View>
  );
}
