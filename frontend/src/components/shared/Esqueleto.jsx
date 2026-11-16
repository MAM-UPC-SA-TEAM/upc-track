import { useTardando, TEXTO_DESPERTANDO } from '../../hooks/useTardando'
import '../inicio/Talon.css'
import './Esqueleto.css'

// Esqueletos de carga: repiten la forma de lo que va a aparecer, sin cambio de tamaño al llegar los datos.
// Son decorativos (aria-hidden); quien los usa pone aria-busy y un texto de estado para lectores de pantalla.
// El retraso de ~150 ms es CSS puro (Esqueleto.css): en cargas rápidas nunca llegan a verse.

/** Barra básica. `ancho` y `alto` son CSS (por defecto 100 % y 14 px). */
export function Esqueleto({ ancho, alto, className = '' }) {
  return <span className={`esq ${className}`.trim()} style={{ width: ancho, height: alto }} aria-hidden="true" />
}

/** Lugar de la cifra del ETA en el talón: mismo alto que la cifra real. */
export function EsqueletoCifra() {
  return <span className="esq esq-cifra" aria-hidden="true" />
}

/** Filas con la silueta real de una lista: título + etiqueta, y subtítulo. */
export function EsqueletoFilas({ filas = 3 }) {
  return (
    <div className="esq-filas" aria-hidden="true">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="esq-fila">
          <div className="esq-fila-cab">
            <span className="esq esq-fila-titulo" />
            <span className="esq esq-fila-etiqueta" />
          </div>
          <span className="esq esq-fila-sub" />
        </div>
      ))}
    </div>
  )
}

/** Talón de lista cargando (Buses, Rutas, Alertas, admin). */
export function EsqueletoLista({ filas = 3, etiqueta = 'Cargando…' }) {
  const tardando = useTardando()
  return (
    <section className="talon lista-estado" aria-busy="true">
      <EsqueletoFilas filas={filas} />
      <p className="solo-lectura" role="status">{tardando ? TEXTO_DESPERTANDO : etiqueta}</p>
      {tardando && <p className="talon-vacio" aria-hidden="true">{TEXTO_DESPERTANDO}</p>}
    </section>
  )
}

/** Hoja de datos (Perfil, Configuración): cabo con nombre y rol, perforación y renglones clave/valor. */
export function EsqueletoHoja({ renglones = 3, etiqueta = 'Cargando…' }) {
  const tardando = useTardando()
  return (
    <div className="lista-pagina esq-pagina" aria-busy="true">
      <section className="talon">
        <div className="talon-cuerpo esq-hoja-cabo" aria-hidden="true">
          <span className="esq esq-hoja-nombre" />
          <span className="esq esq-hoja-rol" />
        </div>
        <div className="talon-perf" aria-hidden="true" />
        <div className="esq-hoja-cuerpo" aria-hidden="true">
          {Array.from({ length: renglones }, (_, i) => (
            <div key={i} className="esq-hoja-renglon">
              <span className="esq esq-hoja-clave" />
              <span className="esq esq-hoja-valor" />
            </div>
          ))}
        </div>
        <p className="solo-lectura" role="status">{tardando ? TEXTO_DESPERTANDO : etiqueta}</p>
      </section>
    </div>
  )
}

/** Mapa cargando: papel claro con la barra de chips arriba y la hoja inferior, sin texto suelto. */
export function EsqueletoMapa() {
  const tardando = useTardando()
  return (
    <div className="esq-mapa" aria-busy="true">
      <div className="esq-mapa-chips" aria-hidden="true">
        <span className="esq esq-chip" /><span className="esq esq-chip" /><span className="esq esq-chip esq-chip--corto" />
      </div>
      <div className="esq-mapa-hoja talon" aria-hidden="true">
        <div className="talon-cuerpo">
          <span className="esq esq-hoja-valor" />
          <span className="esq esq-cifra esq-cifra--hoja" />
        </div>
        <div className="talon-perf" />
        <EsqueletoFilas filas={1} />
      </div>
      <p className="solo-lectura" role="status">{tardando ? TEXTO_DESPERTANDO : 'Cargando el mapa…'}</p>
      {tardando && <p className="esq-mapa-aviso">{TEXTO_DESPERTANDO}</p>}
    </div>
  )
}
