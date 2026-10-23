# HU-05 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Tareas
- [x] T1 · Spec escrita y aprobada (todos)
- [x] T2 · Plan y tareas escritos
- [x] T3 · Comprobar que HU-04 está hecha (`sendChatQuery`, tipos `ChatResponse` y modo mock). Si no, hacerla antes
- [x] T4 · `utils/query.ts` (`normalizeQuery`) + test (RF-05.3, RF-05.6)
- [x] T5 · `useChatStore` (`send`, `retry`, filtro de lugares desconocidos) + test (RF-05.1, RF-05.4, RF-05.5, RF-05.10, RF-05.11, RF-05.18, RF-05.23)
- [x] T6 · `ChatInput` (textarea que crece, Enter/Shift+Enter, «Enviar», foco) + test (RF-05.2, RF-05.3, RF-05.4, RF-05.6, RF-05.15, RF-05.25, RF-05.27)
- [x] T7 · `UserMessage`, `TypingIndicator`, `ChatError`, `ChatWelcome` (RF-05.8, RF-05.10, RF-05.12, RF-05.26)
- [x] T8 · `PlaceLinkCard` + test: elige el lugar con origen `other`, quita el filtro y navega a `/mapa` (RF-05.16, RF-05.19, RF-05.22, RF-05.27)
- [x] T9 · `AssistantMessage` (texto con saltos de línea y tarjetas) + test (RF-05.5, RF-05.7, RF-05.16, RF-05.17, RF-05.26)
- [x] T10 · `useStickToBottom` + test (RF-05.13, RF-05.14)
- [x] T11 · `MessageList` (región `aria-live`, indicador, error, botón «Ir al último mensaje») + test (RF-05.8, RF-05.10, RF-05.12, RF-05.13, RF-05.14, RF-05.27)
- [x] T12 · `ChatPage`: columna de 48 rem sin scroll de página, caja fija abajo + test de que la conversación sobrevive al volver (RF-05.12, RF-05.23, RF-05.24, RF-05.25)
- [x] T13 · Test en `FlyToSelection.test.tsx`: un remonte con selección `other` vuela otra vez (RF-05.20, RF-05.21)
- [x] T14 · Revisar colores en tema claro y oscuro, y `prefers-reduced-motion` en el scroll (RF-05.28)
- [ ] T15 · Probar a mano con el mapa real y el backend o el mock (escenarios 6, 7, 12, 13, 14, 15 y 16)

## Verificación final
- [x] `npm run test` en verde (190 tests)
- [x] `npm run build` sin errores
- [x] `npm run lint` sin avisos
- [ ] Escenarios de `spec.md` comprobados a mano en el navegador: 6, 7, 12, 13, 14, 15 y 16 (el resto, con tests)
- [x] `spec.md` en «Implementada»; HU-05 y HU-08 con ✅ en la tabla y los títulos de `../../histories.md`
- [ ] Commit `feat(web): HU-05 …` con spec, plan, task y código

## Pendiente / notas
- RF-05.9 y el escenario 5 se retiraron (sin Render no hay aviso de servidor despertando). La numeración no se reordena.
- `draw_route` y `destination` de la respuesta se ignoran hasta HU-13/14.
- HU-06 (sugerencias) añade chips al chat vacío; HU-07 añade `persist` al store.
- Falta comprobar a mano (T15): escenarios 6, 7, 12, 13, 14, 15 y 16 con el mapa real y el backend o el mock.
- «Ir al último mensaje» aparece siempre que el usuario esté a más de 120 px del final, no solo cuando llega contenido nuevo: evita un estado extra (la regla de lint prohíbe `setState` en efectos).
- Al abrir el mapa con un lugar ya elegido desde el chat, `PlaceSearch` arrancaba vacío; ahora inicia con el nombre del lugar (RF-12.18 al montar). Test en `PlaceSearch.test.tsx`.
