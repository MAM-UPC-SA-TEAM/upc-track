import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserPlus, faRightToBracket, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import AccesoLayout from '../components/acceso/AccesoLayout'
import Campo from '../components/acceso/Campo'

const CAMPOS = [
  { key: 'nombre', label: 'Nombre completo', autoComplete: 'name' },
  {
    key: 'nombre_usuario', label: 'Nombre de usuario', autoComplete: 'username',
    ayuda: '3 a 20 caracteres: letras, números, punto, guion y guion bajo.',
    autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false,
  },
  {
    key: 'correo', label: 'Correo electrónico', type: 'email', autoComplete: 'email', inputMode: 'email',
    autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false,
  },
  { key: 'password', label: 'Contraseña', secreto: true, autoComplete: 'new-password', ayuda: 'Mínimo 8 caracteres.' },
  { key: 'confirmar', label: 'Confirmar contraseña', secreto: true, autoComplete: 'new-password' },
]

export default function Registro() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({
    nombre: '', nombre_usuario: '', correo: '', password: '', confirmar: ''
  })
  const [verPassword, setVerPassword] = useState(false)
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
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorGlobal('')
    const fallos = validar()
    const primero = CAMPOS.find(c => fallos[c.key])
    if (primero) {
      document.getElementById(`reg-${primero.key}`)?.focus()
      return
    }
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

  if (exito) {
    return (
      <AccesoLayout titulo="Cuenta creada">
        <div className="acceso-exito" role="status">
          <p>Tu cuenta de estudiante quedó registrada. Ya puedes iniciar sesión.</p>
          <button type="button" className="talon-accion" onClick={() => navigate('/login')}>
            <FontAwesomeIcon icon={faRightToBracket} /> Ir a iniciar sesión
          </button>
        </div>
      </AccesoLayout>
    )
  }

  return (
    <AccesoLayout titulo="Crear cuenta" subtitulo="Regístrate como estudiante UPCSA.">
      <form onSubmit={handleSubmit} className="acceso-form" noValidate>
        {errorGlobal && (
          <p className="acceso-aviso" role="alert">
            <FontAwesomeIcon icon={faTriangleExclamation} /> <span>{errorGlobal}</span>
          </p>
        )}

        {CAMPOS.map(({ key, label, secreto, type = 'text', ...resto }) => (
          <Campo
            key={key}
            id={`reg-${key}`}
            label={label}
            type={secreto ? (verPassword ? 'text' : 'password') : type}
            value={form[key]}
            error={errores[key]}
            onChange={ev => {
              setForm(p => ({ ...p, [key]: ev.target.value }))
              if (errores[key]) setErrores(p => ({ ...p, [key]: '' }))
            }}
            {...resto}
          />
        ))}

        <label className="mostrar">
          <input type="checkbox" checked={verPassword} onChange={ev => setVerPassword(ev.target.checked)} />
          Mostrar contraseñas
        </label>

        <button type="submit" className="talon-accion" disabled={enviando}>
          <FontAwesomeIcon icon={faUserPlus} /> {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="acceso-alt">
        ¿Ya tienes cuenta? <Link className="acceso-enlace" to="/login">Iniciar sesión</Link>
      </p>
    </AccesoLayout>
  )
}
