import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import '../inicio/Talon.css'
import './Mapa.css'

// El mismo talón de Inicio, en versión de hoja: parada o bus seleccionado en el mapa.
// fase: vivo (validado) · viejo / sin-red (anulado con sello) · sin-buses.
const SELLOS = { viejo: 'Sin señal', 'sin-red': 'Sin conexión' }

export default function TalonMapa({
  icono, titulo, destino, minutos, lineas = [], etiqueta, fase, frescura = 1, mensajeVacio, onCerrar,
}) {
  const anulado = fase === 'viejo' || fase === 'sin-red'
  const hayEta = minutos != null && (fase === 'vivo' || anulado)
  const cifra = !hayEta ? '' : minutos < 1 ? '<1' : minutos > 30 ? '30+' : String(minutos)

  const lectura = hayEta
    ? `${titulo}${destino ? ', ' + destino : ''}: ${cifra} minutos. ${anulado ? 'Dato anulado: ' + SELLOS[fase] + '.' : 'Dato validado.'}`
    : mensajeVacio

  return (
    <section className={`talon talon--hoja talon--${fase}`} aria-label={titulo}>
      <div className="talon-cuerpo">
        <div className="talon-cabecera">
          <FontAwesomeIcon icon={icono} className="talon-parada-icono" />
          <h2 className="talon-titulo">{titulo}</h2>
          <button className="talon-cerrar" onClick={onCerrar} aria-label="Cerrar">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        {destino && <p className="talon-destino">{destino}</p>}

        <div className="talon-eta">
          {hayEta
            ? (<><span className="talon-cifra" aria-hidden="true">{cifra}</span><span className="talon-unidad" aria-hidden="true">min</span></>)
            : <span className="talon-sin" aria-hidden="true">Sin bus ahora</span>}
          {anulado && <span className="sello" aria-hidden="true">{SELLOS[fase]}</span>}
        </div>
        <div className="talon-franja" style={{ '--frescura': frescura }} aria-hidden="true" />
        <p className="solo-lectura" role="status">{lectura}</p>
      </div>

      <div className="talon-perf" aria-hidden="true" />

      {hayEta ? (
        <div className="talon-datos dato">
          <div className="talon-datos-info">{lineas.map((l, i) => <span key={i}>{l}</span>)}</div>
          {etiqueta && <span className={`etiqueta etiqueta--${etiqueta.tipo}`}>{etiqueta.texto}</span>}
        </div>
      ) : (
        <p className="talon-vacio">{mensajeVacio}</p>
      )}
      {hayEta && <p className="talon-nota">Tiempo estimado por distancia en línea recta.</p>}
    </section>
  )
}
