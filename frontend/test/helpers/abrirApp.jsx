// Abre la aplicación COMPLETA (<App />: router, sesión, guardas de rol, páginas) en una URL,
// opcionalmente con una sesión ya iniciada. Importar después de declarar los vi.mock.
import { render } from '@testing-library/react'
import App from '../../src/App'

const jwt = (payload) => `h.${btoa(JSON.stringify(payload))}.s`

export const estudiante = { id_usuario: 1, nombre: 'Ana', nombre_usuario: 'ana', tipo_usuario: 'estudiante' }
export const conductor = { id_usuario: 2, nombre: 'Pedro', nombre_usuario: 'pedro', tipo_usuario: 'conductor' }
export const admin = { id_usuario: 3, nombre: 'Admin', nombre_usuario: 'admin', tipo_usuario: 'admin' }

export function abrirApp(ruta = '/', usuario = null, { vencida = false } = {}) {
  localStorage.clear()
  if (usuario) {
    const exp = Math.floor(Date.now() / 1000) + (vencida ? -60 : 3600)
    localStorage.setItem('token', jwt({ ...usuario, exp }))
    localStorage.setItem('usuario', JSON.stringify(usuario))
  }
  window.history.pushState({}, '', ruta)
  return render(<App />)
}
