import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup, configure } from '@testing-library/react'

// Las páginas se cargan con lazy(): bajo carga (suite completa o CI) 1 s por defecto se queda corto.
configure({ asyncUtilTimeout: 5000 })

// jsdom no implementa matchMedia (lo usan el tema y la detección de PWA instalada).
beforeEach(() => {
  window.matchMedia = vi.fn((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }))
})

// jsdom no implementa scrollIntoView (lo usa la gestión de rutas al elegir una ruta).
Element.prototype.scrollIntoView = vi.fn()

// jsdom no implementa <dialog>.showModal()/close() (los usan los formularios de administración).
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function close() {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

afterEach(() => cleanup())
