import LogoTema from '../shared/LogoTema'
import logoUpc from '../../assets/logo-upc-aguachica.png'
import logoUpcOscuro from '../../assets/logo-upc-aguachica-oscuro.png'
import '../inicio/Talon.css'
import './Acceso.css'

// Marco de las pantallas de acceso (login y registro): el mismo talón de la app.
// Cabo con la marca → perforación → formulario. El logo de la universidad va al pie.
export default function AccesoLayout({ titulo, subtitulo, children }) {
  return (
    <main className="acceso">
      <section className="talon acceso-talon" aria-labelledby="acceso-titulo">
        <div className="talon-cuerpo acceso-marca">
          <LogoTema className="acceso-mark" claro="/brand/upc-track-mark.png" oscuro="/brand/upc-track-mark-oscuro.png" alt="" width="72" height="72" />
          <div>
            <p className="acceso-nombre">UpcTrack</p>
            <p className="acceso-lema">Tu ruta en tiempo real</p>
          </div>
        </div>

        <div className="talon-perf" aria-hidden="true" />

        <div className="acceso-cuerpo">
          <div>
            <h1 id="acceso-titulo" className="acceso-titulo">{titulo}</h1>
            {subtitulo && <p className="acceso-subtitulo">{subtitulo}</p>}
          </div>
          {children}
        </div>
      </section>

      <footer className="acceso-pie">
        <LogoTema claro={logoUpc} oscuro={logoUpcOscuro} alt="Universidad Popular del Cesar, Seccional Aguachica" height="52" />
      </footer>
    </main>
  )
}
