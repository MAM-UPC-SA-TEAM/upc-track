import { useCallback, useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faFloppyDisk, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import Layout from '../../components/shared/Layout'
import EstadoLista from '../../components/listas/EstadoLista'
import Campo from '../../components/acceso/Campo'
import TablaAdmin from '../../components/admin/TablaAdmin'
import DialogoForm from '../../components/admin/DialogoForm'
import ConfirmarEliminar from '../../components/admin/ConfirmarEliminar'
import api from '../../services/api'
import '../../components/mapa/Mapa.css'
import '../../components/listas/Listas.css'

// Un bus nuevo nace fuera de servicio: todavía no transmite ni tiene posición.
const FORM_VACIO = { nombre: '', placa: '', id_ruta: '', id_conductor: '', estado: 'fuera_de_servicio' }
const ESTADOS = { en_recorrido: 'En servicio', detenido: 'Detenido', fuera_de_servicio: 'Fuera de servicio' }

export default function GestionBuses() {
  const [buses, setBuses] = useState([])
  const [rutas, setRutas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [fase, setFase] = useState('cargando') // cargando | error | ok
  const [dialogo, setDialogo] = useState(null) // null | 'crear' | 'editar'
  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [porEliminar, setPorEliminar] = useState(null)
  const [errorEliminar, setErrorEliminar] = useState('')
  const [eliminando, setEliminando] = useState(false)

  const conductores = usuarios.filter(u => u.tipo_usuario === 'conductor' && u.activo)

  const cargar = useCallback(async () => {
    try {
      const [dataBuses, dataRutas, dataUsuarios] = await Promise.all([
        api.get('/api/buses'),
        api.get('/api/rutas'),
        api.get('/api/usuarios'),
      ])
      setBuses(dataBuses.buses || [])
      setRutas(dataRutas.rutas || [])
      setUsuarios(dataUsuarios.usuarios || [])
      setFase('ok')
    } catch {
      setFase('error') // un fallo de red no se disfraza de «no hay buses»
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

  function abrirCrear() {
    setForm(FORM_VACIO)
    setEditandoId(null)
    setErrores({})
    setErrorServidor('')
    setDialogo('crear')
  }

  function abrirEditar(bus) {
    setForm({
      nombre: bus.nombre,
      placa: bus.placa,
      id_ruta: bus.id_ruta || '',
      id_conductor: bus.id_conductor || '',
      estado: bus.estado,
    })
    setEditandoId(bus.id_bus)
    setErrores({})
    setErrorServidor('')
    setDialogo('editar')
  }

  function cerrar() {
    setDialogo(null)
    setEditandoId(null)
  }

  async function guardar(e) {
    e.preventDefault()
    if (guardando) return
    const fallos = {}
    if (!form.nombre.trim()) fallos.nombre = 'El nombre del bus es obligatorio.'
    if (!form.placa.trim()) fallos.placa = 'La placa es obligatoria.'
    setErrores(fallos)
    const primero = ['nombre', 'placa'].find(k => fallos[k])
    if (primero) { document.getElementById(`bus-${primero}`)?.focus(); return }

    setGuardando(true)
    setErrorServidor('')
    try {
      if (dialogo === 'crear') await api.post('/api/buses', form)
      else await api.patch(`/api/buses/${editandoId}`, form)
      cerrar()
      cargar()
    } catch (err) {
      setErrorServidor(err.message || 'No se pudo guardar. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  async function confirmarEliminar() {
    if (eliminando) return
    setEliminando(true)
    setErrorEliminar('')
    try {
      await api.delete(`/api/buses/${porEliminar.id_bus}`)
      setPorEliminar(null)
      cargar()
    } catch (err) {
      setErrorEliminar(err.message || 'No se pudo eliminar. Intenta de nuevo.')
    } finally {
      setEliminando(false)
    }
  }

  const cambiar = key => ev => {
    setForm(p => ({ ...p, [key]: ev.target.value }))
    if (errores[key]) setErrores(p => ({ ...p, [key]: '' }))
  }

  const columnas = [
    { titulo: 'Bus', celda: b => b.nombre },
    { titulo: 'Placa', celda: b => <span className="mono-celda">{b.placa}</span> },
    { titulo: 'Ruta asignada', celda: b => b.nombre_ruta || 'Sin ruta' },
    { titulo: 'Conductor', celda: b => b.nombre_conductor || 'Sin conductor' },
    {
      titulo: 'Estado',
      celda: b => (
        <span className={`etiqueta etiqueta--neutro ${b.estado === 'fuera_de_servicio' ? 'etiqueta--apagada' : ''}`}>
          {ESTADOS[b.estado] || 'Fuera de servicio'}
        </span>
      ),
    },
  ]

  const acciones = b => (
    <>
      <button type="button" className="boton-contorno" aria-label={`Editar ${b.nombre}`} onClick={() => abrirEditar(b)}>Editar</button>
      <button type="button" className="boton-contorno" aria-label={`Eliminar ${b.nombre}`}
        onClick={() => { setErrorEliminar(''); setPorEliminar(b) }}>Eliminar</button>
    </>
  )

  const hayLista = fase === 'ok' && buses.length > 0

  return (
    <Layout titulo="Gestión de buses">
      <div className="adm-pagina">
        <div className="adm-barra">
          <h2 className="lista-titulo">{fase === 'ok' ? `${buses.length} ${buses.length === 1 ? 'bus' : 'buses'}` : 'Buses'}</h2>
          <button type="button" className="boton-verde" onClick={abrirCrear}>
            <FontAwesomeIcon icon={faPlus} /> Agregar bus
          </button>
        </div>

        {hayLista ? (
          <TablaAdmin etiqueta="Buses" columnas={columnas} filas={buses} idDe={b => b.id_bus} acciones={acciones} />
        ) : (
          <EstadoLista
            fase={fase === 'ok' ? 'vacio' : fase}
            etiquetaCarga="Buscando buses…"
            vacio={{ titulo: 'Sin buses', texto: 'Todavía no hay buses. Agrega el primero.' }}
            onReintentar={reintentar}
          />
        )}

        <DialogoForm abierto={Boolean(dialogo)} titulo={dialogo === 'crear' ? 'Agregar bus' : 'Editar bus'} onCerrar={cerrar}>
          <form className="dialogo-form" onSubmit={guardar} noValidate>
            <div className="dialogo-cuerpo">
              {errorServidor && (
                <p className="acceso-aviso" role="alert">
                  <FontAwesomeIcon icon={faTriangleExclamation} /> <span>{errorServidor}</span>
                </p>
              )}
              <Campo id="bus-nombre" label="Nombre del bus" value={form.nombre} error={errores.nombre} autoComplete="off" onChange={cambiar('nombre')} />
              <Campo id="bus-placa" label="Placa" value={form.placa} error={errores.placa} autoComplete="off" autoCapitalize="characters"
                spellCheck={false} onChange={cambiar('placa')} />
              <Campo id="bus-ruta" label="Ruta asignada" control="select" value={form.id_ruta} onChange={cambiar('id_ruta')}>
                <option value="">Sin ruta</option>
                {rutas.map(r => <option key={r.id_ruta} value={r.id_ruta}>{r.nombre}</option>)}
              </Campo>
              <Campo id="bus-conductor" label="Conductor asignado" control="select" value={form.id_conductor} onChange={cambiar('id_conductor')}>
                <option value="">Sin conductor</option>
                {conductores.map(c => <option key={c.id_usuario} value={c.id_usuario}>{c.nombre}</option>)}
              </Campo>
              <Campo id="bus-estado" label="Estado" control="select" value={form.estado} onChange={cambiar('estado')}>
                <option value="en_recorrido">En servicio</option>
                <option value="detenido">Detenido</option>
                <option value="fuera_de_servicio">Fuera de servicio</option>
              </Campo>
            </div>
            <div className="dialogo-pie">
              <button type="button" className="boton-contorno" onClick={cerrar}>Cancelar</button>
              <button type="submit" className="boton-verde" aria-disabled={guardando}>
                <FontAwesomeIcon icon={faFloppyDisk} /> {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </DialogoForm>

        <ConfirmarEliminar
          objetivo={porEliminar?.nombre}
          error={errorEliminar}
          enviando={eliminando}
          onCancelar={() => setPorEliminar(null)}
          onConfirmar={confirmarEliminar}
        />
      </div>
    </Layout>
  )
}
