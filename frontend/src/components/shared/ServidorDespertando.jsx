import { useEffect, useState } from 'react'
import { EVENTO_SERVIDOR } from '../../services/api'
import './ServidorDespertando.css'

// Aviso global mientras el backend (Render free) despierta. api.js reintenta solo;
// al responder el servidor el aviso desaparece sin recargar la pagina.
export default function ServidorDespertando() {
  const [activo, setActivo] = useState(false)

  useEffect(() => {
    const alCambiar = (e) => setActivo(Boolean(e.detail?.activo))
    window.addEventListener(EVENTO_SERVIDOR, alCambiar)
    return () => window.removeEventListener(EVENTO_SERVIDOR, alCambiar)
  }, [])

  if (!activo) return null
  return (
    <div className="servidor-despertando" role="status" aria-live="polite">
      <span className="servidor-despertando__punto" aria-hidden="true" />
      Despertando el servidor… puede tardar hasta un minuto la primera vez.
    </div>
  )
}
