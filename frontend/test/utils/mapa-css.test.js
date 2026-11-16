// El mapa no se oscurece con el tema oscuro. (Issue U19)
// jsdom no calcula estilos de hojas importadas, así que se comprueba el contrato en el propio CSS.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const css = readFileSync(`${import.meta.dirname}/../../src/styles/mapa.css`, 'utf8')

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

  // U14: los controles de Leaflet (z-index hasta 1000) no deben salir del mapa y tapar la barra o sus menús
  it('el mapa aísla sus capas internas para que sus controles no tapen la barra ni sus menús', () => {
    const base = css.match(/\.leaflet-container \{([^}]*)\}/)?.[1] ?? ''
    expect(base).toContain('isolation: isolate')
  })
})

describe('capas de la interfaz (z-index)', () => {
  const leer = (ruta) => readFileSync(`${import.meta.dirname}/../../src/${ruta}`, 'utf8')

  it('las capas están definidas como tokens y en orden', () => {
    const t = leer('styles/tokens.css')
    const z = Object.fromEntries([...t.matchAll(/--z-([a-z]+):\s*(\d+)/g)].map(m => [m[1], Number(m[2])]))
    expect(z.hoja).toBeLessThan(z.barra)
    expect(z.barra).toBeLessThan(z.panel)
    expect(z.panel).toBeLessThan(z.lateral)
    expect(z.lateral).toBeLessThan(z.toast)
  })

  it('ningún CSS de la app usa un z-index numérico suelto de 800 o más', () => {
    for (const f of ['components/shared/Layout.css', 'components/shared/ServidorDespertando.css',
      'components/conductor/Conductor.css', 'pages/MapaTiempoReal.css']) {
      expect(leer(f), f).not.toMatch(/z-index:\s*[89]\d\d|z-index:\s*1\d{3}/)
    }
  })
})
