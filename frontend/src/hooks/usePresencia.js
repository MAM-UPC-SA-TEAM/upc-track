import { useEffect, useState } from 'react'

// Mantiene montado un elemento mientras dura su animación de SALIDA. Sin esto, React lo quita del DOM en el mismo
// instante en que se cierra y la salida nunca se ve.
//   const { montado, saliendo } = usePresencia(abierto, 140)
//   montado: pintarlo; saliendo: ya se cerró, está en su animación de salida (se desmonta solo al terminar).
// Con «reducir movimiento» no hay salida: se desmonta en el acto.
const reducirMovimiento = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

export function usePresencia(abierto, ms) {
  const [montado, setMontado] = useState(abierto)
  const [saliendo, setSaliendo] = useState(false)

  // Se ajusta durante el render (patrón de React para derivar estado de una prop): sin un render intermedio
  // con el estado viejo.
  if (abierto && (!montado || saliendo)) {
    setMontado(true)
    setSaliendo(false)
  } else if (!abierto && montado && !saliendo) {
    if (reducirMovimiento()) setMontado(false)
    else setSaliendo(true)
  }

  useEffect(() => {
    if (!saliendo) return undefined
    const t = setTimeout(() => { setMontado(false); setSaliendo(false) }, ms)
    return () => clearTimeout(t) // si se vuelve a abrir a mitad de la salida, no se desmonta
  }, [saliendo, ms])

  return { montado, saliendo }
}
