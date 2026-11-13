import { StatusBar, Style } from '@capacitor/status-bar'
import { esNativa } from './platform'

// Colores de «papel» de tokens.css; la barra de estado nativa los replica para que
// no quede una franja de otro color sobre la app.
const PAPEL = { claro: '#fbfaf4', oscuro: '#101a13' }

// Tema guardado o, si no hay, el del sistema.
export function temaInicialOscuro() {
  try {
    const guardado = localStorage.getItem('tema')
    if (guardado) return guardado === 'oscuro'
  } catch { /* sin almacenamiento */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

// Aplica el tema a la página y, en la app nativa, a la barra de estado.
export function aplicarTema(oscuro) {
  const tema = oscuro ? 'oscuro' : 'claro'
  document.body.dataset.tema = tema
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', PAPEL[tema])
  if (!esNativa) return
  // Style.Light = texto oscuro (fondo claro); Style.Dark = texto claro (fondo oscuro)
  StatusBar.setStyle({ style: oscuro ? Style.Dark : Style.Light }).catch(() => {})
  StatusBar.setBackgroundColor({ color: PAPEL[tema] }).catch(() => {})
}
