import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { faRoute } from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/shared/Layout'
import EstadoLista from '../components/listas/EstadoLista'
import api from '../services/api'
import socket from '../services/socket'
import { useAlReanudar } from '../hooks/useCicloVida'
import { distanciaKm, formatearETA } from '../utils/calcularETA'
import { busViejo, etiquetaBus } from '../utils/estadoBus'
import '../components/mapa/Mapa.css'
import '../components/listas/Listas.css'
import './Buses.css'

const VELOCIDAD_KMH = 25 // ETA por distancia en línea recta (se dice en pantalla)
const ahoraMs = () => Date.now() // se llama desde manejadores, nunca al renderizar

// Tiempo estimado a la parada activa más cercana de la ruta del bus (línea recta), o null
function etaParadaCercana(bus, paradas) {
  if (bus.lat == null || bus.lng == null) return null
  let menor = Infinity
  for (const p of paradas) {
    if (Number(p.id_ruta) !== Number(bus.id_ruta)) continue
    if (p.lat == null || p.lng == null || p.activa === false || p.activa === 0) continue
    const d = distanciaKm(Number(bus.lat), Number(bus.lng), Number(p.lat), Number(p.lng))
    if (d < menor) menor = d
  }
  return Number.isFinite(menor) ? Math.round((menor / VELOCIDAD_KMH) * 60) : null
}

export default function Buses() {
  const [buses, setBuses] = useState([])
  const [paradas, setParadas] = useState([])
  const [fase, setFase] = useState('cargando') // cargando | error | ok
  const [ahora, setAhora] = useState(ahoraMs)

  const cargar = useCallback(async () => {
    try {
      const [dataBuses, dataParadas] = await Promise.all([
        api.get('/api/buses/activos'),
        api.get('/api/paradas'),
      ])
      const t = ahoraMs()
      setBuses((dataBuses.buses || []).map(b => ({
        ...b,
        lat: b.lat == null ? null : Number(b.lat),
        lng: b.lng == null ? null : Number(b.lng),
        // el servidor dice hace cuántos segundos llegó la última posición
        recibidoMs: t - (Number(b.edad_segundos) || 0) * 1000,
      })))
      setParadas(dataParadas.paradas || [])
      setFase('ok')
    } catch {
      setFase('error') // un fallo de red no se disfraza de «no hay buses»
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos remotos
    cargar()

    // Manejadores propios: off(evento) sin función quitaría también los de otras pantallas
    const alCambiarEstado = ({ id_bus, estado }) => {
      setBuses(prev => prev
        .map(b => (b.id_bus === id_bus ? { ...b, estado } : b))
        .filter(b => b.estado !== 'fuera_de_servicio'))
    }
    const alLlegarPosicion = ({ id_bus, lat, lng }) => {
      setBuses(prev => prev.map(b =>
        b.id_bus === id_bus ? { ...b, lat: Number(lat), lng: Number(lng), recibidoMs: ahoraMs() } : b))
    }
    socket.on('bus:estado', alCambiarEstado)
    socket.on('bus:location', alLlegarPosicion)
    return () => {
      socket.off('bus:estado', alCambiarEstado)
      socket.off('bus:location', alLlegarPosicion)
    }
  }, [cargar])

  // Al volver de segundo plano se recarga la lista (los eventos perdidos no se reenvían)
  useAlReanudar(cargar)

  // Reloj de 1 s para la antigüedad del dato (solo mientras hay buses)
  const hayBuses = buses.length > 0
  useEffect(() => {
    if (!hayBuses) return undefined
    const t = setInterval(() => setAhora(ahoraMs()), 1000)
    return () => clearInterval(t)
  }, [hayBuses])

  function reintentar() {
    setFase('cargando')
    cargar()
  }

  return (
    <Layout titulo="Buses disponibles">
      <div className="lista-pagina">
        {fase !== 'ok' || !hayBuses ? (
          <EstadoLista
            fase={fase === 'ok' ? 'vacio' : fase}
            etiquetaCarga="Buscando buses…"
            vacio={{ titulo: 'Sin bus ahora', texto: 'Ningún bus transmite en este momento. Revisa los horarios de las rutas.' }}
            accion={{ to: '/rutas', texto: 'Ver rutas y horarios', icono: faRoute }}
            onReintentar={reintentar}
          />
        ) : (
          <>
            <h2 className="lista-titulo">{buses.length} {buses.length === 1 ? 'bus' : 'buses'} en ruta</h2>

            <section className="talon" aria-label="Buses en ruta">
              <ul className="lista-filas">
                {buses.map(bus => {
                  const edad = Math.max(0, (ahora - bus.recibidoMs) / 1000)
                  const et = etiquetaBus(bus, edad)
                  const minutos = busViejo(bus, edad) ? null : etaParadaCercana(bus, paradas)
                  return (
                    <li key={bus.id_bus}>
                      <Link to={`/mapa?bus=${bus.id_bus}`} className="bus-fila">
                        <span className="bus-fila-cab">
                          <strong>{bus.nombre}</strong>
                          <span className={`etiqueta etiqueta--${et.tipo}`}>{et.texto}</span>
                        </span>
                        <span className="bus-fila-ruta">{bus.nombre_ruta}</span>
                        {minutos != null && (
                          <span className="dato buses-eta">Parada más cercana · {formatearETA(minutos)}</span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>

            <p className="lista-nota">Tiempo estimado por distancia en línea recta.</p>
          </>
        )}
      </div>
    </Layout>
  )
}
