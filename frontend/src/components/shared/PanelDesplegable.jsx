import { useLayoutEffect, useRef } from 'react'
import { usePresencia } from '../../hooks/usePresencia'
import { DURACION_SALIDA_MS } from '../../utils/movimiento'

// Panel desplegable de la barra superior (campana, cuenta). Entra y sale escalando desde SU botón: el origen de la
// transformación se calcula con la posición del botón, no es una esquina fija. La salida es más corta que la entrada.
export default function PanelDesplegable({ abierto, anclaRef, className = '', children, ...resto }) {
  const { montado, saliendo } = usePresencia(abierto, DURACION_SALIDA_MS)
  const ref = useRef(null)

  useLayoutEffect(() => {
    const panel = ref.current
    const boton = anclaRef?.current?.querySelector('button')
    if (!panel || !boton || !panel.offsetParent) return
    // Geometría SIN transformar (getBoundingClientRect del panel ya vendría escalado por la propia animación)
    const izquierdaPanel = panel.offsetParent.getBoundingClientRect().left + panel.offsetLeft
    const b = boton.getBoundingClientRect()
    panel.style.transformOrigin = `${Math.round(b.left + b.width / 2 - izquierdaPanel)}px 0px`
  }, [montado, anclaRef])

  if (!montado) return null
  return (
    <div
      ref={ref}
      className={`topbar-panel ${className} ${saliendo ? 'topbar-panel--sale' : ''}`.trim()}
      aria-hidden={saliendo || undefined}
      {...resto}
    >
      {children}
    </div>
  )
}
