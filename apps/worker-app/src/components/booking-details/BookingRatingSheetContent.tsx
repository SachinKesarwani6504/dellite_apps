import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, Text, View, useColorScheme } from 'react-native';
import { Button } from '@/components/common/Button';
import type { BookingRatingValue, BookingRatingSheetContentProps } from '@/types/booking-rating';
import { APP_TEXT } from '@/utils/appText';
import { palette, theme, uiColors } from '@/utils/theme';

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;
const REVIEW_MAX_LENGTH = 500;

export function BookingRatingSheetContent({
  title,
  subtitle,
  submitLabel,
  onSubmit,
  scrollToEnd,
}: BookingRatingSheetContentProps) {
  const isDark = useColorScheme() === 'dark';
  const [rating, setRating] = useState<BookingRatingValue | null>(null);
  const [review, setReview] = useState('');
  const [reviewFocused, setReviewFocused] = useState(false);
  const [keyboardSpacerHeight, setKeyboardSpacerHeight] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const reviewFocusedRef = useRef(false);
  const mutedTextColor = isDark ? uiColors.text.subtitleDark : uiColors.text.subtitleLight;

  const scrollReviewIntoView = () => {
    scrollToEnd?.();
    setTimeout(() => scrollToEnd?.(), 80);
    setTimeout(() => scrollToEnd?.(), 220);
    setTimeout(() => scrollToEnd?.(), 420);
    setTimeout(() => scrollToEnd?.(), 720);
  };

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      if (!reviewFocusedRef.current) return;
      setKeyboardSpacerHeight(Math.max(180, event.endCoordinates.height));
      scrollReviewIntoView();
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardSpacerHeight(0);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [scrollToEnd]);

  const submit = async () => {
    if (!rating) {
      setError(APP_TEXT.ratings.requiredError);
      return;
    }
    const normalizedReview = review.trim();
    if (normalizedReview.length > REVIEW_MAX_LENGTH) {
      setError(APP_TEXT.ratings.reviewMaxError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        rating,
        review: normalizedReview.length > 0 ? normalizedReview : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text className="text-lg font-extrabold text-baseDark dark:text-white">{title}</Text>
      <Text className="mt-1 text-sm leading-5" style={{ color: mutedTextColor }}>{subtitle}</Text>

      <View className="mt-5 flex-row justify-center" style={{ gap: 10 }}>
        {RATING_OPTIONS.map(option => {
          const selected = rating != null && option <= rating;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={selected ? { selected: true } : {}}
              disabled={submitting}
              onPress={() => {
                setRating(option);
                setError(null);
              }}
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{
                backgroundColor: selected ? uiColors.surface.accentSoft20 : (isDark ? uiColors.surface.overlayDark10 : uiColors.surface.overlayLight95),
              }}
            >
              <Ionicons
                name={selected ? 'star' : 'star-outline'}
                size={26}
                color={selected ? theme.colors.primary : mutedTextColor}
              />
            </Pressable>
          );
        })}
      </View>

      <View className="mt-5">
        <View className="mb-2 flex-row items-center">
          <Text className="text-sm font-semibold text-baseDark dark:text-white">{APP_TEXT.ratings.reviewLabel}</Text>
        </View>
        <View
          className="rounded-2xl border"
          style={{
            backgroundColor: isDark ? palette.dark.card : palette.light.card,
            borderColor: reviewFocused ? theme.colors.primary : (isDark ? uiColors.surface.borderNeutralDark : theme.colors.stroke),
            borderRadius: 16,
            shadowColor: theme.colors.primary,
            shadowOpacity: reviewFocused ? 0.16 : 0.05,
            shadowRadius: reviewFocused ? 10 : 3,
            shadowOffset: { width: 0, height: reviewFocused ? 6 : 2 },
            elevation: reviewFocused ? 5 : 1,
          }}
        >
          <BottomSheetTextInput
            value={review}
            onChangeText={setReview}
            placeholder={APP_TEXT.ratings.reviewPlaceholder}
            placeholderTextColor={uiColors.text.placeholder}
            editable={!submitting}
            multiline
            maxLength={REVIEW_MAX_LENGTH}
            numberOfLines={4}
            textAlignVertical="top"
            onFocus={() => {
              reviewFocusedRef.current = true;
              setReviewFocused(true);
              scrollReviewIntoView();
            }}
            onBlur={() => {
              reviewFocusedRef.current = false;
              setReviewFocused(false);
              setKeyboardSpacerHeight(0);
            }}
            style={{
              minHeight: 118,
              paddingHorizontal: 12,
              paddingVertical: 14,
              color: isDark ? palette.dark.text : theme.colors.textPrimary,
              fontSize: 16,
              fontWeight: '600',
              textAlignVertical: 'top',
            }}
          />
        </View>
        <Text className="mt-1 text-right text-xs font-semibold" style={{ color: mutedTextColor }}>
          {`${review.length}/${REVIEW_MAX_LENGTH}`}
        </Text>
      </View>

      {error ? (
        <Text className="mt-3 text-sm font-semibold" style={{ color: theme.colors.negative }}>{error}</Text>
      ) : null}

      <View className="mt-5">
        <Button
          label={submitLabel}
          loading={submitting}
          disabled={submitting || rating == null}
          onPress={() => {
            void submit();
          }}
        />
      </View>

      {reviewFocused ? <View style={{ height: keyboardSpacerHeight }} /> : null}
    </View>
  );
}
