// «Mundo falso» para las pruebas funcionales: se simulan SOLO las fronteras de la app
// (el backend HTTP y Socket.IO). Todo lo demás —rutas, contexto de sesión, páginas,
// componentes— es el código real.
//
// Uso en una prueba (los vi.mock se elevan solos):
//   vi.mock('../../src/services/api', async () => (await import('../helpers/mundoFalso.js')).moduloApiFalso)
//   vi.mock('../../src/services/socket', async () => (await import('../helpers/mundoFalso.js')).moduloSocketFalso)

import { vi } from 'vitest'

// ── Backend HTTP falso ──────────────────────────────────────
export const backend = {
  respuestas: {}, // 'GET /api/rutas' -> dato | (cuerpo) => dato | rechazo(...)
  llamadas: [],   // { metodo, url, cuerpo } en orden
  reset() {
    this.respuestas = {}
    this.llamadas = []
  },
  responder(metodo, url, cuerpo) {
    this.llamadas.push({ metodo, url, cuerpo })
    const r = this.respuestas[`${metodo} ${url}`]
    const valor = typeof r === 'function' ? r(cuerpo) : r
    if (valor?.__rechazo) return Promise.reject({ status: valor.status, message: valor.message })
    return Promise.resolve(valor === undefined ? {} : valor)
  },
  llamadasA(metodo, url) {
    return this.llamadas.filter((l) => l.metodo === metodo && l.url === url)
  },
}

// Respuesta de error del backend (api.js lanza { status, message })
export const rechazo = (status, message) => ({ __rechazo: true, status, message })

export const moduloApiFalso = {
  default: {
    get: (url) => backend.responder('GET', url),
    post: (url, cuerpo) => backend.responder('POST', url, cuerpo),
    patch: (url, cuerpo) => backend.responder('PATCH', url, cuerpo),
    delete: (url) => backend.responder('DELETE', url),
  },
  EVENTO_SERVIDOR: 'api:servidor-despertando',
}

// ── Socket.IO falso ─────────────────────────────────────────
const oyentes = new Map() // evento -> Set<callback>

export const socketFalso = {
  connected: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
  on(evento, cb) {
    if (!oyentes.has(evento)) oyentes.set(evento, new Set())
    oyentes.get(evento).add(cb)
  },
  off(evento, cb) {
    oyentes.get(evento)?.delete(cb)
  },
  // Simula un evento que llega desde el servidor
  desdeServidor(evento, datos) {
    oyentes.get(evento)?.forEach((cb) => cb(datos))
  },
  reset() {
    oyentes.clear()
    this.connected = false
    this.connect.mockClear()
    this.disconnect.mockClear()
    this.emit.mockClear()
  },
}

export const moduloSocketFalso = {
  default: socketFalso,
  unirseRuta: vi.fn(),
  salirRuta: vi.fn(),
  olvidarRutas: vi.fn(),
}
