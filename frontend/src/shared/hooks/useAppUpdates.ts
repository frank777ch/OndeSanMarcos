import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import * as Updates from "expo-updates";
import * as Application from "expo-application";

import { Config } from "@constants/config";
import {
  ApkRelease,
  fetchLatestApkRelease,
  isNewerThanInstalled,
} from "@shared/utils/appRelease";

// Al volver a primer plano no se consulta más de una vez cada 30 min.
const RECHECK_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Dos tipos de actualización:
 *  - OTA (JS/TS): expo-updates la descarga sola; cuando está lista se ofrece
 *    reiniciar. Si se ignora, se aplica en el siguiente arranque.
 *  - APK (cambio nativo): se avisa con un enlace al GitHub Release más nuevo.
 *
 * En desarrollo (__DEV__) no hace nada.
 */
export function useAppUpdates() {
  const { isUpdatePending } = Updates.useUpdates();
  const [apkRelease, setApkRelease] = useState<ApkRelease | null>(null);
  const lastCheck = useRef(0);

  const check = useCallback(async () => {
    lastCheck.current = Date.now();

    if (Updates.isEnabled) {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) await Updates.fetchUpdateAsync();
      } catch {
        // Sin red o servidor caído: se reintenta en el próximo arranque.
      }
    }

    if (Platform.OS === "android") {
      try {
        const latest = await fetchLatestApkRelease(Config.releases.repo);
        setApkRelease(
          isNewerThanInstalled(Application.nativeBuildVersion, latest)
            ? latest
            : null,
        );
      } catch {
        // Ídem: un aviso perdido no es grave.
      }
    }
  }, []);

  useEffect(() => {
    if (__DEV__) return;
    check();
    const subscription = AppState.addEventListener("change", (state) => {
      if (
        state === "active" &&
        Date.now() - lastCheck.current > RECHECK_INTERVAL_MS
      ) {
        check();
      }
    });
    return () => subscription.remove();
  }, [check]);

  const applyOtaUpdate = useCallback(() => {
    Updates.reloadAsync().catch(() => {});
  }, []);

  return {
    otaReady: Updates.isEnabled && isUpdatePending,
    applyOtaUpdate,
    apkRelease,
  };
}
