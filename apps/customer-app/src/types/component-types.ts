import type { ComponentProps, ElementRef } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { Image, ImageBackground, ImageSourcePropType, StyleProp, TextInput, ViewProps, ViewStyle } from 'react-native';
import type { LiveRouteResult } from '@/types/live-route';
import type { LiveTrackingCard } from '@/types/live-tracking';
import type { LocationCoordinates } from '@/modules/location/types/location.types';
import type { Booking } from '@/types/api';
import type { CustomerBookableService, CustomerServicePriceOption, CustomerServiceTask } from '@/types/customer';
import type { ImageCacheMode } from '@/types/shared';
import type { WorkerLiveLocationRecord, WorkerRouteCoordinates } from '@/types/worker-live-location';
import type { WorkerVehicleMode } from '@/types/worker-live-location';

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

export type PermissionPromptTone = 'location' | 'notification';

export type PermissionPromptCardProps = {
  tone: PermissionPromptTone;
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void | Promise<void>;
  loading?: boolean;
  helperText?: string | null;
  containerClassName?: string;
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
  hideRemoveAction?: boolean;
  hideDecreaseQuantityAction?: boolean;
  minSelectableDurationMinutes?: number | null;
  hideFlexiblePriceOptionChoices?: boolean;
  readOnly?: boolean;
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
  hideRemoveAction?: boolean;
  hideDecreaseQuantityAction?: boolean;
  minSelectableDurationMinutes?: number | null;
  hideFlexiblePriceOptionChoices?: boolean;
  readOnly?: boolean;
  readOnlyReason?: string | null;
};

export type CustomerBookingCardProps = {
  item: Booking;
  onPress: (bookingId: string) => void;
};

export type CustomerOngoingBookingCardProps = {
  item: Booking;
  onPress: (bookingId: string) => void;
};

export type CustomerOngoingBookingsRowProps = {
  items: Booking[];
  onPressBooking: (bookingId: string) => void;
};

export type LivePulseIndicatorSize = 'default' | 'compact';

export type LivePulseIndicatorProps = {
  size?: LivePulseIndicatorSize;
};

export type SectionHeaderRowProps = {
  title: string;
  onPressAction?: () => void;
  actionIconName?: 'chevron-forward' | 'arrow-forward' | 'ellipsis-horizontal';
  showLiveIndicator?: boolean;
};

export type FloatingTabRouteIcon = {
  active: ComponentProps<typeof Ionicons>['name'];
  inactive: ComponentProps<typeof Ionicons>['name'];
};

export type FloatingTabRoute = {
  key: string;
  name: string;
  params?: object;
};

export type FloatingTabDescriptorOptions = {
  title?: string;
  tabBarAccessibilityLabel?: string;
};

export type FloatingTabBarProps = {
  state: {
    index: number;
    routes: FloatingTabRoute[];
  };
  descriptors: Record<string, { options: FloatingTabDescriptorOptions }>;
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault?: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
  routeIconMap: Record<string, FloatingTabRouteIcon>;
};

export type FloatingTabBarRenderProps = Omit<FloatingTabBarProps, 'routeIconMap'>;

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

export type WorkerLiveRouteMapProps = {
  workerLocation: WorkerLiveLocationRecord | null;
  vehicleMode: WorkerVehicleMode;
  destinationCoordinates: WorkerRouteCoordinates;
  route: LiveRouteResult | null;
  isDark: boolean;
  loading: boolean;
  error: string | null;
};

export type WorkerLiveMarkerProps = {
  headingDegrees: number;
};

export type LiveTrackingStatusCardProps = {
  card: LiveTrackingCard;
  isDark: boolean;
  liveBadgeText: string;
  error?: string | null;
};

export type ScrollablePillTabItem<T extends string> = {
  label: string;
  value: T;
  iconName?: keyof typeof Ionicons.glyphMap;
};

export type ScrollablePillTabsProps<T extends string> = {
  items: ScrollablePillTabItem<T>[];
  value: T;
  onChange: (next: T) => void;
};

export type DetailsTopBarProps = {
  onBack: () => void;
  onEdit?: () => void;
  editLabel?: string;
  editDisabled?: boolean;
};

export type BookingDetailsSectionProps = {
  isDark: boolean;
};

export const BOOKING_SERVICE_SUMMARY_CARD_MODE = {
  VIEW: 'VIEW',
  EDIT: 'EDIT',
} as const;

export type BookingServiceSummaryCardMode =
  (typeof BOOKING_SERVICE_SUMMARY_CARD_MODE)[keyof typeof BOOKING_SERVICE_SUMMARY_CARD_MODE];

export type BookingServiceSummaryCardAddon = {
  id: string;
  title: string;
  description?: string | null;
  pricingLabel: string;
};

export type BookingServiceSummaryCardProps = {
  mode: BookingServiceSummaryCardMode;
  title: string;
  subtitle?: string | null;
  iconText?: string | null;
  selectedValueLabel: string;
  selectedValue: string;
  pricingTitle: string;
  pricingValue: string;
  totalLabel: string;
  addons?: BookingServiceSummaryCardAddon[];
  onRemove?: () => void;
};
