import { Config } from '@/config'

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'invalid'

const GENERIC_MESSAGE = 'El asistente tuvo un problema. Inténtalo de nuevo.'

/** Texto pensado para el usuario: sin estados, direcciones ni jerga (RF-04.12). */
export function userMessageFor(kind: ApiErrorKind, status?: number): string {
  if (kind === 'network') {
    return 'No pudimos conectarnos con el asistente. Revisa tu conexión e inténtalo de nuevo.'
  }
  if (kind === 'timeout') return 'El asistente tardó demasiado en responder. Inténtalo de nuevo.'
  if (kind === 'http' && status === 503) {
    return 'El asistente no está disponible por ahora. Inténtalo en unos minutos.'
  }
  if (kind === 'http' && status === 422) {
    return 'Tu pregunta no es válida. Escríbela con entre 1 y 1000 caracteres.'
  }
  return GENERIC_MESSAGE
}

/**
 * Error del cliente. `message` es para mostrar al usuario; `detail` es técnico
 * y solo se escribe en la consola (RF-04.24): la interfaz no debe mostrarlo.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly detail: string
  /** Segundos de espera que indica el servidor (`Retry-After`), p. ej. en un 429. */
  readonly retryAfterSeconds?: number

  constructor(kind: ApiErrorKind, detail: string, status?: number, retryAfterSeconds?: number) {
    super(userMessageFor(kind, status))
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.detail = detail
    this.retryAfterSeconds = retryAfterSeconds
  }
}

function log(...args: unknown[]): void {
  if (Config.dev.enableLogs) console.log('[api]', ...args)
}

function logFailure(error: ApiError): void {
  if (Config.dev.enableLogs) console.warn('[api]', error.kind, error.detail)
}

interface RequestOptions {
  body?: unknown
  /** Cabeceras extra (p. ej. `Authorization`). Solo las añade `adminClient`. */
  headers?: Record<string, string>
}

function parseRetryAfter(response: Response): number | undefined {
  const seconds = Number(response.headers.get('Retry-After'))
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined
}

async function request<T>(method: 'GET' | 'POST', endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${Config.api.baseUrl}${endpoint}`
  const started = performance.now()
  const elapsed = () => `${Math.round(performance.now() - started)}ms`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Config.api.timeoutMs)

  try {
    let response: Response
    try {
      response = await fetch(url, {
        method,
        headers: {
          ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
          ...options.headers,
        },
        body: method === 'POST' ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      })
    } catch (cause) {
      // Solo el temporizador cancela la petición: si la señal se abortó, fue el tiempo máximo.
      const aborted = controller.signal.aborted
      throw new ApiError(
        aborted ? 'timeout' : 'network',
        `${method} ${url}: ${aborted ? `sin respuesta tras ${Config.api.timeoutMs}ms` : String(cause)}`,
      )
    }

    log(method, url, response.status, elapsed())
    if (!response.ok) {
      throw new ApiError(
        'http',
        `${method} ${url}: ${response.status} ${response.statusText}`,
        response.status,
        parseRetryAfter(response),
      )
    }

    try {
      return (await response.json()) as T
    } catch (cause) {
      throw new ApiError('invalid', `${method} ${url}: la respuesta no es JSON (${String(cause)})`)
    }
  } catch (error) {
    if (error instanceof ApiError) {
      log(method, url, error.kind, elapsed())
      logFailure(error)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

export const apiClient = {
  post: <T>(endpoint: string, body: unknown, headers?: Record<string, string>) =>
    request<T>('POST', endpoint, { body, headers }),
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>('GET', endpoint, { headers }),
}
