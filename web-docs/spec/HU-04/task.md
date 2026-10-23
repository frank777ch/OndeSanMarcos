# HU-04 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Tareas
- [x] T1 · Spec escrita y aprobada (todos)
- [x] T2 · Plan y tareas escritos
- [x] T3 · `config.ts`: sección `api` y `dev.enableLogs` + tests (RF-04.1 a RF-04.4)
- [x] T4 · Revisar `web/.env.example` (RF-04.5)
- [x] T5 · Tipos del chat en `features/chat/types` (RF-04.15)
- [x] T6 · `client.ts`: `apiClient.post`, `ApiError`, `userMessageFor`, timeout y logs + `client.test.ts` (RF-04.6 a RF-04.13, RF-04.23, RF-04.24)
- [x] T7 · `mockChat.ts` + `mockChat.test.ts` (RF-04.20 a RF-04.22)
- [x] T8 · `chatApi.ts`: `sendChatQuery`, normalización y elección mock/real + `chatApi.test.ts` (RF-04.14 a RF-04.19)
- [x] T9 · Probar a mano con el backend de Docker: respuesta real, backend apagado y base caída (escenarios 1, 4, 5 y 6)

## Verificación final
- [x] `npm run test` en verde (141 tests)
- [x] `npm run build` sin errores
- [x] `npm run lint` sin avisos
- [x] Escenarios de `spec.md` comprobados (manuales: 1, 4, 5 y 6 con el backend de Docker; el resto, con tests)
- [x] `spec.md` en «Implementada»; HU-04 con ✅ en la tabla y el título de `../../histories.md`
- [ ] Commit `feat(web): HU-04 …` con spec, plan, task y código

## Pendiente / notas
- Fijar CORS del backend al origen de la web al desplegar.
- HU-05 usa `sendChatQuery` y muestra solo `error.message`; el detalle técnico se queda en la consola.
- `ApiError` decide `timeout` por `controller.signal.aborted` y no por el nombre del error: `DOMException` no es `instanceof Error` en jsdom.
- Escenarios 1, 4, 5 y 6 comprobados con el backend real (cliente en vitest contra `localhost:8000`): respuesta real con `biblioteca-central` (~2 s), `network` con el backend apagado, `http 503` con la base apagada y `timeout` a los 30 s con el backend pausado. Tras recuperar el backend vuelve a responder.
