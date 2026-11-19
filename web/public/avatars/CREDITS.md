# Créditos de los avatares

Todos los modelos de esta carpeta son de uso libre (CC0, dominio público).

- `robot.glb` — «RobotExpressive» de Tomás Laulhé, tomado de los ejemplos de three.js. CC0.
- `knight.glb`, `mage.glb`, `rogue.glb` — «KayKit: Adventurers Character Pack 1.0» de Kay Lousberg
  (https://kaylousberg.com, https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0). CC0.
  Se les quitaron las animaciones que la app no usa (se conservan `Idle` y `Walking_A`).
- `panda.glb` — «Panda» de Quaternius (https://quaternius.com), vía https://poly.pizza/m/q1uJ28Hs8T. CC0.
  Se conservan las animaciones `Idle` y `Walk`.
- `fish.glb` — «Clownfish» de Quaternius, vía https://poly.pizza/m/769fHo3eEB. CC0.
  Se conservan dos animaciones de nado, renombradas `Idle` (Swimming_Normal) y `Walk` (Swimming_Fast).
- `worm.glb` — «Worm» de Quaternius, vía https://poly.pizza/m/KiNAaBa4cK. CC0.
  Modificado para este proyecto: se cambió el color a verde y se crearon las animaciones `Idle` y `Walk`
  (el modelo original no traía animaciones).

Para añadir un modelo: copiar el GLB aquí y sumar una línea en `src/features/avatar/avatars.ts`.
Antes de incluirlo, comprobar que su licencia permite redistribuirlo (CC0 o equivalente).
