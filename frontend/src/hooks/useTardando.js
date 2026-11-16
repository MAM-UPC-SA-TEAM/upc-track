import { useEffect, useState } from 'react'

export const MS_SERVIDOR_TARDA = 6000
export const TEXTO_DESPERTANDO = 'Despertando el servidor… puede tardar hasta un minuto.'

/** true cuando la carga lleva más de `ms` (el servidor gratuito se duerme y tarda hasta un minuto). El esqueleto vive solo mientras carga. */
export function useTardando(ms = MS_SERVIDOR_TARDA) {
  const [tardando, setTardando] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setTardando(true), ms)
    return () => clearTimeout(t)
  }, [ms])
  return tardando
}
