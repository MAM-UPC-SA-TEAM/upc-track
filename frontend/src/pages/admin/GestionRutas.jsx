import { useCallback, useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faFloppyDisk, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import Layout from '../../components/shared/Layout'
import EstadoLista from '../../components/listas/EstadoLista'
import Campo from '../../components/acceso/Campo'
import TablaAdmin from '../../components/admin/TablaAdmin'
import DialogoForm from '../../components/admin/DialogoForm'
import ConfirmarEliminar from '../../components/admin/ConfirmarEliminar'
import FormParada from '../../components/admin/FormParada'
import api from '../../services/api'
import '../../components/mapa/Mapa.css'
import '../../components/listas/Listas.css'

const hora = h => String(h || '').slice(0, 5)
const esActiva = r => r.activa === 1 || r.activa === true
const ENDPOINT = { ruta: 'rutas', parada: 'paradas', horario: 'horarios' }

// Botones de pie comunes de los formularios de esta pantalla
function Pie({ onCerrar, guardando, texto = 'Guardar' }) {
  return (
    <div className="dialogo-pie">
      <button type="button" className="boton-contorno" onClick={onCerrar}>Cancelar</button>
      <button type="submit" className="boton-verde" aria-disabled={guardando}>
        <FontAwesomeIcon icon={faFloppyDisk} /> {guardando ? 'Guardando…' : texto}
      </button>
    </div>
  )
}

function ErrorServidor({ texto }) {
  if (!texto) return null
  return (
    <p className="acceso-aviso" role="alert">
      <FontAwesomeIcon icon={faTriangleExclamation} /> <span>{texto}</span>
    </p>
  )
}

function FormRuta({ inicial, onGuardar, onCerrar }) {
  const [form, setForm] = useState(inicial)
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    if (guardando) return
    if (!form.nombre.trim()) {
      setErrores({ nombre: 'El nombre de la ruta es obligatorio.' })
      document.getElementById('rut-nombre')?.focus()
      return
    }
    setGuardando(true)
    setErrorServidor('')
    try {
      await onGuardar(form)
    } catch (err) {
      setErrorServidor(err.message || 'No se pudo guardar. Intenta de nuevo.')
      setGuardando(false)
    }
  }

  return (
    <form className="dialogo-form" onSubmit={enviar} noValidate>
      <div className="dialogo-cuerpo">
        <ErrorServidor texto={errorServidor} />
        <Campo id="rut-nombre" label="Nombre de la ruta" value={form.nombre} error={errores.nombre} autoComplete="off"
          onChange={ev => { setForm(p => ({ ...p, nombre: ev.target.value })); setErrores({}) }} />
        <Campo id="rut-descripcion" label="Descripción" value={form.descripcion} autoComplete="off"
          onChange={ev => setForm(p => ({ ...p, descripcion: ev.target.value }))} />
        <Campo id="rut-estado" label="Estado" control="select" value={form.activa ? 'true' : 'false'}
          onChange={ev => setForm(p => ({ ...p, activa: ev.target.value === 'true' }))}>
          <option value="true">Activa</option>
          <option value="false">Suspendida</option>
        </Campo>
      </div>
      <Pie onCerrar={onCerrar} guardando={guardando} />
    </form>
  )
}

function FormHorario({ inicial, onGuardar, onCerrar }) {
  const [form, setForm] = useState(inicial)
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    if (guardando) return
    const fallos = {}
    if (!form.hora_salida) fallos.hora_salida = 'Indica la hora de salida.'
    if (!form.hora_llegada) fallos.hora_llegada = 'Indica la hora de regreso.'
    setErrores(fallos)
    const primero = ['hora_salida', 'hora_llegada'].find(k => fallos[k])
    if (primero) { document.getElementById(`hor-${primero}`)?.focus(); return }
    setGuardando(true)
    setErrorServidor('')
    try {
      await onGuardar(form)
    } catch (err) {
      setErrorServidor(err.message || 'No se pudo guardar el horario. Intenta de nuevo.')
      setGuardando(false)
    }
  }

  const cambiar = key => ev => { setForm(p => ({ ...p, [key]: ev.target.value })); setErrores(p => ({ ...p, [key]: '' })) }

  return (
    <form className="dialogo-form" onSubmit={enviar} noValidate>
      <div className="dialogo-cuerpo">
        <ErrorServidor texto={errorServidor} />
        <div className="dialogo-fila">
          <Campo id="hor-hora_salida" label="Hora de salida" type="time" value={form.hora_salida} error={errores.hora_salida} onChange={cambiar('hora_salida')} />
          <Campo id="hor-hora_llegada" label="Hora de regreso" type="time" value={form.hora_llegada} error={errores.hora_llegada} onChange={cambiar('hora_llegada')} />
        </div>
      </div>
      <Pie onCerrar={onCerrar} guardando={guardando} />
    </form>
  )
}

export default function GestionRutas() {
  const [rutas, setRutas] = useState([])
  const [fase, setFase] = useState('cargando') // cargando | error | ok
  const [seleccion, setSeleccion] = useState(null)
  const [paradas, setParadas] = useState([])
  const [faseParadas, setFaseParadas] = useState('cargando')
  const [horarios, setHorarios] = useState([])
  const [faseHorarios, setFaseHorarios] = useState('cargando')
  const [dRuta, setDRuta] = useState(null) // { modo: 'crear' | 'editar', ruta? }
  const [dParada, setDParada] = useState(null)
  const [dHorario, setDHorario] = useState(null)
  const [porEliminar, setPorEliminar] = useState(null) // { tipo, id, texto }
  const [errorEliminar, setErrorEliminar] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const encabezadoRef = useRef(null)

  const cargarRutas = useCallback(async () => {
    try {
      const data = await api.get('/api/rutas')
      const lista = data.rutas || []
      setRutas(lista)
      // La ruta elegida se refresca con sus datos nuevos; si se eliminó, el panel se cierra
      setSeleccion(prev => (prev ? lista.find(r => r.id_ruta === prev.id_ruta) || null : null))
      setFase('ok')
    } catch {
      setFase('error') // un fallo de red no se disfraza de «no hay rutas»
    }
  }, [])

  const cargarParadas = useCallback(async idRuta => {
    setFaseParadas('cargando')
    try {
      const data = await api.get(`/api/paradas?ruta_id=${idRuta}`)
      setParadas([...(data.paradas || [])].sort((a, b) => (a.orden || 0) - (b.orden || 0)))
      setFaseParadas('ok')
    } catch {
      setFaseParadas('error')
    }
  }, [])

  const cargarHorarios = useCallback(async idRuta => {
    setFaseHorarios('cargando')
    try {
      const data = await api.get(`/api/horarios?ruta_id=${idRuta}`)
      setHorarios(data.horarios || [])
      setFaseHorarios('ok')
    } catch {
      setFaseHorarios('error')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos remotos
    cargarRutas()
  }, [cargarRutas])

  const idSeleccion = seleccion?.id_ruta
  // Al elegir una ruta se llevan sus paradas y horarios a la vista y el foco al encabezado
  useEffect(() => {
    if (idSeleccion == null) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga de datos remotos al elegir la ruta
    cargarParadas(idSeleccion)
    cargarHorarios(idSeleccion)
  }, [idSeleccion, cargarParadas, cargarHorarios])

  function elegirRuta(ruta) {
    setSeleccion(ruta)
    // el panel se monta tras este render
    setTimeout(() => {
      encabezadoRef.current?.scrollIntoView({ block: 'start' })
      encabezadoRef.current?.focus()
    }, 0)
  }

  function reintentar() {
    setFase('cargando')
    cargarRutas()
  }

  // ── Guardar ──
  async function guardarRuta(form) {
    if (dRuta.modo === 'crear') await api.post('/api/rutas', form)
    else await api.patch(`/api/rutas/${dRuta.ruta.id_ruta}`, form)
    setDRuta(null)
    cargarRutas()
  }

  async function guardarParada(form) {
    const payload = { ...form, ruta_id: seleccion.id_ruta }
    if (dParada.modo === 'crear') await api.post('/api/paradas', payload)
    else await api.patch(`/api/paradas/${dParada.parada.id_parada}`, payload)
    setDParada(null)
    cargarParadas(seleccion.id_ruta)
    cargarRutas()
  }

  async function guardarHorario(form) {
    const cuerpo = { hora_salida: form.hora_salida, hora_llegada: form.hora_llegada }
    if (dHorario.modo === 'crear') await api.post('/api/horarios', { ruta_id: seleccion.id_ruta, ...cuerpo })
    else await api.patch(`/api/horarios/${dHorario.horario.id_horario}`, cuerpo)
    setDHorario(null)
    cargarHorarios(seleccion.id_ruta)
  }

  // ── Eliminar (ruta, parada u horario) ──
  async function confirmarEliminar() {
    if (eliminando) return
    setEliminando(true)
    setErrorEliminar('')
    try {
      await api.delete(`/api/${ENDPOINT[porEliminar.tipo]}/${porEliminar.id}`)
      const { tipo } = porEliminar
      setPorEliminar(null)
      if (tipo === 'ruta') cargarRutas()
      if (tipo === 'parada') { cargarParadas(seleccion.id_ruta); cargarRutas() }
      if (tipo === 'horario') cargarHorarios(seleccion.id_ruta)
    } catch (err) {
      setErrorEliminar(err.message || 'No se pudo eliminar. Intenta de nuevo.')
    } finally {
      setEliminando(false)
    }
  }

  const pedirEliminar = (tipo, id, texto) => { setErrorEliminar(''); setPorEliminar({ tipo, id, texto }) }

  // ── Tablas ──
  const columnasRutas = [
    { titulo: 'Ruta', celda: r => r.nombre },
    { titulo: 'Paradas', celda: r => <span className="mono-celda">{r.num_paradas}</span> },
    {
      titulo: 'Estado',
      celda: r => (
        <span className={`etiqueta etiqueta--neutro ${esActiva(r) ? '' : 'etiqueta--apagada'}`}>{esActiva(r) ? 'Activa' : 'Suspendida'}</span>
      ),
    },
  ]
  const accionesRuta = r => (
    <>
      <button type="button" className="boton-contorno" aria-label={`Paradas y horarios de ${r.nombre}`} onClick={() => elegirRuta(r)}>Paradas y horarios</button>
      <button type="button" className="boton-contorno" aria-label={`Editar ${r.nombre}`} onClick={() => setDRuta({ modo: 'editar', ruta: r })}>Editar</button>
      <button type="button" className="boton-contorno" aria-label={`Eliminar ${r.nombre}`} onClick={() => pedirEliminar('ruta', r.id_ruta, `la ruta ${r.nombre}`)}>Eliminar</button>
    </>
  )

  const columnasParadas = [
    { titulo: 'Parada', celda: p => p.nombre },
    { titulo: 'Coordenadas', celda: p => <span className="mono-celda">{Number(p.lat).toFixed(5)}, {Number(p.lng).toFixed(5)}</span> },
    { titulo: 'Orden', celda: p => <span className="mono-celda">{p.orden}</span> },
    {
      titulo: 'Estado',
      celda: p => (
        <span className={`etiqueta etiqueta--neutro ${p.activa ? '' : 'etiqueta--apagada'}`}>{p.activa ? 'Activa' : 'Inactiva'}</span>
      ),
    },
  ]
  const accionesParada = p => (
    <>
      <button type="button" className="boton-contorno" aria-label={`Editar la parada ${p.nombre}`} onClick={() => setDParada({ modo: 'editar', parada: p })}>Editar</button>
      <button type="button" className="boton-contorno" aria-label={`Eliminar la parada ${p.nombre}`} onClick={() => pedirEliminar('parada', p.id_parada, `la parada ${p.nombre}`)}>Eliminar</button>
    </>
  )

  const columnasHorarios = [
    { titulo: 'Hora de salida', celda: h => <span className="mono-celda">{hora(h.hora_salida)}</span> },
    { titulo: 'Hora de regreso', celda: h => <span className="mono-celda">{hora(h.hora_llegada)}</span> },
  ]
  const accionesHorario = h => (
    <>
      <button type="button" className="boton-contorno" aria-label={`Editar el horario de las ${hora(h.hora_salida)}`} onClick={() => setDHorario({ modo: 'editar', horario: h })}>Editar</button>
      <button type="button" className="boton-contorno" aria-label={`Eliminar el horario de las ${hora(h.hora_salida)}`}
        onClick={() => pedirEliminar('horario', h.id_horario, `el horario de las ${hora(h.hora_salida)}`)}>Eliminar</button>
    </>
  )

  const hayRutas = fase === 'ok' && rutas.length > 0

  return (
    <Layout titulo="Gestión de rutas">
      <div className="adm-pagina">
        <div className="adm-barra">
          <h2 className="lista-titulo">{fase === 'ok' ? `${rutas.length} ${rutas.length === 1 ? 'ruta' : 'rutas'}` : 'Rutas'}</h2>
          <button type="button" className="boton-verde" onClick={() => setDRuta({ modo: 'crear' })}>
            <FontAwesomeIcon icon={faPlus} /> Agregar ruta
          </button>
        </div>

        {hayRutas ? (
          <TablaAdmin etiqueta="Rutas" columnas={columnasRutas} filas={rutas} idDe={r => r.id_ruta} acciones={accionesRuta} />
        ) : (
          <EstadoLista
            fase={fase === 'ok' ? 'vacio' : fase}
            etiquetaCarga="Buscando rutas…"
            vacio={{ titulo: 'Sin rutas', texto: 'Todavía no hay rutas. Agrega la primera.' }}
            onReintentar={reintentar}
          />
        )}

        {seleccion && (
          <>
            <section className="adm-seccion" aria-labelledby="sec-paradas">
              <div className="adm-seccion-barra">
                <h2 id="sec-paradas" ref={encabezadoRef} tabIndex={-1} className="adm-seccion-titulo">Paradas de {seleccion.nombre}</h2>
                <button type="button" className="boton-contorno" onClick={() => setDParada({ modo: 'crear' })}>
                  <FontAwesomeIcon icon={faPlus} /> Agregar parada
                </button>
              </div>
              {faseParadas === 'ok' && paradas.length > 0 ? (
                <TablaAdmin etiqueta={`Paradas de ${seleccion.nombre}`} columnas={columnasParadas} filas={paradas} idDe={p => p.id_parada} acciones={accionesParada} />
              ) : faseParadas === 'ok' ? (
                <p className="adm-seccion-vacio">Esta ruta no tiene paradas registradas.</p>
              ) : (
                <EstadoLista fase={faseParadas} etiquetaCarga="Buscando paradas…" onReintentar={() => cargarParadas(seleccion.id_ruta)} />
              )}
            </section>

            <section className="adm-seccion" aria-labelledby="sec-horarios">
              <div className="adm-seccion-barra">
                <h2 id="sec-horarios" className="adm-seccion-titulo">Horarios de {seleccion.nombre}</h2>
                <button type="button" className="boton-contorno" onClick={() => setDHorario({ modo: 'crear' })}>
                  <FontAwesomeIcon icon={faPlus} /> Agregar horario
                </button>
              </div>
              {faseHorarios === 'ok' && horarios.length > 0 ? (
                <TablaAdmin etiqueta={`Horarios de ${seleccion.nombre}`} columnas={columnasHorarios} filas={horarios} idDe={h => h.id_horario} acciones={accionesHorario} />
              ) : faseHorarios === 'ok' ? (
                <p className="adm-seccion-vacio">No hay horarios registrados para esta ruta.</p>
              ) : (
                <EstadoLista fase={faseHorarios} etiquetaCarga="Buscando horarios…" onReintentar={() => cargarHorarios(seleccion.id_ruta)} />
              )}
            </section>
          </>
        )}

        <DialogoForm abierto={Boolean(dRuta)} titulo={dRuta?.modo === 'crear' ? 'Agregar ruta' : 'Editar ruta'} onCerrar={() => setDRuta(null)}>
          {dRuta && (
            <FormRuta
              inicial={dRuta.modo === 'editar'
                ? { nombre: dRuta.ruta.nombre, descripcion: dRuta.ruta.descripcion || '', activa: esActiva(dRuta.ruta) }
                : { nombre: '', descripcion: '', activa: true }}
              onGuardar={guardarRuta}
              onCerrar={() => setDRuta(null)}
            />
          )}
        </DialogoForm>

        <DialogoForm ancho abierto={Boolean(dParada)} titulo={dParada?.modo === 'crear' ? 'Agregar parada' : 'Editar parada'} onCerrar={() => setDParada(null)}>
          {dParada && (
            <FormParada
              modo={dParada.modo}
              inicial={dParada.modo === 'editar'
                ? { nombre: dParada.parada.nombre, lat: String(dParada.parada.lat), lng: String(dParada.parada.lng), orden: String(dParada.parada.orden), activa: Boolean(dParada.parada.activa) }
                : { nombre: '', lat: '', lng: '', orden: String(paradas.length + 1), activa: true }}
              onGuardar={guardarParada}
              onCerrar={() => setDParada(null)}
            />
          )}
        </DialogoForm>

        <DialogoForm abierto={Boolean(dHorario)} titulo={dHorario?.modo === 'crear' ? 'Agregar horario' : 'Editar horario'} onCerrar={() => setDHorario(null)}>
          {dHorario && (
            <FormHorario
              inicial={dHorario.modo === 'editar'
                ? { hora_salida: hora(dHorario.horario.hora_salida), hora_llegada: hora(dHorario.horario.hora_llegada) }
                : { hora_salida: '', hora_llegada: '' }}
              onGuardar={guardarHorario}
              onCerrar={() => setDHorario(null)}
            />
          )}
        </DialogoForm>

        <ConfirmarEliminar
          objetivo={porEliminar?.texto}
          error={errorEliminar}
          enviando={eliminando}
          onCancelar={() => setPorEliminar(null)}
          onConfirmar={confirmarEliminar}
        />
      </div>
    </Layout>
  )
}
