import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser, faEnvelope, faLock,
  faEye, faEyeSlash,
  faCircleCheck, faUserPlus, faShield
} from '@fortawesome/free-solid-svg-icons'
import logoUpc from '../assets/logo-upc.png'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Registro.css'

export default function Registro() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({
    nombre: '', nombre_usuario: '', correo: '', password: '', confirmar: ''
  })
  const [mostrar, setMostrar]     = useState({ password: false, confirmar: false })
  const [errores, setErrores]     = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [enviando, setEnviando]   = useState(false)
  const [exito, setExito]         = useState(false)

  function validar() {
    const e = {}
    if (!form.nombre.trim())         e.nombre         = 'El nombre es obligatorio'
    if (!form.nombre_usuario.trim()) e.nombre_usuario = 'El nombre de usuario es obligatorio'
    else if (!/^[a-zA-Z0-9._-]{3,20}$/.test(form.nombre_usuario))
                                     e.nombre_usuario = 'Solo letras, números, puntos, guiones (3-20 caracteres)'
    if (!form.correo.trim())         e.correo         = 'El correo es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
                                     e.correo         = 'Correo no válido'
    if (!form.password)              e.password       = 'La contraseña es obligatoria'
    else if (form.password.length < 8)
                                     e.password       = 'Mínimo 8 caracteres'
    if (form.password !== form.confirmar)
                                     e.confirmar      = 'Las contraseñas no coinciden'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorGlobal('')
    if (!validar()) return
    setEnviando(true)
    try {
      const data = await api.post('/api/auth/registro', {
        nombre:         form.nombre,
        nombre_usuario: form.nombre_usuario.toLowerCase(),
        correo:         form.correo,
        password:       form.password,
      })
      // Si el backend devuelve token, iniciamos sesión directo
      if (data.token) {
        login(data.token, data.usuario)
        navigate('/inicio')
      } else {
        setExito(true)
      }
    } catch (err) {
      setErrorGlobal(err.message || 'Error al crear la cuenta. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const campos = [
    { key: 'nombre',         label: 'Nombre completo',     icono: faUser,    type: 'text',     placeholder: 'Tu nombre completo'            },
    { key: 'nombre_usuario', label: 'Nombre de usuario',   icono: faUser,    type: 'text',     placeholder: 'ej. juan.perez o jperez2024'   },
    { key: 'correo',         label: 'Correo electrónico',  icono: faEnvelope,type: 'email',    placeholder: 'correo@ejemplo.com'            },
    { key: 'password',       label: 'Contraseña',          icono: faLock,    type: 'password', placeholder: 'Mínimo 8 caracteres'           },
    { key: 'confirmar',      label: 'Confirmar contraseña',icono: faLock,    type: 'password', placeholder: 'Repite tu contraseña'          },
  ]

  if (exito) {
    return (
      <div className="reg-bg">
        <div className="reg-deco reg-deco--tl" />
        <div className="reg-deco reg-deco--br" />
        <div className="reg-card">
          <div className="reg-exito">
            <div className="reg-exito-icono">
              <FontAwesomeIcon icon={faCircleCheck} />
            </div>
            <h2>¡Cuenta creada!</h2>
            <p>Tu cuenta de estudiante ha sido registrada exitosamente. Ya puedes iniciar sesión.</p>
            <button className="reg-btn reg-btn--primario" onClick={() => navigate('/login')}>
              Ir al inicio de sesión
            </button>
          </div>
          <div className="reg-footer">
            <FontAwesomeIcon icon={faShield} className="reg-footer-icono" />
            <p>© Universidad Popular del Cesar – Seccional Aguachica 2026</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="reg-bg">
      <div className="reg-deco reg-deco--tl" />
      <div className="reg-deco reg-deco--br" />

      <div className="reg-card">
        {/* Logo */}
        <div className="reg-logo">
          <img src={logoUpc} alt="Universidad Popular del Cesar" />
        </div>

        <div className="reg-divider" />

        <div className="reg-header">
          <div className="reg-header-icono">
            <FontAwesomeIcon icon={faUserPlus} />
          </div>
          <div>
            <h1 className="reg-titulo">Crear cuenta</h1>
            <p className="reg-subtitulo">Regístrate como estudiante UPCSA</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="reg-form" noValidate>

          {errorGlobal && (
            <div className="reg-alerta">{errorGlobal}</div>
          )}

          {campos.map(({ key, label, icono, type, placeholder }) => {
            const esPwd = type === 'password'
            const visible = mostrar[key]
            return (
              <div key={key} className={`reg-campo ${errores[key] ? 'reg-campo--error' : ''}`}>
                <label>{label}</label>
                <div className="reg-input-wrap">
                  <FontAwesomeIcon icon={icono} className="reg-input-icon" />
                  <input
                    type={esPwd ? (visible ? 'text' : 'password') : type}
                    placeholder={placeholder}
                    value={form[key]}
                    autoComplete={esPwd ? 'new-password' : 'off'}
                    onChange={e => {
                      setForm(p => ({ ...p, [key]: e.target.value }))
                      if (errores[key]) setErrores(p => ({ ...p, [key]: '' }))
                    }}
                  />
                  {esPwd && (
                    <button
                      type="button"
                      className="reg-toggle-pass"
                      onClick={() => setMostrar(p => ({ ...p, [key]: !p[key] }))}
                    >
                      <FontAwesomeIcon icon={visible ? faEyeSlash : faEye} />
                    </button>
                  )}
                </div>
                {errores[key] && <span className="reg-error-msg">{errores[key]}</span>}
                {key === 'password' && form.password.length > 0 && form.password.length < 8 && (
                  <span className="reg-hint">Mínimo 8 caracteres</span>
                )}
              </div>
            )
          })}

          <button type="submit" className="reg-btn reg-btn--primario reg-btn--submit" disabled={enviando}>
            <FontAwesomeIcon icon={faUserPlus} />
            {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

        </form>

        <p className="reg-link">
          ¿Ya tienes cuenta?{' '}
          <span className="reg-link--verde" onClick={() => navigate('/login')}>
            Iniciar sesión
          </span>
        </p>

        <div className="reg-footer">
          <FontAwesomeIcon icon={faShield} className="reg-footer-icono" />
          <p>© Universidad Popular del Cesar – Seccional Aguachica 2026</p>
        </div>
      </div>
    </div>
  )
}
