import { View } from 'react-native';
import type { WorkerEarningsStatGridProps } from '@/types/worker-finance';
import { EarningsStatCard } from '@/components/earnings/EarningsStatCard';
import { APP_TEXT } from '@/utils/appText';
import { formatInr, parseAmount } from '@/utils/worker-finance';

export function EarningsStatGrid({ cards, carriedForwardCommission }: WorkerEarningsStatGridProps) {
  const carriedForwardText = parseAmount(carriedForwardCommission) > 0
    ? `${APP_TEXT.earnings.carriedForwardHelperPrefix} ${formatInr(carriedForwardCommission)} ${APP_TEXT.earnings.carriedForwardHelperSuffix}`
    : null;

  return (
    <View className="mt-4 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
      {cards.map(card => (
        <EarningsStatCard
          key={card.key}
          item={card}
          footerText={card.key === 'commission-due' ? carriedForwardText : null}
        />
      ))}
    </View>
  );
}
