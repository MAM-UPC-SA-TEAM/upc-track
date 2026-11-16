// Adapter del estado de red: @capacitor/network en la app nativa (el WebView de
// Android no siempre dispara online/offline) y los eventos del navegador en web/PWA.
//
//   hayRed()                 -> boolean (último estado conocido)
//   const quitar = alCambiarRed(conectado => ...)

import { Network } from '@capacitor/network'
import { esNativa } from '../utils/platform'

let conectado = typeof navigator === 'undefined' ? true : navigator.onLine
const oyentes = new Set()

function fijar(valor) {
  if (valor === conectado) return
  conectado = valor
  oyentes.forEach(cb => cb(valor))
}

if (esNativa) {
  Network.getStatus().then(s => fijar(s.connected)).catch(() => {})
  Network.addListener('networkStatusChange', s => fijar(s.connected))
} else if (typeof window !== 'undefined') {
  window.addEventListener('online', () => fijar(true))
  window.addEventListener('offline', () => fijar(false))
}

export function hayRed() {
  return conectado
}

export function alCambiarRed(cb) {
  oyentes.add(cb)
  return () => oyentes.delete(cb)
}
