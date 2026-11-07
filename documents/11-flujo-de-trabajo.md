# 11. Flujo de trabajo y publicación

Cómo trabajamos en equipo y cómo llega cada cambio a los celulares y al servidor
**sin que nadie entre a un panel ni descargue el APK a mano** (salvo cuando la app
lo pide).

---

## 11.1 Resumen

```
rama de trabajo ──► Pull Request ──► revisión + CI verde ──► merge a main
                     (frontend-ci,                              │
                      backend-ci)                               ▼
                                         ┌──────────── ¿qué cambió? ────────────┐
                                         │                                      │
                                    backend/ o deploy/                      frontend/
                                         │                                      │
                                  deploy-vps.yml                        app-release.yml
                                  tests → VPS por SSH                   tests → ¿cambio nativo?
                                                                          │            │
                                                                         no            sí
                                                                          │            │
                                                                     OTA (EAS     APK nuevo en
                                                                     Update)      GitHub Releases
                                                                          │            │
                                                              llega solo al     la app avisa
                                                              abrir la app      "Descargar"
```

## 11.2 Reglas del equipo

1. **Nadie hace push directo a `main`.** Todo entra por Pull Request.
2. Una rama por tarea, creada desde `main` actualizado:
   `feat/<tema>`, `fix/<tema>`, `chore/<tema>`, `docs/<tema>`.
3. Commits con prefijo convencional: `feat(map): …`, `fix(chat): …`, `test: …`.
4. El PR necesita **CI en verde** y **una aprobación** de otro integrante.
5. Se fusiona con **Squash and merge**: un commit por PR. Su título aparece en las notas
   del release, así que debe entenderse solo.
6. Merge a `main` = publicación. Si no está listo para que lo usen todos, no se fusiona.

```bash
git switch main && git pull
git switch -c feat/filtro-cafeterias
# … cambios …
cd frontend && npx jest && npx tsc --noEmit   # lo mismo que corre el CI
git push -u origin feat/filtro-cafeterias
gh pr create --fill
```

## 11.3 ¿Mi cambio necesita APK nuevo?

No hay que decidirlo a mano: el workflow calcula la **huella nativa** del proyecto
(`runtimeVersion` con policy `fingerprint`) y la compara con las de los APK ya
publicados. Como referencia:

| Cambio | Cómo llega | Qué hace el usuario |
|---|---|---|
| Pantallas, estilos, textos, lógica (`.ts`/`.tsx`) | OTA | Nada. Se aplica al abrir la app (o toca **Reiniciar** en el aviso). |
| Imágenes, fuentes, datos del campus (`unmsm.ts`) | OTA | Nada. |
| Variables `EXPO_PUBLIC_*` en EAS | OTA (en el siguiente merge) | Nada. |
| Instalar/actualizar una librería **con código nativo** | APK | Toca **Descargar** en el aviso e instala encima. |
| Plugins, permisos, ícono, splash, `scheme` en `app.config.ts` | APK | Ídem. |
| Subir la versión del SDK de Expo | APK | Ídem. |

> ⚠️ No pongas en `app.config.ts` valores que salgan de `process.env`. Cambiarían la
> huella según dónde se calcule y las OTA dejarían de llegar. Lo público va como
> `EXPO_PUBLIC_*` y se lee en `src/constants/config.ts`.

Las OTA solo se aplican a APKs con la misma huella: un cambio de JS nunca llega a un
APK viejo incompatible, así que no puede romperlo.

## 11.4 Dónde se descarga la app

- Página: `https://<DOMINIO>/descargar`, con la última versión, las anteriores y
  los pasos de instalación.
- Enlace directo, siempre a la última:
  `https://github.com/frank777ch/OndeSanMarcos/releases/latest/download/ondesanmarcos.apk`
- Historial con notas de cambios: pestaña **Releases** del repo (tags `app-v<N>`).

La primera vez Android pide permitir *instalar apps desconocidas* para el navegador.
Las siguientes versiones se instalan encima y conservan la sesión y los datos.

## 11.5 Probar antes de fusionar

- **En tu celular con tu código:** usa un build de desarrollo (`development`,
  incluye `expo-dev-client`) y `npx expo start`. Se instala una vez con
  `npx eas-cli build -p android --profile development`.
- **Que otro pruebe tu PR:** `cd frontend && npx eas-cli update --channel preview --environment preview --message "PR #N"`,
  con un APK del perfil `preview`. Sirve para revisar sin tocar a los usuarios de `production`.

## 11.6 Si algo sale mal

| Problema | Solución |
|---|---|
| Una OTA rompió la app | Revertir el PR en GitHub (botón **Revert**) y fusionar: sale otra OTA con el código anterior. Si urge: `npx eas-cli update:rollback`. |
| Un APK salió mal | Revertir y forzar un APK: Actions → **app-release** → *Run workflow* → `forzar_apk`. El nuevo tendrá `versionCode` mayor y la app avisará. |
| El aviso de APK no aparece | Comprobar que el release sea `app-v<N>`, no borrador, con un `.apk` adjunto. |
| La OTA no llega | Cerrar la app por completo y abrirla dos veces (la primera descarga y la segunda aplica). Revisar en expo.dev → Updates que esté en el canal `production`. |
| El workflow avisa "huella no coincide" | Algo en `app.config.ts` depende del entorno. Corregirlo (ver 11.3). |

## 11.7 Configuración inicial (una sola vez)

Responsable: quien administre la cuenta de Expo del equipo.

1. **Proyecto EAS:** `cd frontend && npx eas-cli login && npx eas-cli init` y pegar
   el `projectId` en `EAS_PROJECT_ID` de `app.config.ts` (activa también las OTA).
2. **Variables de EAS** para `preview` y `production`: ver §10.8.
3. **Keystore de Android** (la firma debe ser siempre la misma o Android no deja
   actualizar): `npx eas-cli credentials -p android` → perfil `release-apk` →
   *Keystore* → *Set up a new keystore*. Lo guarda EAS y no se versiona.
4. **Token para GitHub Actions:** expo.dev → *Account settings* → *Access tokens* →
   crear y guardarlo como secret `EXPO_TOKEN` del repo.
5. **Protección de `main`:** Settings → Branches → regla para `main` con PR obligatorio,
   1 aprobación y los checks `frontend-ci` y `backend-ci`.
6. **Primer APK:** Actions → **app-release** → *Run workflow* (`forzar_apk` activado).
   Es el único que todos instalan a mano desde `/descargar`. Desde ahí todo
   llega solo.
