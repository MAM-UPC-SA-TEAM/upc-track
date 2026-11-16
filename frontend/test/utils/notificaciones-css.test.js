// El amarillo de una alerta nueva es solo la franja de marca, no una losa completa. (Issue U31)
// jsdom no calcula hojas importadas: se comprueba el contrato en el propio CSS.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const css = readFileSync(`${import.meta.dirname}/../../src/pages/Notificaciones.css`, 'utf8')
// Cuerpo de la regla cuyo selector empieza una línea: «.sel { ... }»
const regla = (selector) => {
  const inicio = css.indexOf(`${selector} {`)
  return inicio === -1 ? '' : css.slice(css.indexOf('{', inicio) + 1, css.indexOf('}', inicio))
}

describe('estilos de las alertas', () => {
  it('la alerta nueva no usa el amarillo como fondo', () => {
    expect(regla('.notif--nueva')).not.toMatch(/background/)
    expect(css).not.toMatch(/background:\s*var\(--amarillo\)/)
  })

  it('la alerta nueva lleva una franja amarilla arriba', () => {
    expect(regla('.notif--nueva')).toMatch(/border-top:\s*8px solid var\(--amarillo\)/)
  })
})
