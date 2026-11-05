import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRoute, faMapLocationDot, faCircleCheck, faCircleMinus, faClock } from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/shared/Layout'
import api from '../services/api'
import './Rutas.css'


export default function Rutas() {
  const [rutas, setRutas] = useState([])
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()

  function horaCorta(hora) {
    return String(hora || '').slice(0, 5)
  }

  function obtenerTurno(horaSalida) {
    const hora = Number(String(horaSalida || '00:00').slice(0, 2))
    if (hora < 12) return { key: 'manana', label: 'Manana' }
    if (hora < 18) return { key: 'tarde', label: 'Tarde' }
    return { key: 'noche', label: 'Noche' }
  }

  useEffect(() => {
    async function cargar() {
      try {
        const [dataRutas, dataHorarios] = await Promise.all([
          api.get('/api/rutas'),
          api.get('/api/horarios'),
        ])

        const horariosPorRuta = (dataHorarios.horarios || []).reduce((acc, horario) => {
          const idRuta = Number(horario.id_ruta)
          if (!acc[idRuta]) acc[idRuta] = []
          acc[idRuta].push(horario)
          return acc
        }, {})

        Object.keys(horariosPorRuta).forEach(idRuta => {
          horariosPorRuta[idRuta].sort((a, b) => String(a.hora_salida).localeCompare(String(b.hora_salida)))
        })

        const rutasNormalizadas = dataRutas.rutas.map(r => ({
            ...r,
            activa: r.activa === 1 || r.activa === true,
            horarios: horariosPorRuta[Number(r.id_ruta)] || [],
          }))
        setRutas(rutasNormalizadas)
        
      } catch {
        console.error('Error cargando rutas')
        setRutas([])
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  function verEnMapa(idRuta) {
    navigate(`/mapa?ruta=${idRuta}`)
  }

  return (
    <Layout titulo="Rutas disponibles">
      <div className="rutas-page">
        <div className="rutas-header">
          <h2 className="rutas-titulo">Rutas disponibles</h2>
        </div>

        {cargando ? (
          <p className="rutas-cargando">Cargando rutas...</p>
        ) : (
          <div className="rutas-lista">
            {rutas.map(ruta => (
              <div key={ruta.id_ruta} className={`ruta-item ${!ruta.activa ? 'ruta-item--inactiva' : ''}`}>
                <div className="ruta-icono">
                  <FontAwesomeIcon icon={faRoute} />
                </div>

                <div className="ruta-info">
                  <span className="ruta-nombre">{ruta.nombre}</span>
                  <span className="ruta-detalle">Paradas: {ruta.num_paradas}</span>
                  <span className={`ruta-badge ${ruta.activa ? 'ruta-badge--activa' : 'ruta-badge--suspendida'}`}>
                    <FontAwesomeIcon icon={ruta.activa ? faCircleCheck : faCircleMinus} />
                    {ruta.activa ? 'Activa' : 'Suspendida'}
                  </span>

                  <div className="ruta-horarios">
                    <span className="ruta-horarios-titulo">
                      <FontAwesomeIcon icon={faClock} /> Horarios
                    </span>

                    {ruta.horarios.length > 0 ? (
                      <div className="ruta-horarios-lista">
                        {ruta.horarios.map(horario => (
                          <span
                            key={horario.id_horario}
                            className={`ruta-horario-chip ruta-horario-chip--${obtenerTurno(horario.hora_salida).key}`}
                          >
                            <strong>{obtenerTurno(horario.hora_salida).label}:</strong>{' '}
                            {horaCorta(horario.hora_salida)} - {horaCorta(horario.hora_llegada)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="ruta-horarios-vacio">Sin horarios cargados</span>
                    )}
                  </div>
                </div>

                <button
                  className="ruta-btn-mapa"
                  onClick={() => verEnMapa(ruta.id_ruta)}
                  disabled={!ruta.activa}
                >
                  <FontAwesomeIcon icon={faMapLocationDot} />
                  Ver en mapa
                </button>
              </div>
            ))}

            {rutas.length === 0 && (
              <div className="rutas-vacio">
                <FontAwesomeIcon icon={faRoute} />
                <p>No hay rutas disponibles</p>
              </div>
            )}
          </div>
        )}

        <button className="rutas-btn-todas" onClick={() => {}}>
          Ver todas las rutas
        </button>
      </div>
    </Layout>
  )
}