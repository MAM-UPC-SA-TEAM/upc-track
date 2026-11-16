import { useCallback, useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPaperPlane, faTriangleExclamation, faCircleCheck, faRotate, faCircleInfo,
} from '@fortawesome/free-solid-svg-icons'
import Layout from '../../components/shared/Layout'
import api from '../../services/api'
import { textoHace } from '../../utils/formato'
import '../../components/inicio/Talon.css'
import '../../components/mapa/Mapa.css'
import '../../components/listas/Listas.css'
import '../../components/conductor/Conductor.css'
import { EsqueletoFilas } from '../../components/shared/Esqueleto'

const TIPOS_AVISO = [
  { valor: 'info', texto: 'Info' },
  { valor: 'retraso', texto: 'Retraso' },
  { valor: 'cambio_ruta', texto: 'Cambio de ruta' },
]
const ROTULOS = { info: 'Información', retraso: 'Retraso', cambio_ruta: 'Cambio de ruta' }
const ICONOS = { retraso: faTriangleExclamation, cambio_ruta: faRotate }

// «Avisar»: el conductor avisa a los estudiantes de su ruta (retraso, cambio de ruta o información)
// y ve lo que ya envió. El conductor no recibe los avisos de nadie: aquí solo los emite.
export default function Avisar() {
  const [tipo, setTipo] = useState('info')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null) // 'ok' | 'error'
  const [enviados, setEnviados] = useState([])
  const [faseLista, setFaseLista] = useState('cargando') // cargando | ok | error
  const [ahora, setAhora] = useState(() => Date.now())

  const cargarEnviados = useCallback(async () => {
    try {
      const data = await api.get('/api/notificaciones/mias')
      setEnviados(data.notificaciones || [])
      setAhora(Date.now())
      setFaseLista('ok')
    } catch {
      setFaseLista('error')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos remotos
    cargarEnviados()
  }, [cargarEnviados])

  useEffect(() => {
    if (resultado !== 'ok') return undefined
    const t = setTimeout(() => setResultado(null), 4000)
    return () => clearTimeout(t)
  }, [resultado])

  async function enviar(e) {
    e.preventDefault()
    if (!mensaje.trim() || enviando) return
    setEnviando(true)
    try {
      await api.post('/api/notificaciones', { tipo, mensaje: mensaje.trim() })
      setResultado('ok')
      setMensaje('')
      cargarEnviados()
    } catch {
      setResultado('error')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Layout titulo="Avisar a mi ruta">
      <div className="lista-pagina">
        <section className="talon" aria-labelledby="avisar-titulo">
          <h2 id="avisar-titulo" className="avisar-titulo">Nuevo aviso</h2>
          <form className="cond-aviso-form" onSubmit={enviar}>
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
        </section>

        <section className="talon" aria-labelledby="avisar-enviados">
          <h2 id="avisar-enviados" className="avisar-titulo">Enviados</h2>
          {faseLista === 'cargando' && <><EsqueletoFilas filas={2} /><p className="solo-lectura" role="status">Cargando tus avisos…</p></>}
          {faseLista === 'error' && (
            <p className="avisar-vacio" role="alert">
              <FontAwesomeIcon icon={faTriangleExclamation} /> No se pudieron cargar tus avisos.{' '}
              <button type="button" className="boton-contorno" onClick={cargarEnviados}>Reintentar</button>
            </p>
          )}
          {faseLista === 'ok' && enviados.length === 0 && (
            <p className="avisar-vacio">Aún no has enviado avisos.</p>
          )}
          {faseLista === 'ok' && enviados.length > 0 && (
            <ul className="lista-filas">
              {enviados.map(n => (
                <li key={n.id_notificacion} className="avisar-fila">
                  <FontAwesomeIcon icon={ICONOS[n.tipo] || faCircleInfo} className="avisar-fila-icono" />
                  <div className="avisar-fila-cuerpo">
                    <span className="avisar-fila-rotulo">{ROTULOS[n.tipo] || ROTULOS.info}{n.nombre_ruta ? ` · ${n.nombre_ruta}` : ''}</span>
                    <p>{n.mensaje}</p>
                  </div>
                  <time className="dato avisar-fila-hace" dateTime={n.fecha_hora}>{textoHace(n.fecha_hora, ahora)}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Layout>
  )
}
