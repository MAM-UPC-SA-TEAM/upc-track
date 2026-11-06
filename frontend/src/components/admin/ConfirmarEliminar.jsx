import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import DialogoForm from './DialogoForm'
import '../listas/Listas.css'

// Confirmación de borrado: reemplaza a window.confirm(). El botón es de tinta, no rojo (el rojo es solo para el dato vencido);
// la palabra «Eliminar» y el nombre del elemento dejan claro qué se pierde. Los errores del servidor salen aquí, no en un alert().
export default function ConfirmarEliminar({ objetivo, detalle, error, enviando, onCancelar, onConfirmar }) {
  return (
    <DialogoForm abierto={Boolean(objetivo)} titulo="¿Eliminar?" onCerrar={onCancelar}>
      <div className="dialogo-cuerpo">
        <p>Vas a eliminar <strong>{objetivo}</strong>. {detalle || 'Esta acción no se puede deshacer.'}</p>
        {error && (
          <p className="acceso-aviso" role="alert">
            <FontAwesomeIcon icon={faTriangleExclamation} /> <span>{error}</span>
          </p>
        )}
      </div>
      <div className="dialogo-pie">
        <button type="button" className="boton-contorno" onClick={onCancelar}>Cancelar</button>
        <button type="button" className="boton-tinta" onClick={() => { if (!enviando) onConfirmar() }} aria-disabled={enviando}>
          <FontAwesomeIcon icon={faTrash} /> {enviando ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>
    </DialogoForm>
  )
}
