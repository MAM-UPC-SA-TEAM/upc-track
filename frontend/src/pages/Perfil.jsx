import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser, faIdCard, faEnvelope, faShield,
  faLock, faPen, faFloppyDisk, faXmark,
  faEye, faEyeSlash, faCircleCheck
} from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/shared/Layout'
import api from '../services/api'
import './Perfil.css'

export default function Perfil() {
  const { usuario, actualizarUsuario } = useAuth()

  const iniciales = usuario?.nombre
    ? usuario.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  // ── Tab activa ─────────────────────────────────────────────
  const [tab, setTab] = useState('info') // 'info' | 'seguridad'

  // ── Editar info básica ──────────────────────────────────────
  const [editando, setEditando] = useState(false)
  const [formInfo, setFormInfo]   = useState({
    nombre:  usuario?.nombre  || '',
    correo:  usuario?.correo  || usuario?.email || '',
    documento: usuario?.documento || '',
  })
  const [guardandoInfo, setGuardandoInfo] = useState(false)
  const [msgInfo, setMsgInfo]           = useState(null) // { tipo, texto }

  async function guardarInfo() {
    if (!formInfo.nombre.trim()) {
      setMsgInfo({ tipo: 'error', texto: 'El nombre no puede estar vacío' })
      return
    }
    setGuardandoInfo(true)
    setMsgInfo(null)
    try {
      const data = await api.patch('/api/usuarios/perfil', {
        nombre:    formInfo.nombre,
        correo:    formInfo.correo,
        documento: formInfo.documento,
      })
      if (actualizarUsuario && data.usuario) actualizarUsuario(data.usuario)
      setMsgInfo({ tipo: 'ok', texto: 'Información actualizada correctamente' })
      setEditando(false)
    } catch (err) {
      setMsgInfo({ tipo: 'error', texto: err.message || 'Error al actualizar' })
    } finally {
      setGuardandoInfo(false)
    }
  }

  // ── Cambio de contraseña ────────────────────────────────────
  const [formPwd, setFormPwd] = useState({
    actual: '', nueva: '', confirmar: ''
  })
  const [mostrar, setMostrar]   = useState({ actual: false, nueva: false, confirmar: false })
  const [guardandoPwd, setGuardandoPwd] = useState(false)
  const [msgPwd, setMsgPwd]           = useState(null)

  async function cambiarPassword() {
    if (!formPwd.actual || !formPwd.nueva || !formPwd.confirmar) {
      setMsgPwd({ tipo: 'error', texto: 'Todos los campos son obligatorios' })
      return
    }
    if (formPwd.nueva.length < 8) {
      setMsgPwd({ tipo: 'error', texto: 'La nueva contraseña debe tener mínimo 8 caracteres' })
      return
    }
    if (formPwd.nueva !== formPwd.confirmar) {
      setMsgPwd({ tipo: 'error', texto: 'Las contraseñas nuevas no coinciden' })
      return
    }
    setGuardandoPwd(true)
    setMsgPwd(null)
    try {
      await api.patch('/api/usuarios/password', {
        password_actual: formPwd.actual,
        password_nueva:  formPwd.nueva,
      })
      setMsgPwd({ tipo: 'ok', texto: 'Contraseña actualizada correctamente' })
      setFormPwd({ actual: '', nueva: '', confirmar: '' })
    } catch (err) {
      setMsgPwd({ tipo: 'error', texto: err.message || 'Error al cambiar contraseña' })
    } finally {
      setGuardandoPwd(false)
    }
  }

  return (
    <Layout titulo="Mi perfil">
      <div className="perfil-page">

        {/* Cabecera */}
        <div className="perfil-header">
          <div className="perfil-avatar">{iniciales}</div>
          <div>
            <h2 className="perfil-nombre">{usuario?.nombre}</h2>
            <span className="perfil-rol">{usuario?.tipo_usuario}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="perfil-tabs">
          <button
            className={`perfil-tab ${tab === 'info' ? 'perfil-tab--activo' : ''}`}
            onClick={() => setTab('info')}
          >
            <FontAwesomeIcon icon={faUser} /> Información
          </button>
          <button
            className={`perfil-tab ${tab === 'seguridad' ? 'perfil-tab--activo' : ''}`}
            onClick={() => setTab('seguridad')}
          >
            <FontAwesomeIcon icon={faLock} /> Seguridad
          </button>
        </div>

        {/* ── Tab: Información ── */}
        {tab === 'info' && (
          <div className="perfil-card">
            <div className="perfil-card-header">
              <h3 className="perfil-card-titulo">Datos personales</h3>
              {!editando ? (
                <button className="perfil-btn-sec" onClick={() => { setEditando(true); setMsgInfo(null) }}>
                  <FontAwesomeIcon icon={faPen} /> Editar
                </button>
              ) : (
                <button className="perfil-btn-sec" onClick={() => { setEditando(false); setMsgInfo(null) }}>
                  <FontAwesomeIcon icon={faXmark} /> Cancelar
                </button>
              )}
            </div>

            {msgInfo && (
              <div className={`perfil-alerta perfil-alerta--${msgInfo.tipo}`}>
                {msgInfo.tipo === 'ok' && <FontAwesomeIcon icon={faCircleCheck} />}
                {msgInfo.texto}
              </div>
            )}

            <div className="perfil-campos">
              {/* Nombre */}
              <div className="perfil-campo">
                <label className="perfil-campo-label">
                  <FontAwesomeIcon icon={faUser} className="perfil-campo-icono" />
                  Nombre completo
                </label>
                {editando ? (
                  <input
                    className="perfil-input"
                    value={formInfo.nombre}
                    onChange={e => setFormInfo(p => ({ ...p, nombre: e.target.value }))}
                    placeholder="Tu nombre completo"
                  />
                ) : (
                  <div className="perfil-campo-valor">{usuario?.nombre || '—'}</div>
                )}
              </div>

              {/* Documento */}
              <div className="perfil-campo">
                <label className="perfil-campo-label">
                  <FontAwesomeIcon icon={faIdCard} className="perfil-campo-icono" />
                  Documento
                </label>
                {editando ? (
                  <input
                    className="perfil-input"
                    value={formInfo.documento}
                    onChange={e => setFormInfo(p => ({ ...p, documento: e.target.value }))}
                    placeholder="Número de documento"
                  />
                ) : (
                  <div className="perfil-campo-valor">{usuario?.documento || '—'}</div>
                )}
              </div>

              {/* Correo */}
              <div className="perfil-campo">
                <label className="perfil-campo-label">
                  <FontAwesomeIcon icon={faEnvelope} className="perfil-campo-icono" />
                  Correo electrónico
                </label>
                {editando ? (
                  <input
                    className="perfil-input"
                    type="email"
                    value={formInfo.correo}
                    onChange={e => setFormInfo(p => ({ ...p, correo: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                  />
                ) : (
                  <div className="perfil-campo-valor" style={{ textTransform: 'none' }}>
                    {usuario?.correo || usuario?.email || '—'}
                  </div>
                )}
              </div>

              {/* Rol (solo lectura) */}
              <div className="perfil-campo">
                <label className="perfil-campo-label">
                  <FontAwesomeIcon icon={faShield} className="perfil-campo-icono" />
                  Rol en el sistema
                </label>
                <div className="perfil-campo-valor">{usuario?.tipo_usuario || '—'}</div>
              </div>
            </div>

            {editando && (
              <button
                className="perfil-btn-primary"
                onClick={guardarInfo}
                disabled={guardandoInfo}
              >
                <FontAwesomeIcon icon={faFloppyDisk} />
                {guardandoInfo ? 'Guardando...' : 'Guardar cambios'}
              </button>
            )}
          </div>
        )}

        {/* ── Tab: Seguridad ── */}
        {tab === 'seguridad' && (
          <div className="perfil-card">
            <div className="perfil-card-header">
              <h3 className="perfil-card-titulo">Cambiar contraseña</h3>
            </div>

            {msgPwd && (
              <div className={`perfil-alerta perfil-alerta--${msgPwd.tipo}`}>
                {msgPwd.tipo === 'ok' && <FontAwesomeIcon icon={faCircleCheck} />}
                {msgPwd.texto}
              </div>
            )}

            <div className="perfil-campos">
              {[
                { key: 'actual',    label: 'Contraseña actual' },
                { key: 'nueva',     label: 'Nueva contraseña' },
                { key: 'confirmar', label: 'Confirmar nueva contraseña' },
              ].map(({ key, label }) => (
                <div className="perfil-campo" key={key}>
                  <label className="perfil-campo-label">
                    <FontAwesomeIcon icon={faLock} className="perfil-campo-icono" />
                    {label}
                  </label>
                  <div className="perfil-pwd-wrap">
                    <input
                      className="perfil-input perfil-input--pwd"
                      type={mostrar[key] ? 'text' : 'password'}
                      value={formPwd[key]}
                      onChange={e => setFormPwd(p => ({ ...p, [key]: e.target.value }))}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="perfil-ojo"
                      onClick={() => setMostrar(p => ({ ...p, [key]: !p[key] }))}
                    >
                      <FontAwesomeIcon icon={mostrar[key] ? faEyeSlash : faEye} />
                    </button>
                  </div>
                  {key === 'nueva' && formPwd.nueva.length > 0 && formPwd.nueva.length < 8 && (
                    <span className="perfil-hint">Mínimo 8 caracteres</span>
                  )}
                </div>
              ))}
            </div>

            <button
              className="perfil-btn-primary"
              onClick={cambiarPassword}
              disabled={guardandoPwd}
            >
              <FontAwesomeIcon icon={faLock} />
              {guardandoPwd ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </div>
        )}

      </div>
    </Layout>
  )
}
