import { Ionicons } from '@expo/vector-icons';
import { Text, TextStyle, View, useColorScheme } from 'react-native';
import { GradientWord } from '@/components/common/GradientWord';
import { theme, uiColors } from '@/utils/theme';

type SplitGradientTitleProps = {
  eyebrow?: string;
  prefix: string;
  highlight: string;
  subtitle?: string;
  prefixClassName?: string;
  highlightClassName?: string;
  subtitleClassName?: string;
  subtitleStyle?: TextStyle;
  inline?: boolean;
  showSparkle?: boolean;
};

export function SplitGradientTitle({
  eyebrow,
  prefix,
  highlight,
  subtitle,
  prefixClassName = 'mt-3 text-[36px] font-extrabold leading-[38px] text-baseDark dark:text-white',
  highlightClassName = 'text-[44px] font-extrabold leading-[45px]',
  subtitleClassName = 'mt-2 text-sm',
  subtitleStyle,
  inline = false,
  showSparkle = true,
}: SplitGradientTitleProps) {
  const isDark = useColorScheme() === 'dark';
  const resolvedSubtitleStyle = subtitleStyle ?? {
    color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight,
  };

  return (
    <View>
      {eyebrow ? (
        <View className="flex-row items-center gap-1.5">
          {showSparkle ? <Ionicons name="sparkles-outline" size={14} color={theme.colors.primary} /> : null}
          <Text className="text-xs font-bold tracking-widest text-primary">{eyebrow}</Text>
        </View>
      ) : null}

      {inline ? (
        <View className="flex-row flex-wrap items-end">
          <Text className={prefixClassName}>{`${prefix} `}</Text>
          <GradientWord word={highlight} className={highlightClassName} />
        </View>
      ) : (
        <>
          <Text className={prefixClassName}>{prefix}</Text>
          <View className="mt-0.5">
            <GradientWord word={highlight} className={highlightClassName} />
          </View>
        </>
      )}

      {subtitle ? (
        <Text className={subtitleClassName} style={resolvedSubtitleStyle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
