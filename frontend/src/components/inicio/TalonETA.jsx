import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMap, faRoute, faLocationDot, faRotate } from '@fortawesome/free-solid-svg-icons'
import './Talon.css'

// Fases: vivo (validado) · viejo y sin-red (cifra anulada con sello) · sin-red-vacio (no hay datos y no hay red)
// · sin-buses (la red responde y nadie transmite) · cargando.
const SELLOS = { viejo: 'Sin señal', 'sin-red': 'Sin conexión', 'sin-red-vacio': 'Sin conexión' }

function textoEdad(seg) {
  if (seg == null) return ''
  const s = Math.max(0, Math.round(seg))
  return s < 90 ? `${s} s` : `${Math.round(s / 60)} min`
}

function TituloParada({ fase, parada, paradas, onParada }) {
  if (paradas.length > 0) {
    return (
      <label className="talon-parada">
        <FontAwesomeIcon icon={faLocationDot} className="talon-parada-icono" />
        <select aria-label="Tu parada" value={parada?.id_parada ?? ''} onChange={e => onParada(Number(e.target.value))}>
          {paradas.map(p => <option key={p.id_parada} value={p.id_parada}>{p.nombre}</option>)}
        </select>
      </label>
    )
  }
  const texto = fase === 'cargando' ? 'Buscando tu parada…'
    : fase === 'sin-red-vacio' ? 'No pudimos cargar tu parada'
    : 'Sin paradas disponibles'
  return <p className="talon-parada talon-parada--vacia">{texto}</p>
}

export default function TalonETA({
  fase, parada, paradas, onParada, minutos, bus, distanciaKm, edad, frescoMax, recibidoEn,
  tardando, onMapa, onRutas, onReintentar,
}) {
  const anulado = fase === 'viejo' || fase === 'sin-red'
  const hayEta = minutos != null && (fase === 'vivo' || anulado)
  const sinDatosPorRed = fase === 'sin-red-vacio'
  const cifra = !hayEta ? '' : minutos < 1 ? '<1' : minutos > 30 ? '30+' : String(minutos)
  const km = distanciaKm != null
    ? distanciaKm.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : null

  // La franja amarilla es el tiempo de validez del dato: se vacía de 0 a 30 s y se apaga al vencer
  const frescura = fase === 'vivo' && edad != null ? Math.max(0.06, 1 - edad / frescoMax) : 1

  const lectura = hayEta
    ? `Tu bus llega a ${parada?.nombre} en ${cifra} minutos. ${anulado ? 'Dato anulado: ' + SELLOS[fase] + '.' : 'Dato validado.'}`
    : sinDatosPorRed ? 'Sin conexión. No sabemos dónde está tu bus.'
    : fase === 'cargando' ? 'Buscando tu bus' : 'Ningún bus está transmitiendo ahora'

  const vacio = fase === 'cargando'
    ? (tardando ? 'Despertando el servidor… puede tardar hasta un minuto.' : 'Buscando tu bus…')
    : sinDatosPorRed ? 'Sin conexión. No sabemos dónde está tu bus. Reintentando…'
    : 'Ningún bus está transmitiendo ahora. Revisa los horarios de la ruta.'

  return (
    <section className={`talon talon--${fase}`} aria-label="Llegada de tu bus" aria-busy={fase === 'cargando'}>
      <div className="talon-cuerpo">
        <TituloParada fase={fase} parada={parada} paradas={paradas} onParada={onParada} />

        <div className="talon-eta">
          {hayEta && <span className="talon-cifra" aria-hidden="true">{cifra}</span>}
          {hayEta && <span className="talon-unidad" aria-hidden="true">min</span>}
          {!hayEta && fase === 'sin-buses' && <span className="talon-sin" aria-hidden="true">Sin bus ahora</span>}
          {!hayEta && fase !== 'sin-buses' && <span className="talon-esqueleto" aria-hidden="true" />}
          {(anulado || sinDatosPorRed) && <span className="sello" aria-hidden="true">{SELLOS[fase]}</span>}
        </div>
        <div key={recibidoEn} className="talon-franja" style={{ '--frescura': frescura }} aria-hidden="true" />
        <p className="solo-lectura" role="status">{lectura}</p>
      </div>

      <div className="talon-perf" aria-hidden="true" />

      {hayEta ? (
        <div className="talon-datos dato">
          <div className="talon-datos-info">
            <span>{bus?.nombre_ruta}</span>
            <span>{[bus?.nombre, km && `a ${km} km`].filter(Boolean).join(' · ')}</span>
          </div>
          <span className={`talon-estado ${anulado ? 'talon-estado--viejo' : ''}`}>
            {anulado ? `Hace ${textoEdad(edad)}` : `Validado · ${textoEdad(edad)}`}
          </span>
        </div>
      ) : (
        <p className="talon-vacio">{vacio}</p>
      )}

      {hayEta && (
        <button className="talon-accion" onClick={onMapa}>
          <FontAwesomeIcon icon={faMap} /> Ver en el mapa
        </button>
      )}
      {sinDatosPorRed && (
        <button className="talon-accion" onClick={onReintentar}>
          <FontAwesomeIcon icon={faRotate} /> Reintentar ahora
        </button>
      )}
      {!hayEta && !sinDatosPorRed && (
        <button className="talon-accion" onClick={onRutas}>
          <FontAwesomeIcon icon={faRoute} /> Ver rutas y horarios
        </button>
      )}
      {hayEta && <p className="talon-nota">Tiempo estimado por distancia en línea recta.</p>}
    </section>
  )
}
