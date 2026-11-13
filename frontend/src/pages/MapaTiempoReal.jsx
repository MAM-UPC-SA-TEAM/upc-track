import { Fragment, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  MapContainer, TileLayer, Marker, Polyline, CircleMarker, Tooltip, ZoomControl, AttributionControl, useMap, useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faLocationDot, faBus, faRotate } from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/shared/Layout'
import ChipsRutas from '../components/mapa/ChipsRutas'
import HojaBuses from '../components/mapa/HojaBuses'
import TalonMapa from '../components/mapa/TalonMapa'
import { FRESCO_MAX_S, etiquetaBus } from '../utils/estadoBus'
import socket, { unirseRuta } from '../services/socket'
import { useAlReanudar, useEnLinea } from '../hooks/useCicloVida'
import api from '../services/api'
import { distanciaKm } from '../utils/calcularETA'
import './MapaTiempoReal.css'

const UMBRAL_SIN_SENAL_MS = 60000
const VELOCIDAD_KMH = 25         // ETA por distancia en línea recta (se dice en pantalla)
const MAX_ETIQUETAS_BUS = 3      // con más buses solo se rotula el seleccionado

// Un trazo verde por ruta; con varias se distinguen por el estilo de la línea, no por una paleta de colores
// (las rutas impares son más finas: donde comparten calle, la de abajo sigue viéndose)
const ESTILOS_RUTA = [
  { clase: 'ruta-verde', dash: undefined, peso: 6 },
  { clase: 'ruta-tinta', dash: '10 8', peso: 3 },
  { clase: 'ruta-verde', dash: '2 9', peso: 6 },
  { clase: 'ruta-tinta', dash: '2 9', peso: 3 },
]
const estiloRuta = i => ESTILOS_RUTA[i % ESTILOS_RUTA.length]

const icono = (clase, tam = 44) => L.divIcon({
  className: '',
  html: `<div class="mk-wrap"><span class="mk ${clase}"></span></div>`,
  iconSize: [tam, tam],
  iconAnchor: [tam / 2, tam / 2],
})
const iconoBus = icono('mk-bus')
const iconoBusViejo = icono('mk-bus mk-bus--viejo')
const iconoParadaSel = icono('mk-parada')

const num = v => Number(v)
const tieneCoordenadas = b => Number.isFinite(num(b?.lat)) && Number.isFinite(num(b?.lng))
const normalizarBus = b => ({ ...b, lat: b?.lat == null ? null : num(b.lat), lng: b?.lng == null ? null : num(b.lng) })
const esActiva = r => r.activa === true || r.activa === 1
const paradaActiva = p => p.activa !== false && p.activa !== 0

// Bus más cercano a un punto y su tiempo estimado en línea recta
function masCercano(punto, buses, idRuta) {
  let mejor = null
  let dm = Infinity
  for (const b of buses) {
    if (!tieneCoordenadas(b) || b.estado === 'fuera_de_servicio') continue
    if (idRuta != null && b.id_ruta !== idRuta) continue // el ETA de una parada solo lo dan los buses de su ruta
    const d = distanciaKm(num(b.lat), num(b.lng), num(punto.lat), num(punto.lng))
    if (d < dm) { dm = d; mejor = b }
  }
  return mejor ? { bus: mejor, km: dm, min: Math.round((dm / VELOCIDAD_KMH) * 60) } : null
}

// Mueve el mapa para que lo seleccionado quede a la vista por encima de la hoja (se mide su altura real)
function Encuadre({ puntos, claveSel, centro, ruta, clave }) {
  const map = useMap()
  // Márgenes según dónde esté la hoja: abajo en móvil; en escritorio es una tarjeta a la izquierda
  const margenes = () => {
    const hoja = document.querySelector('.mapa-hoja')
    if (window.innerWidth >= 1024) return { tl: [(hoja?.offsetWidth || 0) + 64, 72], br: [48, 48] }
    return { tl: [40, 72], br: [64, (hoja?.offsetHeight || 0) + 16] } // 64 a la derecha: libra el zoom
  }
  useEffect(() => {
    if (!claveSel || !puntos.length) return
    const { tl, br } = margenes()
    if (puntos.length === 1) map.panInside(puntos[0], { paddingTopLeft: tl, paddingBottomRight: br, animate: true })
    else map.fitBounds(L.latLngBounds(puntos), { paddingTopLeft: tl, paddingBottomRight: br, maxZoom: 17 })
  }, [claveSel]) // eslint-disable-line react-hooks/exhaustive-deps
  // Con algo seleccionado manda el encuadre de la selección: los otros dos no deben pisarlo al montar
  useEffect(() => { if (centro && !claveSel) map.setView(centro, map.getZoom()) }, [centro, map]) // eslint-disable-line react-hooks/exhaustive-deps
  // Al elegir otra ruta se encuadra completa, dejando sitio a la hoja de abajo
  useEffect(() => {
    if (!claveSel && ruta.length > 1) map.fitBounds(L.latLngBounds(ruta), { paddingTopLeft: [32, 64], paddingBottomRight: [32, 96] })
  }, [clave, ruta.length > 1]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function AlTocarMapa({ onTocar }) {
  useMapEvents({ click: onTocar })
  return null
}

export default function MapaTiempoReal() {
  const [buses, setBuses] = useState([])
  const [rutas, setRutas] = useState([])
  const [paradas, setParadas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null)
  const [busSeleccionado, setBusSeleccionado] = useState(null)
  const [paradaSeleccionada, setParadaSeleccionada] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [centro, setCentro] = useState([8.3086, -73.6194])
  const [listaAbierta, setListaAbierta] = useState(() => sessionStorage.getItem('mapaLista') === 'abierta')
  const [geometriaRuta, setGeometriaRuta] = useState([])
  const [geometriasRutas, setGeometriasRutas] = useState([])
  const [cargandoRuta, setCargandoRuta] = useState(false)
  const enLinea = useEnLinea()
  const [ahora, setAhora] = useState(() => Date.now())

  const ultimaUbicacion = useRef({})
  const busesRef = useRef([])
  const [searchParams] = useSearchParams()

  // Cuándo se recibió por última vez cada posición: se respeta la edad real que informa el servidor
  function marcarRecibido(b) {
    ultimaUbicacion.current[b.id_bus] = Date.now() - (Number(b.edad_segundos) || 0) * 1000
  }
  const edadBus = b => Math.max(0, (ahora - (ultimaUbicacion.current[b.id_bus] ?? ahora)) / 1000)

  async function refrescarBusesActivos() {
    const data = await api.get('/api/buses/activos')
    const lista = (Array.isArray(data) ? data : (data.buses || [])).map(normalizarBus)
    lista.forEach(b => { if (tieneCoordenadas(b)) marcarRecibido(b) })
    setBuses(lista)
    busesRef.current = lista
    setBusSeleccionado(prev => (prev ? lista.find(b => b.id_bus === prev.id_bus) || prev : prev))
  }

  useEffect(() => { busesRef.current = buses }, [buses])

  // ── Carga inicial ──────────────────────────────────────────
  async function cargarDatos() {
    setErrorCarga(false)
    try {
      const [dataBuses, dataRutas] = await Promise.all([api.get('/api/buses/activos'), api.get('/api/rutas')])
      const listaBuses = (Array.isArray(dataBuses) ? dataBuses : (dataBuses.buses || [])).map(normalizarBus)
      const listaRutas = Array.isArray(dataRutas) ? dataRutas : (dataRutas.rutas || [])

      listaBuses.forEach(marcarRecibido)
      setBuses(listaBuses)
      busesRef.current = listaBuses
      setRutas(listaRutas)

      // Preselección por URL (?ruta=X ?bus=X); si no, la primera ruta activa con bus
      const rutaParam = searchParams.get('ruta')
      const busParam = searchParams.get('bus')
      if (rutaParam) {
        const ruta = listaRutas.find(r => r.id_ruta === Number(rutaParam))
        if (ruta) await cargarParadas(ruta)
      } else {
        const rutaActiva = listaRutas.find(r => esActiva(r) && listaBuses.some(b => b.id_ruta === r.id_ruta)) || listaRutas.find(esActiva)
        if (rutaActiva) await cargarParadas(rutaActiva)
      }
      if (busParam) {
        const bus = listaBuses.find(b => b.id_bus === Number(busParam))
        if (bus) setBusSeleccionado(bus)
      }
    } catch (err) {
      console.error('Error cargando mapa:', err)
      setErrorCarga(true)
    } finally {
      setCargando(false)
    }
  }
  useEffect(() => { cargarDatos() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Conexión y reloj (la frescura se mide con el tiempo, no solo con eventos) ──
  useEffect(() => {
    const reloj = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(reloj)
  }, [])

  // Al volver de segundo plano las posiciones guardadas ya son viejas: se piden de nuevo
  useAlReanudar(() => { refrescarBusesActivos().catch(() => {}) })

  // ── Socket.io ──────────────────────────────────────────────
  useEffect(() => {
    if (!socket.connected) socket.connect()
    rutas.filter(esActiva).forEach(r => unirseRuta(Number(r.id_ruta)))

    socket.on('bus:location', ({ id_bus, lat, lng }) => {
      ultimaUbicacion.current[id_bus] = Date.now()
      const latNum = num(lat)
      const lngNum = num(lng)
      if (!busesRef.current.some(b => b.id_bus === id_bus)) {
        refrescarBusesActivos().catch(() => {}) // bus nuevo: se re-sincroniza desde el backend
        return
      }
      setBuses(prev => prev.map(b => (b.id_bus === id_bus ? { ...b, estado: b.estado === 'sin_senal' ? 'en_recorrido' : b.estado, lat: latNum, lng: lngNum } : b)))
      setBusSeleccionado(prev => (prev?.id_bus === id_bus ? { ...prev, lat: latNum, lng: lngNum, estado: prev.estado === 'sin_senal' ? 'en_recorrido' : prev.estado } : prev))
    })

    socket.on('bus:estado', ({ id_bus, estado }) => {
      if (!busesRef.current.some(b => b.id_bus === id_bus) && estado === 'en_recorrido') {
        refrescarBusesActivos().catch(() => {})
        return
      }
      setBuses(prev => prev.map(b => (b.id_bus === id_bus ? { ...b, estado } : b)))
      setBusSeleccionado(prev => (prev?.id_bus === id_bus ? { ...prev, estado } : prev))
    })

    return () => { socket.off('bus:location'); socket.off('bus:estado') }
  }, [rutas]) // eslint-disable-line react-hooks/exhaustive-deps

  // Respaldo: si el socket falla un rato, se refresca la lista de buses
  useEffect(() => {
    const t = setInterval(() => refrescarBusesActivos().catch(() => {}), 15000)
    return () => clearInterval(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Un bus sin posición nueva en 60 s pasa a «sin señal»
  useEffect(() => {
    const t = setInterval(() => {
      const ahoraMs = Date.now()
      setBuses(prev => prev.map(b => {
        const ultimo = ultimaUbicacion.current[b.id_bus]
        return ultimo && ahoraMs - ultimo > UMBRAL_SIN_SENAL_MS && b.estado !== 'fuera_de_servicio' && b.estado !== 'sin_senal'
          ? { ...b, estado: 'sin_senal' } : b
      }))
    }, 10000)
    return () => clearInterval(t)
  }, [])

  // ── Rutas y paradas ────────────────────────────────────────
  async function calcularGeometriaOSRM(lista) {
    const ordenadas = [...lista].filter(p => p.lat && p.lng).sort((a, b) => (a.orden || 0) - (b.orden || 0))
    if (ordenadas.length < 2) return ordenadas.map(p => [p.lat, p.lng])
    setCargandoRuta(true)
    try {
      const coords = ordenadas.map(p => `${p.lng},${p.lat}`).join(';')
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
      const json = await res.json()
      if (json.code === 'Ok' && json.routes?.length > 0) return json.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
      return ordenadas.map(p => [p.lat, p.lng]) // OSRM falló: línea recta entre paradas
    } catch {
      return ordenadas.map(p => [p.lat, p.lng])
    } finally {
      setCargandoRuta(false)
    }
  }

  function limpiarSeleccion() {
    setBusSeleccionado(null)
    setParadaSeleccionada(null)
  }

  async function cargarParadas(ruta) {
    setRutaSeleccionada(ruta)
    limpiarSeleccion()
    setGeometriaRuta([])
    setGeometriasRutas([])
    try {
      const data = await api.get(`/api/paradas?ruta_id=${ruta.id_ruta}`)
      // El endpoint filtrado por ruta no devuelve id_ruta: se etiqueta aquí para poder emparejar parada y bus
      const lista = (Array.isArray(data) ? data : (data.paradas || [])).map(p => ({ ...p, id_ruta: p.id_ruta ?? ruta.id_ruta }))
      setParadas(lista)
      if (lista.length > 0) setCentro([lista[0].lat, lista[0].lng])
      if (lista.length > 1) setGeometriaRuta(await calcularGeometriaOSRM(lista))
    } catch (err) {
      console.error('Error cargando paradas:', err)
      setParadas([])
    }
  }

  async function cargarTodasLasRutas() {
    setRutaSeleccionada(null)
    limpiarSeleccion()
    setGeometriaRuta([])
    setGeometriasRutas([])
    const activas = rutas.filter(esActiva)
    if (!activas.length) { setParadas([]); return }

    setCargandoRuta(true)
    try {
      const respuestas = await Promise.all(activas.map(r => api.get(`/api/paradas?ruta_id=${r.id_ruta}`)))
      const porRuta = respuestas.map((data, idx) => (Array.isArray(data) ? data : (data.paradas || []))
        .filter(p => p.lat && p.lng).map(p => ({ ...p, id_ruta: p.id_ruta ?? activas[idx].id_ruta }))
        .sort((a, b) => (a.orden || 0) - (b.orden || 0)))
      const todas = porRuta.flat()
      setParadas(todas)
      if (todas.length > 0) setCentro([todas[0].lat, todas[0].lng])

      const geometrias = await Promise.all(porRuta.map(async (lista, idx) => ({
        idRuta: activas[idx]?.id_ruta ?? idx,
        nombre: activas[idx]?.nombre || `Ruta ${idx + 1}`,
        estilo: estiloRuta(idx),
        puntos: lista.length > 1 ? await calcularGeometriaOSRM(lista) : [],
      })))
      setGeometriasRutas(geometrias.filter(g => g.puntos.length > 1))
    } catch (err) {
      console.error('Error cargando todas las rutas:', err)
      setParadas([])
      setGeometriasRutas([])
    } finally {
      setCargandoRuta(false)
    }
  }

  function alternarLista() {
    setListaAbierta(v => {
      sessionStorage.setItem('mapaLista', v ? 'cerrada' : 'abierta')
      return !v
    })
  }

  // ── Datos derivados ────────────────────────────────────────
  const rutasActivas = rutas.filter(esActiva)
  const texto = busqueda.trim().toLowerCase()
  // Con una ruta elegida solo se ven los buses de esa ruta
  const busesDeRuta = rutaSeleccionada ? buses.filter(b => b.id_ruta === rutaSeleccionada.id_ruta) : buses
  const busesConPosicion = busesDeRuta.filter(tieneCoordenadas)
  const busesFiltrados = busesConPosicion.filter(b =>
    !texto || (b.nombre || '').toLowerCase().includes(texto) || (b.nombre_ruta || '').toLowerCase().includes(texto))
  const rotularTodos = busesFiltrados.length <= MAX_ETIQUETAS_BUS

  const puntosRuta = geometriaRuta.length > 0
    ? geometriaRuta
    : paradas.filter(p => p.lat && p.lng).sort((a, b) => (a.orden || 0) - (b.orden || 0)).map(p => [p.lat, p.lng])

  // Próxima parada del bus seleccionado (de su propia ruta); se dibuja como parada elegida
  let proxima = null
  if (busSeleccionado && !paradaSeleccionada && tieneCoordenadas(busSeleccionado)) {
    const candidatas = paradas.filter(p => paradaActiva(p) && p.lat && p.lng && (p.id_ruta == null || p.id_ruta === busSeleccionado.id_ruta))
    if (candidatas.length) {
      proxima = candidatas
        .map(p => ({ p, d: distanciaKm(num(busSeleccionado.lat), num(busSeleccionado.lng), num(p.lat), num(p.lng)) }))
        .sort((x, y) => x.d - y.d)[0]
    }
  }

  // Para encuadrar: con varias rutas, la geometría de todas; con una, la suya
  const puntosEncuadre = geometriasRutas.length > 0 ? geometriasRutas.flatMap(g => g.puntos) : puntosRuta

  // Hoja: parada seleccionada → ETA del bus más cercano; bus seleccionado → ETA a su próxima parada
  let hoja = null
  if (paradaSeleccionada) {
    const e = masCercano(paradaSeleccionada, buses, paradaSeleccionada.id_ruta)
    const edad = e ? edadBus(e.bus) : null
    const viejo = e && (e.bus.estado === 'sin_senal' || edad > FRESCO_MAX_S)
    hoja = {
      icono: faLocationDot,
      titulo: paradaSeleccionada.nombre,
      destino: paradaActiva(paradaSeleccionada) ? null : 'Parada inactiva',
      minutos: e?.min ?? null,
      fase: !e ? 'sin-buses' : !enLinea ? 'sin-red' : viejo ? 'viejo' : 'vivo',
      frescura: e && !viejo ? Math.max(0.06, 1 - edad / FRESCO_MAX_S) : 1,
      lineas: e ? [[e.bus.nombre_ruta, e.bus.nombre].filter(Boolean).join(' · '), `a ${e.km.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`] : [],
      etiqueta: e ? etiquetaBus(e.bus, edad) : null,
      mensajeVacio: 'Ningún bus transmite en esta ruta ahora. Revisa los horarios.',
    }
  } else if (busSeleccionado) {
    const b = busSeleccionado
    const edad = edadBus(b)
    const viejo = b.estado === 'sin_senal' || (b.estado === 'en_recorrido' && edad > FRESCO_MAX_S)
    const fuera = b.estado === 'fuera_de_servicio'
    hoja = {
      icono: faBus,
      titulo: `${b.nombre}${b.placa ? ' · ' + b.placa : ''}`,
      destino: proxima ? `Próxima parada: ${proxima.p.nombre}` : null,
      minutos: proxima && !fuera ? Math.round((proxima.d / VELOCIDAD_KMH) * 60) : null,
      fase: fuera || !proxima ? 'sin-buses' : !enLinea ? 'sin-red' : viejo ? 'viejo' : 'vivo',
      frescura: !viejo && !fuera ? Math.max(0.06, 1 - edad / FRESCO_MAX_S) : 1,
      lineas: [b.nombre_ruta, b.nombre_conductor && `Conductor: ${b.nombre_conductor}`].filter(Boolean),
      etiqueta: etiquetaBus(b, edad),
      mensajeVacio: fuera ? 'Este bus está fuera de servicio.' : 'No se conoce la próxima parada de este bus.',
    }
  }

  // Qué debe quedar a la vista al seleccionar: la parada, o el bus junto con su próxima parada
  const puntosSeleccion = paradaSeleccionada ? [[num(paradaSeleccionada.lat), num(paradaSeleccionada.lng)]]
    : busSeleccionado && tieneCoordenadas(busSeleccionado)
      ? [[num(busSeleccionado.lat), num(busSeleccionado.lng)], ...(proxima ? [[num(proxima.p.lat), num(proxima.p.lng)]] : [])]
      : []
  const claveSeleccion = paradaSeleccionada ? `p${paradaSeleccionada.id_parada}` : busSeleccionado ? `b${busSeleccionado.id_bus}-${proxima?.p.id_parada ?? ''}` : ''

  // ── Render ─────────────────────────────────────────────────
  if (cargando) {
    return (
      <Layout titulo="Mapa" sinPadding>
        <div className="mapa-aviso" role="status"><span className="talon-esqueleto" /><p>Cargando el mapa…</p></div>
      </Layout>
    )
  }

  if (errorCarga && rutas.length === 0) {
    return (
      <Layout titulo="Mapa" sinPadding>
        <div className="mapa-aviso" role="alert">
          <span className="sello sello--fijo">Sin conexión</span>
          <p>No pudimos cargar el mapa. Revisa tu conexión e inténtalo de nuevo.</p>
          <button className="talon-accion" onClick={() => { setCargando(true); cargarDatos() }}>
            <FontAwesomeIcon icon={faRotate} /> Reintentar ahora
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titulo="Mapa" sinPadding>
      <div className="mapa-page">
        <div className="mapa-barra">
          {buses.length > 3 && (
            <label className="mapa-buscar">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              <input type="search" aria-label="Buscar bus" placeholder="Buscar bus…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </label>
          )}
          <ChipsRutas
            rutas={rutasActivas}
            seleccionada={rutaSeleccionada}
            onTodas={cargarTodasLasRutas}
            onRuta={cargarParadas}
            estiloDe={estiloRuta}
            mostrarMuestras={!rutaSeleccionada}
            calculando={cargandoRuta}
          />
        </div>

        <div className="mapa-contenido">
          <div className="mapa-leaflet">
            <MapContainer center={centro} zoom={15} style={{ width: '100%', height: '100%' }} zoomControl={false} attributionControl={false}>
              <TileLayer className="tiles-calmos" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
              <ZoomControl position="topright" />
              <AttributionControl position="topleft" prefix={false} />
              <Encuadre puntos={puntosSeleccion} claveSel={claveSeleccion} centro={centro} ruta={puntosEncuadre} clave={`${rutaSeleccionada?.id_ruta ?? 'todas'}-${geometriaRuta.length}-${geometriasRutas.length}`} />
              <AlTocarMapa onTocar={limpiarSeleccion} />

              {geometriasRutas.map((g, idx) => (
                <Fragment key={`ruta-${g.idRuta ?? idx}`}>
                  <Polyline positions={g.puntos} interactive={false} className="ruta-casing" color="#fbfaf4" weight={g.estilo.peso + 4} />
                  <Polyline positions={g.puntos} interactive={false} className={g.estilo.clase} color="#1e6b2e" weight={g.estilo.peso} dashArray={g.estilo.dash} />
                </Fragment>
              ))}
              {geometriasRutas.length === 0 && puntosRuta.length > 1 && (
                <>
                  <Polyline positions={puntosRuta} interactive={false} className="ruta-casing" color="#fbfaf4" weight={9} />
                  <Polyline positions={puntosRuta} interactive={false} className="ruta-verde" color="#1e6b2e" weight={5} />
                </>
              )}

              {/* Paradas: punto visible pequeño + zona de toque de 18 px de radio */}
              {paradas.filter(p => p.lat && p.lng).map(p => {
                const sel = paradaSeleccionada?.id_parada === p.id_parada || proxima?.p.id_parada === p.id_parada
                const tocar = { click: () => { setParadaSeleccionada(p); setBusSeleccionado(null) } }
                return (
                  <Fragment key={p.id_parada}>
                    {sel ? (
                      <Marker position={[p.lat, p.lng]} icon={iconoParadaSel} eventHandlers={tocar}>
                        <Tooltip permanent direction={window.innerWidth >= 1024 ? 'right' : 'auto'} offset={[16, 0]} className="etiqueta-mapa">{p.nombre}</Tooltip>
                      </Marker>
                    ) : (
                      <>
                        <CircleMarker center={[p.lat, p.lng]} radius={8} interactive={false}
                          className={`parada-punto ${paradaActiva(p) ? '' : 'parada-punto--inactiva'}`} pathOptions={{ weight: 2 }} />
                        {/* bubblingMouseEvents=false: el toque no sube al mapa (que lo leería como «tocar fuera» y limpiaría la selección) */}
                        <CircleMarker center={[p.lat, p.lng]} radius={22} eventHandlers={tocar} bubblingMouseEvents={false}
                          pathOptions={{ stroke: false, fillOpacity: 0 }} />
                      </>
                    )}
                  </Fragment>
                )
              })}

              {busesFiltrados.map(b => {
                const viejo = b.estado === 'sin_senal' || edadBus(b) > FRESCO_MAX_S
                const rotular = rotularTodos || busSeleccionado?.id_bus === b.id_bus
                return (
                  <Marker key={b.id_bus} position={[b.lat, b.lng]} icon={viejo ? iconoBusViejo : iconoBus}
                    eventHandlers={{ click: () => { setBusSeleccionado(b); setParadaSeleccionada(null) } }}>
                    {rotular && (
                      <Tooltip permanent direction="top" offset={[0, -16]} className="etiqueta-mapa">
                        {viejo ? `${b.nombre} · sin señal` : b.nombre}
                      </Tooltip>
                    )}
                  </Marker>
                )
              })}
            </MapContainer>
          </div>

          <div className="mapa-hoja">
            {hoja ? (
              <TalonMapa {...hoja} onCerrar={limpiarSeleccion} />
            ) : (
              <HojaBuses
                buses={busesFiltrados}
                paradas={paradas.filter(p => p.lat && p.lng)}
                onElegirParada={p => { setParadaSeleccionada(p); setBusSeleccionado(null) }}
                expandido={listaAbierta}
                onAlternar={alternarLista}
                onElegir={b => { setBusSeleccionado(b); setParadaSeleccionada(null) }}
                descripcion={b => b.nombre_ruta || 'Sin ruta'}
                etiquetaDe={b => etiquetaBus(b, edadBus(b))}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
