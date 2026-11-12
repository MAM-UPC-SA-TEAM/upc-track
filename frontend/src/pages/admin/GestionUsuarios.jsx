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

const FORM_VACIO = { nombre: '', nombre_usuario: '', correo: '', password: '', tipo_usuario: 'estudiante', activo: true }
const ROLES = { admin: 'Administrador', conductor: 'Conductor', estudiante: 'Estudiante' }
const USUARIO_OK = /^[a-zA-Z0-9._-]{3,20}$/
const CORREO_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const esActivo = u => u.activo === 1 || u.activo === true

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [fase, setFase] = useState('cargando') // cargando | error | ok
  const [dialogo, setDialogo] = useState(null) // null | 'crear' | 'editar'
  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [verPassword, setVerPassword] = useState(false)
  const [porEliminar, setPorEliminar] = useState(null)
  const [errorEliminar, setErrorEliminar] = useState('')
  const [eliminando, setEliminando] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const data = await api.get('/api/usuarios')
      setUsuarios(data.usuarios || [])
      setFase('ok')
    } catch {
      setFase('error') // un fallo de red no se disfraza de «no hay usuarios»
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
    setVerPassword(false)
    setDialogo('crear')
  }

  function abrirEditar(u) {
    setForm({
      nombre: u.nombre,
      nombre_usuario: u.nombre_usuario || '',
      correo: u.correo,
      password: '',
      tipo_usuario: u.tipo_usuario,
      activo: esActivo(u),
    })
    setEditandoId(u.id_usuario)
    setErrores({})
    setErrorServidor('')
    setVerPassword(false)
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
    if (!form.nombre.trim()) fallos.nombre = 'El nombre es obligatorio.'
    if (form.nombre_usuario.trim() && !USUARIO_OK.test(form.nombre_usuario)) fallos.nombre_usuario = 'Solo letras, números, punto, guion y guion bajo (3 a 20).'
    if (!form.correo.trim()) fallos.correo = 'El correo es obligatorio.'
    else if (!CORREO_OK.test(form.correo)) fallos.correo = 'Escribe un correo válido.'
    if (dialogo === 'crear' && !form.password) fallos.password = 'La contraseña es obligatoria.'
    else if (form.password && form.password.length < 8) fallos.password = 'Mínimo 8 caracteres.'
    setErrores(fallos)
    const primero = ['nombre', 'nombre_usuario', 'correo', 'password'].find(k => fallos[k])
    if (primero) { document.getElementById(`usr-${primero}`)?.focus(); return }

    setGuardando(true)
    setErrorServidor('')
    try {
      if (dialogo === 'crear') await api.post('/api/usuarios', form)
      else await api.patch(`/api/usuarios/${editandoId}`, form)
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
      await api.delete(`/api/usuarios/${porEliminar.id_usuario}`)
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
    { titulo: 'Nombre', celda: u => u.nombre },
    { titulo: 'Usuario', celda: u => u.nombre_usuario || '—' },
    { titulo: 'Correo', celda: u => u.correo, romper: true },
    { titulo: 'Rol', celda: u => ROLES[u.tipo_usuario] || 'Estudiante' },
    {
      titulo: 'Estado',
      celda: u => (
        <span className={`etiqueta etiqueta--neutro ${esActivo(u) ? '' : 'etiqueta--apagada'}`}>
          {esActivo(u) ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ]

  const acciones = u => (
    <>
      <button type="button" className="boton-contorno" aria-label={`Editar ${u.nombre}`} onClick={() => abrirEditar(u)}>Editar</button>
      <button type="button" className="boton-contorno" aria-label={`Eliminar ${u.nombre}`}
        onClick={() => { setErrorEliminar(''); setPorEliminar(u) }}>Eliminar</button>
    </>
  )

  const hayLista = fase === 'ok' && usuarios.length > 0

  return (
    <Layout titulo="Gestión de usuarios">
      <div className="adm-pagina">
        <div className="adm-barra">
          <h2 className="lista-titulo">{fase === 'ok' ? `${usuarios.length} ${usuarios.length === 1 ? 'usuario' : 'usuarios'}` : 'Usuarios'}</h2>
          <button type="button" className="boton-verde" onClick={abrirCrear}>
            <FontAwesomeIcon icon={faPlus} /> Agregar usuario
          </button>
        </div>

        {hayLista ? (
          <TablaAdmin etiqueta="Usuarios" columnas={columnas} filas={usuarios} idDe={u => u.id_usuario} acciones={acciones} />
        ) : (
          <EstadoLista
            fase={fase === 'ok' ? 'vacio' : fase}
            etiquetaCarga="Buscando usuarios…"
            vacio={{ titulo: 'Sin usuarios', texto: 'Todavía no hay cuentas. Agrega la primera.' }}
            onReintentar={reintentar}
          />
        )}

        <DialogoForm abierto={Boolean(dialogo)} titulo={dialogo === 'crear' ? 'Agregar usuario' : 'Editar usuario'} onCerrar={cerrar}>
          <form className="dialogo-form" onSubmit={guardar} noValidate>
            <div className="dialogo-cuerpo">
              {errorServidor && (
                <p className="acceso-aviso" role="alert">
                  <FontAwesomeIcon icon={faTriangleExclamation} /> <span>{errorServidor}</span>
                </p>
              )}
              <Campo id="usr-nombre" label="Nombre completo" value={form.nombre} error={errores.nombre} autoComplete="off" onChange={cambiar('nombre')} />
              <Campo id="usr-nombre_usuario" label="Nombre de usuario" value={form.nombre_usuario} error={errores.nombre_usuario}
                autoComplete="off" autoCapitalize="none" spellCheck={false} onChange={cambiar('nombre_usuario')} />
              <Campo id="usr-correo" label="Correo" type="email" value={form.correo} error={errores.correo}
                autoComplete="off" autoCapitalize="none" spellCheck={false} onChange={cambiar('correo')} />
              <Campo id="usr-password" label={dialogo === 'crear' ? 'Contraseña' : 'Nueva contraseña'} type={verPassword ? 'text' : 'password'}
                value={form.password} error={errores.password} autoComplete="new-password"
                ayuda={dialogo === 'crear' ? 'Mínimo 8 caracteres.' : 'Déjala vacía para no cambiarla.'} onChange={cambiar('password')} />
              <label className="mostrar">
                <input type="checkbox" checked={verPassword} onChange={ev => setVerPassword(ev.target.checked)} />
                Mostrar contraseña
              </label>
              <div className="dialogo-fila">
                <Campo id="usr-rol" label="Rol" control="select" value={form.tipo_usuario} onChange={cambiar('tipo_usuario')}>
                  <option value="estudiante">Estudiante</option>
                  <option value="conductor">Conductor</option>
                  <option value="admin">Administrador</option>
                </Campo>
                <Campo id="usr-estado" label="Estado" control="select" value={form.activo ? 'true' : 'false'}
                  onChange={ev => setForm(p => ({ ...p, activo: ev.target.value === 'true' }))}>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </Campo>
              </div>
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
