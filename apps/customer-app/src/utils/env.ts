export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME,
} as const;