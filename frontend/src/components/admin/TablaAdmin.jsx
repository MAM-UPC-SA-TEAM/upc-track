import './Admin.css'

// Lista de administración: tabla real desde 1024 px (con panel lateral) y, en pantallas menores, una tarjeta-talón por fila.
// Las dos vistas salen de los mismos datos; la que no se ve queda con display:none (no la leen los lectores de pantalla).
// columnas: [{ titulo, celda(fila) }] — la primera es el título de la tarjeta. acciones(fila) devuelve los botones.
export default function TablaAdmin({ etiqueta, columnas, filas, idDe, acciones }) {
  const [principal, ...resto] = columnas
  return (
    <>
      <div className="adm-tabla-wrap">
        <table className="adm-tabla">
          <caption className="solo-lectura">{etiqueta}</caption>
          <thead>
            <tr>
              {columnas.map(c => <th key={c.titulo} scope="col">{c.titulo}</th>)}
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(f => (
              <tr key={idDe(f)}>
                {columnas.map((c, i) => (
                  <td key={c.titulo} className={[i === 0 && 'adm-principal', c.romper && 'adm-romper'].filter(Boolean).join(' ')}>{c.celda(f)}</td>
                ))}
                <td className="adm-acciones">{acciones(f)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="adm-tarjetas" aria-label={etiqueta}>
        {filas.map(f => (
          <li key={idDe(f)}>
            <article className="talon">
              <div className="talon-cuerpo adm-tarjeta-cabo">
                <h3 className="lista-nombre">{principal.celda(f)}</h3>
              </div>
              <div className="talon-perf" aria-hidden="true" />
              <dl className="adm-datos">
                {resto.map(c => (
                  <div key={c.titulo} className="adm-dato">
                    <dt>{c.titulo}</dt>
                    <dd>{c.celda(f)}</dd>
                  </div>
                ))}
              </dl>
              <div className="adm-acciones adm-acciones--tarjeta">{acciones(f)}</div>
            </article>
          </li>
        ))}
      </ul>
    </>
  )
}
