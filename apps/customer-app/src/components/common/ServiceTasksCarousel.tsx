import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Text, View, useWindowDimensions } from 'react-native';
import type { ServiceTasksCarouselProps } from '@/types/component-types';
import { APP_TEXT } from '@/utils/appText';
import { titleCase, uiColors } from '@/utils';
import { theme } from '@/utils/theme';

type TaskPage = {
  id: 'included' | 'excluded';
  title: string;
  emptyText: string;
  toneColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
  items: Array<{ id?: string; title: string }>;
};

function TaskPageView({ page, isDark }: { page: TaskPage; isDark: boolean }) {
  return (
    <View
      className="rounded-md px-4 py-3"
      style={{ backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95 }}
    >
      <Text className="text-xs font-bold" style={{ color: page.toneColor }}>{page.title}</Text>
      {page.items.length === 0 ? (
        <Text className="mt-2 text-xs" style={{ color: isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight }}>
          {page.emptyText}
        </Text>
      ) : null}
      {page.items.map((task, index) => (
        <View key={`${task.id ?? task.title}-${index}`} className="mt-2 flex-row items-start">
          <Ionicons name={page.iconName} size={14} color={page.toneColor} />
          <Text className="ml-2 flex-1 text-xs font-semibold text-baseDark dark:text-white">
            {titleCase(task.title)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ServiceTasksCarousel({ includedTasks, excludedTasks, isDark }: ServiceTasksCarouselProps) {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<TaskPage> | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const pages: TaskPage[] = [
    {
      id: 'included',
      title: APP_TEXT.main.bookingFlow.includedTitle,
      emptyText: APP_TEXT.main.bookingFlow.tasksNoIncluded,
      toneColor: '#38B66B',
      iconName: 'checkmark-circle',
      items: includedTasks,
    },
    {
      id: 'excluded',
      title: APP_TEXT.main.bookingFlow.excludedTitle,
      emptyText: APP_TEXT.main.bookingFlow.tasksNoExcluded,
      toneColor: '#DB8A43',
      iconName: 'close-circle',
      items: excludedTasks,
    },
  ];

  const pageWidth = Math.max(200, width - 64);

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    setActiveIndex(Math.max(0, Math.min(nextIndex, pages.length - 1)));
  };

  return (
    <View className="mt-4">
      <FlatList
        ref={listRef}
        horizontal
        pagingEnabled
        data={pages}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item }) => (
          <View style={{ width: pageWidth }}>
            <TaskPageView page={item} isDark={isDark} />
          </View>
        )}
      />
      <View
        className="mt-3 flex-row items-center justify-center self-center rounded-full border px-3 py-1.5"
        style={{
          borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
          backgroundColor: isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95,
        }}
      >
        {pages.map((item, index) => {
          const selected = index === activeIndex;
          return (
            <View
              key={item.id}
              className="mx-1 rounded-full"
              style={{
                width: selected ? 18 : 9,
                height: 9,
                borderWidth: selected ? 1 : 0,
                borderColor: selected ? theme.colors.primary : 'transparent',
                backgroundColor: selected
                  ? theme.colors.primary
                  : (isDark ? '#5E6672' : '#C9CFD8'),
                opacity: selected ? 1 : 0.95,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
