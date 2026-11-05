import { Fragment, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass, faBus, faClock,
  faLocationDot, faChevronDown, faChevronUp, faXmark
} from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/shared/Layout'
import socket from '../services/socket'
import api from '../services/api'
import { calcularETA, formatearETA, distanciaKm } from '../utils/calcularETA'
import './MapaTiempoReal.css'

// ── Iconos ──────────────────────────────────────────────────

const iconoBus = L.divIcon({
  className: '',
  html: `<div class="marcador-bus">🚌</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
})

const iconoParada = L.divIcon({
  className: '',
  html: `<div class="marcador-parada"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const iconoParadaInactiva = L.divIcon({
  className: '',
  html: `<div class="marcador-parada marcador-parada--inactiva"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const iconoParadaSeleccionada = L.divIcon({
  className: '',
  html: `<div class="marcador-parada marcador-parada--seleccionada"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

// ── Control de vista del mapa ────────────────────────────────

function ControlMapa({ centro }) {
  const map = useMap()
  useEffect(() => {
    if (centro) map.setView(centro, map.getZoom())
  }, [centro, map])
  return null
}

// ── Umbral sin señal: 60 segundos ───────────────────────────

const UMBRAL_SIN_SENAL = 60000

// ── Componente principal ─────────────────────────────────────

export default function MapaTiempoReal() {
  const [buses, setBuses]                       = useState([])
  const [rutas, setRutas]                       = useState([])
  const [paradas, setParadas]                   = useState([])
  const [cargando, setCargando]                 = useState(true)
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null)
  const [busSeleccionado, setBusSeleccionado]   = useState(null)
  const [paradaSeleccionada, setParadaSeleccionada] = useState(null)
  const [busqueda, setBusqueda]                 = useState('')
  const [filtro, setFiltro]                     = useState('todos')
  const [centro, setCentro]                     = useState([8.3086, -73.6194])
  const [panelExpandido, setPanelExpandido]     = useState(
    () => sessionStorage.getItem('mapaPanel') === 'abierto'
  )
  const [panelVisible, setPanelVisible] = useState(
    () => sessionStorage.getItem('mapaPanelVisible') === 'abierto'
  )
  const [geometriaRuta, setGeometriaRuta] = useState([])
  const [geometriasRutas, setGeometriasRutas] = useState([])
  const [cargandoRuta, setCargandoRuta]   = useState(false)

  const ultimaUbicacion = useRef({})
  const busesRef = useRef([])
  const [searchParams] = useSearchParams()
  const PALETA_RUTAS = ['#1e6b2e', '#1565c0', '#f57c00', '#8e24aa', '#00897b', '#c62828']

  function tieneCoordenadas(bus) {
    const lat = Number(bus?.lat)
    const lng = Number(bus?.lng)
    return Number.isFinite(lat) && Number.isFinite(lng)
  }

  function normalizarBus(bus) {
    return {
      ...bus,
      lat: bus?.lat == null ? null : Number(bus.lat),
      lng: bus?.lng == null ? null : Number(bus.lng),
    }
  }

  async function refrescarBusesActivos() {
    const dataBuses = await api.get('/api/buses/activos')
    const listaBuses = (Array.isArray(dataBuses)
      ? dataBuses
      : (dataBuses.buses || [])).map(normalizarBus)

    listaBuses.forEach(b => {
      if (tieneCoordenadas(b)) {
        ultimaUbicacion.current[b.id_bus] = Date.now()
      }
    })

    setBuses(listaBuses)
    busesRef.current = listaBuses
    setBusSeleccionado(prev => {
      if (!prev) return prev
      return listaBuses.find(b => b.id_bus === prev.id_bus) || prev
    })
  }

  useEffect(() => {
    busesRef.current = buses
  }, [buses])

  // ── Carga inicial ──────────────────────────────────────────

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [dataBuses, dataRutas] = await Promise.all([
          api.get('/api/buses/activos'),
          api.get('/api/rutas'),
        ])

        const listaBuses = (Array.isArray(dataBuses)
          ? dataBuses
          : (dataBuses.buses || [])).map(normalizarBus)

        const listaRutas = Array.isArray(dataRutas)
          ? dataRutas
          : (dataRutas.rutas || [])

        setBuses(listaBuses)
        busesRef.current = listaBuses
        setRutas(listaRutas)

        listaBuses.forEach(b => {
          ultimaUbicacion.current[b.id_bus] = Date.now()
        })

        // Preseleccionar desde URL (?ruta=X ?bus=X), si no, auto-cargar la primera ruta activa
        const rutaParam = searchParams.get('ruta')
        const busParam  = searchParams.get('bus')

        if (rutaParam) {
          const ruta = listaRutas.find(r => r.id_ruta === Number(rutaParam))
          if (ruta) await cargarParadas(ruta)
        } else {
          // Auto-carga: primera ruta activa que tenga un bus, o simplemente la primera activa
          const rutaActiva =
            listaRutas.find(r => (r.activa === true || r.activa === 1) &&
              listaBuses.some(b => b.id_ruta === r.id_ruta)) ||
            listaRutas.find(r => r.activa === true || r.activa === 1)
          if (rutaActiva) await cargarParadas(rutaActiva)
        }

        if (busParam) {
          const bus = listaBuses.find(b => b.id_bus === Number(busParam))
          if (bus) setBusSeleccionado(bus)
        }

      } catch (err) {
        console.error('Error cargando mapa:', err)
      } finally {
        setCargando(false)
      }
    }
    cargarDatos()
  }, []) // eslint-disable-line

  // ── Socket.io ──────────────────────────────────────────────

  useEffect(() => {
    if (!socket.connected) socket.connect()

    rutas.filter(r => r.activa).forEach(r => {
      socket.emit('join:ruta', { id_ruta: r.id_ruta })
    })

    socket.on('bus:location', ({ id_bus, lat, lng }) => {
      ultimaUbicacion.current[id_bus] = Date.now()
      const latNum = Number(lat)
      const lngNum = Number(lng)
      const existe = busesRef.current.some(b => b.id_bus === id_bus)

      if (!existe) {
        // Si el bus no estaba en la lista inicial, re-sincronizamos desde backend.
        refrescarBusesActivos().catch(err => {
          console.error('No se pudo refrescar buses activos tras bus:location', err)
        })
        return
      }

      setBuses(prev => prev.map(b =>
        b.id_bus === id_bus ? { ...b, lat: latNum, lng: lngNum } : b
      ))
      setBusSeleccionado(prev =>
        prev?.id_bus === id_bus ? { ...prev, lat: latNum, lng: lngNum } : prev
      )
    })

    socket.on('bus:estado', ({ id_bus, estado }) => {
      const existe = busesRef.current.some(b => b.id_bus === id_bus)

      if (!existe && estado === 'en_recorrido') {
        refrescarBusesActivos().catch(err => {
          console.error('No se pudo refrescar buses activos tras bus:estado', err)
        })
        return
      }

      setBuses(prev => prev.map(b =>
        b.id_bus === id_bus ? { ...b, estado } : b
      ))
      setBusSeleccionado(prev =>
        prev?.id_bus === id_bus ? { ...prev, estado } : prev
      )
    })

    socket.on('connect_error', (err) => {
      console.error('Error de conexion Socket.IO en mapa:', err.message)
    })

    return () => {
      socket.off('bus:location')
      socket.off('bus:estado')
      socket.off('connect_error')
    }
  }, [rutas])

  useEffect(() => {
    // Respaldo: si falla temporalmente socket, refrescar lista de buses activos.
    const intervalo = setInterval(() => {
      refrescarBusesActivos().catch(() => {})
    }, 15000)
    return () => clearInterval(intervalo)
  }, [])

  // ── Detector sin señal ─────────────────────────────────────

  useEffect(() => {
    const intervalo = setInterval(() => {
      const ahora = Date.now()
      setBuses(prev => prev.map(b => {
        const ultimo = ultimaUbicacion.current[b.id_bus]
        if (ultimo && (ahora - ultimo) > UMBRAL_SIN_SENAL &&
            b.estado !== 'fuera_de_servicio' && b.estado !== 'sin_senal') {
          return { ...b, estado: 'sin_senal' }
        }
        return b
      }))
    }, 10000)
    return () => clearInterval(intervalo)
  }, [])

  // ── Cargar paradas de una ruta ─────────────────────────────

  async function cargarParadas(ruta) {
    setRutaSeleccionada(ruta)
    setBusSeleccionado(null)
    setParadaSeleccionada(null)
    setGeometriaRuta([])
    setGeometriasRutas([])
    try {
      const data = await api.get(`/api/paradas?ruta_id=${ruta.id_ruta}`)
      const lista = Array.isArray(data) ? data : (data.paradas || [])
      setParadas(lista)
      if (lista.length > 0) setCentro([lista[0].lat, lista[0].lng])
      if (lista.length > 1) {
        const puntos = await calcularGeometriaOSRM(lista)
        setGeometriaRuta(puntos)
      }
    } catch (err) {
      console.error('Error cargando paradas:', err)
      setParadas([])
    }
  }

  async function cargarTodasLasRutas() {
    setRutaSeleccionada(null)
    setBusSeleccionado(null)
    setParadaSeleccionada(null)
    setGeometriaRuta([])
    setGeometriasRutas([])

    const rutasActivas = rutas.filter(r => r.activa === true || r.activa === 1)
    if (!rutasActivas.length) {
      setParadas([])
      return
    }

    setCargandoRuta(true)
    try {
      const respuestas = await Promise.all(
        rutasActivas.map(r => api.get(`/api/paradas?ruta_id=${r.id_ruta}`))
      )

      const paradasPorRuta = respuestas.map((data) =>
        (Array.isArray(data) ? data : (data.paradas || []))
          .filter(p => p.lat && p.lng)
          .sort((a, b) => (a.orden || 0) - (b.orden || 0))
      )

      const todasLasParadas = paradasPorRuta.flat()
      setParadas(todasLasParadas)

      if (todasLasParadas.length > 0) {
        setCentro([todasLasParadas[0].lat, todasLasParadas[0].lng])
      }

      const geometrias = paradasPorRuta
        .map((lista, idx) => ({ lista, idx }))
        .filter(({ lista }) => lista.length > 1)

      const geometriasConEstilo = await Promise.all(
        geometrias.map(async ({ lista, idx }) => {
          const rutaRef = rutasActivas[idx]
          const puntos = await calcularGeometriaOSRM(lista)
          const dashed = idx % 2 !== 0
          return {
            idRuta: rutaRef?.id_ruta || idx,
            nombre: rutaRef?.nombre || `Ruta ${idx + 1}`,
            color: PALETA_RUTAS[idx % PALETA_RUTAS.length],
            puntos,
            dashed,
          }
        })
      )

      setGeometriasRutas(geometriasConEstilo)
    } catch (err) {
      console.error('Error cargando todas las rutas:', err)
      setParadas([])
      setGeometriasRutas([])
    } finally {
      setCargandoRuta(false)
    }
  }

  async function calcularGeometriaOSRM(listaParadas) {
    const ordenadas = [...listaParadas]
      .filter(p => p.lat && p.lng)
      .sort((a, b) => (a.orden || 0) - (b.orden || 0))
    if (ordenadas.length < 2) return

    setCargandoRuta(true)
    try {
      // OSRM espera coordenadas como lng,lat separadas por punto y coma
      const coords = ordenadas.map(p => `${p.lng},${p.lat}`).join(';')
      const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
      const res = await fetch(url)
      const json = await res.json()
      if (json.code === 'Ok' && json.routes?.length > 0) {
        // GeoJSON devuelve [lng, lat], Leaflet necesita [lat, lng]
        return json.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
      } else {
        // Fallback a línea recta si OSRM falla
        return ordenadas.map(p => [p.lat, p.lng])
      }
    } catch {
      return ordenadas.map(p => [p.lat, p.lng])
    } finally {
      setCargandoRuta(false)
    }
  }

  // ── Helpers ────────────────────────────────────────────────

  function colorEstado(estado) {
    if (estado === 'en_recorrido') return '#1e6b2e'
    if (estado === 'detenido')     return '#f39c12'
    if (estado === 'sin_senal')    return '#95a5a6'
    return '#e74c3c'
  }

  function textoEstado(estado) {
    if (estado === 'en_recorrido') return 'En recorrido'
    if (estado === 'detenido')     return 'Detenido'
    if (estado === 'sin_senal')    return 'Sin señal'
    return 'Fuera de servicio'
  }

  // ── Filtros ────────────────────────────────────────────────

  const busesFiltrados = buses.filter(b => {
    const texto = busqueda.toLowerCase()
    const coincideBusqueda = !texto ||
      (b.nombre || '').toLowerCase().includes(texto) ||
      (b.nombre_ruta || '').toLowerCase().includes(texto)
    const coincideFiltro = filtro === 'todos' || b.id_bus === parseInt(filtro)
    return coincideBusqueda && coincideFiltro
  })

  // ── Polilínea: usa geometría OSRM si está disponible ──────

  const puntosRuta = geometriaRuta.length > 0
    ? geometriaRuta
    : paradas
        .filter(p => p.lat && p.lng)
        .sort((a, b) => (a.orden || 0) - (b.orden || 0))
        .map(p => [p.lat, p.lng])

  // ── ETA parada seleccionada (#12) ──────────────────────────

  const etaParada = paradaSeleccionada
    ? calcularETA(paradaSeleccionada, buses)
    : null

  const panelAbierto = panelVisible || !!busSeleccionado || !!paradaSeleccionada

  // ── Render ─────────────────────────────────────────────────

  if (cargando) {
    return (
      <Layout titulo="Mapa en tiempo real" sinPadding>
        <div className="mapa-cargando">
          <div className="mapa-cargando-spinner" />
          <p>Cargando mapa...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titulo="Mapa en tiempo real" sinPadding>
      <div className="mapa-page">

        {/* ── Barra superior ── */}
        <div className="mapa-toolbar">
          {/* Buscador de bus */}
          <div className="mapa-buscador">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="mapa-buscador-icono" />
            <input
              type="text"
              placeholder="Buscar bus…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          {/* Chips de ruta — reemplazan el dropdown */}
          <div className="mapa-rutas-chips">
            {/* Chip "Todas" solo si hay más de 1 ruta activa */}
            {rutas.filter(r => r.activa === true || r.activa === 1).length > 1 && (
              <button
                className={`mapa-ruta-chip ${!rutaSeleccionada ? 'mapa-ruta-chip--activo' : ''}`}
                  onClick={cargarTodasLasRutas}
              >
                Todas
              </button>
            )}
            {rutas.filter(r => r.activa === true || r.activa === 1).map(r => (
              <button
                key={r.id_ruta}
                className={`mapa-ruta-chip ${rutaSeleccionada?.id_ruta === r.id_ruta ? 'mapa-ruta-chip--activo' : ''}`}
                onClick={() => cargarParadas(r)}
              >
                {r.nombre}
              </button>
            ))}
            {cargandoRuta && <span className="mapa-ruta-spinner-inline" />}
          </div>
        </div>

        {/* ── Mapa Leaflet (full screen) ── */}
        <div className="mapa-contenido">
          <div className="mapa-leaflet">
            <MapContainer
              center={centro}
              zoom={15}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap"
              />
              <ZoomControl position="bottomleft" />
              <ControlMapa centro={centro} />

              {/* Polilínea de la ruta — sigue calles reales via OSRM */}
              {geometriasRutas.length > 0 && geometriasRutas.map((rutaGeo, idx) => (
                <Fragment key={`ruta-polilinea-${rutaGeo.idRuta || idx}`}>
                  <Polyline
                    positions={rutaGeo.puntos}
                    color="#ffffff"
                    weight={7}
                    opacity={0.75}
                  />
                  <Polyline
                    positions={rutaGeo.puntos}
                    color={rutaGeo.color}
                    weight={4.5}
                    opacity={0.95}
                    dashArray={rutaGeo.dashed ? '10 6' : undefined}
                  />
                </Fragment>
              ))}

              {geometriasRutas.length === 0 && puntosRuta.length > 1 && (
                <>
                  {/* Borde blanco para contraste */}
                  <Polyline
                    positions={puntosRuta}
                    color="#ffffff"
                    weight={7}
                    opacity={0.8}
                  />
                  {/* Línea principal */}
                  <Polyline
                    positions={puntosRuta}
                    color="#1e6b2e"
                    weight={4}
                    opacity={1}
                  />
                </>
              )}

              {/* Paradas (#10) */}
              {paradas.map(p => (
                <Marker
                  key={p.id_parada}
                  position={[p.lat, p.lng]}
                  icon={
                    paradaSeleccionada?.id_parada === p.id_parada
                      ? iconoParadaSeleccionada
                      : p.activa === false || p.activa === 0
                        ? iconoParadaInactiva
                        : iconoParada
                  }
                  eventHandlers={{ click: () => {
                    setPanelVisible(true)
                    setParadaSeleccionada(p)
                    setBusSeleccionado(null)
                  }}}
                >
                  <Popup>
                    <strong>{p.nombre}</strong><br />
                    <span style={{ fontSize: 12, color: p.activa ? '#1e6b2e' : '#aaa' }}>
                      {p.activa === false || p.activa === 0 ? 'Inactiva' : 'Activa'}
                    </span>
                  </Popup>
                </Marker>
              ))}

              {/* Buses (#09) */}
              {busesFiltrados
                .filter(tieneCoordenadas)
                .map(b => (
                  <Marker
                    key={b.id_bus}
                    position={[Number(b.lat), Number(b.lng)]}
                    icon={iconoBus}
                    eventHandlers={{ click: () => {
                      setPanelVisible(true)
                      setBusSeleccionado(b)
                      setParadaSeleccionada(null)
                    }}}
                  />
                ))
              }
            </MapContainer>
          </div>
        </div>

        {/* ── Panel flotante ── */}
        <button
          className={`mapa-panel-toggle ${panelAbierto ? 'mapa-panel-toggle--abierto' : ''}`}
          onClick={() => {
            const nuevo = !panelAbierto
            setPanelVisible(nuevo)
            sessionStorage.setItem('mapaPanelVisible', nuevo ? 'abierto' : 'cerrado')
            if (!nuevo) {
              setBusSeleccionado(null)
              setParadaSeleccionada(null)
            }
          }}
          aria-label={panelAbierto ? 'Ocultar panel del mapa' : 'Mostrar panel del mapa'}
        >
          <FontAwesomeIcon icon={panelAbierto ? faXmark : faBus} />
        </button>

        <div className={`mapa-panel ${panelAbierto ? 'mapa-panel--abierto' : 'mapa-panel--oculto'}`}>

            {/* Info bus seleccionado (#11) */}
            {busSeleccionado && (
              <div className="mapa-info-bus">
                <h3 className="mapa-info-titulo">Información del bus</h3>

                <div className="mapa-info-fila">
                  <span className="mapa-info-label">Bus:</span>
                  <span className="mapa-info-valor">{busSeleccionado.nombre}</span>
                </div>
                <div className="mapa-info-fila">
                  <span className="mapa-info-label">Placa:</span>
                  <span className="mapa-info-valor">{busSeleccionado.placa || '—'}</span>
                </div>
                <div className="mapa-info-fila">
                  <span className="mapa-info-label">Ruta:</span>
                  <span className="mapa-info-valor">{busSeleccionado.nombre_ruta || '—'}</span>
                </div>
                <div className="mapa-info-fila">
                  <span className="mapa-info-label">Conductor:</span>
                  <span className="mapa-info-valor">{busSeleccionado.nombre_conductor || '—'}</span>
                </div>
                <div className="mapa-info-fila">
                  <span className="mapa-info-label">Estado:</span>
                  <span
                    className="mapa-info-badge"
                    style={{ background: colorEstado(busSeleccionado.estado) }}
                  >
                    {textoEstado(busSeleccionado.estado)}
                  </span>
                </div>

                {/* Próxima parada con ETA */}
                {paradas.length > 0 && busSeleccionado.lat && (
                  <div className="mapa-info-fila">
                    <span className="mapa-info-label">Próxima parada:</span>
                    <span className="mapa-info-valor">
                      {(() => {
                        const activas = paradas.filter(p => p.activa !== false && p.activa !== 0 && p.lat && p.lng)
                        if (!activas.length) return '—'
                        let cercana = activas[0], menor = Infinity
                        for (const p of activas) {
                          const d = distanciaKm(busSeleccionado.lat, busSeleccionado.lng, p.lat, p.lng)
                          if (d < menor) { menor = d; cercana = p }
                        }
                        const eta = calcularETA(cercana, [busSeleccionado])
                        return `${cercana.nombre} — ${formatearETA(eta.etaMinutos)}`
                      })()}
                    </span>
                  </div>
                )}

                <button className="mapa-info-btn" onClick={() => setBusSeleccionado(null)}>
                  Cerrar
                </button>
              </div>
            )}

            {/* Info parada seleccionada (#12) */}
            {paradaSeleccionada && !busSeleccionado && (
              <div className="mapa-info-bus">
                <h3 className="mapa-info-titulo">
                  <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: 8 }} />
                  {paradaSeleccionada.nombre}
                </h3>

                <div className="mapa-info-fila">
                  <span className="mapa-info-label">Estado:</span>
                  <span
                    className="mapa-info-badge"
                    style={{ background: paradaSeleccionada.activa === false || paradaSeleccionada.activa === 0 ? '#95a5a6' : '#1e6b2e' }}
                  >
                    {paradaSeleccionada.activa === false || paradaSeleccionada.activa === 0 ? 'Inactiva' : 'Activa'}
                  </span>
                </div>

                {etaParada?.busCercano ? (
                  <>
                    <div className="mapa-info-fila">
                      <span className="mapa-info-label">Bus más cercano:</span>
                      <span className="mapa-info-valor">{etaParada.busCercano.nombre}</span>
                    </div>
                    <div className="mapa-info-fila">
                      <span className="mapa-info-label">Distancia:</span>
                      <span className="mapa-info-valor">{etaParada.distanciaKmVal} km</span>
                    </div>
                    <div className="mapa-info-fila">
                      <span className="mapa-info-label">
                        <FontAwesomeIcon icon={faClock} style={{ marginRight: 6 }} />
                        Llegada estimada:
                      </span>
                      <span className="mapa-info-valor" style={{ color: '#1e6b2e', fontSize: 18, fontWeight: 700 }}>
                        {etaParada.etaMinutos > 30 ? '> 30 min' : formatearETA(etaParada.etaMinutos)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p style={{ color: 'var(--texto-suave)', fontSize: 13, marginTop: 8 }}>
                    Sin buses activos en esta ruta
                  </p>
                )}

                <button className="mapa-info-btn" onClick={() => setParadaSeleccionada(null)}>
                  Cerrar
                </button>
              </div>
            )}

            {/* Panel compacto — lista de buses */}
            {!busSeleccionado && !paradaSeleccionada && (
              <div className="mapa-panel-compacto">
                <button
                  className="mapa-panel-header"
                  onClick={() => setPanelExpandido(v => {
                    const nuevo = !v
                    sessionStorage.setItem('mapaPanel', nuevo ? 'abierto' : 'cerrado')
                    return nuevo
                  })}
                >
                  <div className="mapa-panel-header-left">
                    <FontAwesomeIcon icon={faBus} />
                    <span>
                      {busesFiltrados.filter(tieneCoordenadas).length} buses en ruta
                    </span>
                  </div>
                  <FontAwesomeIcon icon={panelExpandido ? faChevronDown : faChevronUp} />
                </button>

                {panelExpandido && (
                  <div className="mapa-panel-lista">
                    {rutaSeleccionada == null && geometriasRutas.length > 0 && (
                      <div className="mapa-leyenda-rutas">
                        <h4 className="mapa-leyenda-titulo">Leyenda de rutas</h4>
                        {geometriasRutas.map((rutaGeo, idx) => (
                          <div key={`leyenda-ruta-${rutaGeo.idRuta || idx}`} className="mapa-leyenda-item">
                            <span
                              className="mapa-leyenda-trazo"
                              style={{
                                '--line-color': rutaGeo.color,
                                borderTopStyle: rutaGeo.dashed ? 'dashed' : 'solid',
                              }}
                            />
                            <span className="mapa-leyenda-nombre">{rutaGeo.nombre}</span>
                            <span className="mapa-leyenda-tipo">
                              {rutaGeo.dashed ? 'Punteada' : 'Continua'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {busesFiltrados.filter(tieneCoordenadas).length === 0 ? (
                      <p className="mapa-panel-sin-buses">Sin buses con ubicación activa</p>
                    ) : (
                      busesFiltrados.filter(tieneCoordenadas).map(b => (
                        <div
                          key={b.id_bus}
                          className="mapa-bus-item"
                          onClick={() => {
                            setPanelVisible(true)
                            setBusSeleccionado(b)
                          }}
                        >
                          <div>
                            <div className="mapa-bus-nombre">{b.nombre}</div>
                            <div className="mapa-bus-ruta">{b.nombre_ruta || 'Sin ruta'}</div>
                          </div>
                          <span
                            className="mapa-info-badge"
                            style={{ background: colorEstado(b.estado) }}
                          >
                            {textoEstado(b.estado)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
      </div>
    </Layout>
  )
}