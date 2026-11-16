import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRotate } from '@fortawesome/free-solid-svg-icons'
import { EsqueletoLista } from '../shared/Esqueleto'
import '../inicio/Talon.css'
import './Listas.css'

// Estado de una lista que no tiene filas que mostrar: cargando, error de carga o vacía.
// El error NO se disfraza de vacío: «No pudimos cargar» y «No hay nada» son cosas distintas.
export default function EstadoLista({ fase, etiquetaCarga = 'Cargando…', filas = 3, vacio, accion, onReintentar }) {
  if (fase === 'cargando') return <EsqueletoLista filas={filas} etiqueta={etiquetaCarga} />

  if (fase === 'error') {
    return (
      <section className="talon lista-estado" role="alert">
        <div className="talon-cuerpo">
          <p className="talon-sin">No pudimos cargar</p>
        </div>
        <div className="talon-perf" aria-hidden="true" />
        <p className="talon-vacio">Revisa tu conexión e inténtalo de nuevo.</p>
        <button type="button" className="talon-accion" onClick={onReintentar}>
          <FontAwesomeIcon icon={faRotate} /> Reintentar ahora
        </button>
      </section>
    )
  }

  return (
    <section className="talon lista-estado">
      <div className="talon-cuerpo">
        <p className="talon-sin">{vacio.titulo}</p>
      </div>
      <div className="talon-perf" aria-hidden="true" />
      <p className="talon-vacio">{vacio.texto}</p>
      {accion && (
        <Link to={accion.to} className="talon-accion boton">
          {accion.icono && <FontAwesomeIcon icon={accion.icono} />} {accion.texto}
        </Link>
      )}
    </section>
  )
}
