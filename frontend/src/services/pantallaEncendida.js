// Mantiene la pantalla encendida mientras el conductor transmite (Wake Lock API).
//
//   mantener()   // al iniciar el recorrido
//   liberar()    // al terminarlo
//
// El navegador y la WebView sueltan el bloqueo solos cuando la app pasa a segundo plano, así que se vuelve
// a pedir al regresar. Si el dispositivo no la soporta, no pasa nada: el aviso en pantalla le pide al
// conductor mantener la app abierta.

import { alReanudar } from './cicloVida'

let candado = null
let activo = false
let quitarReanudar = null

async function pedir() {
  if (!activo || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return
  try {
    const nuevo = await navigator.wakeLock.request('screen')
    if (!activo) { nuevo.release().catch(() => {}); return } // se liberó mientras esperaba
    candado = nuevo
    candado.addEventListener?.('release', () => { if (candado === nuevo) candado = null })
  } catch { /* sin permiso o sin batería: el aviso en pantalla cubre este caso */ }
}

export function mantener() {
  if (activo) return
  activo = true
  quitarReanudar = alReanudar(() => { if (!candado) pedir() })
  pedir()
}

export function liberar() {
  activo = false
  quitarReanudar?.()
  quitarReanudar = null
  const actual = candado
  candado = null
  actual?.release().catch(() => {})
}
