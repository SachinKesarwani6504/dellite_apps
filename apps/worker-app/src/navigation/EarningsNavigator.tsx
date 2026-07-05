import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettlementDetailScreen } from '@/screens/earnings/SettlementDetailScreen';
import { EarningsScreen } from '@/screens/tabs/EarningsScreen';
import type { EarningsStackParamList } from '@/types/navigation';
import { EARNINGS_STACK_SCREENS } from '@/types/screen-names';

const Stack = createNativeStackNavigator<EarningsStackParamList>();

export function EarningsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={EARNINGS_STACK_SCREENS.home} component={EarningsScreen} />
      <Stack.Screen name={EARNINGS_STACK_SCREENS.settlementDetail} component={SettlementDetailScreen} />
    </Stack.Navigator>
  );
}
