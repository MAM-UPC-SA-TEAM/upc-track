import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBus, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/shared/Layout'
import api from '../services/api'
import socket from '../services/socket'
import { distanciaKm, formatearETA } from '../utils/calcularETA'
import './Buses.css'

export default function Buses() {
  const [buses, setBuses] = useState([])
  const [cargando, setCargando] = useState(true)
  const paradasRef = useRef([])
  const navigate = useNavigate()

  function calcularEtaBus(bus, paradasRuta) {
    if (!bus || bus.lat == null || bus.lng == null) return '--'
    if (!paradasRuta || paradasRuta.length === 0) return '--'

    let menorDistancia = Infinity
    for (const parada of paradasRuta) {
      if (parada.lat == null || parada.lng == null) continue
      if (parada.activa === false || parada.activa === 0) continue
      const d = distanciaKm(Number(bus.lat), Number(bus.lng), Number(parada.lat), Number(parada.lng))
      if (d < menorDistancia) menorDistancia = d
    }

    if (!Number.isFinite(menorDistancia)) return '--'

    const velocidadKmH = 25
    const etaMinutos = Math.round((menorDistancia / velocidadKmH) * 60)
    return formatearETA(etaMinutos)
  }

  function aplicarEta(listaBuses, listaParadas) {
    return listaBuses.map((bus) => {
      const paradasRuta = listaParadas.filter((p) => Number(p.id_ruta) === Number(bus.id_ruta))
      return {
        ...bus,
        eta: calcularEtaBus(bus, paradasRuta),
      }
    })
  }

  async function cargarBusesYParadas() {
    const [dataBuses, dataParadas] = await Promise.all([
      api.get('/api/buses/activos'),
      api.get('/api/paradas'),
    ])

    const listaBuses = (dataBuses.buses || []).map((b) => ({
      ...b,
      lat: b.lat == null ? null : Number(b.lat),
      lng: b.lng == null ? null : Number(b.lng),
    }))

    const listaParadas = dataParadas.paradas || []

    paradasRef.current = listaParadas
    setBuses(aplicarEta(listaBuses, listaParadas))
  }

  useEffect(() => {
    async function cargar() {
      try {
        await cargarBusesYParadas()
      } catch {
        console.error('Error cargando buses')
        setBuses([])
        paradasRef.current = []
      } finally {
        setCargando(false)
      }
    }
    cargar()

    // Actualizar estado en tiempo real
    socket.on('bus:estado', ({ id_bus, estado }) => {
      setBuses(prev => {
        const actualizados = prev
          .map(b => (b.id_bus === id_bus ? { ...b, estado } : b))
          .filter(b => b.estado !== 'fuera_de_servicio')
        return aplicarEta(actualizados, paradasRef.current)
      })
    })

    socket.on('bus:location', ({ id_bus, lat, lng }) => {
      setBuses(prev => {
        const actualizados = prev.map(b =>
          b.id_bus === id_bus ? { ...b, lat: Number(lat), lng: Number(lng) } : b
        )
        return aplicarEta(actualizados, paradasRef.current)
      })
    })

    return () => {
      socket.off('bus:estado')
      socket.off('bus:location')
    }
  }, [])

  function infoEstado(estado) {
    if (estado === 'en_recorrido')      return { texto: 'En recorrido',      clase: 'badge--verde' }
    if (estado === 'detenido')          return { texto: 'Detenido',          clase: 'badge--amarillo' }
    if (estado === 'fuera_de_servicio') return { texto: 'Fuera de servicio', clase: 'badge--rojo' }
    return { texto: 'Sin señal', clase: 'badge--gris' }
  }

  return (
    <Layout titulo="Buses disponibles">
      <div className="buses-page">
        <h2 className="buses-titulo">Buses disponibles</h2>

        {cargando ? (
          <p className="buses-cargando">Cargando buses...</p>
        ) : (
          <div className="buses-lista">
            {buses.map(bus => {
              const { texto, clase } = infoEstado(bus.estado)
              const activo = bus.estado !== 'fuera_de_servicio'
              return (
                <div
                  key={bus.id_bus}
                  className={`bus-item ${!activo ? 'bus-item--inactivo' : ''}`}
                  onClick={() => navigate(`/mapa?bus=${bus.id_bus}`)}
                >
                  <div className={`bus-icono ${!activo ? 'bus-icono--inactivo' : ''}`}>
                    <FontAwesomeIcon icon={faBus} />
                  </div>

                  <div className="bus-info">
                    <span className="bus-nombre">{bus.nombre}</span>
                    <span className="bus-ruta">Ruta: {bus.nombre_ruta}</span>
                    <span className={`bus-badge ${clase}`}>{texto}</span>
                    <span className="bus-eta">
                      Llegada estimada: {bus.eta || '--'}
                    </span>
                  </div>

                  <FontAwesomeIcon icon={faChevronRight} className="bus-flecha" />
                </div>
              )
            })}

            {buses.length === 0 && (
              <div className="buses-vacio">
                <FontAwesomeIcon icon={faBus} />
                <p>No hay buses disponibles</p>
              </div>
            )}
          </div>
        )}

        <button className="buses-btn-todos">
          Ver todos los buses
        </button>
      </div>
    </Layout>
  )
}