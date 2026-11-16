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

const ROTULOS = { retraso: 'Retraso', cambio_ruta: 'Cambio de ruta' }

// Aviso del conductor a su ruta: verde suave si informa; con franja amarilla y rótulo si es retraso o cambio de ruta.
export default function AvisoConductor({ aviso }) {
  if (!aviso) return null
  return (
    <aside className={`aviso aviso--${aviso.tipo}`} aria-label="Aviso del conductor">
      <FontAwesomeIcon icon={ICONOS[aviso.tipo] || faCircleInfo} className="aviso-icono" />
      <div className="aviso-cuerpo">
        <span className="aviso-rotulo">{ROTULOS[aviso.tipo] || 'Información'}</span>
        <p className="aviso-texto">{aviso.mensaje}</p>
      </div>
      <time className="aviso-hace dato" dateTime={aviso.fecha_hora}>{haceTexto(aviso.fecha_hora)}</time>
    </aside>
  )
}
