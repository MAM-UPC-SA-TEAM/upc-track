import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFloppyDisk, faLock, faChevronDown, faChevronUp, faCircleCheck, faTriangleExclamation, faArrowLeft,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../hooks/useTema'
import Layout from '../components/shared/Layout'
import Campo from '../components/acceso/Campo'
import api from '../services/api'
import '../components/inicio/Talon.css'
import '../components/mapa/Mapa.css'
import '../components/listas/Listas.css'
import './Perfil.css'

// Mensaje de resultado: lo bueno se anuncia con role=status (en tinta); el error, con role=alert (en rojo).
function Resultado({ msg }) {
  if (!msg) return null
  const ok = msg.tipo === 'ok'
  return (
    <p className={`acceso-aviso ${ok ? 'acceso-aviso--ok' : ''}`} role={ok ? 'status' : 'alert'}>
      <FontAwesomeIcon icon={ok ? faCircleCheck : faTriangleExclamation} /> <span>{msg.texto}</span>
    </p>
  )
}

const CORREO_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TEMAS = [
  { valor: 'claro', texto: 'Claro' },
  { valor: 'oscuro', texto: 'Oscuro' },
  { valor: 'auto', texto: 'Automático' },
]
const USUARIO_OK = /^[a-zA-Z0-9._-]{3,20}$/ // las mismas reglas que el registro

// Configuración: aquí se EDITA (datos y contraseña). «Mi perfil» solo muestra los datos.
export default function Configuracion() {
  const { usuario, actualizarUsuario } = useAuth()
  const { preferencia: temaElegido, establecer: elegirTema } = useTema()
  const correoActual = usuario?.correo || usuario?.email || ''

  // ── Datos personales ────────────────────────────────────────
  const [formInfo, setFormInfo] = useState(() => ({
    nombre: usuario?.nombre || '', nombre_usuario: usuario?.nombre_usuario || '', correo: correoActual,
  }))
  const [erroresInfo, setErroresInfo] = useState({})
  const [guardandoInfo, setGuardandoInfo] = useState(false)
  const [msgInfo, setMsgInfo] = useState(null) // { tipo: 'ok' | 'error', texto }

  async function guardarInfo(e) {
    e.preventDefault()
    const fallos = {}
    if (!formInfo.nombre.trim()) fallos.nombre = 'El nombre no puede estar vacío.'
    if (!USUARIO_OK.test(formInfo.nombre_usuario.trim())) fallos.nombre_usuario = 'Usa de 3 a 20 caracteres: letras, números, punto, guion o guion bajo.'
    if (formInfo.correo.trim() && !CORREO_OK.test(formInfo.correo)) fallos.correo = 'Escribe un correo válido.'
    setErroresInfo(fallos)
    const primero = ['nombre', 'nombre_usuario', 'correo'].find(k => fallos[k])
    if (primero) { document.getElementById(`perfil-campo-${primero}`)?.focus(); return }

    setGuardandoInfo(true)
    setMsgInfo(null)
    try {
      const data = await api.patch('/api/usuarios/perfil', {
        nombre: formInfo.nombre,
        nombre_usuario: formInfo.nombre_usuario.trim(),
        correo: formInfo.correo,
      })
      if (actualizarUsuario && data.usuario) actualizarUsuario(data.usuario, data.token) // el servidor reemite el token
      // El servidor guarda el nombre de usuario en minúsculas: el campo muestra lo guardado, no lo escrito
      if (data.usuario?.nombre_usuario) setFormInfo(p => ({ ...p, nombre_usuario: data.usuario.nombre_usuario }))
      setMsgInfo({ tipo: 'ok', texto: 'Datos guardados.' })
    } catch (err) {
      if (err.status === 409) { // nombre de usuario ya tomado: se dice en el propio campo
        setErroresInfo({ nombre_usuario: err.message || 'Ese nombre de usuario ya está en uso.' })
        document.getElementById('perfil-campo-nombre_usuario')?.focus()
      } else {
        setMsgInfo({ tipo: 'error', texto: err.message || 'No se pudieron guardar los datos. Intenta de nuevo.' })
      }
    } finally {
      setGuardandoInfo(false)
    }
  }

  // ── Contraseña ──────────────────────────────────────────────
  const [pwdAbierta, setPwdAbierta] = useState(false)
  const [formPwd, setFormPwd] = useState({ actual: '', nueva: '', confirmar: '' })
  const [erroresPwd, setErroresPwd] = useState({})
  const [verPwd, setVerPwd] = useState(false)
  const [guardandoPwd, setGuardandoPwd] = useState(false)
  const [msgPwd, setMsgPwd] = useState(null)

  async function cambiarPassword(e) {
    e.preventDefault()
    const fallos = {}
    if (!formPwd.actual) fallos.actual = 'Escribe tu contraseña actual.'
    if (!formPwd.nueva) fallos.nueva = 'Escribe la nueva contraseña.'
    else if (formPwd.nueva.length < 8) fallos.nueva = 'Mínimo 8 caracteres.'
    if (formPwd.nueva !== formPwd.confirmar) fallos.confirmar = 'Las contraseñas nuevas no coinciden.'
    setErroresPwd(fallos)
    const primero = ['actual', 'nueva', 'confirmar'].find(k => fallos[k])
    if (primero) { document.getElementById(`perfil-pwd-${primero}`)?.focus(); return }

    setGuardandoPwd(true)
    setMsgPwd(null)
    try {
      await api.patch('/api/usuarios/password', {
        password_actual: formPwd.actual,
        password_nueva: formPwd.nueva,
      })
      setMsgPwd({ tipo: 'ok', texto: 'Contraseña actualizada.' })
      setFormPwd({ actual: '', nueva: '', confirmar: '' })
    } catch (err) {
      setMsgPwd({ tipo: 'error', texto: err.message || 'No se pudo cambiar la contraseña. Intenta de nuevo.' })
    } finally {
      setGuardandoPwd(false)
    }
  }

  const cambiar = (setter, errores, setErrores, key) => ev => {
    setter(p => ({ ...p, [key]: ev.target.value }))
    if (errores[key]) setErrores(p => ({ ...p, [key]: '' }))
  }

  return (
    <Layout titulo="Configuración">
      <div className="lista-pagina">

        <Link to="/perfil" className="acceso-enlace">
          <FontAwesomeIcon icon={faArrowLeft} /> &nbsp;Mi perfil
        </Link>

        <section className="talon" aria-labelledby="config-datos">
          <div className="perfil-cuerpo perfil-cuerpo--form">
            <h2 id="config-datos" className="perfil-seccion">Datos personales</h2>
            <Resultado msg={msgInfo} />
            <form className="acceso-form" onSubmit={guardarInfo} noValidate>
              <Campo id="perfil-campo-nombre" label="Nombre completo" value={formInfo.nombre} error={erroresInfo.nombre}
                autoComplete="name" onChange={cambiar(setFormInfo, erroresInfo, setErroresInfo, 'nombre')} />
              <Campo id="perfil-campo-nombre_usuario" label="Nombre de usuario" value={formInfo.nombre_usuario} error={erroresInfo.nombre_usuario}
                ayuda="Con él inicias sesión. 3 a 20 caracteres: letras, números, punto, guion y guion bajo."
                autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                onChange={cambiar(setFormInfo, erroresInfo, setErroresInfo, 'nombre_usuario')} />
              <Campo id="perfil-campo-correo" label="Correo electrónico" type="email" value={formInfo.correo} error={erroresInfo.correo}
                autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false}
                onChange={cambiar(setFormInfo, erroresInfo, setErroresInfo, 'correo')} />
              <button type="submit" className="talon-accion" disabled={guardandoInfo}>
                <FontAwesomeIcon icon={faFloppyDisk} /> {guardandoInfo ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </form>
          </div>
        </section>

        <section className="talon" aria-labelledby="config-apariencia">
          <div className="perfil-cuerpo perfil-cuerpo--form">
            <h2 id="config-apariencia" className="perfil-seccion">Apariencia</h2>
            <div className="tema-opciones" role="radiogroup" aria-label="Tema">
              {TEMAS.map(t => (
                <button
                  key={t.valor}
                  type="button"
                  role="radio"
                  aria-checked={temaElegido === t.valor}
                  className={`tema-opcion ${temaElegido === t.valor ? 'tema-opcion--activa' : ''}`}
                  onClick={() => elegirTema(t.valor)}
                >
                  {t.texto}
                </button>
              ))}
            </div>
            <p className="perfil-ayuda">«Automático» sigue el modo claro u oscuro de tu teléfono.</p>
          </div>
        </section>

        <section className="talon" aria-label="Contraseña">
          <h3 className="perfil-seccion perfil-seccion--boton">
            <button type="button" className="perfil-desplegar" aria-expanded={pwdAbierta} aria-controls="perfil-pwd-form"
              onClick={() => setPwdAbierta(v => !v)}>
              <span><FontAwesomeIcon icon={faLock} /> Cambiar contraseña</span>
              <FontAwesomeIcon icon={pwdAbierta ? faChevronUp : faChevronDown} />
            </button>
          </h3>

          {pwdAbierta && (
            <form id="perfil-pwd-form" className="acceso-form perfil-cuerpo perfil-cuerpo--form" onSubmit={cambiarPassword} noValidate>
              <Resultado msg={msgPwd} />
              <Campo id="perfil-pwd-actual" label="Contraseña actual" type={verPwd ? 'text' : 'password'} value={formPwd.actual}
                error={erroresPwd.actual} autoComplete="current-password" onChange={cambiar(setFormPwd, erroresPwd, setErroresPwd, 'actual')} />
              <Campo id="perfil-pwd-nueva" label="Nueva contraseña" type={verPwd ? 'text' : 'password'} value={formPwd.nueva}
                ayuda="Mínimo 8 caracteres." error={erroresPwd.nueva} autoComplete="new-password"
                onChange={cambiar(setFormPwd, erroresPwd, setErroresPwd, 'nueva')} />
              <Campo id="perfil-pwd-confirmar" label="Confirmar nueva contraseña" type={verPwd ? 'text' : 'password'} value={formPwd.confirmar}
                error={erroresPwd.confirmar} autoComplete="new-password" onChange={cambiar(setFormPwd, erroresPwd, setErroresPwd, 'confirmar')} />
              <label className="mostrar">
                <input type="checkbox" checked={verPwd} onChange={ev => setVerPwd(ev.target.checked)} />
                Mostrar contraseñas
              </label>
              <button type="submit" className="perfil-boton-tinta" disabled={guardandoPwd}>
                <FontAwesomeIcon icon={faLock} /> {guardandoPwd ? 'Actualizando…' : 'Actualizar contraseña'}
              </button>
            </form>
          )}
        </section>

      </div>
    </Layout>
  )
}
