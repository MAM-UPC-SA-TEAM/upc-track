// Ciclo de vida de la app: volver de segundo plano y botón atrás de Android.
//
//   const quitar = alReanudar(msFuera => ...)   // msFuera: tiempo que estuvo oculta
//   const quitar = alAtras(() => true)          // true = «lo atendí», no navegar
//
// En nativo usa @capacitor/app; en web, visibilitychange (el botón atrás es del navegador).

import { App } from '@capacitor/app'
import { esNativa } from '../utils/platform'

const reanudar = new Set()
const atras = [] // pila: el último en registrarse (p. ej. el panel abierto) atiende primero
let ocultaDesde = typeof document !== 'undefined' && document.visibilityState === 'hidden' ? Date.now() : null

function cambioVisibilidad(activa) {
  if (!activa) {
    ocultaDesde ??= Date.now()
    return
  }
  if (ocultaDesde === null) return
  const msFuera = Date.now() - ocultaDesde
  ocultaDesde = null
  reanudar.forEach(cb => cb(msFuera))
}

if (esNativa) {
  App.addListener('appStateChange', ({ isActive }) => cambioVisibilidad(isActive))
} else if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => cambioVisibilidad(document.visibilityState === 'visible'))
}

// false mientras la app está en segundo plano (o la pestaña oculta)
export function enPrimerPlano() {
  return ocultaDesde === null
}

export function alReanudar(cb) {
  reanudar.add(cb)
  return () => reanudar.delete(cb)
}

export function alAtras(cb) {
  atras.push(cb)
  return () => {
    const i = atras.lastIndexOf(cb)
    if (i >= 0) atras.splice(i, 1)
  }
}

// La registra BotonAtrasNativo con la navegación del router.
export function escucharBotonAtras(porDefecto) {
  if (!esNativa) return () => {}
  const h = App.addListener('backButton', ({ canGoBack }) => {
    for (let i = atras.length - 1; i >= 0; i--) if (atras[i]()) return
    porDefecto(canGoBack)
  })
  return () => { h.then(x => x.remove()) }
}

export function salirDeLaApp() {
  App.exitApp()
}
