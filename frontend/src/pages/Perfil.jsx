import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPen, faXmark, faFloppyDisk, faLock, faChevronDown, faChevronUp,
  faCircleCheck, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/shared/Layout'
import Campo from '../components/acceso/Campo'
import api from '../services/api'
import '../components/inicio/Talon.css'
import '../components/mapa/Mapa.css'
import '../components/listas/Listas.css'
import './Perfil.css'

// Mensaje de resultado: lo bueno se anuncia con role=status; el error, con role=alert. Ninguno va en rojo.
function Resultado({ msg }) {
  if (!msg) return null
  const ok = msg.tipo === 'ok'
  return (
    <p className="acceso-aviso" role={ok ? 'status' : 'alert'}>
      <FontAwesomeIcon icon={ok ? faCircleCheck : faTriangleExclamation} /> <span>{msg.texto}</span>
    </p>
  )
}

const CORREO_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Perfil() {
  const { usuario, actualizarUsuario } = useAuth()
  const correoActual = usuario?.correo || usuario?.email || ''

  // ── Datos personales ────────────────────────────────────────
  const [editando, setEditando] = useState(false)
  const [formInfo, setFormInfo] = useState({ nombre: '', correo: '', documento: '' })
  const [erroresInfo, setErroresInfo] = useState({})
  const [guardandoInfo, setGuardandoInfo] = useState(false)
  const [msgInfo, setMsgInfo] = useState(null) // { tipo: 'ok' | 'error', texto }

  function abrirEdicion() {
    // Se parte siempre de los datos vigentes (el formulario no se queda con valores de antes de guardar)
    setFormInfo({ nombre: usuario?.nombre || '', correo: correoActual, documento: usuario?.documento || '' })
    setErroresInfo({})
    setMsgInfo(null)
    setEditando(true)
  }

  function cancelarEdicion() {
    setEditando(false)
    setErroresInfo({})
    setMsgInfo(null)
  }

  async function guardarInfo(e) {
    e.preventDefault()
    const fallos = {}
    if (!formInfo.nombre.trim()) fallos.nombre = 'El nombre no puede estar vacío.'
    if (formInfo.correo.trim() && !CORREO_OK.test(formInfo.correo)) fallos.correo = 'Escribe un correo válido.'
    setErroresInfo(fallos)
    const primero = ['nombre', 'correo'].find(k => fallos[k])
    if (primero) { document.getElementById(`perfil-campo-${primero}`)?.focus(); return }

    setGuardandoInfo(true)
    setMsgInfo(null)
    try {
      const data = await api.patch('/api/usuarios/perfil', {
        nombre: formInfo.nombre,
        correo: formInfo.correo,
        documento: formInfo.documento,
      })
      if (actualizarUsuario && data.usuario) actualizarUsuario(data.usuario)
      setMsgInfo({ tipo: 'ok', texto: 'Datos guardados.' })
      setEditando(false)
    } catch (err) {
      setMsgInfo({ tipo: 'error', texto: err.message || 'No se pudieron guardar los datos. Intenta de nuevo.' })
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

  const datos = [
    { clave: 'Nombre completo', valor: usuario?.nombre },
    { clave: 'Documento', valor: usuario?.documento },
    { clave: 'Correo electrónico', valor: correoActual },
  ]

  return (
    <Layout titulo="Mi perfil">
      <div className="lista-pagina">

        <section className="talon" aria-labelledby="perfil-nombre">
          <div className="talon-cuerpo perfil-cabo">
            <h2 id="perfil-nombre" className="perfil-nombre">{usuario?.nombre || 'Sin nombre'}</h2>
            <span className="etiqueta etiqueta--neutro perfil-rol">{usuario?.tipo_usuario}</span>
          </div>

          <div className="talon-perf" aria-hidden="true" />

          <div className="perfil-cuerpo">
            <div className="lista-cabecera">
              <h3 className="perfil-seccion">Datos personales</h3>
              {!editando ? (
                <button type="button" className="boton-contorno" onClick={abrirEdicion}>
                  <FontAwesomeIcon icon={faPen} /> Editar
                </button>
              ) : (
                <button type="button" className="boton-contorno" onClick={cancelarEdicion}>
                  <FontAwesomeIcon icon={faXmark} /> Cancelar
                </button>
              )}
            </div>

            <Resultado msg={msgInfo} />

            {!editando ? (
              <dl className="perfil-datos">
                {datos.map(d => (
                  <div key={d.clave} className="perfil-dato">
                    <dt>{d.clave}</dt>
                    <dd>{d.valor || <span className="perfil-sin">Sin registrar</span>}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <form className="acceso-form" onSubmit={guardarInfo} noValidate>
                <Campo id="perfil-campo-nombre" label="Nombre completo" value={formInfo.nombre} error={erroresInfo.nombre}
                  autoComplete="name" onChange={cambiar(setFormInfo, erroresInfo, setErroresInfo, 'nombre')} />
                <Campo id="perfil-campo-documento" label="Documento" value={formInfo.documento} inputMode="numeric"
                  autoComplete="off" onChange={cambiar(setFormInfo, erroresInfo, setErroresInfo, 'documento')} />
                <Campo id="perfil-campo-correo" label="Correo electrónico" type="email" value={formInfo.correo} error={erroresInfo.correo}
                  autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false}
                  onChange={cambiar(setFormInfo, erroresInfo, setErroresInfo, 'correo')} />
                <button type="submit" className="talon-accion" disabled={guardandoInfo}>
                  <FontAwesomeIcon icon={faFloppyDisk} /> {guardandoInfo ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </form>
            )}
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
