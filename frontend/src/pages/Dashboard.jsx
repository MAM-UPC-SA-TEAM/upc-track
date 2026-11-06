import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/shared/Layout'
import TalonETA from '../components/inicio/TalonETA'
import AvisoConductor from '../components/inicio/AvisoConductor'
import api from '../services/api'
import socket from '../services/socket'
import { calcularETA } from '../utils/calcularETA'
import './Dashboard.css'
import { MapContainer, Polyline, Marker, CircleMarker, Tooltip } from 'react-leaflet'
import L from 'leaflet'

const FRESCO_MAX_S = 30        // meta del charter: posición visible actualizada en ≤ 30 s
const FALLOS_PARA_ANULAR = 2   // un sondeo fallido no anula el dato: dos seguidos sí
const AVISO_VIGENCIA_MIN = 90  // un aviso del conductor deja de mostrarse tras 90 min
const CLAVE_PARADA = 'upctrack.miParada'

const iconoBus = L.divIcon({ className: '', html: '<span class="mk mk-bus"></span>', iconSize: [28, 28], iconAnchor: [14, 14] })
const iconoParada = L.divIcon({ className: '', html: '<span class="mk mk-parada"></span>', iconSize: [22, 22], iconAnchor: [11, 11] })

const num = v => Number.parseFloat(v)

export default function Dashboard() {
  const navigate = useNavigate()

  const [busesActivos, setBusesActivos] = useState([])
  const [paradas, setParadas]           = useState([])
  const [cargando, setCargando]         = useState(true)
  const [tardando, setTardando]         = useState(false)
  const [fallos, setFallos]             = useState(0)
  const [enLinea, setEnLinea]           = useState(() => navigator.onLine)
  const [recibidoEn, setRecibidoEn]     = useState(() => Date.now())
  const [ahora, setAhora]               = useState(() => Date.now())
  const [aviso, setAviso]               = useState(null)
  const [miParadaId, setMiParadaId]     = useState(() => {
    try { return Number(localStorage.getItem(CLAVE_PARADA)) || null } catch { return null }
  })

  const cargandoRef = useRef(false)
  const refrescoPendienteRef = useRef(null)
  const ultimoRefrescoRef = useRef(0)

  async function cargarEstado() {
    if (cargandoRef.current) return
    cargandoRef.current = true
    try {
      const [respBuses, respRutas] = await Promise.all([api.get('/api/buses/activos'), api.get('/api/rutas')])
      const listaBuses = Array.isArray(respBuses) ? respBuses : (respBuses.buses || [])
      const listaRutas = Array.isArray(respRutas) ? respRutas : (respRutas.rutas || [])

      const enRuta = listaBuses.filter(b => b.estado === 'en_recorrido' && b.lat && b.lng)
      const rutasActivas = listaRutas.filter(r => r.activa === 1 || r.activa === true)
      const rutaEnOp = rutasActivas.find(r => enRuta.some(b => b.id_ruta === r.id_ruta)) || rutasActivas[0] || null

      setBusesActivos(enRuta)
      setRecibidoEn(Date.now())
      setFallos(0)

      if (rutaEnOp?.id_ruta) {
        try {
          const resp = await api.get(`/api/paradas?ruta_id=${rutaEnOp.id_ruta}`)
          const lista = (Array.isArray(resp) ? resp : resp.paradas || [])
            .filter(p => p.lat && p.lng)
            .sort((a, b) => (a.orden || 0) - (b.orden || 0))
          setParadas(lista)
        } catch { /* se conservan las paradas anteriores */ }
      }
    } catch {
      setFallos(f => f + 1) // se conservan los últimos datos: el talón los anula con sello en vez de borrarlos
    } finally {
      cargandoRef.current = false
      setCargando(false)
    }
  }

  async function cargarAviso() {
    try {
      const data = await api.get('/api/notificaciones')
      const lista = Array.isArray(data) ? data : (data.notificaciones || [])
      if (lista[0]) setAviso(lista[0])
    } catch { /* el aviso es opcional */ }
  }

  useEffect(() => {
    cargarEstado()
    cargarAviso()
    const poll = setInterval(cargarEstado, 10_000)
    const reloj = setInterval(() => setAhora(Date.now()), 1000)
    const espera = setTimeout(() => setTardando(true), 4000)
    return () => { clearInterval(poll); clearInterval(reloj); clearTimeout(espera) }
  }, [])

  useEffect(() => {
    const subir = () => { setEnLinea(true); cargarEstado() }
    const bajar = () => setEnLinea(false)
    window.addEventListener('online', subir)
    window.addEventListener('offline', bajar)
    return () => { window.removeEventListener('online', subir); window.removeEventListener('offline', bajar) }
  }, [])

  useEffect(() => {
    function refrescar(delay = 300) {
      if (Date.now() - ultimoRefrescoRef.current < 2500) return
      clearTimeout(refrescoPendienteRef.current)
      refrescoPendienteRef.current = setTimeout(() => { ultimoRefrescoRef.current = Date.now(); cargarEstado() }, delay)
    }
    const alEstado = () => refrescar(200)
    const alConectar = () => refrescar(0)
    const alAviso = n => setAviso(n)

    if (!socket.connected) socket.connect()
    socket.on('bus:estado', alEstado)
    socket.on('connect', alConectar)
    socket.on('notificacion:nueva', alAviso)
    return () => {
      clearTimeout(refrescoPendienteRef.current)
      socket.off('bus:estado', alEstado)
      socket.off('connect', alConectar)
      socket.off('notificacion:nueva', alAviso)
    }
  }, [])

  const parada = paradas.find(p => p.id_parada === miParadaId) || paradas[0] || null

  const calculo = useMemo(() => {
    if (!parada || busesActivos.length === 0) return null
    const buses = busesActivos.map(b => ({ ...b, lat: num(b.lat), lng: num(b.lng) }))
    const c = calcularETA({ lat: num(parada.lat), lng: num(parada.lng) }, buses)
    return c.etaMinutos == null ? null : c
  }, [parada, busesActivos])

  // Frescura: edad medida por el servidor al recibirla + lo que ha pasado desde entonces en este teléfono
  const edad = calculo?.busCercano
    ? (Number(calculo.busCercano.edad_segundos) || 0) + Math.max(0, (ahora - recibidoEn) / 1000)
    : null

  // Un dato solo se anula cuando de verdad envejeció o cuando fallaron dos sondeos seguidos;
  // un tropiezo de red de unos segundos no debe hacer parpadear el talón.
  const sinRed = !enLinea || fallos > 0
  let fase = 'vivo'
  if (cargando) fase = 'cargando'
  else if (!calculo) fase = sinRed ? 'sin-red-vacio' : 'sin-buses'
  else if (sinRed && (edad > FRESCO_MAX_S || fallos >= FALLOS_PARA_ANULAR)) fase = 'sin-red'
  else if (edad > FRESCO_MAX_S) fase = 'viejo'

  const avisoVigente = aviso && (ahora - new Date(aviso.fecha_hora).getTime()) / 60000 < AVISO_VIGENCIA_MIN ? aviso : null

  // Mapa esquemático: la ruta, las paradas y el bus sobre papel; sin teselas de calles
  const puntosRuta = paradas.map(p => [num(p.lat), num(p.lng)])
  const busCerca = calculo?.busCercano
  const hayMapa = puntosRuta.length > 0
  const hayBus = Boolean(busCerca)
  const encuadre = useMemo(() => {
    const pts = [...puntosRuta]
    if (busCerca) pts.push([busCerca.lat, busCerca.lng])
    return pts.length > 1 ? L.latLngBounds(pts) : null
    // se reencuadra al cambiar el conjunto de paradas o al aparecer el primer bus, no en cada posición nueva
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paradas.length, hayBus])

  function elegirParada(id) {
    setMiParadaId(id)
    try { localStorage.setItem(CLAVE_PARADA, String(id)) } catch { /* sin almacenamiento */ }
  }

  return (
    <Layout titulo="UpcTrack">
      <div className="inicio">
        <TalonETA
          fase={fase}
          parada={parada}
          paradas={paradas}
          onParada={elegirParada}
          minutos={calculo?.etaMinutos ?? null}
          bus={busCerca}
          distanciaKm={calculo?.distanciaKmVal ?? null}
          edad={edad}
          frescoMax={FRESCO_MAX_S}
          recibidoEn={recibidoEn}
          tardando={tardando}
          onMapa={() => navigate('/mapa')}
          onRutas={() => navigate('/rutas')}
          onReintentar={cargarEstado}
        />

        <AvisoConductor aviso={avisoVigente} />

        {hayMapa && (
          <Link to="/mapa" className="inicio-mapa" aria-label="Abrir el mapa en tiempo real">
            <MapContainer
              key={`${paradas.length}-${hayBus}`}
              {...(encuadre
                ? { bounds: encuadre, boundsOptions: { padding: [40, 40] } }
                : { center: [num(paradas[0].lat), num(paradas[0].lng)], zoom: 15 })}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false}
              touchZoom={false} keyboard={false} attributionControl={false}
            >
              {puntosRuta.length > 1 && <Polyline positions={puntosRuta} className="ruta-verde" color="#1e6b2e" weight={5} />}
              {paradas.filter(p => p.id_parada !== parada?.id_parada).map(p => (
                <CircleMarker key={p.id_parada} center={[num(p.lat), num(p.lng)]} radius={5}
                  pathOptions={{ color: '#14261a', weight: 2, fillColor: '#fbfaf4', fillOpacity: 1 }} />
              ))}
              {parada && (
                <Marker position={[num(parada.lat), num(parada.lng)]} icon={iconoParada}>
                  <Tooltip permanent direction="bottom" offset={[0, 10]} className="etiqueta-mapa">Tu parada</Tooltip>
                </Marker>
              )}
              {busCerca && (
                <Marker position={[busCerca.lat, busCerca.lng]} icon={iconoBus}>
                  <Tooltip permanent direction="top" offset={[0, -12]} className="etiqueta-mapa">{busCerca.nombre}</Tooltip>
                </Marker>
              )}
            </MapContainer>
          </Link>
        )}

        <nav className="inicio-enlaces" aria-label="Más">
          <Link to="/rutas">Ver rutas</Link>
          <Link to="/buses">Ver buses</Link>
        </nav>
      </div>
    </Layout>
  )
}
