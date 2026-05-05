const appJson = require('./app.json');

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

module.exports = {
  ...appJson.expo,
  android: {
    ...appJson.expo.android,
    config: googleMapsApiKey
      ? {
        ...(appJson.expo.android.config ?? {}),
        googleMaps: {
          ...(appJson.expo.android.config?.googleMaps ?? {}),
          apiKey: googleMapsApiKey,
        },
      }
      : appJson.expo.android.config,
  },
};
