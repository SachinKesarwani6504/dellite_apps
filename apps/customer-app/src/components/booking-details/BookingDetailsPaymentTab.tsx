import { View } from 'react-native';
import { ListEmptyState } from '@/components/common/ListEmptyState';

export function BookingDetailsPaymentTab() {
  return (
    <View className="mt-5">
      <ListEmptyState
        title="Payment information not available"
        description="Payment details will appear here once payment APIs are connected."
        icon="card-outline"
      />
    </View>
  );
}
