import type { AppBannerAction } from '@/types/app-banner';

export type BannerNavigation = {
  navigate: (screen: string, params?: unknown) => void;
};

export type BannerActionHandlerParams = {
  action: AppBannerAction | null;
  navigation: BannerNavigation;
  city?: string;
};

