import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBus, faPlay, faPause, faStop, faPaperPlane, faBullhorn, faChevronDown, faChevronUp,
  faTriangleExclamation, faCircleCheck,
} from '@fortawesome/free-solid-svg-icons'
import { textoEdad } from '../../utils/formato'
import '../inicio/Talon.css'
import '../mapa/Mapa.css'
import './Conductor.css'

// Vistas del talón del conductor. La cifra de este talón es el estado de ESTE teléfono:
//   libre · buscando (GPS) · vivo · detenido · viejo (dato anulado con sello) · colgado (el servidor dice
//   «en recorrido» pero el teléfono no transmite) · sin-bus.
export const FRESCO_MAX_S = 30 // los estudiantes ven «validado» hasta 30 s; igual que Inicio y Mapa

const PALABRAS = {
  'sin-bus': 'Sin bus asignado',
  libre: 'Fuera de servicio',
  buscando: 'Buscando GPS',
  vivo: 'Transmitiendo',
  detenido: 'Bus detenido',
  colgado: 'Sin transmitir',
}

const TIPOS_AVISO = [
  { valor: 'info', texto: 'Info' },
  { valor: 'retraso', texto: 'Retraso' },
  { valor: 'cambio_ruta', texto: 'Cambio de ruta' },
]

// Clase de estado heredada del talón del estudiante (color de la franja y de la etiqueta)
const CLASE_FASE = {
  'sin-bus': 'sin-buses', libre: 'sin-buses', buscando: 'cargando', vivo: 'vivo', detenido: 'vivo', colgado: 'viejo',
}

function Aviso({ onEnviar }) {
  const [abierto, setAbierto] = useState(false)
  const [tipo, setTipo] = useState('info')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null) // 'ok' | 'error'
  const formRef = useRef(null)

  // En pantallas bajas el formulario nace cortado por la hoja: se acerca a la vista al abrirlo
  useEffect(() => {
    if (abierto) formRef.current?.scrollIntoView({ block: 'nearest' })
  }, [abierto])

  useEffect(() => {
    if (resultado !== 'ok') return undefined
    const t = setTimeout(() => setResultado(null), 4000)
    return () => clearTimeout(t)
  }, [resultado])

  async function enviar(e) {
    e.preventDefault()
    if (!mensaje.trim() || enviando) return
    setEnviando(true)
    const ok = await onEnviar(tipo, mensaje.trim())
    setEnviando(false)
    setResultado(ok ? 'ok' : 'error')
    if (ok) setMensaje('')
  }

  return (
    <div className="cond-aviso">
      <button
        type="button"
        className="cond-aviso-boton"
        aria-expanded={abierto}
        aria-controls="cond-aviso-form"
        onClick={() => setAbierto(v => !v)}
      >
        <span><FontAwesomeIcon icon={faBullhorn} /> Avisar a mi ruta</span>
        <FontAwesomeIcon icon={abierto ? faChevronUp : faChevronDown} />
      </button>

      {abierto && (
        <form id="cond-aviso-form" ref={formRef} className="cond-aviso-form" onSubmit={enviar}>
          <div className="cond-tipos" role="radiogroup" aria-label="Tipo de aviso">
            {TIPOS_AVISO.map(t => (
              <button
                key={t.valor}
                type="button"
                role="radio"
                aria-checked={tipo === t.valor}
                className={`cond-tipo ${tipo === t.valor ? 'cond-tipo--activo' : ''}`}
                onClick={() => setTipo(t.valor)}
              >
                {t.texto}
              </button>
            ))}
          </div>
          <input
            type="text"
            aria-label="Mensaje del aviso"
            placeholder="Ej: Retraso por tráfico en la Calle 7"
            value={mensaje}
            maxLength={200}
            onChange={e => { setMensaje(e.target.value); if (resultado) setResultado(null) }}
          />
          <button type="submit" className="cond-enviar" disabled={!mensaje.trim() || enviando}>
            <FontAwesomeIcon icon={faPaperPlane} /> {enviando ? 'Enviando…' : 'Enviar aviso'}
          </button>
          <p className="cond-aviso-estado" role="status">
            {resultado === 'ok' && <><FontAwesomeIcon icon={faCircleCheck} /> Aviso enviado a tu ruta.</>}
            {resultado === 'error' && <><FontAwesomeIcon icon={faTriangleExclamation} /> No se pudo enviar. Intenta de nuevo.</>}
          </p>
        </form>
      )}
    </div>
  )
}

export default function TalonConductor({
  vista, bus, estado, edad, ultimoEnvioMs, sinRed, errores,
  onIniciar, onDetener, onFinalizar, onAviso,
}) {
  const [confirmando, setConfirmando] = useState(false)

  // «Finalizar» pide un segundo toque: terminar el recorrido sin querer apaga el bus para los estudiantes
  useEffect(() => {
    if (!confirmando) return undefined
    const t = setTimeout(() => setConfirmando(false), 4000)
    return () => clearTimeout(t)
  }, [confirmando])

  const anulada = vista === 'viejo'
  const base = anulada ? (estado === 'detenido' ? 'detenido' : 'vivo') : vista
  const palabra = PALABRAS[base] || PALABRAS.libre
  const sello = sinRed ? 'Sin conexión' : 'Sin señal'
  const clase = anulada ? 'viejo' : CLASE_FASE[vista]
  const frescura = (vista === 'vivo' || vista === 'detenido') && edad != null
    ? Math.max(0.06, 1 - edad / FRESCO_MAX_S) : 1

  const hayDatos = vista !== 'sin-bus' && vista !== 'libre'
  const etiqueta = vista === 'vivo' || vista === 'detenido'
    ? { viejo: false, texto: `Validado · ${textoEdad(edad)}` }
    : anulada ? { viejo: true, texto: `Hace ${textoEdad(edad)}` }
    : vista === 'colgado' ? (edad != null ? { viejo: true, texto: `Hace ${textoEdad(edad)}` } : { viejo: false, texto: 'Sin envíos' })
    : { viejo: false, texto: 'Sin envío aún' }

  const lectura = vista === 'sin-bus' ? 'Sin bus asignado'
    : anulada ? `${palabra}. Dato anulado: ${sello}.`
    : vista === 'colgado' ? 'Este teléfono no está transmitiendo. Los estudiantes ven tu bus en recorrido con una posición vieja.'
    : palabra

  const vacio = vista === 'sin-bus'
    ? (errores.carga || 'No tienes un bus o ruta asignada actualmente.')
    : 'Inicia el recorrido para que los estudiantes vean tu bus en el mapa.'

  function finalizar() {
    if (!confirmando) { setConfirmando(true); return }
    setConfirmando(false)
    onFinalizar()
  }

  const botonFinalizar = (
    <button type="button" className={`cond-boton cond-boton--fin ${confirmando ? 'cond-boton--confirma' : ''}`} onClick={finalizar}>
      <FontAwesomeIcon icon={faStop} /> {confirmando ? 'Toca otra vez para finalizar' : vista === 'colgado' ? 'Finalizar recorrido' : 'Finalizar'}
    </button>
  )

  return (
    <section className={`talon talon--hoja talon--${clase} ${anulada ? 'cond--anulada' : ''}`} aria-label="Estado de tu recorrido">
      <div className="talon-cuerpo">
        {bus && (
          <div className="talon-cabecera">
            <FontAwesomeIcon icon={faBus} className="cond-bus-icono" />
            <h2 className="talon-titulo">{bus.nombre}</h2>
          </div>
        )}

        <div className="cond-estado">
          <span className="cond-palabra" aria-hidden="true">{palabra}</span>
          {anulada && <span className="sello" aria-hidden="true">{sello}</span>}
        </div>
        <div key={ultimoEnvioMs} className="talon-franja" style={{ '--frescura': frescura }} aria-hidden="true" />
        <p className="solo-lectura" role="status">{lectura}</p>
      </div>

      <div className="talon-perf" aria-hidden="true" />

      {hayDatos ? (
        <div className="talon-datos dato">
          <div className="talon-datos-info">
            <span>{bus?.nombre_ruta || 'Sin ruta asignada'}</span>
            <span>{bus?.placa}</span>
          </div>
          <span className={`talon-estado ${etiqueta.viejo ? 'talon-estado--viejo' : ''} ${!etiqueta.viejo && !(vista === 'vivo' || vista === 'detenido') ? 'etiqueta--neutro cond-neutra' : ''}`}>
            {etiqueta.texto}
          </span>
        </div>
      ) : (
        <p className="talon-vacio">{vacio}</p>
      )}

      {vista === 'colgado' && (
        <p className="talon-vacio cond-explica">
          Los estudiantes ven tu bus «En recorrido» con una posición cada vez más vieja.
        </p>
      )}

      {errores.lista.map(msg => (
        <p key={msg} className="cond-error" role="alert">
          <FontAwesomeIcon icon={faTriangleExclamation} /> <span>{msg}</span>
        </p>
      ))}

      {vista === 'libre' && (
        <button type="button" className="talon-accion" onClick={onIniciar} disabled={!bus?.id_bus}>
          <FontAwesomeIcon icon={faPlay} /> Iniciar recorrido
        </button>
      )}

      {vista === 'colgado' && (
        <div className="cond-acciones cond-acciones--apiladas">
          <button type="button" className="talon-accion cond-reanudar" onClick={onIniciar}>
            <FontAwesomeIcon icon={faPlay} /> Reanudar transmisión
          </button>
          {botonFinalizar}
        </div>
      )}

      {(vista === 'buscando' || vista === 'vivo' || vista === 'detenido' || vista === 'viejo') && (
        <div className="cond-acciones">
          {base === 'detenido' ? (
            <button type="button" className="talon-accion cond-reanudar" onClick={onDetener}>
              <FontAwesomeIcon icon={faPlay} /> Reanudar
            </button>
          ) : (
            <button type="button" className="cond-boton" onClick={onDetener}>
              <FontAwesomeIcon icon={faPause} /> Detener
            </button>
          )}
          {botonFinalizar}
        </div>
      )}

      {bus?.id_bus && <Aviso onEnviar={onAviso} />}
    </section>
  )
}
