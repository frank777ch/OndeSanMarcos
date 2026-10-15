import { ExpoConfig, ConfigContext } from "expo/config";
import "dotenv/config";

// Única fuente de configuración de Expo (reemplaza a app.json).
//
// ID del proyecto en EAS. Se obtiene con `npx eas-cli init` usando la cuenta de
// Expo del equipo y se pega aquí (ver documents/10-despliegue-vps.md §10.8).
const EAS_PROJECT_ID: string | undefined = undefined;

// Token público (pk.) de Mapbox. EXPO_PUBLIC_MAPBOX_TOKEN es el nombre vigente;
// MAPBOX_PUBLIC_TOKEN se acepta por compatibilidad con .env antiguos.
const MAPBOX_PUBLIC_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? process.env.MAPBOX_PUBLIC_TOKEN;

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
    permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "OndeSanMarcos usa tu ubicación para mostrarte en el mapa del campus y guiarte hasta tu destino.",
      },
    ],
    "expo-font",
    [
      "@rnmapbox/maps",
      {
        // Token secreto (sk.) solo para descargar el SDK al compilar. Va en las
        // variables de EAS, nunca en el repo.
        RNMAPBOX_MAPS_DOWNLOAD_TOKEN: process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN,
      },
    ],
  ],
  experiments: {
    typedRoutes: false,
  },
  extra: {
    ...(EAS_PROJECT_ID ? { eas: { projectId: EAS_PROJECT_ID } } : {}),
    mapboxPublicToken: MAPBOX_PUBLIC_TOKEN,
  },
});
