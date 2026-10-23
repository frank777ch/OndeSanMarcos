# Spec-Driven Development (SDD)

En este proyecto la **spec es la fuente de verdad**: se escribe y se revisa **antes** del código, y el código y los tests se derivan de ella. Si algo cambia durante la implementación, se corrige primero la spec.

## Estructura

```
web-docs/spec/
├── README.md
├── plantillas/        # copiar de aquí al empezar una historia
│   ├── spec.md        # QUÉ: contexto, alcance, requisitos, escenarios
│   ├── plan.md        # CÓMO: diseño, archivos, decisiones, pruebas
│   └── task.md        # TRABAJO: lista de tareas y verificación final
└── HU-XX/             # una carpeta por historia
    ├── spec.md
    ├── plan.md
    └── task.md
```

| Archivo | Responde a | Quién lo lee |
|---|---|---|
| `spec.md` | ¿Qué debe hacer y cómo se comprueba? | Quien revisa y aprueba |
| `plan.md` | ¿Cómo se construye? | Quien implementa |
| `task.md` | ¿Qué falta por hacer? | Quien implementa y quien sigue el avance |

## Ciclo por historia

1. **Especificar.** Crear `HU-XX/` copiando `plantillas/`. Completar `spec.md` (estado `Borrador`).
2. **Aprobar.** Resolver las «Preguntas abiertas» y pasar `spec.md` a `Aprobada`.
3. **Planificar.** Completar `plan.md` (diseño técnico) y `task.md` (tareas en orden).
4. **Implementar.** Ejecutar `task.md` tarea por tarea, marcando `[x]`, sin salirse del alcance de la spec.
5. **Probar contra la spec.** Cada requisito (`RF-XX.N`) tiene al menos un test cuyo nombre empieza con su ID, por ejemplo `it('RF-10.5: ...')`. Los escenarios de aceptación se comprueban con test o a mano.
6. **Cerrar.** `spec.md` en `Implementada`, ✅ en `../histories.md` y un commit `feat(web): HU-XX …` con spec, plan, task y código juntos.

## Reglas

- **Requisitos verificables.** Formato: «Cuando <situación>, el sistema debe <comportamiento>». Nada de «debería verse bien».
- **Alcance explícito.** Lo que queda fuera se lista en «Fuera (y dónde se hace)» con la historia que lo cubrirá.
- **Cada archivo en su lugar.** `spec.md` no lleva rutas de archivos ni librerías; `plan.md` no repite requisitos, los cita por ID.
- **Solo escritorio** (≥ 1024px) hasta HU-21. Las specs no incluyen requisitos móviles.
- **Cambios de rumbo.** Si el código necesita algo que la spec no dice, se edita la spec en el mismo commit y se anota en su «Historial».
- **Trazabilidad.** `RF-XX.N` → test → código. Para buscarlo: `grep -rn "RF-10.5" web/src web-docs`.

## Nota sobre HU-01 a HU-09

Se hicieron antes de adoptar SDD. Sus criterios están en `../histories.md` y no tienen carpeta propia. Desde HU-10 toda historia tiene la suya.
