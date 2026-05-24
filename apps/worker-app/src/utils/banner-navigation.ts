import { Linking } from 'react-native';
import {
  APP_BANNER_TARGET_SCREEN,
  APP_BANNER_TARGET_TYPE,
  type AppBannerAction,
  type AppBannerTargetScreen,
} from '@/types/app-banner';
import type { BannerActionHandlerParams } from '@/types/banner-navigation';
import { MAIN_TAB_SCREENS, PROFILE_SCREENS, ROOT_SCREENS } from '@/types/screen-names';

type BannerRouteResolver = (action: AppBannerAction, params: BannerActionHandlerParams) => Promise<boolean>;

const bannerRouteConfig: Record<string, BannerRouteResolver> = {
  [APP_BANNER_TARGET_TYPE.CATEGORY]: async (action, params) => {
    if (!action.targetId) return false;
    params.navigation.navigate(ROOT_SCREENS.mainTabsNavigator, { screen: MAIN_TAB_SCREENS.home });
    return true;
  },
  [APP_BANNER_TARGET_TYPE.SUBCATEGORY]: async (action, params) => {
    if (!action.targetId) return false;
    params.navigation.navigate(ROOT_SCREENS.mainTabsNavigator, { screen: MAIN_TAB_SCREENS.home });
    return true;
  },
  [APP_BANNER_TARGET_TYPE.SERVICE]: async (action, params) => {
    if (!action.targetId) return false;
    params.navigation.navigate(ROOT_SCREENS.mainTabsNavigator, { screen: MAIN_TAB_SCREENS.home });
    return true;
  },
  [APP_BANNER_TARGET_TYPE.URL]: async (action) => {
    if (!action.targetUrl) return false;
    await Linking.openURL(action.targetUrl);
    return true;
  },
  [APP_BANNER_TARGET_TYPE.SCREEN]: async (action, params) => {
    if (!action.targetScreen) return false;
    const screenResolver = screenRouteConfig[action.targetScreen];
    if (!screenResolver) return false;
    screenResolver(params);
    return true;
  },
};

const screenRouteConfig: Record<AppBannerTargetScreen, (params: BannerActionHandlerParams) => void> = {
  [APP_BANNER_TARGET_SCREEN.HOME]: (params) => {
    params.navigation.navigate(ROOT_SCREENS.mainTabsNavigator, { screen: MAIN_TAB_SCREENS.home });
  },
  [APP_BANNER_TARGET_SCREEN.CATEGORY_SELECT]: (params) => {
    params.navigation.navigate(ROOT_SCREENS.mainTabsNavigator, { screen: MAIN_TAB_SCREENS.jobs });
  },
  [APP_BANNER_TARGET_SCREEN.SUBCATEGORY_SELECT]: (params) => {
    params.navigation.navigate(ROOT_SCREENS.mainTabsNavigator, { screen: MAIN_TAB_SCREENS.jobs });
  },
  [APP_BANNER_TARGET_SCREEN.SERVICE_SELECT]: (params) => {
    params.navigation.navigate(ROOT_SCREENS.mainTabsNavigator, { screen: MAIN_TAB_SCREENS.jobs });
  },
  [APP_BANNER_TARGET_SCREEN.BOOKING_REVIEW]: (params) => {
    params.navigation.navigate(ROOT_SCREENS.mainTabsNavigator, { screen: MAIN_TAB_SCREENS.jobs });
  },
  [APP_BANNER_TARGET_SCREEN.MY_BOOKINGS]: (params) => {
    params.navigation.navigate(ROOT_SCREENS.mainTabsNavigator, { screen: MAIN_TAB_SCREENS.jobs });
  },
  [APP_BANNER_TARGET_SCREEN.PROFILE]: (params) => {
    params.navigation.navigate(ROOT_SCREENS.mainTabsNavigator, { screen: MAIN_TAB_SCREENS.profile });
  },
  [APP_BANNER_TARGET_SCREEN.SUPPORT]: (params) => {
    params.navigation.navigate(ROOT_SCREENS.mainTabsNavigator, {
      screen: MAIN_TAB_SCREENS.profile,
      params: { screen: PROFILE_SCREENS.helpSupport },
    });
  },
  [APP_BANNER_TARGET_SCREEN.REFERRAL]: (params) => {
    params.navigation.navigate(ROOT_SCREENS.mainTabsNavigator, {
      screen: MAIN_TAB_SCREENS.profile,
      params: { screen: PROFILE_SCREENS.referral },
    });
  },
};

export async function handleBannerAction(params: BannerActionHandlerParams): Promise<boolean> {
  if (!params.action) return false;
  const resolver = bannerRouteConfig[params.action.targetType];
  if (!resolver) return false;
  return resolver(params.action, params);
}
