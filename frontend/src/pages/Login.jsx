import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser, faLock, faEye, faEyeSlash,
  faRightToBracket, faShield
} from '@fortawesome/free-solid-svg-icons'
import logoUpc from '../assets/logo-upc.png'
import logoBus from '../assets/logo-bus.jpeg'
import './Login.css'

export default function Login() {
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')

    if (!nombreUsuario || !password) {
      setError('Completa todos los campos')
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
    <div className="login-bg">
      <div className="login-deco login-deco--tl" />
      <div className="login-deco login-deco--br" />

      <div className="login-card">
        {/* Logo UPC */}
        <div className="login-logo">
          <img src={logoUpc} alt="Universidad Popular del Cesar" />
        </div>

        <div className="login-divider" />

        {/* Ilustración */}
        <div className="login-ilustracion">
          <img src={logoBus} alt="Sistema de monitoreo" />
        </div>

        <h1 className="login-titulo">Sistema de Monitoreo de Rutas</h1>
        <p className="login-subtitulo">Universidad Popular del Cesar</p>

        <div className="login-divider" />

        {/* Formulario */}
        <form onSubmit={handleLogin} className="login-form">
          <div className="login-campo">
            <label>Usuario</label>
            <div className="login-input-wrap">
              <FontAwesomeIcon icon={faUser} className="login-input-icon" />
              <input
                type="text"
                placeholder="Ingrese su nombre de usuario"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="login-campo">
            <label>Contraseña</label>
            <div className="login-input-wrap">
              <FontAwesomeIcon icon={faLock} className="login-input-icon" />
              <input
                type={verPassword ? 'text' : 'password'}
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-toggle-pass"
                onClick={() => setVerPassword(!verPassword)}
              >
                <FontAwesomeIcon icon={verPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={cargando}>
            <FontAwesomeIcon icon={faRightToBracket} />
            {cargando ? 'Ingresando...' : 'ACCEDER'}
          </button>
        </form>

        <p className="login-link">
          ¿No tienes cuenta?{' '}
          <span className="login-link--verde" onClick={() => navigate('/registro')}>
            Regístrate aquí
          </span>
        </p>

        <div className="login-footer">
          <FontAwesomeIcon icon={faShield} className="login-footer-icono" />
          <p>© Universidad Popular del Cesar – Seccional Aguachica 2026</p>
        </div>
      </div>
    </div>
  )
}