import { Config } from '@constants/config';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

/** Log de red solo en desarrollo (EXPO_PUBLIC_ENABLE_DEV_LOGS=true). */
function devLog(...args: unknown[]): void {
  if (Config.dev.enableLogs) {
    console.log('[api]', ...args);
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  const url = `${Config.api.baseUrl}${endpoint}`;

  // Corta la petición si el backend no responde a tiempo (cold start de Render).
  // Sin esto, un fallo de red dejaría el spinner colgado indefinidamente.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Config.api.timeout);

  devLog(method, url, body ?? '');
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      devLog('error', response.status, response.statusText);
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      devLog('timeout', `${Config.api.timeout}ms`, url);
      throw new Error(`API timeout after ${Config.api.timeout}ms`);
    }
    devLog('network error', error);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body }),
};
