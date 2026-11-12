import { useCallback, useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation, faRotate, faCircleInfo, faCheckDouble } from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/shared/Layout'
import EstadoLista from '../components/listas/EstadoLista'
import api from '../services/api'
import socket from '../services/socket'
import { textoHace } from '../utils/formato'
import '../components/mapa/Mapa.css'
import '../components/listas/Listas.css'
import './Notificaciones.css'

const CLAVE_LEIDAS = 'upctrack.notificaciones.leidas'
const ahoraMs = () => Date.now() // se llama desde manejadores, nunca al renderizar

// El servidor no guarda «leída»: se recuerda en este dispositivo para que no vuelva todo a «sin leer» al recargar
function leerLeidas() {
  try { return new Set(JSON.parse(localStorage.getItem(CLAVE_LEIDAS) || '[]')) } catch { return new Set() }
}
function guardarLeidas(set) {
  try { localStorage.setItem(CLAVE_LEIDAS, JSON.stringify([...set].slice(-300))) } catch { /* sin almacenamiento */ }
}

const TIPOS = {
  retraso: { titulo: 'Retraso', icono: faTriangleExclamation },
  cambio_ruta: { titulo: 'Cambio de ruta', icono: faRotate },
}
const tipoDe = tipo => TIPOS[tipo] || { titulo: 'Información', icono: faCircleInfo }

const normalizar = n => ({ ...n, id: n.id_notificacion ?? `rt-${ahoraMs()}-${n.mensaje}` })
const masNuevasPrimero = (a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora)

export default function Notificaciones() {
  const [notifs, setNotifs] = useState([])
  const [leidas, setLeidas] = useState(leerLeidas)
  const [fase, setFase] = useState('cargando') // cargando | error | ok
  const [ahora, setAhora] = useState(ahoraMs)

  const cargar = useCallback(async () => {
    try {
      const data = await api.get('/api/notificaciones')
      setNotifs((data.notificaciones || []).map(normalizar).sort(masNuevasPrimero))
      setFase('ok')
    } catch {
      setFase('error') // un fallo de red no se disfraza de «no hay notificaciones»
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos remotos
    cargar()

    // Nuevas notificaciones en tiempo real (manejador propio: off(evento) sin función quitaría los de otras pantallas)
    const alLlegar = notif => {
      const n = normalizar({ ...notif, fecha_hora: notif.fecha_hora || new Date().toISOString() })
      setNotifs(prev => (prev.some(x => x.id === n.id) ? prev : [n, ...prev]))
    }
    socket.on('notificacion:nueva', alLlegar)
    return () => socket.off('notificacion:nueva', alLlegar)
  }, [cargar])

  // «Hace N min» se refresca cada 30 s
  useEffect(() => {
    const t = setInterval(() => setAhora(ahoraMs()), 30000)
    return () => clearInterval(t)
  }, [])

  function marcar(ids) {
    const s = new Set(leidas)
    ids.forEach(id => s.add(id))
    guardarLeidas(s)
    setLeidas(s)
  }

  function reintentar() {
    setFase('cargando')
    cargar()
  }

  const sinLeer = notifs.filter(n => !leidas.has(n.id))
  const hayLista = fase === 'ok' && notifs.length > 0

  return (
    <Layout titulo="Notificaciones">
      <div className="lista-pagina">
        {!hayLista ? (
          <EstadoLista
            fase={fase === 'ok' ? 'vacio' : fase}
            etiquetaCarga="Buscando avisos…"
            vacio={{ titulo: 'Sin avisos', texto: 'Aquí aparecen los retrasos y cambios de ruta que avisan los conductores.' }}
            onReintentar={reintentar}
          />
        ) : (
          <>
            <div className="lista-barra">
              <h2 className="lista-titulo" role="status">{sinLeer.length > 0 ? `${sinLeer.length} sin leer` : 'Todo al día'}</h2>
              <button type="button" className="boton-contorno" disabled={sinLeer.length === 0}
                onClick={() => marcar(sinLeer.map(n => n.id))}>
                <FontAwesomeIcon icon={faCheckDouble} /> Marcar todas como leídas
              </button>
            </div>

            <ul className="notif-lista">
              {notifs.map(n => {
                const { titulo, icono } = tipoDe(n.tipo)
                const nueva = !leidas.has(n.id)
                return (
                  <li key={n.id}>
                    <article className={`notif ${nueva ? 'notif--nueva' : ''}`}>
                      <FontAwesomeIcon icon={icono} className="notif-icono" />
                      <div className="notif-cuerpo">
                        <h3 className="notif-titulo">{titulo}{n.nombre_ruta ? ` · ${n.nombre_ruta}` : ''}</h3>
                        <p className="notif-mensaje">{n.mensaje}</p>
                        <div className="notif-pie">
                          <time className="dato" dateTime={n.fecha_hora}>{textoHace(n.fecha_hora, ahora)}</time>
                          {nueva && (
                            <>
                              <span className="etiqueta etiqueta--neutro">Nueva</span>
                              <button type="button" className="boton-contorno notif-leer" onClick={() => marcar([n.id])}>
                                Marcar como leída
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </Layout>
  )
}
