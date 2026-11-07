import { ExpoConfig, ConfigContext } from "expo/config";

// Única fuente de configuración de Expo (reemplaza a app.json).
//
// ID del proyecto en EAS. Se obtiene con `npx eas-cli init` usando la cuenta de
// Expo del equipo y se pega aquí (ver documents/10-despliegue-vps.md §10.8).
const EAS_PROJECT_ID: string | undefined = "3092fe63-a84c-4d9e-b388-6588c2669229";

// IMPORTANTE: esta config entra en la "huella" nativa (runtimeVersion con
// policy "fingerprint"). No metas aquí valores que dependan del entorno
// (tokens, URLs, process.env): la huella calculada en GitHub Actions dejaría de
// coincidir con la del build y las actualizaciones OTA no llegarían a nadie.
// Los valores públicos van como EXPO_PUBLIC_* (ver src/constants/config.ts).

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "OndeSanMarcos",
  slug: "ondesanmarcos",
  owner: "ondesanmarcospes-team",
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
  // Actualizaciones OTA (EAS Update). La huella cambia solo si cambia algo
  // nativo (dependencias nativas, plugins, permisos, SDK); en ese caso hace
  // falta un APK nuevo y la OTA no se aplica a builds incompatibles.
  runtimeVersion: { policy: "fingerprint" },
  ...(EAS_PROJECT_ID
    ? {
        updates: {
          url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
          checkAutomatically: "ON_LOAD" as const,
          fallbackToCacheTimeout: 0,
        },
      }
    : {}),
  plugins: [
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "OndeSanMarcos usa tu ubicación para mostrarte en el mapa del campus y guiarte hasta tu destino.",
      },
    ],
    "expo-font",
    // El token secreto (sk.) para descargar el SDK lo lee Gradle directamente
    // de la variable de entorno RNMAPBOX_MAPS_DOWNLOAD_TOKEN (variables de EAS).
    "@rnmapbox/maps",
  ],
  experiments: {
    typedRoutes: false,
  },
  extra: {
    ...(EAS_PROJECT_ID ? { eas: { projectId: EAS_PROJECT_ID } } : {}),
  },
});
