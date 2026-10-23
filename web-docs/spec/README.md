# Spec-Driven Development (SDD)

En este proyecto la **spec es la fuente de verdad**: se escribe y se revisa **antes** del código, y el código y los tests se derivan de ella. Si algo cambia durante la implementación, se corrige primero la spec.

## Ciclo por historia

1. **Especificar.** Copiar `_template.md` a `HU-XX-nombre.md` y completarlo. Estado: `Borrador`.
2. **Revisar.** El equipo lee la spec y resuelve las "Preguntas abiertas". Estado: `Aprobada`.
3. **Implementar.** Seguir la sección "Diseño" y las "Tareas", sin salirse del "Alcance".
4. **Probar contra la spec.** Cada requisito (`RF-XX.N`) tiene al menos un test cuyo nombre empieza con su ID, por ejemplo `it('RF-10.5: ...')`. Cada escenario de aceptación se comprueba a mano o con test.
5. **Cerrar.** Estado `Implementada`, marcar ✅ en `../histories.md` y hacer commit (`feat(web): HU-XX …`) con spec y código juntos.

## Reglas

- **Una spec por historia**, nombrada `HU-XX-nombre-corto.md`. Las historias viven en `../histories.md`; la spec las detalla.
- **Requisitos verificables.** Formato: «Cuando <situación>, el sistema debe <comportamiento>». Nada de "debería verse bien".
- **Alcance explícito.** Lo que queda fuera se lista en "Fuera de alcance" con la historia que lo cubrirá.
- **Solo escritorio** (≥ 1024px) hasta HU-21. Las specs no incluyen requisitos móviles.
- **Cambios de rumbo.** Si el código necesita algo que la spec no dice, se edita la spec en el mismo commit y se anota en "Historial".
- **Trazabilidad.** `RF-XX.N` → test → código. Para buscarlo: `grep -rn "RF-10.5" web/src web-docs`.

## Archivos

| Archivo | Para qué |
|---|---|
| `_template.md` | Plantilla de spec |
| `HU-XX-*.md` | Una spec por historia |

## Nota sobre HU-01 a HU-09

Se hicieron antes de adoptar SDD. Sus criterios están en `../histories.md` y no tienen spec propia. Desde HU-10 toda historia tiene spec.
