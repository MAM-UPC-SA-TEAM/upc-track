import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import './Acceso.css'

// Campo de formulario con su etiqueta ligada (for/id), ayuda siempre visible y error con icono.
// Ayuda y error se anuncian con aria-describedby; el error no depende del color.
// `control="select"` lo vuelve un selector (los hijos son las <option>).
export default function Campo({ id, label, ayuda, error, type = 'text', control = 'input', children, ...resto }) {
  // El error reemplaza a la ayuda: dicen lo mismo y no deben leerse dos veces
  const idAyuda = ayuda && !error ? `${id}-ayuda` : null
  const idError = error ? `${id}-error` : null
  const Control = control
  return (
    <div className="campo">
      <label htmlFor={id}>{label}</label>
      <Control
        id={id}
        type={control === 'input' ? type : undefined}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[idAyuda, idError].filter(Boolean).join(' ') || undefined}
        {...resto}
      >
        {children}
      </Control>
      {idAyuda && <p id={idAyuda} className="campo-ayuda">{ayuda}</p>}
      {error && (
        <p id={idError} className="campo-error">
          <FontAwesomeIcon icon={faTriangleExclamation} /> <span>{error}</span>
        </p>
      )}
    </div>
  )
}
