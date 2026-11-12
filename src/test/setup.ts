import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { MockWebSocket } from './kraken-fixtures'
beforeEach(() => {
  MockWebSocket.instances = []
  vi.stubGlobal('WebSocket', MockWebSocket)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  if (typeof document !== 'undefined') {
    window.localStorage.clear()
    document.documentElement.classList.remove('dark')
  }
})
