import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMap, faRoute } from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/shared/Layout'
import EstadoLista from '../components/listas/EstadoLista'
import api from '../services/api'
import '../components/mapa/Mapa.css'
import '../components/listas/Listas.css'
import './Rutas.css'

const horaCorta = hora => String(hora || '').slice(0, 5)

function turnoDe(horaSalida) {
  const hora = Number(String(horaSalida || '00:00').slice(0, 2))
  if (hora < 12) return 'Mañana'
  if (hora < 18) return 'Tarde'
  return 'Noche'
}

export default function Rutas() {
  const [rutas, setRutas] = useState([])
  const [fase, setFase] = useState('cargando') // cargando | error | ok

  const cargar = useCallback(async () => {
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

      setRutas((dataRutas.rutas || []).map(r => ({
        ...r,
        activa: r.activa === 1 || r.activa === true,
        horarios: horariosPorRuta[Number(r.id_ruta)] || [],
      })))
      setFase('ok')
    } catch {
      setFase('error') // un fallo de red no se disfraza de «no hay rutas»
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos remotos
    cargar()
  }, [cargar])

  function reintentar() {
    setFase('cargando')
    cargar()
  }

  return (
    <Layout titulo="Rutas disponibles">
      <div className="lista-pagina">
        {fase !== 'ok' || rutas.length === 0 ? (
          <EstadoLista
            fase={fase === 'ok' ? 'vacio' : fase}
            etiquetaCarga="Buscando las rutas…"
            vacio={{ titulo: 'Sin rutas', texto: 'Todavía no hay rutas cargadas. Vuelve más tarde.' }}
            onReintentar={reintentar}
          />
        ) : (
          rutas.map(ruta => (
            <article key={ruta.id_ruta} className="talon" aria-labelledby={`ruta-${ruta.id_ruta}`}>
              <div className="talon-cuerpo">
                <div className="lista-cabecera">
                  <h2 id={`ruta-${ruta.id_ruta}`} className="lista-nombre">
                    <FontAwesomeIcon icon={faRoute} className="ruta-icono" /> {ruta.nombre}
                  </h2>
                  <span className={`etiqueta ${ruta.activa ? 'etiqueta--neutro' : 'etiqueta--neutro ruta-suspendida'}`}>
                    {ruta.activa ? 'Activa' : 'Suspendida'}
                  </span>
                </div>
                <p className="lista-dato dato">{ruta.num_paradas} {Number(ruta.num_paradas) === 1 ? 'parada' : 'paradas'}</p>
              </div>

              <div className="talon-perf" aria-hidden="true" />

              <div className="ruta-horarios">
                <h3 className="ruta-horarios-titulo">Horarios</h3>
                {ruta.horarios.length > 0 ? (
                  <ul className="ruta-horarios-lista">
                    {ruta.horarios.map(h => (
                      <li key={h.id_horario}>
                        <span>{turnoDe(h.hora_salida)}</span>
                        <span className="dato">{horaCorta(h.hora_salida)} – {horaCorta(h.hora_llegada)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="ruta-horarios-vacio">Sin horarios cargados.</p>
                )}
              </div>

              {ruta.activa ? (
                <Link to={`/mapa?ruta=${ruta.id_ruta}`} className="boton boton-contorno ruta-accion">
                  <FontAwesomeIcon icon={faMap} /> Ver en el mapa
                </Link>
              ) : (
                <p className="talon-nota">Ruta suspendida por ahora: no hay buses en ella.</p>
              )}
            </article>
          ))
        )}
      </div>
    </Layout>
  )
}
