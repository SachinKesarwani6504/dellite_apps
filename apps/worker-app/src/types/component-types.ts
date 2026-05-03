import type { ComponentProps, ElementRef } from 'react';
import type { Image, ImageBackground, ImageSourcePropType } from 'react-native';
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
