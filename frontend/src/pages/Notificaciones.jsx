import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBell, faTriangleExclamation,
  faRotate, faCircleCheck, faCheckDouble
} from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/shared/Layout'
import api from '../services/api'
import socket from '../services/socket'
import './Notificaciones.css'


function infoTipo(tipo) {
  if (tipo === 'retraso')     return { icono: faTriangleExclamation, clase: 'notif-icono--amarillo' }
  if (tipo === 'cambio_ruta') return { icono: faRotate,              clase: 'notif-icono--azul' }
  return                             { icono: faCircleCheck,         clase: 'notif-icono--verde' }
}

function tituloNotif(tipo) {
  if (tipo === 'retraso') return 'Retraso'
  if (tipo === 'cambio_ruta') return 'Cambio de ruta'
  return 'Informacion'
}

function formatearHace(fechaHora) {
  const diff = Math.floor((Date.now() - new Date(fechaHora)) / 60000)
  if (diff < 1) return 'Ahora'
  if (diff < 60) return `Hace ${diff} min`
  return `Hace ${Math.floor(diff / 60)} h`
}

export default function Notificaciones() {
  const [notifs, setNotifs] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        const data = await api.get('/api/notificaciones')
        const normalizadas = (data.notificaciones || []).map(n => ({
          ...n,
          id: n.id_notificacion,
          titulo: `${tituloNotif(n.tipo)} — ${n.nombre_ruta}`,
          leida: false,
          hace: formatearHace(n.fecha_hora),
        }))
        setNotifs(normalizadas)
      } catch {
        console.error('Error cargando notificaciones')
        setNotifs([])
      } finally {
        setCargando(false)
      }
    }
    cargar()

    // Nuevas notificaciones en tiempo real
    socket.on('notificacion:nueva', (notif) => {
      setNotifs(prev => [{
        ...notif,
        id: notif.id_notificacion || Date.now(),
        titulo: `${tituloNotif(notif.tipo)} — ${notif.nombre_ruta || 'Ruta'}`,
        leida: false,
        hace: 'Ahora',
      }, ...prev])
    })

    return () => socket.off('notificacion:nueva')
  }, [])

  function marcarTodasLeidas() {
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })))
  }

  function marcarLeida(id) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
  }

  const sinLeer = notifs.filter(n => !n.leida).length

  return (
    <Layout titulo="Notificaciones">
      <div className="notifs-page">

        <div className="notifs-header">
          <div className="notifs-titulo-wrap">
            <h2 className="notifs-titulo">Notificaciones</h2>
            {sinLeer > 0 && (
              <span className="notifs-badge">{sinLeer}</span>
            )}
          </div>
          <button className="notifs-btn-leer" onClick={marcarTodasLeidas}>
            <FontAwesomeIcon icon={faCheckDouble} />
            Marcar todas como leídas
          </button>
        </div>

        {cargando ? (
          <p className="notifs-cargando">Cargando notificaciones...</p>
        ) : (
          <div className="notifs-lista">
            {notifs.map(notif => {
              const { icono, clase } = infoTipo(notif.tipo)
              return (
                <div
                  key={notif.id}
                  className={`notif-item ${!notif.leida ? 'notif-item--nueva' : ''}`}
                  onClick={() => marcarLeida(notif.id)}
                >
                  <div className={`notif-icono ${clase}`}>
                    <FontAwesomeIcon icon={icono} />
                  </div>

                  <div className="notif-info">
                    <span className="notif-titulo">{notif.titulo}</span>
                    <span className="notif-mensaje">{notif.mensaje}</span>
                  </div>

                  <span className="notif-hace">{notif.hace}</span>
                </div>
              )
            })}

            {notifs.length === 0 && (
              <div className="notifs-vacio">
                <FontAwesomeIcon icon={faBell} />
                <p>No hay notificaciones</p>
              </div>
            )}
          </div>
        )}

        <button className="notifs-btn-todas">
          Ver todas las notificaciones
        </button>
      </div>
    </Layout>
  )
}