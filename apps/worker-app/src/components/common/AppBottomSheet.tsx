import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, BackHandler, Pressable, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBottomSheetContext } from '@/contexts/BottomSheetContext';
import type {
  AppBottomSheetConfig,
  BottomSheetAction,
  BottomSheetActionTone,
} from '@/types/bottom-sheet';
import { APP_TEXT } from '@/utils/appText';
import { palette, theme, uiColors } from '@/utils/theme';

const SHEET_SNAP_POINT_BY_VARIANT: Record<AppBottomSheetConfig['variant'], string> = {
  info: '34%',
  confirm: '32%',
  'action-list': '52%',
  custom: '68%',
};
const BOTTOM_SHEET_SAFE_BOTTOM_PADDING = 36;

function getSheetSnapPoints(activeSheet: AppBottomSheetConfig | null) {
  if (!activeSheet) {
    return ['42%'];
  }

  return [activeSheet.snapPoint ?? SHEET_SNAP_POINT_BY_VARIANT[activeSheet.variant]];
}

function getFooterActions(activeSheet: AppBottomSheetConfig | null) {
  if (!activeSheet) {
    return [];
  }

  if (activeSheet.variant === 'info') {
    return [
      activeSheet.secondaryAction,
      activeSheet.primaryAction ?? ({
        id: 'close-info-sheet',
        label: APP_TEXT.bottomSheet.closeButton,
        tone: 'primary',
      } satisfies BottomSheetAction),
    ].filter(Boolean) as BottomSheetAction[];
  }

  if (activeSheet.variant === 'confirm') {
    return [
      activeSheet.cancelAction ?? ({
        id: 'cancel-confirm-sheet',
        label: APP_TEXT.bottomSheet.cancelButton,
        tone: 'default',
      } satisfies BottomSheetAction),
      activeSheet.confirmAction,
    ];
  }

  if (activeSheet.variant === 'custom') {
    return activeSheet.footerActions ?? [];
  }

  return activeSheet.footerAction
    ? [activeSheet.footerAction]
    : [
        ({
          id: 'dismiss-action-list-sheet',
          label: APP_TEXT.bottomSheet.closeButton,
          tone: 'default',
        } satisfies BottomSheetAction),
      ];
}

function getActionTextColor(tone: BottomSheetActionTone, isDark: boolean) {
  if (tone === 'danger' || tone === 'primary') {
    return theme.colors.onPrimary;
  }

  return isDark ? palette.dark.text : theme.colors.baseDark;
}

function getActionContainerStyle(tone: BottomSheetActionTone, isDark: boolean) {
  if (tone === 'danger') {
    return {
      backgroundColor: theme.colors.negative,
      borderColor: theme.colors.negative,
    };
  }

  if (tone === 'primary') {
    return {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    };
  }

  return {
    backgroundColor: isDark ? uiColors.surface.cardMutedDark : uiColors.surface.neutralSoftLight,
    borderColor: isDark ? uiColors.surface.borderNeutralDark : uiColors.surface.borderNeutralLight,
  };
}

function BottomSheetActionButton({
  action,
  isLoading,
  isDark,
  onPress,
}: {
  action: BottomSheetAction;
  isLoading: boolean;
  isDark: boolean;
  onPress: () => void;
}) {
  const tone = action.tone ?? 'default';
  const isPrimary = tone === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={action.disabled || isLoading}
      className={(action.disabled || isLoading) ? 'opacity-60' : ''}
        style={{
          borderRadius: 12,
          borderWidth: 1,
          minHeight: 44,
          flex: 1,
          ...getActionContainerStyle(tone, isDark),
          paddingVertical: isPrimary ? 0 : 10,
        paddingHorizontal: isPrimary ? 0 : 14,
        overflow: 'hidden',
      }}
    >
      {isPrimary ? (
        <LinearGradient
          colors={theme.gradients.cta}
          locations={[0, 0.25, 0.62, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ minHeight: 44, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={getActionTextColor(tone, isDark)} />
          ) : (
            <Text
              className="text-center text-sm font-semibold"
              style={{ color: getActionTextColor(tone, isDark) }}
            >
              {action.label}
            </Text>
          )}
        </LinearGradient>
      ) : (
        <View className="min-h-[24px] items-center justify-center">
          {isLoading ? (
            <ActivityIndicator size="small" color={getActionTextColor(tone, isDark)} />
          ) : (
            <Text
              className="text-center text-sm font-semibold"
              style={{ color: getActionTextColor(tone, isDark) }}
            >
              {action.label}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

export function AppBottomSheet() {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const modalRef = useRef<BottomSheetModal>(null);
  const scrollRef = useRef<any>(null);
  const {
    activeSheet,
    closeSheet,
    pendingActionId,
    runAction,
  } = useBottomSheetContext();

  const snapPoints = useMemo(() => getSheetSnapPoints(activeSheet), [activeSheet]);
  const footerActions = useMemo(() => getFooterActions(activeSheet), [activeSheet]);

  useEffect(() => {
    if (!activeSheet) {
      return undefined;
    }

    const frameId = requestAnimationFrame(() => {
      modalRef.current?.present();
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [activeSheet]);

  useEffect(() => {
    if (!activeSheet) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeSheet.dismissible === false) {
        return true;
      }
      closeSheet();
      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [activeSheet, closeSheet]);

  const handleDismiss = useCallback(() => {
    closeSheet();
  }, [closeSheet]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.42}
        pressBehavior={activeSheet?.dismissible === false ? 'none' : 'close'}
      />
    ),
    [activeSheet?.dismissible],
  );

  const surfaceStyle = {
    backgroundColor: isDark ? uiColors.surface.cardElevatedDark : uiColors.surface.warmSubtleLight,
  };
  const headerTextColor = isDark ? palette.dark.text : theme.colors.baseDark;
  const subtextColor = isDark ? palette.dark.mutedText : theme.colors.textMuted;
  const footerIsInline = activeSheet?.variant === 'confirm' && footerActions.length === 2;
  const contentBottomPadding = Math.max(48, insets.bottom + BOTTOM_SHEET_SAFE_BOTTOM_PADDING);

  if (!activeSheet) {
    return null;
  }

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={snapPoints}
      enablePanDownToClose={activeSheet?.dismissible !== false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={surfaceStyle}
      handleIndicatorStyle={{
        width: 42,
        height: 4,
        backgroundColor: isDark ? uiColors.surface.overlayDark14 : theme.colors.stroke,
      }}
    >
      <BottomSheetView style={surfaceStyle} className="flex-1">
        <BottomSheetScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: contentBottomPadding }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {activeSheet?.title ? (
            <Text className="text-xl font-extrabold" style={{ color: headerTextColor }}>
              {activeSheet.title}
            </Text>
          ) : null}

          {activeSheet?.subtitle ? (
            <Text className="mt-2 text-sm leading-5" style={{ color: subtextColor }}>
              {activeSheet.subtitle}
            </Text>
          ) : null}

          {activeSheet?.description ? (
            <Text className="mt-3 text-sm leading-5" style={{ color: subtextColor }}>
              {activeSheet.description}
            </Text>
          ) : null}

          {activeSheet?.variant === 'action-list' ? (
            <View className="mt-5 gap-3">
              {activeSheet.actions.map(action => {
                const tone = action.tone ?? 'default';
                const isLoading = pendingActionId === action.id;

                return (
                  <Pressable
                    key={action.id}
                    onPress={() => { void runAction(action).catch(() => undefined); }}
                    disabled={action.disabled || isLoading}
                    className={(action.disabled || isLoading) ? 'opacity-60' : ''}
                    style={{
                      borderRadius: 14,
                      borderWidth: 1,
                      minHeight: 48,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      ...getActionContainerStyle(tone, isDark),
                    }}
                  >
                    <View className="min-h-[24px] items-center justify-center">
                      {isLoading ? (
                        <ActivityIndicator size="small" color={getActionTextColor(tone, isDark)} />
                      ) : (
                        <Text
                          className="text-center text-sm font-semibold"
                          style={{ color: getActionTextColor(tone, isDark) }}
                        >
                          {action.label}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {activeSheet?.variant === 'custom' ? (
            <View className="mt-5">
              {activeSheet.renderContent({
                closeSheet,
                pendingActionId,
                scrollToEnd: (animated = true) => {
                  const scroll = () => scrollRef.current?.scrollToEnd({ animated });
                  requestAnimationFrame(scroll);
                  setTimeout(scroll, 120);
                  setTimeout(scroll, 320);
                  setTimeout(scroll, 520);
                },
              })}
            </View>
          ) : null}

          {footerActions.length > 0 ? (
            <View className={`mt-5 ${footerIsInline ? 'flex-row gap-3' : 'gap-3'}`}>
              {footerActions.map(action => (
                <BottomSheetActionButton
                  key={action.id}
                  action={action}
                  isDark={isDark}
                  isLoading={pendingActionId === action.id}
                  onPress={() => { void runAction(action).catch(() => undefined); }}
                />
              ))}
            </View>
          ) : null}
        </BottomSheetScrollView>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
