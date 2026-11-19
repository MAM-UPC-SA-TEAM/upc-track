import { StatusBar, Style } from '@capacitor/status-bar'
import { esNativa } from './platform'

// Colores de «papel» de tokens.css; la barra de estado nativa los replica para que
// no quede una franja de otro color sobre la app.
const PAPEL = { claro: '#fbfaf4', oscuro: '#111b21' }

const CLAVE = 'tema'
export const PREFERENCIAS_TEMA = ['claro', 'oscuro', 'auto']

// Preferencia del usuario: «claro», «oscuro» o «auto» (sigue al teléfono). Sin elegir, claro: el producto se usa
// a pleno sol y el claro es el principal.
export function leerPreferenciaTema() {
  try {
    const guardado = localStorage.getItem(CLAVE)
    if (PREFERENCIAS_TEMA.includes(guardado)) return guardado
  } catch { /* sin almacenamiento */ }
  return 'claro'
}

export function guardarPreferenciaTema(preferencia) {
  try { localStorage.setItem(CLAVE, preferencia) } catch { /* sin almacenamiento */ }
}

// ¿Esa preferencia se ve oscura ahora? «auto» depende del teléfono.
export function esOscuro(preferencia = leerPreferenciaTema()) {
  if (preferencia === 'oscuro') return true
  if (preferencia === 'auto') return Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  return false
}

export function temaInicialOscuro() {
  return esOscuro()
}

// Mientras el splash de arranque está visible, la barra de estado se queda clara (el splash va siempre en papel claro,
// como el nativo): si no, con el tema oscuro quedaba una franja oscura con íconos oscuros sobre el splash.
let barraClaraFija = false

function aplicarBarraEstado(oscuro) {
  if (!esNativa) return
  // Style.Light = texto oscuro (fondo claro); Style.Dark = texto claro (fondo oscuro)
  StatusBar.setStyle({ style: oscuro ? Style.Dark : Style.Light }).catch(() => {})
  StatusBar.setBackgroundColor({ color: PAPEL[oscuro ? 'oscuro' : 'claro'] }).catch(() => {})
}

/**
 * Fija (true) o suelta (false) la barra de estado en claro. Fija: aplicarTema sigue cambiando el tema de la página
 * pero no toca la barra. Suelta: la barra toma el tema vigente.
 */
export function fijarBarraEstadoClara(fija) {
  barraClaraFija = fija
  aplicarBarraEstado(fija ? false : document.body.dataset.tema === 'oscuro')
}

// Aplica el tema a la página y, en la app nativa, a la barra de estado.
export function aplicarTema(oscuro) {
  const tema = oscuro ? 'oscuro' : 'claro'
  document.body.dataset.tema = tema
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', PAPEL[tema])
  if (barraClaraFija) return
  aplicarBarraEstado(oscuro)
}
