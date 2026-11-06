import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronUp, faChevronDown, faLocationDot } from '@fortawesome/free-solid-svg-icons'
import './Mapa.css'

// Hoja inferior sin selección: buses en ruta y paradas. La lista de paradas es también el camino
// para quien no puede tocar los puntos del mapa (teclado, lector de pantalla).
export default function HojaBuses({ buses, paradas, expandido, onAlternar, onElegir, onElegirParada, descripcion, etiquetaDe }) {
  const hay = buses.length > 0
  const expandible = hay || paradas.length > 0
  return (
    <div className="hoja-buses">
      <button className="hoja-cabecera" onClick={onAlternar} aria-expanded={expandido} disabled={!expandible}>
        <span>{hay ? `${buses.length} ${buses.length === 1 ? 'bus' : 'buses'} en ruta` : 'Ningún bus transmite ahora'}</span>
        {expandible && <FontAwesomeIcon icon={expandido ? faChevronDown : faChevronUp} />}
      </button>
      {expandido && expandible && (
        <div className="hoja-lista">
          {hay && (
            <>
              <h3 className="hoja-seccion">Buses</h3>
              <ul>
                {buses.map(b => {
                  const et = etiquetaDe(b)
                  return (
                    <li key={b.id_bus}>
                      <button className="hoja-fila" onClick={() => onElegir(b)}>
                        <span className="hoja-fila-info">
                          <strong>{b.nombre}</strong>
                          <span>{descripcion(b)}</span>
                        </span>
                        <span className={`etiqueta etiqueta--${et.tipo}`}>{et.texto}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
          {paradas.length > 0 && (
            <>
              <h3 className="hoja-seccion">Paradas</h3>
              <ul>
                {paradas.map(p => (
                  <li key={p.id_parada}>
                    <button className="hoja-fila" onClick={() => onElegirParada(p)}>
                      <span className="hoja-fila-info hoja-fila-parada">
                        <FontAwesomeIcon icon={faLocationDot} />
                        <strong>{p.nombre}</strong>
                      </span>
                      {(p.activa === false || p.activa === 0) && <span className="etiqueta etiqueta--neutro">Inactiva</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
