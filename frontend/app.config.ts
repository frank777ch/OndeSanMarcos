import { ExpoConfig, ConfigContext } from "expo/config";
import "dotenv/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "OndeSanMarcos",
  slug: "ondesanmarcos",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  scheme: "ondesanmarcos",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#003087",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.ondesanmarcos.app",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#003087",
    },
    package: "com.ondesanmarcos.app",
    permissions: config.android?.permissions || [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
    ],
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-location",
    "expo-font",
    [
      "@rnmapbox/maps",
      {
        RNMAPBOX_MAPS_DOWNLOAD_TOKEN: process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN,
      },
    ],
  ],
  experiments: {
    typedRoutes: false,
  },
  extra: {
    eas: {
      projectId: "PROJECT_ID",
    },
    mapboxPublicToken: process.env.MAPBOX_PUBLIC_TOKEN,
  },
});
