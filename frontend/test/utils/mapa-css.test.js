// El mapa no se oscurece con el tema oscuro. (Issue U19)
// jsdom no calcula estilos de hojas importadas, así que se comprueba el contrato en el propio CSS.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// vitest corre con la raíz del frontend como directorio de trabajo
const css = readFileSync(resolve(process.cwd(), 'src/styles/mapa.css'), 'utf8')

describe('estilos del mapa', () => {
  it('ninguna regla invierte las teselas en tema oscuro', () => {
    expect(css).not.toMatch(/data-tema='oscuro'\]\s*\.tiles-calmos/)
    expect(css).not.toMatch(/invert\(/)
  })

  it('en oscuro los tokens dentro del mapa vuelven a los valores claros', () => {
    const bloque = css.match(/body\[data-tema='oscuro'\]\s*\.leaflet-container\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(bloque).toContain('--papel: #fbfaf4')
    expect(bloque).toContain('--tinta: #14261a')
    expect(bloque).toContain('--acento-texto: #1e6b2e')
  })
})
