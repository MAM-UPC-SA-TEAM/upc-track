// Reglas del splash de arranque (U35). La animación vive en components/shared/Splash.jsx.
//
//  · Una vez por arranque en frío: volver del fondo no remonta la app, y una vez mostrado no se repite.
//  · En el navegador la landing (/) abre directo; el splash es de la app (APK, PWA instalada y rutas internas).

import { esNativa } from './platform'

export const DURACION_MIN_MS = 1100 // lo que el bus tarda en llegar a la parada, más una pausa breve
export const DURACION_MIN_REDUCIDA_MS = 500 // con «reducir movimiento»
export const DURACION_MAX_MS = 3000 // tope: nunca retiene la app
export const DURACION_SALIDA_MS = 250 // fundido de salida (igual a la transición de Splash.css)

let yaMostrado = false

export function marcarSplashMostrado() {
  yaMostrado = true
}

/** Solo para las pruebas: simula un arranque en frío nuevo. */
export function reiniciarSplash() {
  yaMostrado = false
}

export const enStandalone = () => Boolean(
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true,
)
export const prefiereMenosMovimiento = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

/** ¿Hay que mostrar el splash en este arranque? */
export function debeMostrarSplash({ ruta = window.location.pathname, nativa = esNativa, standalone = enStandalone() } = {}) {
  if (yaMostrado) return false
  if (nativa || standalone) return true
  return ruta !== '/'
}
