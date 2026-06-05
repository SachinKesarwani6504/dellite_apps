const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const googleServicesFile = './google-services.json';

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile,
    config: googleMapsApiKey
      ? {
          ...(config.android?.config ?? {}),
          googleMaps: {
            ...(config.android?.config?.googleMaps ?? {}),
            apiKey: googleMapsApiKey,
          },
        }
      : config.android?.config,
  },
});
