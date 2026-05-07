import type { ComponentProps, ElementRef } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { Image, ImageBackground, ImageSourcePropType, StyleProp, TextInput, ViewProps, ViewStyle } from 'react-native';
import type { LocationCoordinates } from '@/modules/location/types/location.types';
import type { CustomerBookableService, CustomerServicePriceOption, CustomerServiceTask } from '@/types/customer';
import type { ImageCacheMode } from '@/types/shared';

export type AppImageProps = Omit<ComponentProps<typeof Image>, 'source'> & {
  source?: ImageSourcePropType;
  cacheMode?: ImageCacheMode;
};

export type AppImageRef = ElementRef<typeof Image>;

export type AppImageBackgroundProps = Omit<ComponentProps<typeof ImageBackground>, 'source'> & {
  source?: ImageSourcePropType;
  cacheMode?: ImageCacheMode;
};

export type AppImageBackgroundRef = ElementRef<typeof ImageBackground>;

export type DateTimeFieldMode = 'date' | 'time';

export type DateTimeFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  mode: DateTimeFieldMode;
  isRequired?: boolean;
  onChange: (value: string) => void;
};

export type OtpCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
};

export type OtpInputRef = TextInput | null;

export type CardWrapperProps = ViewProps & {
  isDark: boolean;
  lightBackgroundColor?: string;
  darkBackgroundColor?: string;
  borderColor?: string;
  withShadow?: boolean;
  style?: StyleProp<ViewStyle>;
};

export type ServicePricingHeaderCardProps = {
  serviceName: string;
  serviceIconText?: string | null;
  selectedPriceOption: CustomerServicePriceOption | null;
  priceOptions: CustomerServicePriceOption[];
  selectedPriceOptionId: string | null;
  quantity: number;
  isDark: boolean;
  selectedDurationMinutes: number | null;
  onSelectPriceOption: (priceOptionId: string) => void;
  onSelectDurationMinutes: (minutes: number) => void;
  onDecreaseQuantity: () => void;
  onIncreaseQuantity: () => void;
  onRemoveService: () => void;
};

export type BookingTypeChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export type BookingServiceDetailCardProps = {
  service: CustomerBookableService;
  selectedPriceOption: CustomerServicePriceOption | null;
  selectedPriceOptionId: string | null;
  quantity: number;
  unitPriceAmount: number | null;
  lineTotalAmount: number | null;
  isDark: boolean;
  selectedDurationMinutes: number | null;
  onSelectPriceOption: (priceOptionId: string) => void;
  onSelectDurationMinutes: (minutes: number) => void;
  onDecreaseQuantity: () => void;
  onIncreaseQuantity: () => void;
  onRemoveService: () => void;
};

export type ServiceTasksCarouselProps = {
  includedTasks: CustomerServiceTask[];
  excludedTasks: CustomerServiceTask[];
  isDark: boolean;
};

export type TwoOptionPillTabItem<T extends string> = {
  label: string;
  value: T;
  iconName: keyof typeof Ionicons.glyphMap;
};

export type TwoOptionPillTabsProps<T extends string> = {
  items: [TwoOptionPillTabItem<T>, TwoOptionPillTabItem<T>];
  value: T;
  onChange: (next: T) => void;
  isDark: boolean;
};

export type PinnedLocationMapPickerProps = {
  coordinates: LocationCoordinates;
  addressTitle: string;
  addressSummary: string;
  isDark: boolean;
  isResolving: boolean;
  error: string | null;
  mapHeight?: number;
  showAddressPreview?: boolean;
  onRegionChangeComplete: (coordinates: LocationCoordinates) => void;
};
