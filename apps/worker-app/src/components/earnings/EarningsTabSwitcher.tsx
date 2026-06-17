import { TwoOptionPillTabs } from '@/components/common/TwoOptionPillTabs';
import type { EarningsTabSwitcherProps } from '@/types/worker-finance';
import { APP_TEXT } from '@/utils/appText';
import { useColorScheme } from 'react-native';

export function EarningsTabSwitcher({ activeTab, onChangeTab }: EarningsTabSwitcherProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <TwoOptionPillTabs
      isDark={isDark}
      value={activeTab}
      onChange={onChangeTab}
      items={[
        { label: APP_TEXT.earnings.summaryTabLabel, value: 'SUMMARY', iconName: 'wallet-outline' },
        { label: APP_TEXT.earnings.settlementsTabLabel, value: 'SETTLEMENTS', iconName: 'calendar-outline' },
      ]}
    />
  );
}
