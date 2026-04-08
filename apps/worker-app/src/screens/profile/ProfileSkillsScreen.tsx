import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View, useColorScheme } from 'react-native';
import { getWorkerStatus } from '@/actions';
import { AppSpinner } from '@/components/common/AppSpinner';
import { BackButton } from '@/components/common/BackButton';
import { GradientScreen } from '@/components/common/GradientScreen';
import { ProfileStackParamList } from '@/types/navigation';
import { PROFILE_SCREENS } from '@/types/screen-names';
import { APP_TEXT } from '@/utils/appText';
import { palette, theme, uiColors } from '@/utils/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, typeof PROFILE_SCREENS.allSkills>;

type WorkerSkill = {
  id?: string;
  serviceId?: string;
  serviceName?: string;
  status?: string;
};

function normalizeStatus(value?: string): { label: string; color: string; icon: keyof typeof Ionicons.glyphMap } {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (normalized === 'APPROVED') {
    return { label: 'Approved', color: theme.colors.positive, icon: 'checkmark-circle-outline' };
  }
  if (normalized === 'PENDING') {
    return { label: 'Pending', color: theme.colors.caution, icon: 'time-outline' };
  }
  if (normalized === 'REJECTED') {
    return { label: 'Rejected', color: theme.colors.negative, icon: 'close-circle-outline' };
  }
  return { label: 'In Review', color: theme.colors.accent, icon: 'information-circle-outline' };
}

export function ProfileSkillsScreen({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [skills, setSkills] = useState<WorkerSkill[]>([]);

  const loadSkills = async (isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const status = await getWorkerStatus();
      setSkills(Array.isArray(status.skills) ? status.skills : []);
    } catch {
      setSkills([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadSkills(false);
  }, []);

  const totalApproved = useMemo(
    () => skills.filter(skill => String(skill.status ?? '').toUpperCase() === 'APPROVED').length,
    [skills],
  );

  return (
    <GradientScreen contentContainerStyle={{ paddingBottom: 20 }}>
      <View className="mb-4">
        <BackButton onPress={() => navigation.goBack()} visible={navigation.canGoBack()} />
      </View>

      <View className="rounded-2xl border p-5" style={{ backgroundColor: isDark ? palette.dark.card : palette.light.card, borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }}>
        <Text className="text-2xl font-bold text-baseDark dark:text-white">{APP_TEXT.profile.allSkills.title}</Text>
        <Text className="mt-1 text-sm" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {APP_TEXT.profile.allSkills.subtitle}
        </Text>

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-xl border p-3" style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.trackLight, borderColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight }}>
            <Text className="text-xs uppercase tracking-wide text-textPrimary/70 dark:text-white/70">Total Skills</Text>
            <Text className="mt-1 text-2xl font-bold text-baseDark dark:text-white">{skills.length}</Text>
          </View>
          <View className="flex-1 rounded-xl border p-3" style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.trackLight, borderColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight }}>
            <Text className="text-xs uppercase tracking-wide text-textPrimary/70 dark:text-white/70">Approved</Text>
            <Text className="mt-1 text-2xl font-bold" style={{ color: theme.colors.positive }}>{totalApproved}</Text>
          </View>
        </View>
      </View>

      <View className="mt-4 rounded-2xl border p-3" style={{ backgroundColor: isDark ? palette.dark.card : palette.light.card, borderColor: isDark ? uiColors.surface.overlayDark14 : uiColors.surface.overlayStrokeLight }}>
        {loading ? (
          <View className="items-center py-8">
            <AppSpinner size="large" color={theme.colors.primary} />
          </View>
        ) : skills.length === 0 ? (
          <View className="items-center py-8">
            <Text className="text-sm text-textPrimary/70 dark:text-white/70">No skills added yet.</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={(
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  void loadSkills(true);
                }}
              />
            )}
          >
            <View className="gap-2">
              {skills.map((skill, index) => {
                const statusMeta = normalizeStatus(skill.status);
                const name = skill.serviceName?.trim() || `Skill ${index + 1}`;
                return (
                  <View
                    key={skill.id ?? skill.serviceId ?? `${name}-${index}`}
                    className="flex-row items-center rounded-xl border px-3 py-3"
                    style={{ backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.trackLight, borderColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayStrokeLight }}
                  >
                    <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/12">
                      <Ionicons name="construct-outline" size={17} color={theme.colors.primary} />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-semibold text-baseDark dark:text-white">{name}</Text>
                      <View className="mt-0.5 flex-row items-center">
                        <Ionicons name={statusMeta.icon} size={14} color={statusMeta.color} />
                        <Text className="ml-1 text-xs font-semibold" style={{ color: statusMeta.color }}>{statusMeta.label}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </GradientScreen>
  );
}
