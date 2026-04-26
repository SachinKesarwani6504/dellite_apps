import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { AnimatedSegmentTabs } from '@/components/common/AnimatedSegmentTabs';
import { GradientScreen } from '@/components/common/GradientScreen';
import { SplitGradientTitle } from '@/components/common/SplitGradientTitle';
import { WorkerJobCard } from '@/components/common/WorkerJobCard';
import { JobStackParamList } from '@/types/navigation';
import { JOB_STACK_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { workerJobStatusTabs, workerMockJobs, WorkerJobStatus } from '@/utils/options';

export function JobsScreen() {
  const [activeStatus, setActiveStatus] = useState<WorkerJobStatus>('ONGOING');
  const navigation = useNavigation<NativeStackNavigationProp<JobStackParamList>>();

  const jobs = useMemo(() => workerMockJobs[activeStatus], [activeStatus]);

  return (
    <GradientScreen>
      <ScrollView className="flex-1 pt-1" contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <SplitGradientTitle
          prefix={APP_TEXT.jobs.titlePrefix}
          highlight={APP_TEXT.jobs.titleHighlight}
          subtitle={APP_TEXT.jobs.subtitle}
          inline
          prefixClassName="text-[34px] font-extrabold leading-[38px] text-baseDark dark:text-white"
          highlightClassName="text-[38px] font-extrabold leading-[41px]"
        />

        <AnimatedSegmentTabs items={workerJobStatusTabs} value={activeStatus} onChange={setActiveStatus} />

        <View className="mt-4">
          {jobs.map(item => (
            <WorkerJobCard
              key={item.id}
              item={item}
              onPress={(jobId) => navigation.navigate(JOB_STACK_SCREENS.details, { jobId })}
            />
          ))}
        </View>
      </ScrollView>
    </GradientScreen>
  );
}
