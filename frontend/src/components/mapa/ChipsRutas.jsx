import './Mapa.css'

// Chips de ruta. Con «Todas» cada chip lleva una muestra de su trazo: los chips hacen de leyenda.
export default function ChipsRutas({ rutas, seleccionada, onTodas, onRuta, estiloDe, mostrarMuestras, calculando }) {
  return (
    <div className="mapa-chips" role="group" aria-label="Rutas">
      {rutas.length > 1 && (
        <button className={`chip ${!seleccionada ? 'chip--activo' : ''}`} aria-pressed={!seleccionada} onClick={onTodas}>
          Todas
        </button>
      )}
      {rutas.map((r, i) => {
        const activo = seleccionada?.id_ruta === r.id_ruta
        const est = estiloDe(i)
        return (
          <button key={r.id_ruta} className={`chip ${activo ? 'chip--activo' : ''}`} aria-pressed={activo} onClick={() => onRuta(r)}>
            {mostrarMuestras && (
              <svg width="30" height="8" viewBox="0 0 30 8" aria-hidden="true">
                <line x1="1" y1="4" x2="29" y2="4" strokeWidth="4" strokeDasharray={est.dash} stroke="currentColor" />
              </svg>
            )}
            {r.nombre}
          </button>
        )
      })}
      {calculando && <span className="mapa-calculando" role="status" aria-label="Calculando la ruta" />}
    </div>
  )
}
