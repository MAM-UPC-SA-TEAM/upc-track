import { useEffect, useId, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { usePresencia } from '../../hooks/usePresencia'
import { DURACION_SALIDA_MS } from '../../utils/movimiento'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import './Admin.css'

// Diálogo modal NATIVO (<dialog>): el navegador atrapa el foco, cierra con Esc y lo devuelve a quien lo abrió.
// Es el único caso donde un modal se justifica: un formulario que bloquea la lista mientras se edita.
// Los hijos solo se montan mientras está abierto (el estado del formulario vive en la página).
// Tocar el fondo o pulsar Esc con cambios sin guardar NO cierra: pide confirmar el descarte (sin cambios, cierra).
// «✕» y «Cancelar» son decisiones explícitas y cierran directamente.
// Entra escalando desde el centro (un modal no tiene botón de origen) y sale más rápido; mientras sale se muestra
// lo último que tuvo abierto, porque la página ya vació su formulario.
const CAMPOS = 'input, select, textarea'
const valores = d => JSON.stringify(
  [...d.querySelectorAll(CAMPOS)].map(c => (c.type === 'checkbox' || c.type === 'radio' ? c.checked : c.value))
)

export default function DialogoForm({ abierto, titulo, onCerrar, ancho = false, children }) {
  const ref = useRef(null)
  const inicial = useRef('')
  const idTitulo = useId()
  const [confirmando, setConfirmando] = useState(false)
  const { montado, saliendo } = usePresencia(abierto, DURACION_SALIDA_MS)

  // Contenido «congelado» para la salida (patrón de React: derivar estado de props durante el render)
  const [vista, setVista] = useState({ titulo, children })
  if (abierto && (vista.titulo !== titulo || vista.children !== children)) setVista({ titulo, children })

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (montado && !d.open) {
      d.showModal()
      // El foco va al primer campo del formulario; en una confirmación, al primer botón del pie («Cancelar», lo seguro)
      d.querySelector('.dialogo-cuerpo input, .dialogo-cuerpo select, .dialogo-pie button')?.focus()
      inicial.current = valores(d) // lo que había al abrir: contra esto se miden los cambios
    }
    if (!montado && d.open) d.close()
  }, [montado])

  useEffect(() => () => setConfirmando(false), [abierto])

  // Fondo o Esc: con cambios sin guardar se pide confirmar; sin cambios se cierra
  function intentarCerrar() {
    if (saliendo) return
    const d = ref.current
    if (d && valores(d) !== inicial.current) setConfirmando(true)
    else onCerrar()
  }

  return (
    <dialog
      ref={ref}
      className={`dialogo ${ancho ? 'dialogo--ancho' : ''}`}
      aria-labelledby={idTitulo}
      data-saliendo={saliendo ? '' : undefined}
      onClose={onCerrar}
      onCancel={e => { e.preventDefault(); intentarCerrar() }} // Esc
      onClick={e => { if (e.target === e.currentTarget) intentarCerrar() }} // clic en el fondo
    >
      {montado && (
        <div className="dialogo-hoja">
          <div className="dialogo-cabecera">
            <h2 id={idTitulo} className="dialogo-titulo">{vista.titulo}</h2>
            <button type="button" className="dialogo-cerrar" onClick={onCerrar} aria-label="Cerrar">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
          {confirmando && (
            <div className="dialogo-descartar" role="alertdialog" aria-label="Cambios sin guardar">
              <p>Tienes cambios sin guardar.</p>
              <div className="dialogo-descartar-acciones">
                <button type="button" className="boton-contorno" autoFocus onClick={() => setConfirmando(false)}>Seguir editando</button>
                <button type="button" className="boton-tinta" onClick={onCerrar}>Descartar</button>
              </div>
            </div>
          )}
          {vista.children}
        </div>
      )}
    </dialog>
  )
}
