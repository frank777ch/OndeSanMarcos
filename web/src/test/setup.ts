import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// Las pruebas nunca tocan la red: por defecto `fetch` falla como si no hubiera conexión. Quien necesite
// respuestas las simula con `vi.stubGlobal('fetch', ...)`.
beforeEach(() => {
  vi.stubGlobal('fetch', () => Promise.reject(new TypeError('sin red en las pruebas')))
})

afterEach(() => cleanup())
