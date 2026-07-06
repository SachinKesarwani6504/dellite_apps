import type { ComponentProps, ElementRef } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { Image, ImageBackground, ImageSourcePropType, StyleProp, ViewProps, ViewStyle } from 'react-native';
import type { WorkerJobListItem } from '@/types/jobs';
import type { WorkerCurrentStatus } from '@/types/auth';
import type { ImageCacheMode } from '@/types/shared';
import type { UploadPreviewFile } from '@/types/file-upload';
import type { LiveRouteResult, RouteCoordinates, RouteVehicleMode } from '@/types/live-route';
import type { LiveTrackingCard } from '@/types/live-tracking';
import type { WorkerLiveLocationRecord } from '@/lib/firebase';

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

export type OtpCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
};

export type CardWrapperProps = ViewProps & {
  isDark: boolean;
  lightBackgroundColor?: string;
  darkBackgroundColor?: string;
  borderColor?: string;
  withShadow?: boolean;
  style?: StyleProp<ViewStyle>;
};

export type FileUploadCardProps = {
  files: UploadPreviewFile[];
  onPress: () => void;
  disabled?: boolean;
  isPicking?: boolean;
  isDark: boolean;
  isRequired?: boolean;
  multiple?: boolean;
  iconName?: string;
  idleTitle?: string;
  pickingTitle?: string;
  description?: string;
  helperText?: string;
  maxPreviewItems?: number;
};

export type WorkerCurrentStatusBannerProps = {
  currentStatus?: WorkerCurrentStatus | null;
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

export type WorkerBookingRouteMapProps = {
  workerLiveLocation: WorkerLiveLocationRecord | null;
  originCoordinates: RouteCoordinates;
  destinationCoordinates: RouteCoordinates;
  vehicleMode: RouteVehicleMode;
  route: LiveRouteResult | null;
  isDark: boolean;
  loading: boolean;
  error: string | null;
  onVehicleModeChange?: (mode: RouteVehicleMode) => void;
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

export type WorkerOngoingJobCardProps = {
  item: WorkerJobListItem;
  onPress: (jobId: string) => void;
};

export type WorkerOngoingJobsRowProps = {
  items: WorkerJobListItem[];
  onPressJob: (jobId: string) => void;
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
