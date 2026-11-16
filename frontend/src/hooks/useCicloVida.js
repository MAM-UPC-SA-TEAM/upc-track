import { useEffect, useRef, useSyncExternalStore } from 'react'
import { alAtras, alReanudar } from '../services/cicloVida'
import { alCambiarRed, hayRed } from '../services/red'

// true/false según la red (nativa o del navegador), con re-render al cambiar.
export function useEnLinea() {
  return useSyncExternalStore(alCambiarRed, hayRed)
}

// Ejecuta cb al volver de segundo plano si estuvo fuera al menos `minMs`.
export function useAlReanudar(cb, minMs = 15_000) {
  const ref = useRef(cb)
  useEffect(() => { ref.current = cb })
  useEffect(() => alReanudar(ms => { if (ms >= minMs) ref.current(ms) }), [minMs])
}

// Mientras `activo`, el botón atrás de Android llama a `cerrar` en vez de navegar.
export function useCerrarConAtras(activo, cerrar) {
  const ref = useRef(cerrar)
  useEffect(() => { ref.current = cerrar })
  useEffect(() => {
    if (!activo) return undefined
    return alAtras(() => { ref.current(); return true })
  }, [activo])
}
