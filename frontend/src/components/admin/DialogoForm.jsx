import { useEffect, useId, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import './Admin.css'

// Diálogo modal NATIVO (<dialog>): el navegador atrapa el foco, cierra con Esc y lo devuelve a quien lo abrió.
// Es el único caso donde un modal se justifica: un formulario que bloquea la lista mientras se edita.
// Los hijos solo se montan mientras está abierto (el estado del formulario vive en la página).
export default function DialogoForm({ abierto, titulo, onCerrar, ancho = false, children }) {
  const ref = useRef(null)
  const idTitulo = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) {
      d.showModal()
      // El foco va al primer campo del formulario; en una confirmación, al primer botón del pie («Cancelar», lo seguro)
      d.querySelector('.dialogo-cuerpo input, .dialogo-cuerpo select, .dialogo-pie button')?.focus()
    }
    if (!abierto && d.open) d.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      className={`dialogo ${ancho ? 'dialogo--ancho' : ''}`}
      aria-labelledby={idTitulo}
      onClose={onCerrar}
      onClick={e => { if (e.target === e.currentTarget) onCerrar() }} // clic en el fondo
    >
      {abierto && (
        <div className="dialogo-hoja">
          <div className="dialogo-cabecera">
            <h2 id={idTitulo} className="dialogo-titulo">{titulo}</h2>
            <button type="button" className="dialogo-cerrar" onClick={onCerrar} aria-label="Cerrar">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
