import { Text } from 'react-native';

import { theme } from '@/utils/theme';

type GradientWordProps = {
  word?: string;
  className?: string;
  palette?: readonly string[];
  wrap?: boolean;
};

const DEFAULT_PALETTE = theme.gradients.cta;

export function GradientWord({
  word = '',
  className = 'text-[21px] font-extrabold leading-[24px]',
  palette = DEFAULT_PALETTE,
  wrap = false,
}: GradientWordProps) {
  const letters = String(word).split('');
  const colors = letters.map((_, index) => {
    const paletteIndex = Math.round((index / Math.max(letters.length - 1, 1)) * (palette.length - 1));
    return palette[paletteIndex] ?? palette[palette.length - 1] ?? theme.colors.primary;
  });

  return (
    <Text className={className}>
      {letters.map((char, index) => (
        <Text key={`${char}-${index}`} style={{ color: colors[index] }}>
          {char}
        </Text>
      ))}
    </Text>
  );
}
