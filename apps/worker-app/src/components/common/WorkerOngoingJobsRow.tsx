import { ScrollView, Text, View, useColorScheme } from 'react-native';

import { SectionHeaderRow } from '@/components/common/SectionHeaderRow';
import { WorkerOngoingJobCard, WORKER_ONGOING_JOB_CARD_WIDTH } from '@/components/common/WorkerOngoingJobCard';
import type { WorkerOngoingJobsRowProps } from '@/types/component-types';
import { APP_TEXT } from '@/utils/appText';
import { uiColors } from '@/utils/theme';

const CARD_GAP = 12;

export function WorkerOngoingJobsRow({
  items,
  onPressJob,
}: WorkerOngoingJobsRowProps) {
  const isDark = useColorScheme() === 'dark';

  if (items.length === 0) {
    return null;
  }

  return (
    <View className="mt-4">
      <SectionHeaderRow title={APP_TEXT.home.ongoingJobs.title} showLiveIndicator />
      <Text
        className="mt-1 text-xs leading-4"
        style={{ color: isDark ? uiColors.text.captionDark : uiColors.text.captionLight }}
      >
        {APP_TEXT.home.ongoingJobs.subtitle}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 12,
          paddingRight: 4,
          gap: CARD_GAP,
        }}
        snapToInterval={WORKER_ONGOING_JOB_CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
      >
        {items.map(item => (
          <WorkerOngoingJobCard
            key={item.booking.id}
            item={item}
            onPress={onPressJob}
          />
        ))}
      </ScrollView>
    </View>
  );
}
