import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation, faRotate, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import './Talon.css'

const ICONOS = { retraso: faTriangleExclamation, cambio_ruta: faRotate }

function haceTexto(fecha) {
  const min = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000)
  if (!Number.isFinite(min) || min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  return `hace ${Math.floor(min / 60)} h`
}

// Aviso del conductor a su ruta: un talón amarillo (relleno, no borde de color).
export default function AvisoConductor({ aviso }) {
  if (!aviso) return null
  return (
    <aside className="aviso" aria-label="Aviso del conductor">
      <FontAwesomeIcon icon={ICONOS[aviso.tipo] || faCircleInfo} className="aviso-icono" />
      <p className="aviso-texto">{aviso.mensaje}</p>
      <time className="aviso-hace dato" dateTime={aviso.fecha_hora}>{haceTexto(aviso.fecha_hora)}</time>
    </aside>
  )
}
