import type { ComponentProps, ElementRef } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { Image, ImageBackground, ImageSourcePropType, StyleProp, ViewProps, ViewStyle } from 'react-native';
import type { WorkerCurrentStatus } from '@/types/auth';
import type { ImageCacheMode } from '@/types/shared';
import type { UploadPreviewFile } from '@/types/file-upload';

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
