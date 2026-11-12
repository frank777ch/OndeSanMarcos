# HU-26 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Tareas
- [x] T1 · Extraer `layouts/SidebarShell.tsx` de `AppLayout` (enlaces y pie por props) y dejar `AppLayout` usándolo; `AppLayout.test.tsx` sigue en verde sin cambios (RF-26.21, RF-26.19)
- [x] T2 · `client.ts`: `get`, cabeceras opcionales y `retryAfterSeconds` en `ApiError`; el chat no cambia; añadir tests a `client.test.ts` (RF-26.6, RF-26.18)
- [x] T3 · `features/admin/types.ts` y `store/useAuthStore.ts` (`login`, `logout`, `expired`, `sessionStorage` con `try/catch`, descarta sesión vencida) + `useAuthStore.test.ts` (RF-26.4, 26.9 a 26.11, 26.16)
- [x] T4 · `services/api/authApi.ts` (`loginRequest`) + test (RF-26.4 a 26.7)
- [x] T5 · `services/api/adminClient.ts` (token en cabecera, 401 → `logout('expired')`, `fetchMe`) + `adminClient.test.ts` (RF-26.14, 26.17, 26.18)
- [x] T6 · `pages/AdminLoginPage.tsx`: formulario, foco, errores 401/429/red, cuenta atrás del bloqueo, aviso de sesión vencida, redirección con sesión + `AdminLoginPage.test.tsx` (RF-26.1 a 26.8, 26.12)
- [x] T7 · `features/admin/components/AdminGuard.tsx` + test (RF-26.13, 26.14)
- [x] T8 · `layouts/AdminLayout.tsx` (pestaña «Perfil», «Cerrar sesión» en el pie) y `pages/AdminProfilePage.tsx` vacía + `AdminLayout.test.tsx` (RF-26.15, 26.16, 26.21)
- [x] T9 · `routes.tsx`: `/admin/login` y `/admin`; ampliar `routes.test.tsx` (RF-26.13, 26.19, 26.20)
- [x] T10 · Comprobar que con los logs de desarrollo activos no se escribe la contraseña ni el token (RF-26.10)
- [ ] T11 · Probar a mano en el navegador con el backend de HU-25 y el administrador de HU-24: escenarios 1 a 9 (pendiente: solo se probó con tests y el backend por `curl`)

## Verificación final
- [x] `npm run test` en verde (344 tests)
- [x] `npm run build` sin errores
- [x] `npm run lint` sin avisos
- [ ] Escenarios de `spec.md` comprobados (por tests; falta la prueba manual en el navegador, T11)
- [x] `spec.md` en «Implementada»; tabla resumen y título en `../../histories.md` con ✅
- [ ] Commit `feat(web): HU-26 …` con spec, plan, task y código

## Pendiente / notas
- Depende de HU-25 (login y `/me` en el backend): implementarla antes de T11.
- Adaptación a móvil: HU-21. Funciones de administración: HU-22 y siguientes.
