import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/shared/Layout'
import api from '../services/api'
import socket from '../services/socket'
import './Dashboard.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBus, faRoute, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons'
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import L from 'leaflet'

const iconoBusMini = L.divIcon({
  className: '',
  html: `<div style="font-size:18px;line-height:1;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.35))">🚌</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

export default function Dashboard() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats]               = useState({ buses: 0, rutas: 0, rutaNombre: null, enServicio: false })
  const [busesActivos, setBusesActivos] = useState([])
  const [puntosRuta, setPuntosRuta]     = useState([])
  const [cargando, setCargando]         = useState(true)
  const [backendOk, setBackendOk]       = useState(false)
  const intervaloRef = useRef(null)
  const refrescoPendienteRef = useRef(null)
  const cargandoRef = useRef(false)
  const ultimoRefrescoRef = useRef(0)

  async function cargarStats() {
    if (cargandoRef.current) return
    cargandoRef.current = true
    try {
      // ── Peticiones paralelas ─────────────────────────────────
      const [respBuses, respRutas] = await Promise.all([
        api.get('/api/buses/activos'),   // devuelve array de buses en servicio con GPS
        api.get('/api/rutas'),
      ])

      // Normalizar: ambas respuestas pueden ser array o { buses/rutas: [] }
      const listaBuses = Array.isArray(respBuses)
        ? respBuses
        : (respBuses.buses || [])

      const listaRutas = Array.isArray(respRutas)
        ? respRutas
        : (respRutas.rutas || [])

      // Buses en_recorrido con GPS válido
      const enRuta = listaBuses.filter(b =>
        b.estado === 'en_recorrido' && b.lat && b.lng
      )

      // Rutas activas (normalizar booleano MySQL 0/1 vs true/false)
      const rutasActivas = listaRutas.filter(r => r.activa === 1 || r.activa === true)

      // Ruta en operación: primera ruta activa que tenga un bus asignado
      const rutaEnOp = rutasActivas.find(r =>
        enRuta.some(b => b.id_ruta === r.id_ruta || b.nombre_ruta === r.nombre)
      ) || rutasActivas[0] || null

      setBusesActivos(enRuta)
      setStats({
        buses:      enRuta.length,
        rutas:      rutasActivas.length,
        rutaNombre: rutaEnOp?.nombre || null,
        enServicio: enRuta.length > 0,
      })
      setBackendOk(true)

      // ── Cargar paradas de la ruta en operación para el mini-mapa ──
      if (rutaEnOp?.id_ruta) {
        try {
          const respParadas = await api.get(`/api/paradas?ruta_id=${rutaEnOp.id_ruta}`)
          const lista = (Array.isArray(respParadas) ? respParadas : respParadas.paradas || [])
            .filter(p => p.lat && p.lng)
            .sort((a, b) => (a.orden || 0) - (b.orden || 0))
          setPuntosRuta(lista.map(p => [p.lat, p.lng]))
        } catch { /* silencioso */ }
      }
    } catch {
      setStats({ buses: 0, rutas: 0, rutaNombre: null, enServicio: false })
      setBackendOk(false)
    } finally {
      cargandoRef.current = false
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarStats()
    // Respaldo de sincronización por polling
    intervaloRef.current = setInterval(cargarStats, 10_000)
    return () => clearInterval(intervaloRef.current)
  }, []) // eslint-disable-line

  useEffect(() => {
    function programarRefresco(delay = 300) {
      const ahora = Date.now()
      // Evita ráfagas de peticiones por eventos consecutivos.
      if (ahora - ultimoRefrescoRef.current < 2500) return

      if (refrescoPendienteRef.current) {
        clearTimeout(refrescoPendienteRef.current)
      }
      refrescoPendienteRef.current = setTimeout(() => {
        ultimoRefrescoRef.current = Date.now()
        cargarStats().catch(() => {})
      }, delay)
    }

    if (!socket.connected) socket.connect()

    const onBusLocation = () => {}
    const onBusEstado = () => programarRefresco(200)
    const onSocketConnect = () => programarRefresco(0)

    socket.on('bus:location', onBusLocation)
    socket.on('bus:estado', onBusEstado)
    socket.on('connect', onSocketConnect)

    return () => {
      if (refrescoPendienteRef.current) {
        clearTimeout(refrescoPendienteRef.current)
      }
      socket.off('bus:location', onBusLocation)
      socket.off('bus:estado', onBusEstado)
      socket.off('connect', onSocketConnect)
    }
  }, []) // eslint-disable-line

  // Centro del mapa: primer bus activo, o coordenadas de la universidad
  const centro = busesActivos.length > 0
    ? [busesActivos[0].lat, busesActivos[0].lng]
    : [8.3086, -73.6194]

  return (
    <Layout titulo="Sistema de Monitoreo de Rutas">
      <div className="dash">

        {/* ── Saludo ── */}
        <p className="dash-saludo">
          Hola, <strong>{usuario?.nombre || 'Usuario'}</strong> —{' '}
          <span className="dash-rol">{usuario?.tipo_usuario}</span>
        </p>

        {/* ── Tarjetas métricas ── */}
        <section className="dash-seccion">
          <h3 className="dash-seccion-titulo">Resumen de transporte</h3>
          <div className="dash-tarjetas">

            {/* Buses en recorrido */}
            <div className="dash-tarjeta">
              <div className="dash-tarjeta-icono">
                <FontAwesomeIcon icon={faBus} />
              </div>
              <div className="dash-tarjeta-info">
                <span className="dash-tarjeta-label">Buses en ruta</span>
                <span className="dash-tarjeta-valor">{cargando ? '…' : stats.buses}</span>
                <span className="dash-tarjeta-sub">Con GPS activo</span>
              </div>
            </div>

            {/* Rutas activas */}
            <div className="dash-tarjeta">
              <div className="dash-tarjeta-icono">
                <FontAwesomeIcon icon={faRoute} />
              </div>
              <div className="dash-tarjeta-info">
                <span className="dash-tarjeta-label">Rutas activas</span>
                <span className="dash-tarjeta-valor">{cargando ? '…' : stats.rutas}</span>
                <span className="dash-tarjeta-sub">Habilitadas</span>
              </div>
            </div>

            {/* Estado del servicio — reemplaza "Próximo bus" hardcodeado */}
            <div className="dash-tarjeta">
              <div className={`dash-tarjeta-icono ${stats.enServicio ? '' : 'dash-tarjeta-icono--gris'}`}>
                <FontAwesomeIcon icon={stats.enServicio ? faCircleCheck : faCircleXmark} />
              </div>
              <div className="dash-tarjeta-info">
                <span className="dash-tarjeta-label">Servicio</span>
                <span
                  className="dash-tarjeta-valor dash-tarjeta-valor--sm"
                  style={{ color: stats.enServicio ? '#1e6b2e' : '#c62828' }}
                >
                  {cargando ? '…' : stats.enServicio ? 'Activo' : 'Inactivo'}
                </span>
                <span className="dash-tarjeta-sub dash-tarjeta-sub--ruta" title={stats.rutaNombre || ''}>
                  {cargando ? '' : stats.rutaNombre || 'Sin ruta en operación'}
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* ── Mapa preview ── */}
        <section className="dash-seccion">
          <h3 className="dash-seccion-titulo">Seguimiento en tiempo real</h3>
          <div className="dash-mapa-preview" onClick={() => navigate('/mapa')} style={{ cursor: 'pointer' }}>
            <MapContainer
              center={centro}
              zoom={14}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
              dragging={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              touchZoom={false}
              attributionControl={false}
              className="dash-mapa-leaflet"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* Polilínea de la ruta activa */}
              {puntosRuta.length > 1 && (
                <>
                  <Polyline positions={puntosRuta} color="#fff"    weight={6} opacity={0.7} />
                  <Polyline positions={puntosRuta} color="#1e6b2e" weight={3} opacity={0.95} />
                </>
              )}

              {/* Buses con GPS */}
              {busesActivos.map(b => (
                <Marker key={b.id_bus} position={[b.lat, b.lng]} icon={iconoBusMini} />
              ))}
            </MapContainer>

            <div className="dash-mapa-overlay">
              {!backendOk && (
                <span className="dash-mapa-offline">Sin conexión al servidor</span>
              )}
              {/* Chip de estado sobre el mapa */}
              {backendOk && (
                <span className={`dash-mapa-estado-chip ${stats.enServicio ? 'dash-mapa-estado-chip--activo' : 'dash-mapa-estado-chip--inactivo'}`}>
                  <span className="dash-mapa-estado-dot" />
                  {stats.enServicio
                    ? `${stats.buses} bus${stats.buses !== 1 ? 'es' : ''} en ruta`
                    : 'Sin servicio activo'}
                </span>
              )}
              <button className="dash-mapa-btn" onClick={e => { e.stopPropagation(); navigate('/mapa') }}>
                Ver mapa completo →
              </button>
            </div>
          </div>
        </section>

        {/* ── Accesos rápidos ── */}
        <section className="dash-seccion">
          <h3 className="dash-seccion-titulo">Accesos rápidos</h3>
          <div className="dash-accesos">
            <button className="dash-acceso-btn" onClick={() => navigate('/rutas')}>
              <FontAwesomeIcon icon={faRoute} /> Ver rutas
            </button>
            <button className="dash-acceso-btn" onClick={() => navigate('/buses')}>
              <FontAwesomeIcon icon={faBus} /> Ver buses
            </button>
          </div>
        </section>

      </div>
    </Layout>
  )
}
