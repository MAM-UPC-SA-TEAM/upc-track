// Un logo con su variante para fondo oscuro. Se dibujan las dos imágenes y el CSS (base.css) deja visible la del
// tema activo: así cambia al instante con el selector de tema, sin estado en React ni recuadros de papel detrás.
// La imagen oculta (display: none) no se anuncia a los lectores de pantalla.
export default function LogoTema({ claro, oscuro, alt, className = '', ...resto }) {
  return (
    <>
      <img src={claro} alt={alt} className={`${className} logo-claro`.trim()} {...resto} />
      <img src={oscuro} alt={alt} className={`${className} logo-oscuro`.trim()} loading="lazy" {...resto} />
    </>
  )
}
