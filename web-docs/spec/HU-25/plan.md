# HU-25 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Ejecutado

## 1. Enfoque
Un paquete `app/auth` ampliado con: emisión y lectura del token (JWT firmado con HS256), un limitador de intentos en memoria y una dependencia de FastAPI `get_current_admin` que valida el token y comprueba que el administrador aún existe. El router `app/api/auth.py` expone login y `/me`. La verificación de `JWT_SECRET` se hace al arrancar, en el `lifespan`, igual que `DATABASE_URL` en HU-24.

## 2. Datos y tipos
- `Settings`: `jwt_secret: str = ""`, `access_token_expire_minutes: int = 60`. No se valida en el constructor (los tests crean `Settings(_env_file=None)` a menudo); se valida al arrancar.
- Esquemas (`app/schemas/auth.py`): `LoginRequest(username, password)` con `min_length=1`; `TokenResponse(access_token, token_type="bearer", expires_in)`; `MeResponse(username)`.
- Claims del token: `sub` (username), `iat`, `exp`.
- `Database.get_admin(username) -> dict | None` con `username` y `password_hash` (se suma a `admin_exists` e `insert_admin`).

## 3. Archivos
| Ruta | Qué hace | Cubre |
|---|---|---|
| `backend/app/config.py` | `jwt_secret`, `access_token_expire_minutes` | RF-25.5, RF-25.4 |
| `backend/app/auth/tokens.py` | `create_access_token`, `decode_access_token` (lanza `InvalidToken`) | RF-25.1, RF-25.4, RF-25.7 |
| `backend/app/auth/rate_limit.py` | `LoginRateLimiter` (5 fallos / 15 min, bloqueo 15 min, reloj inyectable) | RF-25.10 |
| `backend/app/auth/dependencies.py` | `get_current_admin` (Bearer → administrador o 401) y `get_store` | RF-25.6 a RF-25.9 |
| `backend/app/auth/service.py` | `authenticate(store, username, password)` con hash señuelo | RF-25.2, RF-25.3 |
| `backend/app/schemas/auth.py` | Cuerpos de petición y respuesta | RF-25.1, RF-25.3, RF-25.6 |
| `backend/app/api/auth.py` | `POST /api/auth/login` y `GET /api/auth/me` | RF-25.1, RF-25.6, RF-25.10, RF-25.12 |
| `backend/app/rag/db.py` | `get_admin` | RF-25.2, RF-25.8 |
| `backend/app/main.py` | Incluir el router y exigir `JWT_SECRET` en el arranque | RF-25.5, RF-25.11 |
| `backend/requirements.txt` | `PyJWT` | RF-25.4 |
| `backend/tests/conftest.py` | Fija `JWT_SECRET` de prueba | RF-25.5 |
| `backend/.env.example`, `backend/README.md` | Documentación | RF-25.13 |

## 4. Estado y comunicación
- Los endpoints reciben la base con `Depends(get_store)`; los tests la reemplazan con `app.dependency_overrides` y una base falsa en memoria.
- El limitador es una instancia por proceso (módulo `rate_limit`), con bloqueo por `username` normalizado (minúsculas, sin espacios). Se cuentan también los usuarios inexistentes para no delatar cuáles existen, con un tope de entradas para no crecer sin límite.
- 503 por base caída: ya lo cubre el manejador de `RagProviderError` de `main.py`.

## 5. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| JWT (HS256) sin estado | Tokens opacos guardados en la base | No hace falta tabla ni consulta por petición; la revocación está fuera de alcance. |
| `get_current_admin` consulta la base en cada petición | Confiar solo en el token | Cumple RF-25.8 (administrador borrado) y la consulta es una fila por índice único. |
| Hash señuelo cuando el usuario no existe | Responder sin verificar | Iguala el tiempo de respuesta (RF-25.2). |
| `JWT_SECRET` validada en el `lifespan` | Validador de pydantic | Los tests construyen `Settings` sin secreto; mismo patrón que `DATABASE_URL`. |
| Mensaje de 401 fijo («Credenciales incorrectas») | Mensajes por causa | No filtra información (RF-25.2, RF-25.7). |
| Limitador en memoria | Contador en la base | Decidido en la spec; una sola instancia. |

## 6. Estrategia de pruebas
| Requisito | Test |
|---|---|
| RF-25.1, 25.4 | `tests/test_auth_api.py` › «RF-25.1: login correcto devuelve token», «RF-25.4: el token lleva sub y vencimiento configurable» |
| RF-25.2 | › «RF-25.2: usuario inexistente y mala contraseña dan la misma respuesta»; el hash señuelo se verifica con un test que cuenta las llamadas a `verify_password` |
| RF-25.3 | › «RF-25.3: campos vacíos o ausentes dan 422», «contraseña de más de 72 bytes da 401» |
| RF-25.5 | `tests/test_config.py` y `tests/test_auth_startup.py` › «RF-25.5: sin JWT_SECRET o con menos de 32 caracteres la app no arranca» |
| RF-25.6, 25.9 | › «RF-25.6: /me con token válido», «RF-25.9: un endpoint nuevo protegido con la dependencia exige token» |
| RF-25.7 | › «RF-25.7: sin token, alterado, mal formado o vencido dan 401 con WWW-Authenticate» |
| RF-25.8 | › «RF-25.8: token de un administrador borrado da 401» |
| RF-25.10 | `tests/test_rate_limit.py` › «RF-25.10: 5 fallos bloquean 15 min con Retry-After», «el bloqueo rechaza la contraseña correcta», «un éxito reinicia el conteo», «pasado el bloqueo vuelve a funcionar» (reloj inyectado) |
| RF-25.11 | › «RF-25.11: base caída da 503» |
| RF-25.12 | › «RF-25.12: ni la respuesta ni los logs contienen la contraseña ni el hash» (`caplog`) |
| RF-25.13 | revisión manual de `.env.example`, README y `/docs` |
| Integración | `tests/integration/test_auth_login.py`: login real contra Postgres con el administrador de HU-24 y `/me` |

A mano: levantar con `./scripts/dev.sh`, abrir `/docs` y probar el flujo con «Authorize».

## 7. Riesgos y dependencias
- **Bloqueo a propósito:** cualquiera puede bloquear al administrador enviando 5 intentos fallidos con su usuario. Se acepta en esta etapa; la mitigación (límite por IP) queda para una historia futura.
- **Una sola instancia:** con varias réplicas el límite se reparte (decidido en la spec).
- **Secreto:** cambiar `JWT_SECRET` invalida todos los tokens emitidos.
- **bcrypt y CPU:** cada login cuesta ~100 ms de CPU; el límite de intentos también lo acota.

## 8. Historial
- 2026-11-12 · Plan creado.
