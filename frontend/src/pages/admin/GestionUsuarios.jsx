import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus, faPen, faTrash, faXmark, faFloppyDisk, faEye, faEyeSlash
} from '@fortawesome/free-solid-svg-icons'
import Layout from '../../components/shared/Layout'
import api from '../../services/api'
import './GestionUsuarios.css'

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null) // null | 'crear' | 'editar'
  const [form, setForm] = useState({ nombre: '', nombre_usuario: '', correo: '', password: '', tipo_usuario: 'estudiante', activo: true })
  const [editandoId, setEditandoId] = useState(null)
  const [verPassword, setVerPassword] = useState(false)

  async function cargar() {
    try {
      const data = await api.get('/api/usuarios')
      setUsuarios(data.usuarios || [])
    } catch {
      console.error('Error cargando usuarios')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  function abrirCrear() {
    setForm({ nombre: '', nombre_usuario: '', correo: '', password: '', tipo_usuario: 'estudiante', activo: true })
    setEditandoId(null)
    setVerPassword(false)
    setModal('crear')
  }

  function abrirEditar(usuario) {
    setForm({
      nombre:         usuario.nombre,
      nombre_usuario: usuario.nombre_usuario || '',
      correo:         usuario.correo,
      password:       '',
      tipo_usuario:   usuario.tipo_usuario,
      activo:         usuario.activo === 1 || usuario.activo === true,
    })
    setEditandoId(usuario.id_usuario)
    setVerPassword(false)
    setModal('editar')
  }

  function cerrarModal() {
    setModal(null)
    setEditandoId(null)
  }

  async function guardar() {
    if (!form.nombre || !form.correo) return
    try {
      if (modal === 'crear') {
        await api.post('/api/usuarios', form)
      } else {
        await api.patch(`/api/usuarios/${editandoId}`, form)
      }
      cerrarModal()
      cargar()
    } catch (err) {
      alert(err.message || 'Error al guardar')
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return
    try {
      await api.delete(`/api/usuarios/${id}`)
      cargar()
    } catch (err) {
      alert(err.message || 'Error al eliminar')
    }
  }

  function textoRol(rol) {
    if (rol === 'admin') return 'Administrador'
    if (rol === 'conductor') return 'Conductor'
    return 'Estudiante'
  }

  return (
    <Layout titulo="Gestión de usuarios">
      <div className="gestion-page">
        <div className="gestion-header">
          <h2 className="gestion-titulo">Gestión de usuarios</h2>
          <button className="gestion-btn-agregar" onClick={abrirCrear}>
            <FontAwesomeIcon icon={faPlus} /> Agregar usuario
          </button>
        </div>

        {cargando ? (
          <p className="gestion-cargando">Cargando usuarios...</p>
        ) : (
          <>
            <div className="gestion-tabla-wrap">
              <table className="gestion-tabla">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Usuario</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id_usuario}>
                      <td className="celda-nombre">{u.nombre}</td>
                      <td className="celda-usuario">{u.nombre_usuario || '—'}</td>
                      <td className="celda-correo">{u.correo}</td>
                      <td>{textoRol(u.tipo_usuario)}</td>
                      <td>
                        <span className={`estado-badge ${u.activo ? 'estado--activo' : 'estado--inactivo'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="celda-acciones">
                        <button className="btn-accion btn-accion--editar" onClick={() => abrirEditar(u)}>
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button className="btn-accion btn-accion--eliminar" onClick={() => eliminar(u.id_usuario)}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="gestion-conteo">Mostrando 1 a {usuarios.length} de {usuarios.length} usuarios</p>
          </>
        )}

        {/* Modal */}
        {modal && (
          <div className="modal-overlay" onClick={cerrarModal}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{modal === 'crear' ? 'Agregar usuario' : 'Editar usuario'}</h3>
                <button className="modal-cerrar" onClick={cerrarModal}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-campo">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="modal-campo">
                  <label>Nombre de usuario</label>
                  <input
                    type="text"
                    value={form.nombre_usuario}
                    onChange={e => setForm({ ...form, nombre_usuario: e.target.value })}
                    placeholder="ej. juan.perez"
                  />
                </div>
                <div className="modal-campo">
                  <label>Correo</label>
                  <input
                    type="email"
                    value={form.correo}
                    onChange={e => setForm({ ...form, correo: e.target.value })}
                    placeholder="correo@unicesar.edu.co"
                  />
                </div>
                <div className="modal-campo">
                  <label>
                    {modal === 'crear' ? 'Contraseña' : 'Nueva contraseña'}
                    {modal === 'editar' && (
                      <span style={{ fontWeight: 'normal', fontSize: '0.8em', marginLeft: '6px', opacity: 0.6 }}>
                        (dejar vacío para no cambiar)
                      </span>
                    )}
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={verPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder={modal === 'crear' ? 'Mínimo 8 caracteres' : '••••••••'}
                      style={{ paddingRight: '2.5rem', width: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={() => setVerPassword(v => !v)}
                      style={{
                        position: 'absolute', right: '0.6rem',
                        background: 'none', border: 'none',
                        cursor: 'pointer', color: 'var(--color-texto-secundario, #666)',
                        padding: '0.2rem', lineHeight: 1,
                      }}
                      tabIndex={-1}
                    >
                      <FontAwesomeIcon icon={verPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>
                <div className="modal-campo">
                  <label>Rol</label>
                  <select
                    value={form.tipo_usuario}
                    onChange={e => setForm({ ...form, tipo_usuario: e.target.value })}
                  >
                    <option value="estudiante">Estudiante</option>
                    <option value="conductor">Conductor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="modal-campo">
                  <label>Estado</label>
                  <select
                    value={form.activo ? 'true' : 'false'}
                    onChange={e => setForm({ ...form, activo: e.target.value === 'true' })}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
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
      </div>
    </Layout>
  )
}