import { useEffect, useState, useRef } from 'react'
import { MapContainer, Marker, Polyline, CircleMarker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBus, faRoute, faLocationDot, faClock,
  faPlay, faStop, faPaperPlane, faSignal,
  faCircleCheck, faCirclePause, faCircleXmark,
  faTriangleExclamation, faChevronUp, faChevronDown, faMap
} from '@fortawesome/free-solid-svg-icons'
import Layout from '../../components/shared/Layout'
import api from '../../services/api'
import './MiRecorrido.css'

const CENTRO_DEFECTO = [8.3086, -73.6194]

const iconoBus = L.divIcon({
  className: '',
  html: '<div class="conductor-mapa-bus">🚌</div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
})

function ControlCamara({ centro }) {
  const map = useMap()

  useEffect(() => {
    if (!centro) return
    map.setView(centro, Math.max(map.getZoom(), 16), { animate: true })
  }, [centro, map])

  return null
}

export default function MiRecorrido() {
  const [busInfo, setBusInfo]       = useState(null)
  const [enRecorrido, setEnRecorrido] = useState(false)
  const [estado, setEstado]         = useState('fuera_de_servicio')
  const [gps, setGps]               = useState(null)
  const [historialGps, setHistorialGps] = useState([])
  const [estadoConexion, setEstadoConexion] = useState(() => (navigator.onLine ? 'online' : 'offline'))
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)
  const [mensaje, setMensaje]       = useState('')
  const [tipoAviso, setTipoAviso]   = useState('info')
  const [log, setLog]               = useState([])
  const [errorCargaBus, setErrorCargaBus] = useState('')
  const [errorGps, setErrorGps] = useState('')
  // 'colapsado' | 'expandido' | 'oculto'
  const [panelMovil, setPanelMovil] = useState('colapsado')
  const [paradasRuta, setParadasRuta]     = useState([])
  const [geometriaRuta, setGeometriaRuta] = useState([])
  const watchRef = useRef(null)
  const ultimoEnvioRef = useRef(0)
  const INTERVALO_ENVIO_MS = 4000

  useEffect(() => {
    async function cargar() {
      try {
        const data = await api.get('/api/buses/mi-bus')
        if (data.bus) {
          setBusInfo(data.bus)
          setEstado(data.bus.estado || 'fuera_de_servicio')
          setErrorCargaBus('')
        }
      } catch (err) {
        setBusInfo(null)
        setEstado('fuera_de_servicio')
        setErrorCargaBus(err?.status === 404
          ? 'No tienes un bus o ruta asignada actualmente.'
          : 'No se pudo cargar la informacion del bus.')
      }
    }
    cargar()
  }, [])

  // Cargar paradas + geometría OSRM cuando cambia la ruta asignada
  useEffect(() => {
    const idRuta = busInfo?.id_ruta
    if (!idRuta) return

    async function cargarRuta() {
      try {
        const data = await api.get(`/api/paradas?ruta_id=${idRuta}`)
        const lista = (Array.isArray(data) ? data : data.paradas || [])
          .filter(p => p.lat && p.lng)
          .sort((a, b) => (a.orden || 0) - (b.orden || 0))
        setParadasRuta(lista)

        if (lista.length < 2) return
        // Construir geometría vial via OSRM
        const coords = lista.map(p => `${p.lng},${p.lat}`).join(';')
        const res  = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
        )
        const json = await res.json()
        if (json.code === 'Ok' && json.routes?.length > 0) {
          setGeometriaRuta(json.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]))
        } else {
          setGeometriaRuta(lista.map(p => [p.lat, p.lng]))
        }
      } catch {
        // Silencioso — la ruta sigue funcionando sin geometría OSRM
      }
    }
    cargarRuta()
  }, [busInfo?.id_ruta])

  useEffect(() => {
    return () => {
      if (watchRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchRef.current)
      }
    }
  }, [])

  // Si el conductor navega fuera de esta vista sin finalizar, resetear el bus
  const enRecorridoRef = useRef(false)
  const busInfoRef = useRef(null)
  useEffect(() => { enRecorridoRef.current = enRecorrido }, [enRecorrido])
  useEffect(() => { busInfoRef.current = busInfo }, [busInfo])

  useEffect(() => {
    return () => {
      if (enRecorridoRef.current && busInfoRef.current?.id_bus) {
        api.patch(`/api/buses/${busInfoRef.current.id_bus}/estado`, { estado: 'inactivo' }).catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    function handleOnline() {
      setEstadoConexion(prev => (prev === 'offline' ? 'retrying' : prev))
    }

    function handleOffline() {
      setEstadoConexion('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  function iniciarRecorrido() {
    if (!window.isSecureContext) {
      const msg = 'GPS bloqueado: esta pagina debe abrirse por HTTPS (o localhost) para usar ubicacion.'
      setErrorGps(msg)
      agregarLog(msg, 'error')
      return
    }

    if (!navigator.geolocation) {
      const msg = 'GPS no disponible en este dispositivo'
      setErrorGps(msg)
      agregarLog(msg, 'error')
      return
    }

    setErrorGps('')
    setEnRecorrido(true)
    setEstado('en_recorrido')
    agregarLog('Recorrido iniciado', 'ok')
    actualizarEstadoBus('en_recorrido')

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const ahora = Date.now()
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setErrorGps('')
        setGps({ lat, lng })
        setHistorialGps(prev => [...prev.slice(-19), { lat, lng, id: Date.now() }])
        if (!ultimoEnvioRef.current || (ahora - ultimoEnvioRef.current) >= INTERVALO_ENVIO_MS) {
          ultimoEnvioRef.current = ahora
          enviarUbicacion(lat, lng)
        }
      },
      (err) => {
        const msg = `Error GPS: ${err.message}`
        setErrorGps(msg)
        agregarLog(msg, 'error')
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    )

    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').catch(() => {})
    }
  }

  function finalizarRecorrido() {
    setEnRecorrido(false)
    setEstado('fuera_de_servicio')
    setGps(null)
    setHistorialGps([])
    ultimoEnvioRef.current = 0
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
    agregarLog('Recorrido finalizado', 'ok')
    actualizarEstadoBus('fuera_de_servicio')
  }

  function alternarDetenido() {
    if (!enRecorrido) return

    const nuevoEstado = estado === 'detenido' ? 'en_recorrido' : 'detenido'
    setEstado(nuevoEstado)

    if (nuevoEstado === 'detenido') {
      agregarLog('Bus marcado como detenido', 'ok')
    } else {
      agregarLog('Bus reanudo el recorrido', 'ok')
    }

    actualizarEstadoBus(nuevoEstado)
  }

  async function actualizarEstadoBus(nuevoEstado) {
    const idBus = busInfo?.id_bus
    if (!idBus) {
      agregarLog('No hay bus asignado para actualizar estado', 'error')
      return
    }

    try {
      await api.patch(`/api/buses/${idBus}/estado`, { estado: nuevoEstado })
    } catch {
      agregarLog(`Error al actualizar estado a ${nuevoEstado}`, 'error')
    }
  }

  async function enviarUbicacion(lat, lng) {
    const idBus = busInfo?.id_bus
    if (!idBus) {
      agregarLog('No hay bus asignado para enviar ubicación', 'error')
      return
    }

    const hora = new Date().toLocaleTimeString()
    try {
      setEstadoConexion('syncing')
      await api.post('/api/ubicacion', { id_bus: idBus, lat, lng })
      setEstadoConexion('online')
      setUltimaActualizacion(hora)
      agregarLog(`${hora} — lat: ${lat.toFixed(5)}, lng: ${lng.toFixed(5)}`, 'ok')
    } catch {
      setEstadoConexion(navigator.onLine ? 'retrying' : 'offline')
      agregarLog(`${hora} — Error al enviar ubicación`, 'error')
    }
  }

  async function enviarAviso() {
    if (!mensaje.trim()) return
    try {
      await api.post('/api/notificaciones', { mensaje, tipo: tipoAviso })
      agregarLog('Aviso enviado', 'ok')
      setMensaje('')
    } catch {
      agregarLog('Error al enviar aviso. Intenta nuevamente.', 'error')
    }
  }

  function agregarLog(msg, tipo) {
    setLog(prev => [...prev.slice(-20), { msg, tipo, id: Date.now() }])
  }

  const estadoConfig = {
    en_recorrido:     { texto: 'En recorrido',      icono: faCircleCheck,  clase: 'badge--verde'    },
    detenido:         { texto: 'Detenido',           icono: faCirclePause,  clase: 'badge--amarillo' },
    fuera_de_servicio:{ texto: 'Fuera de servicio',  icono: faCircleXmark,  clase: 'badge--rojo'     },
  }

  const conexionConfig = {
    online:   { texto: 'En linea',          icono: faCircleCheck,      clase: 'conexion-chip--online' },
    syncing:  { texto: 'Sincronizando...',  icono: faCirclePause,      clase: 'conexion-chip--syncing' },
    retrying: { texto: 'Reintentando',      icono: faTriangleExclamation, clase: 'conexion-chip--retrying' },
    offline:  { texto: 'Sin conexion',      icono: faCircleXmark,      clase: 'conexion-chip--offline' },
  }

  const estadoInfo = estadoConfig[estado] || estadoConfig.fuera_de_servicio
  const conexionInfo = conexionConfig[estadoConexion] || conexionConfig.offline
  const centroMapa = gps ? [gps.lat, gps.lng] : CENTRO_DEFECTO
  const trazoRecorrido = historialGps.map(p => [p.lat, p.lng])

  return (
    <Layout titulo="Mi recorrido" sinPadding>
      <div className="conductor-ride-page">

        {/* ── Mapa (ocupa toda la pantalla) ── */}
        <div className="conductor-ride-map">
          <MapContainer
            center={centroMapa}
            zoom={16}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap"
            />
            <ControlCamara centro={gps ? [gps.lat, gps.lng] : null} />

            {/* ── Ruta asignada (geometría vial) ── */}
            {geometriaRuta.length > 1 && (
              <>
                <Polyline positions={geometriaRuta} color="#ffffff" weight={7} opacity={0.7} />
                <Polyline positions={geometriaRuta} color="#1e6b2e" weight={4} opacity={0.9} />
              </>
            )}

            {/* ── Paradas de la ruta ── */}
            {paradasRuta.map(p => (
              <CircleMarker
                key={p.id_parada}
                center={[p.lat, p.lng]}
                radius={p.activa === false || p.activa === 0 ? 5 : 7}
                pathOptions={{
                  color: '#fff',
                  weight: 2,
                  fillColor: p.activa === false || p.activa === 0 ? '#aaa' : '#1e6b2e',
                  fillOpacity: 1,
                }}
              >
                <Popup>
                  <strong>{p.nombre}</strong>
                  {(p.activa === false || p.activa === 0) && (
                    <><br /><span style={{ fontSize: 11, color: '#aaa' }}>Inactiva</span></>
                  )}
                </Popup>
              </CircleMarker>
            ))}

            {/* ── Trazo GPS en tiempo real del bus ── */}
            {trazoRecorrido.length > 1 && (
              <Polyline positions={trazoRecorrido} color="#ff6b00" weight={4} opacity={0.75} dashArray="8 5" />
            )}

            {gps && <Marker position={[gps.lat, gps.lng]} icon={iconoBus} />}
          </MapContainer>
        </div>

        {/* ── FAB para reabrir panel cuando está oculto (solo móvil) ── */}
        {panelMovil === 'oculto' && (
          <button
            className="conductor-fab-panel"
            onClick={() => setPanelMovil('colapsado')}
            aria-label="Mostrar panel"
          >
            <FontAwesomeIcon icon={faBus} />
          </button>
        )}

        {/* ── Panel lateral / bottom sheet ── */}
        <aside
          className={`conductor-ride-panel conductor-panel--${panelMovil}`}
          data-panel={panelMovil}
        >
          {/* Handle drag visible solo en móvil */}
          <div
            className="conductor-panel-handle"
            onClick={() => setPanelMovil(v =>
              v === 'colapsado' ? 'expandido' : v === 'expandido' ? 'colapsado' : 'colapsado'
            )}
            role="button"
            aria-label="Expandir o contraer panel"
          >
            <span className="conductor-panel-handle-bar" />
          </div>

          {/* ── Header siempre visible ── */}
          <div className="conductor-panel-header">
            <div>
              <p className="conductor-panel-kicker">Modo conductor</p>
              <h3>{busInfo?.nombre || 'Bus sin asignar'}</h3>
            </div>
            <div className="conductor-panel-header-actions">
              <div className={`conductor-conexion-chip ${conexionInfo.clase}`}>
                <FontAwesomeIcon icon={conexionInfo.icono} />
                <span className="conductor-chip-texto">{conexionInfo.texto}</span>
              </div>
              {/* Botones toggle solo en móvil */}
              <button
                className="conductor-toggle-btn"
                onClick={() => setPanelMovil(v => v === 'expandido' ? 'colapsado' : 'expandido')}
                aria-label="Expandir o contraer"
              >
                <FontAwesomeIcon icon={panelMovil === 'expandido' ? faChevronDown : faChevronUp} />
              </button>
              <button
                className="conductor-toggle-btn conductor-toggle-btn--map"
                onClick={() => setPanelMovil('oculto')}
                aria-label="Ver mapa completo"
              >
                <FontAwesomeIcon icon={faMap} />
              </button>
            </div>
          </div>

          {/* ── Badges siempre visibles ── */}
          <div className="conductor-panel-badges">
            <span className={`conductor-badge ${estadoInfo.clase}`}>
              <FontAwesomeIcon icon={estadoInfo.icono} />
              {estadoInfo.texto}
            </span>
            <span className="conductor-pill">
              <FontAwesomeIcon icon={faSignal} /> {busInfo?.placa || '---'}
            </span>
            <span className="conductor-pill">
              <FontAwesomeIcon icon={faRoute} /> {busInfo?.nombre_ruta || 'Sin ruta asignada'}
            </span>
          </div>

          {/* ── Leyenda del mapa ── */}
          {(geometriaRuta.length > 0 || trazoRecorrido.length > 0) && (
            <div className="conductor-leyenda">
              {geometriaRuta.length > 0 && (
                <span className="conductor-leyenda-item">
                  <span className="conductor-leyenda-linea conductor-leyenda-linea--ruta" />
                  Ruta asignada
                </span>
              )}
              {trazoRecorrido.length > 0 && (
                <span className="conductor-leyenda-item">
                  <span className="conductor-leyenda-linea conductor-leyenda-linea--trazo" />
                  Mi recorrido
                </span>
              )}
            </div>
          )}

          {errorCargaBus && (
            <div className="conductor-log-item conductor-log--error" style={{ marginTop: 10 }}>
              <span className="conductor-log-dot" />
              {errorCargaBus}
            </div>
          )}

          {errorGps && (
            <div className="conductor-log-item conductor-log--error" style={{ marginTop: 10 }}>
              <span className="conductor-log-dot" />
              {errorGps}
            </div>
          )}

          {/* ── Botones de control siempre visibles ── */}
          <div className="conductor-botones">
            <button
              className="conductor-btn conductor-btn--iniciar"
              onClick={iniciarRecorrido}
              disabled={enRecorrido || !busInfo?.id_bus}
            >
              <FontAwesomeIcon icon={faPlay} />
              Iniciar
            </button>
            <button
              className="conductor-btn conductor-btn--detener"
              onClick={alternarDetenido}
              disabled={!enRecorrido}
            >
              <FontAwesomeIcon icon={faCirclePause} />
              {estado === 'detenido' ? 'Reanudar' : 'Detener'}
            </button>
            <button
              className="conductor-btn conductor-btn--finalizar"
              onClick={finalizarRecorrido}
              disabled={!enRecorrido}
            >
              <FontAwesomeIcon icon={faStop} />
              Finalizar
            </button>
          </div>

          {/* ── Sección expandible: stats, aviso, log ── */}
          <div className="conductor-panel-expandible">
            <div className="conductor-stats-grid">
              <div className="conductor-stat-card">
                <span>Ultimo envio</span>
                <strong>{ultimaActualizacion || 'Sin datos'}</strong>
              </div>
              <div className="conductor-stat-card">
                <span>Puntos GPS</span>
                <strong>{historialGps.length}</strong>
              </div>
              <div className="conductor-stat-card conductor-stat-card--full">
                <span>
                  <FontAwesomeIcon icon={faLocationDot} /> Coordenadas actuales
                </span>
                <strong>{gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : 'Aun sin señal GPS'}</strong>
              </div>
            </div>

            <div className="conductor-aviso">
              <h4>
                <FontAwesomeIcon icon={faTriangleExclamation} /> Aviso rapido
              </h4>
              <div className="conductor-aviso-form">
                <select
                  value={tipoAviso}
                  onChange={e => setTipoAviso(e.target.value)}
                  aria-label="Tipo de aviso"
                >
                  <option value="info">Info</option>
                  <option value="retraso">Retraso</option>
                  <option value="cambio_ruta">Cambio de ruta</option>
                </select>
                <input
                  type="text"
                  placeholder="Ej: Retraso por trafico en la Calle 7"
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && enviarAviso()}
                />
                <button className="conductor-aviso-btn" onClick={enviarAviso}>
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </div>
            </div>

            <div className="conductor-log">
              <h4 className="conductor-log-titulo">
                <FontAwesomeIcon icon={faClock} /> Actividad reciente
              </h4>
              <div className="conductor-log-lista">
                {log.length === 0 && (
                  <p className="conductor-log-vacio">Sin eventos por ahora.</p>
                )}
                {[...log].reverse().map(l => (
                  <div key={l.id} className={`conductor-log-item conductor-log--${l.tipo}`}>
                    <span className="conductor-log-dot" />
                    {l.msg}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  )
}
