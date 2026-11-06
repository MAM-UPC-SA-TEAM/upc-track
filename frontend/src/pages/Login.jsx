import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRightToBracket, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import AccesoLayout from '../components/acceso/AccesoLayout'
import Campo from '../components/acceso/Campo'

export default function Login() {
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')

    const faltan = {}
    if (!nombreUsuario.trim()) faltan.usuario = 'Escribe tu nombre de usuario.'
    if (!password) faltan.password = 'Escribe tu contraseña.'
    setErrores(faltan)
    if (faltan.usuario || faltan.password) {
      document.getElementById(faltan.usuario ? 'login-usuario' : 'login-password')?.focus()
      return
    }

    setCargando(true)
    try {
      const data = await api.post('/api/auth/login', { nombre_usuario: nombreUsuario, password })
      login(data.token, data.usuario)

      const rol = data.usuario.tipo_usuario
      if (rol === 'admin') navigate('/admin')
      else if (rol === 'conductor') navigate('/conductor')
      else navigate('/inicio')
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas')
    } finally {
      setCargando(false)
    }
  }

  return (
    <AccesoLayout titulo="Iniciar sesión">
      <form onSubmit={handleLogin} className="acceso-form" noValidate>
        {error && (
          <p className="acceso-aviso" role="alert">
            <FontAwesomeIcon icon={faTriangleExclamation} /> <span>{error}</span>
          </p>
        )}

        <Campo
          id="login-usuario"
          label="Usuario"
          value={nombreUsuario}
          error={errores.usuario}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={e => { setNombreUsuario(e.target.value); if (errores.usuario) setErrores(p => ({ ...p, usuario: '' })) }}
        />

        <Campo
          id="login-password"
          label="Contraseña"
          type={verPassword ? 'text' : 'password'}
          value={password}
          error={errores.password}
          autoComplete="current-password"
          onChange={e => { setPassword(e.target.value); if (errores.password) setErrores(p => ({ ...p, password: '' })) }}
        />

        <label className="mostrar">
          <input type="checkbox" checked={verPassword} onChange={e => setVerPassword(e.target.checked)} />
          Mostrar contraseña
        </label>

        <button type="submit" className="talon-accion" disabled={cargando}>
          <FontAwesomeIcon icon={faRightToBracket} /> {cargando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="acceso-alt">
        ¿No tienes cuenta? <Link className="acceso-enlace" to="/registro">Crear cuenta</Link>
      </p>
    </AccesoLayout>
  )
}
