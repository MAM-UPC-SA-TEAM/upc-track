import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet'
import {
  faPlus,
  faPen,
  faTrash,
  faXmark,
  faFloppyDisk,
  faLocationDot,
  faClock,
} from '@fortawesome/free-solid-svg-icons'
import Layout from '../../components/shared/Layout'
import api from '../../services/api'
import './GestionRutas.css'

function MapaClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function MapaRecentrar({ center }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center)
  }, [center, map])
  return null
}

export default function GestionRutas() {
  const [rutas, setRutas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', activa: true })
  const [editandoId, setEditandoId] = useState(null)
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null)
  const [paradas, setParadas] = useState([])
  const [cargandoParadas, setCargandoParadas] = useState(false)
  const [modalParada, setModalParada] = useState(null)
  const [editandoParadaId, setEditandoParadaId] = useState(null)
  const [formParada, setFormParada] = useState({
    nombre: '',
    lat: '',
    lng: '',
    orden: '',
    activa: true,
  })
  const [horarios, setHorarios] = useState([])
  const [cargandoHorarios, setCargandoHorarios] = useState(false)
  const [modalHorario, setModalHorario] = useState(null)
  const [editandoHorarioId, setEditandoHorarioId] = useState(null)
  const [formHorario, setFormHorario] = useState({ hora_salida: '', hora_llegada: '' })
  const [direccionBusqueda, setDireccionBusqueda] = useState('')
  const [buscandoDireccion, setBuscandoDireccion] = useState(false)
  const [resultadosDireccion, setResultadosDireccion] = useState([])

  const latParada = Number(formParada.lat)
  const lngParada = Number(formParada.lng)
  const tieneCoordenadasParada = Number.isFinite(latParada) && Number.isFinite(lngParada)
  const centroMapaParada = tieneCoordenadasParada ? [latParada, lngParada] : [8.3086, -73.6194]

  async function cargar() {
    try {
      const data = await api.get('/api/rutas')
      setRutas(data.rutas || [])
    } catch {
      console.error('Error cargando rutas')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  function abrirCrear() {
    setForm({ nombre: '', descripcion: '', activa: true })
    setEditandoId(null)
    setModal('crear')
  }

  function abrirEditar(ruta) {
    setForm({
      nombre: ruta.nombre,
      descripcion: ruta.descripcion || '',
      activa: ruta.activa,
    })
    setEditandoId(ruta.id_ruta)
    setModal('editar')
  }

  function cerrarModal() {
    setModal(null)
    setEditandoId(null)
  }

  async function guardar() {
    if (!form.nombre) return

    try {
      if (modal === 'crear') {
        await api.post('/api/rutas', form)
      } else {
        await api.patch(`/api/rutas/${editandoId}`, form)
      }
      cerrarModal()
      cargar()
    } catch (err) {
      alert(err.message || 'Error al guardar')
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Estás seguro de eliminar esta ruta?')) return
    try {
      await api.delete(`/api/rutas/${id}`)
      cargar()
    } catch (err) {
      alert(err.message || 'Error al eliminar')
    }
  }

  async function cargarParadas(idRuta) {
    if (!idRuta) return
    setCargandoParadas(true)
    try {
      const data = await api.get(`/api/paradas?ruta_id=${idRuta}`)
      setParadas(data.paradas || [])
    } catch {
      setParadas([])
      alert('Error cargando paradas')
    } finally {
      setCargandoParadas(false)
    }
  }

  async function cargarHorarios(idRuta) {
    if (!idRuta) return
    setCargandoHorarios(true)
    try {
      const data = await api.get(`/api/horarios?ruta_id=${idRuta}`)
      setHorarios(data.horarios || [])
    } catch {
      setHorarios([])
      alert('Error cargando horarios')
    } finally {
      setCargandoHorarios(false)
    }
  }

  function abrirGestionParadas(ruta) {
    setRutaSeleccionada(ruta)
    setModalParada(null)
    setModalHorario(null)
    setEditandoParadaId(null)
    setEditandoHorarioId(null)
    cargarParadas(ruta.id_ruta)
    cargarHorarios(ruta.id_ruta)
  }

  function abrirCrearParada() {
    setFormParada({ nombre: '', lat: '', lng: '', orden: paradas.length + 1, activa: true })
    setEditandoParadaId(null)
    setDireccionBusqueda('')
    setResultadosDireccion([])
    setModalParada('crear')
  }

  function abrirEditarParada(parada) {
    setFormParada({
      nombre: parada.nombre,
      lat: parada.lat,
      lng: parada.lng,
      orden: parada.orden,
      activa: Boolean(parada.activa),
    })
    setEditandoParadaId(parada.id_parada)
    setDireccionBusqueda('')
    setResultadosDireccion([])
    setModalParada('editar')
  }

  function cerrarModalParada() {
    setModalParada(null)
    setEditandoParadaId(null)
    setDireccionBusqueda('')
    setResultadosDireccion([])
  }

  function seleccionarPuntoParada(lat, lng) {
    setFormParada(prev => ({
      ...prev,
      lat: Number(lat).toFixed(6),
      lng: Number(lng).toFixed(6),
    }))
  }

  function usarUbicacionActual() {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalizacion')
      return
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        seleccionarPuntoParada(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        alert('No se pudo obtener tu ubicacion. Verifica permisos del navegador.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function buscarDireccion() {
    const query = direccionBusqueda.trim()
    if (query.length < 3) {
      alert('Escribe al menos 3 caracteres para buscar una direccion')
      return
    }

    try {
      setBuscandoDireccion(true)
      const q = encodeURIComponent(`${query}, Oruro, Bolivia`)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=bo&q=${q}`)
      const data = await response.json()
      setResultadosDireccion(Array.isArray(data) ? data : [])
      if (!data || data.length === 0) {
        alert('No se encontraron resultados para esa direccion')
      }
    } catch {
      alert('No se pudo buscar la direccion. Intenta nuevamente.')
    } finally {
      setBuscandoDireccion(false)
    }
  }

  function seleccionarResultadoDireccion(item) {
    seleccionarPuntoParada(item.lat, item.lon)
  }

  async function guardarParada() {
    if (!rutaSeleccionada) return
    if (!formParada.nombre || formParada.lat === '' || formParada.lng === '' || formParada.orden === '') {
      alert('Completa todos los campos de la parada')
      return
    }

    const payload = {
      ...formParada,
      ruta_id: rutaSeleccionada.id_ruta,
    }

    try {
      if (modalParada === 'crear') {
        await api.post('/api/paradas', payload)
      } else {
        await api.patch(`/api/paradas/${editandoParadaId}`, payload)
      }
      cerrarModalParada()
      cargarParadas(rutaSeleccionada.id_ruta)
      cargar()
    } catch (err) {
      alert(err.message || 'Error guardando parada')
    }
  }

  async function eliminarParada(idParada) {
    if (!confirm('¿Eliminar esta parada?')) return
    try {
      await api.delete(`/api/paradas/${idParada}`)
      if (rutaSeleccionada) {
        cargarParadas(rutaSeleccionada.id_ruta)
      }
      cargar()
    } catch (err) {
      alert(err.message || 'Error eliminando parada')
    }
  }

  function abrirCrearHorario() {
    setFormHorario({ hora_salida: '', hora_llegada: '' })
    setEditandoHorarioId(null)
    setModalHorario('crear')
  }

  function abrirEditarHorario(horario) {
    setFormHorario({
      hora_salida: String(horario.hora_salida).slice(0, 5),
      hora_llegada: String(horario.hora_llegada).slice(0, 5),
    })
    setEditandoHorarioId(horario.id_horario)
    setModalHorario('editar')
  }

  function cerrarModalHorario() {
    setModalHorario(null)
    setEditandoHorarioId(null)
  }

  async function guardarHorario() {
    if (!rutaSeleccionada) return
    if (!formHorario.hora_salida || !formHorario.hora_llegada) {
      alert('Debes definir hora de salida y regreso')
      return
    }

    try {
      if (modalHorario === 'crear') {
        await api.post('/api/horarios', {
          ruta_id: rutaSeleccionada.id_ruta,
          hora_salida: formHorario.hora_salida,
          hora_llegada: formHorario.hora_llegada,
        })
      } else {
        await api.patch(`/api/horarios/${editandoHorarioId}`, {
          hora_salida: formHorario.hora_salida,
          hora_llegada: formHorario.hora_llegada,
        })
      }

      cerrarModalHorario()
      cargarHorarios(rutaSeleccionada.id_ruta)
    } catch (err) {
      alert(err.message || 'Error guardando horario')
    }
  }

  async function eliminarHorario(idHorario) {
    if (!confirm('¿Eliminar este horario?')) return
    try {
      await api.delete(`/api/horarios/${idHorario}`)
      if (rutaSeleccionada) {
        cargarHorarios(rutaSeleccionada.id_ruta)
      }
    } catch (err) {
      alert(err.message || 'Error eliminando horario')
    }
  }

  return (
    <Layout titulo="Gestión de rutas">
      <div className="gestion-page">
        <div className="gestion-header">
          <h2 className="gestion-titulo">Gestión de rutas</h2>
          <button className="gestion-btn-agregar" onClick={abrirCrear}>
            <FontAwesomeIcon icon={faPlus} /> Agregar ruta
          </button>
        </div>

        {cargando ? (
          <p className="gestion-cargando">Cargando rutas...</p>
        ) : (
          <>
            <div className="gestion-tabla-wrap">
              <table className="gestion-tabla">
                <thead>
                  <tr>
                    <th>Ruta</th>
                    <th>Paradas</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rutas.map(r => (
                    <tr key={r.id_ruta}>
                      <td className="celda-nombre">{r.nombre}</td>
                      <td>{r.num_paradas}</td>
                      <td>
                        <span className={`estado-badge ${r.activa ? 'estado--activo' : 'estado--inactivo'}`}>
                          {r.activa ? 'Activa' : 'Suspendida'}
                        </span>
                      </td>
                      <td className="celda-acciones">
                        <button className="btn-accion btn-accion--rutas" onClick={() => abrirGestionParadas(r)}>
                          <FontAwesomeIcon icon={faLocationDot} />
                        </button>
                        <button className="btn-accion btn-accion--editar" onClick={() => abrirEditar(r)}>
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button className="btn-accion btn-accion--eliminar" onClick={() => eliminar(r.id_ruta)}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="gestion-conteo">Mostrando 1 a {rutas.length} de {rutas.length} rutas</p>

            {rutaSeleccionada && (
              <div className="paradas-panel">
                <div className="paradas-panel-header">
                  <div>
                    <h3>Paradas de {rutaSeleccionada.nombre}</h3>
                    <p>{paradas.length} parada(s)</p>
                  </div>
                  <button className="gestion-btn-agregar" onClick={abrirCrearParada}>
                    <FontAwesomeIcon icon={faPlus} /> Agregar parada
                  </button>
                </div>

                {cargandoParadas ? (
                  <p className="gestion-cargando">Cargando paradas...</p>
                ) : paradas.length === 0 ? (
                  <p className="gestion-cargando">Esta ruta no tiene paradas registradas.</p>
                ) : (
                  <div className="gestion-tabla-wrap">
                    <table className="gestion-tabla">
                      <thead>
                        <tr>
                          <th>Parada</th>
                          <th>Coordenadas</th>
                          <th>Orden</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paradas.map(p => (
                          <tr key={p.id_parada}>
                            <td className="celda-nombre">{p.nombre}</td>
                            <td>{Number(p.lat).toFixed(5)}, {Number(p.lng).toFixed(5)}</td>
                            <td>{p.orden}</td>
                            <td>
                              <span className={`estado-badge ${p.activa ? 'estado--activo' : 'estado--inactivo'}`}>
                                {p.activa ? 'Activa' : 'Inactiva'}
                              </span>
                            </td>
                            <td className="celda-acciones">
                              <button className="btn-accion btn-accion--editar" onClick={() => abrirEditarParada(p)}>
                                <FontAwesomeIcon icon={faPen} />
                              </button>
                              <button className="btn-accion btn-accion--eliminar" onClick={() => eliminarParada(p.id_parada)}>
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {rutaSeleccionada && (
              <div className="paradas-panel">
                <div className="paradas-panel-header">
                  <div>
                    <h3>Horarios de {rutaSeleccionada.nombre}</h3>
                    <p>{horarios.length} turno(s) configurado(s)</p>
                  </div>
                  <button className="gestion-btn-agregar" onClick={abrirCrearHorario}>
                    <FontAwesomeIcon icon={faPlus} /> Agregar horario
                  </button>
                </div>

                {cargandoHorarios ? (
                  <p className="gestion-cargando">Cargando horarios...</p>
                ) : horarios.length === 0 ? (
                  <p className="gestion-cargando">No hay horarios registrados para esta ruta.</p>
                ) : (
                  <div className="gestion-tabla-wrap">
                    <table className="gestion-tabla">
                      <thead>
                        <tr>
                          <th>Hora de salida</th>
                          <th>Hora de regreso</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {horarios.map(h => (
                          <tr key={h.id_horario}>
                            <td>{String(h.hora_salida).slice(0, 5)}</td>
                            <td>{String(h.hora_llegada).slice(0, 5)}</td>
                            <td className="celda-acciones">
                              <button className="btn-accion btn-accion--editar" onClick={() => abrirEditarHorario(h)}>
                                <FontAwesomeIcon icon={faPen} />
                              </button>
                              <button className="btn-accion btn-accion--eliminar" onClick={() => eliminarHorario(h.id_horario)}>
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {modal && (
          <div className="modal-overlay" onClick={cerrarModal}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{modal === 'crear' ? 'Agregar ruta' : 'Editar ruta'}</h3>
                <button className="modal-cerrar" onClick={cerrarModal} aria-label="Cerrar" title="Cerrar">
                  <span className="modal-cerrar-texto">Cerrar</span>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-campo">
                  <label>Nombre de la ruta</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej: Centro"
                  />
                </div>
                <div className="modal-campo">
                  <label>Descripción</label>
                  <input
                    type="text"
                    value={form.descripcion}
                    onChange={e => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Descripción de la ruta"
                  />
                </div>
                <div className="modal-campo">
                  <label>Estado</label>
                  <select
                    value={form.activa ? 'true' : 'false'}
                    onChange={e => setForm({ ...form, activa: e.target.value === 'true' })}
                  >
                    <option value="true">Activa</option>
                    <option value="false">Suspendida</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button className="modal-btn modal-btn--cancelar" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button className="modal-btn modal-btn--guardar" onClick={guardar}>
                  <FontAwesomeIcon icon={faFloppyDisk} /> Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {modalParada && (
          <div className="modal-overlay">
            <div className="modal-card modal-card--parada" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{modalParada === 'crear' ? 'Agregar parada' : 'Editar parada'}</h3>
                <button className="modal-cerrar" onClick={cerrarModalParada} aria-label="Cerrar" title="Cerrar">
                  <span className="modal-cerrar-texto">Cerrar</span>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              <div className="modal-body modal-body--parada">
                <div className="modal-parada-columna modal-parada-columna--form">
                  <div className="modal-campo">
                    <label>Nombre de la parada</label>
                    <input
                      type="text"
                      value={formParada.nombre}
                      onChange={e => setFormParada({ ...formParada, nombre: e.target.value })}
                      placeholder="Ej: Bloque A"
                    />
                  </div>

                  <div className="modal-grid-2">
                    <div className="modal-campo">
                      <label>Latitud</label>
                      <input
                        type="number"
                        step="any"
                        value={formParada.lat}
                        onChange={e => setFormParada({ ...formParada, lat: e.target.value })}
                      />
                    </div>
                    <div className="modal-campo">
                      <label>Longitud</label>
                      <input
                        type="number"
                        step="any"
                        value={formParada.lng}
                        onChange={e => setFormParada({ ...formParada, lng: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="modal-grid-2">
                    <div className="modal-campo">
                      <label>Orden en la ruta</label>
                      <input
                        type="number"
                        min="1"
                        value={formParada.orden}
                        onChange={e => setFormParada({ ...formParada, orden: e.target.value })}
                      />
                    </div>
                    <div className="modal-campo">
                      <label>Estado</label>
                      <select
                        value={formParada.activa ? 'true' : 'false'}
                        onChange={e => setFormParada({ ...formParada, activa: e.target.value === 'true' })}
                      >
                        <option value="true">Activa</option>
                        <option value="false">Inactiva</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-parada-columna modal-parada-columna--mapa">
                  <div className="modal-campo">
                    <label>Seleccionar en mapa</label>
                    <div className="parada-direccion-busqueda">
                      <input
                        type="text"
                        value={direccionBusqueda}
                        onChange={e => setDireccionBusqueda(e.target.value)}
                        placeholder="Buscar direccion o referencia"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            buscarDireccion()
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="modal-btn modal-btn--guardar parada-btn-buscar"
                        onClick={buscarDireccion}
                        disabled={buscandoDireccion}
                      >
                        {buscandoDireccion ? 'Buscando...' : 'Buscar'}
                      </button>
                    </div>

                    {resultadosDireccion.length > 0 && (
                      <div className="parada-direccion-resultados">
                        {resultadosDireccion.map(item => (
                          <button
                            key={`${item.place_id}-${item.lat}-${item.lon}`}
                            type="button"
                            className="parada-direccion-item"
                            onClick={() => seleccionarResultadoDireccion(item)}
                          >
                            {item.display_name}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="parada-mapa-toolbar">
                      <button
                        type="button"
                        className="modal-btn modal-btn--cancelar parada-btn-ubicacion"
                        onClick={usarUbicacionActual}
                      >
                        Usar mi ubicacion actual
                      </button>
                      <span className="parada-mapa-ayuda">Haz clic en el mapa para fijar la parada</span>
                    </div>
                    <div className="parada-mapa-picker">
                      <MapContainer center={centroMapaParada} zoom={16} style={{ width: '100%', height: '100%' }}>
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution="© OpenStreetMap"
                        />
                        <MapaClickHandler onPick={seleccionarPuntoParada} />
                        <MapaRecentrar center={centroMapaParada} />
                        {tieneCoordenadasParada && (
                          <CircleMarker
                            center={[latParada, lngParada]}
                            radius={8}
                            pathOptions={{ color: '#fff', weight: 2, fillColor: '#1e6b2e', fillOpacity: 1 }}
                          />
                        )}
                      </MapContainer>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="modal-btn modal-btn--cancelar" onClick={cerrarModalParada}>
                  Cancelar
                </button>
                <button className="modal-btn modal-btn--guardar" onClick={guardarParada}>
                  <FontAwesomeIcon icon={faFloppyDisk} /> Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {modalHorario && (
          <div className="modal-overlay" onClick={cerrarModalHorario}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{modalHorario === 'crear' ? 'Agregar horario' : 'Editar horario'}</h3>
                <button className="modal-cerrar" onClick={cerrarModalHorario} aria-label="Cerrar" title="Cerrar">
                  <span className="modal-cerrar-texto">Cerrar</span>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-grid-2">
                  <div className="modal-campo">
                    <label>
                      <FontAwesomeIcon icon={faClock} /> Hora de salida
                    </label>
                    <input
                      type="time"
                      value={formHorario.hora_salida}
                      onChange={e => setFormHorario({ ...formHorario, hora_salida: e.target.value })}
                    />
                  </div>

                  <div className="modal-campo">
                    <label>
                      <FontAwesomeIcon icon={faClock} /> Hora de regreso
                    </label>
                    <input
                      type="time"
                      value={formHorario.hora_llegada}
                      onChange={e => setFormHorario({ ...formHorario, hora_llegada: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="modal-btn modal-btn--cancelar" onClick={cerrarModalHorario}>
                  Cancelar
                </button>
                <button className="modal-btn modal-btn--guardar" onClick={guardarHorario}>
                  <FontAwesomeIcon icon={faFloppyDisk} /> Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}