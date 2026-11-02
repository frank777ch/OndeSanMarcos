# HU-15 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Tareas
- [x] T1 · Spec escrita y aprobada (todos)
- [x] T2 · Plan y tareas escritos
- [x] T3 · `utils/geolocation.ts`: `queryPermission`, `readPosition`, `watchPermissionChange` (RF-15.4, RF-15.5, RF-15.7, RF-15.9)
- [x] T4 · `utils/userLocation.ts`: `haloRadiusStops`, `expandBounds`, `userLocationToGeoJSON` + `userLocation.test.ts` (RF-15.15, RF-15.16)
- [x] T5 · `store/useLocationStore.ts` (`init`, `allow`, `dismissNotice`, `locate`, clave de `sessionStorage` con `try/catch`) + `useLocationStore.test.ts` (RF-15.1 a RF-15.5, RF-15.9 a RF-15.11, RF-15.17, RF-15.19)
- [x] T6 · `components/LocationNotice.tsx` (diálogo no modal, Permitir, Ahora no, Esc) + `LocationNotice.test.tsx` (RF-15.1 a RF-15.3, RF-15.6, RF-15.13)
- [x] T7 · `components/UserLocationLayer.tsx` (fuente, halo y punto) + `UserLocationLayer.test.tsx` (RF-15.14, RF-15.15, RF-15.18)
- [x] T8 · `CampusMap`: `init` al montar, botón según permiso con estado ocupado y nombre accesible, `flyTo` al llegar la posición, `maxBounds` ampliado, toast de error; montar aviso y capa (RF-15.7 a RF-15.12, RF-15.16, RF-15.19)
- [x] T9 · `CampusMap.test.tsx`: simular `navigator.geolocation` y `navigator.permissions`; casos con permiso, sin permiso, error y límites (RF-15.7 a RF-15.12, RF-15.16)
- [ ] T10 · Probar a mano con ubicación simulada (dentro y fuera del campus) y revisar el aviso en móvil

## Verificación final
- [x] `npm run test` en verde (224 tests)
- [x] `npm run build` sin errores
- [x] `npm run lint` sin avisos
- [ ] Escenarios de `spec.md` comprobados (manuales con mapa real: 1, 2, 4, 5, 10, 11, 12 y 13; el resto, por tests)
- [x] `spec.md` en «Implementada»; tabla resumen y título en `../../histories.md` con ✅
- [ ] Commit `feat(web): HU-15 …` con spec, plan, task y código

## Pendiente / notas
- Para probar en el celular con `dev.sh` hace falta HTTPS: por HTTP en una IP local el navegador no ofrece geolocalización.
- La historia original mencionaba un aviso por estar fuera del campus (geocerca); se descartó (RF-15.7, RF-15.16).
- T10 y los escenarios manuales (1, 2, 4, 5, 10, 11, 12 y 13) quedan por comprobar en el navegador con token de Mapbox y ubicación simulada.
