export const APP_BANNER_PLACEMENT_KEY = {
  CUSTOMER_HOME: 'CUSTOMER_HOME',
  CATEGORY_SELECT: 'CATEGORY_SELECT',
  SUBCATEGORY_SELECT: 'SUBCATEGORY_SELECT',
  SERVICE_SELECT: 'SERVICE_SELECT',
  BOOKING_REVIEW: 'BOOKING_REVIEW',
  WORKER_HOME: 'WORKER_HOME',
} as const;

export type AppBannerPlacementKey =
  (typeof APP_BANNER_PLACEMENT_KEY)[keyof typeof APP_BANNER_PLACEMENT_KEY];

export const APP_BANNER_TARGET_TYPE = {
  CATEGORY: 'CATEGORY',
  SUBCATEGORY: 'SUBCATEGORY',
  SERVICE: 'SERVICE',
  URL: 'URL',
  SCREEN: 'SCREEN',
} as const;

export type AppBannerTargetType =
  (typeof APP_BANNER_TARGET_TYPE)[keyof typeof APP_BANNER_TARGET_TYPE];

export const APP_BANNER_TARGET_SCREEN = {
  HOME: 'HOME',
  CATEGORY_SELECT: 'CATEGORY_SELECT',
  SUBCATEGORY_SELECT: 'SUBCATEGORY_SELECT',
  SERVICE_SELECT: 'SERVICE_SELECT',
  BOOKING_REVIEW: 'BOOKING_REVIEW',
  MY_BOOKINGS: 'MY_BOOKINGS',
  PROFILE: 'PROFILE',
  SUPPORT: 'SUPPORT',
  REFERRAL: 'REFERRAL',
} as const;

export type AppBannerTargetScreen =
  (typeof APP_BANNER_TARGET_SCREEN)[keyof typeof APP_BANNER_TARGET_SCREEN];

export type AppBannerAction = {
  targetType: AppBannerTargetType;
  targetId?: string;
  targetUrl?: string;
  targetScreen?: AppBannerTargetScreen;
};

export type AppBannerItem = {
  id: string;
  overline: string | null;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  backgroundColor: string | null;
  textColor: string | null;
  isClickable: boolean;
  action: AppBannerAction | null;
};

export type AppBannerQuery = {
  placementKey: AppBannerPlacementKey;
  city?: string;
  cityId?: string;
  categoryId?: string;
  subcategoryId?: string;
  serviceId?: string;
};
