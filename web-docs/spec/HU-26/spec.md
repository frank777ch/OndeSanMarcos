# HU-26 · Login de administrador (web)

- **Estado:** Implementada
- **Historia:** ver `../../histories.md#hu-26`
- **Depende de:** HU-25 (endpoints de login y `/me` del backend) y HU-03 (estructura de la web).
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

## 1. Contexto y objetivo
HU-25 permite al administrador autenticarse en la API, pero la web no tiene dónde hacerlo. Esta historia agrega la pantalla de login, la sesión del administrador (iniciarla, mantenerla al recargar y cerrarla) y un área `/admin` protegida. Como todavía no hay funciones de administración, el área solo tiene la barra lateral con una pestaña «Perfil» y el contenido vacío; ahí irán más pestañas en HU-22 y siguientes. Los visitantes no ven ningún cambio.

## 2. Alcance
**Dentro:**
- Pantalla de login con usuario y contraseña, y sus mensajes de error.
- Sesión del administrador: guardarla, mantenerla al recargar, cerrarla.
- Área `/admin` protegida, con la misma barra lateral desplegable del mapa, una sola pestaña «Perfil» y el contenido vacío.
- Acción «Cerrar sesión» en la barra lateral.
- Un único punto de la web para hacer llamadas autenticadas a la API (envía el token), reutilizable por historias futuras.
- Reacción a una sesión vencida o rechazada por la API.
- Pruebas de la web.

**Fuera (y dónde se hace):**
- Funciones de administración (editar lugares, gestionar administradores) → HU-22 y siguientes.
- Renovación automática del token, «recordarme» y «olvidé mi contraseña» → historias futuras.
- Enlace visible al login para los visitantes → no se agrega; se entra por la dirección `/admin/login`.
- Adaptación a móvil → HU-21 (por ahora solo escritorio ≥ 1024px).

## 3. Requisitos

### Pantalla de login
| ID | Requisito |
|---|---|
| RF-26.1 | Cuando el usuario abre `/admin/login`, el sistema debe mostrar un formulario con los campos «Usuario» y «Contraseña» (oculta) y el botón «Ingresar», con el foco en «Usuario». |
| RF-26.2 | Mientras algún campo esté vacío, el botón «Ingresar» debe estar deshabilitado. Pulsar Enter en un campo debe enviar el formulario si ambos están completos. |
| RF-26.3 | Mientras se envía el formulario, el sistema debe indicar que está trabajando, deshabilitar el botón y no aceptar envíos repetidos. |
| RF-26.4 | Cuando el login es correcto, el sistema debe iniciar la sesión y llevar al usuario a `/admin`. |
| RF-26.5 | Cuando el servidor responde que las credenciales son incorrectas, el sistema debe mostrar «Usuario o contraseña incorrectos», conservar el usuario escrito, vaciar la contraseña y dejar el foco en ella. |
| RF-26.6 | Cuando el servidor indica demasiados intentos, el sistema debe mostrar un mensaje con el tiempo de espera que informa el servidor, en minutos redondeados hacia arriba, y no volver a enviar mientras tanto desde esa pantalla. |
| RF-26.7 | Cuando no se puede contactar al servidor o este responde con error, el sistema debe mostrar «No se pudo conectar con el servidor. Intenta de nuevo.» y permitir reintentar. |
| RF-26.8 | Los mensajes de error deben anunciarse a los lectores de pantalla. La contraseña debe estar oculta por defecto y el campo debe tener un ícono (ojo) que la muestre u oculte, con nombre accesible «Mostrar contraseña» / «Ocultar contraseña», sin perder lo escrito. |

### Sesión
| ID | Requisito |
|---|---|
| RF-26.9 | La sesión debe mantenerse al recargar la página dentro de la misma pestaña y terminar al cerrarla. |
| RF-26.10 | La web debe guardar solo el token y su vencimiento; la contraseña no debe guardarse ni escribirse en los registros de desarrollo. El token tampoco debe escribirse en esos registros. |
| RF-26.11 | Cuando el token guardado ya venció, el sistema debe tratarlo como sin sesión y descartarlo. |
| RF-26.12 | Cuando hay sesión y el usuario abre `/admin/login`, el sistema debe llevarlo a `/admin`. |

### Área protegida
| ID | Requisito |
|---|---|
| RF-26.13 | Cuando se abre `/admin` sin sesión, el sistema debe llevar al usuario a `/admin/login`. |
| RF-26.14 | Cuando se abre `/admin` con sesión, el sistema debe confirmar con el servidor que la sesión sigue siendo válida antes de mostrar el área. Si el servidor la rechaza, debe cerrar la sesión y llevar al login con el mensaje «Tu sesión expiró. Ingresa de nuevo.» |
| RF-26.15 | El área `/admin` debe usar la misma barra lateral contraíble y desplegable de la vista del mapa, pero con una única pestaña, «Perfil», marcada como activa. El contenido de la pestaña debe estar vacío. La barra no debe incluir las pestañas Mapa ni Asistente. |
| RF-26.16 | La barra lateral del área `/admin` debe tener la acción «Cerrar sesión». Cuando el usuario la pulsa, el sistema debe descartar la sesión y llevarlo a `/admin/login`. |
| RF-26.17 | Cuando cualquier llamada autenticada a la API responde que la sesión no es válida, el sistema debe cerrar la sesión y llevar al login con el mensaje de RF-26.14. |
| RF-26.18 | Las llamadas autenticadas a la API deben hacerse desde un único punto de la web que añada el token; ninguna pantalla debe armar esa cabecera por su cuenta. |
| RF-26.21 | La barra lateral del área `/admin` debe conservar el comportamiento de la del mapa: contraerse y desplegarse con la misma transición y ir encima del contenido sin redimensionarlo. |

### Visitantes
| ID | Requisito |
|---|---|
| RF-26.19 | La vista del mapa y del asistente no debe cambiar ni mostrar enlaces o referencias al área de administración. |
| RF-26.20 | Una ruta desconocida debe seguir comportándose como hasta ahora; solo `/admin` y `/admin/login` son nuevas. |

## 4. Escenarios de aceptación
**Escenario 1: ingresar** (RF-26.1, RF-26.4, RF-26.15)
- **Dado** el administrador creado por HU-24
- **Cuando** abro `/admin/login`, escribo su usuario y contraseña y pulso «Ingresar»
- **Entonces** llego a `/admin` y veo la barra lateral con la pestaña «Perfil» activa y el contenido vacío.

**Escenario 1b: barra del área de administración** (RF-26.15, RF-26.16, RF-26.21)
- **Cuando** estoy en `/admin`
- **Entonces** la barra se contrae y se despliega como la del mapa, solo tiene «Perfil» (sin Mapa ni Asistente) y la acción «Cerrar sesión».

**Escenario 2: contraseña incorrecta** (RF-26.5)
- **Cuando** envío una contraseña equivocada
- **Entonces** veo «Usuario o contraseña incorrectos», el usuario sigue escrito y la contraseña está vacía con el foco en ella.

**Escenario 3: demasiados intentos** (RF-26.6)
- **Cuando** el servidor responde que estoy bloqueado
- **Entonces** veo cuántos minutos esperar.

**Escenario 4: servidor apagado** (RF-26.7)
- **Cuando** envío el formulario con el backend apagado
- **Entonces** veo el mensaje de conexión y puedo reintentar.

**Escenario 5: recargar** (RF-26.9, RF-26.14)
- **Dado** que tengo sesión en `/admin`
- **Cuando** recargo la página
- **Entonces** sigo en `/admin` sin volver a escribir mis datos.

**Escenario 6: protección** (RF-26.13)
- **Cuando** abro `/admin` sin sesión
- **Entonces** me lleva a `/admin/login`.

**Escenario 7: sesión vencida o rechazada** (RF-26.11, RF-26.14, RF-26.17)
- **Dado** un token vencido, o que el administrador fue borrado
- **Cuando** abro `/admin` o hago una llamada autenticada
- **Entonces** vuelvo al login con «Tu sesión expiró. Ingresa de nuevo.»

**Escenario 8: cerrar sesión** (RF-26.16)
- **Cuando** pulso «Cerrar sesión» en la barra lateral y luego abro `/admin`
- **Entonces** me lleva al login.

**Escenario 9: visitantes** (RF-26.19)
- **Cuando** uso el mapa y el chat como visitante
- **Entonces** no veo nada del área de administración.

## 5. Preguntas abiertas
Resueltas el 2026-11-12:
- **Dónde se guarda el token:** en el almacenamiento de la pestaña (`sessionStorage`).
- **Cómo se llega al login:** solo por `/admin/login`, sin enlace visible.
- **Contenido de `/admin`:** la misma barra lateral del mapa con una sola pestaña, «Perfil», y sin contenido. No se muestra el nombre del administrador hasta que haya un perfil real.

## 6. Historial
- 2026-11-12 · Borrador creado.
- 2026-11-12 · Aprobada. El área `/admin` pasa a ser la barra lateral con la pestaña «Perfil» vacía (sin nombre en pantalla); «Cerrar sesión» va en la barra.
- 2026-11-12 · RF-26.8: se agrega el ícono para mostrar u ocultar la contraseña.
