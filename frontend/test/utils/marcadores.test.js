// Marcadores del mapa: el bus es un glifo de bus, no un punto. (Issue U16)
import { describe, it, expect } from 'vitest'
import { iconoBus, iconoBusViejo, iconoParada } from '../../src/utils/marcadores'

describe('marcadores del mapa', () => {
  it('el bus lleva un glifo SVG de bus dentro de un área táctil de 44 px', () => {
    expect(iconoBus.options.html).toContain('<svg')
    expect(iconoBus.options.html).toContain('mk-bus')
    expect(iconoBus.options.iconSize).toEqual([44, 44])
    expect(iconoBus.options.iconAnchor).toEqual([22, 22])
  })

  it('el bus sin señal conserva el glifo y se marca como anulado', () => {
    expect(iconoBusViejo.options.html).toContain('mk-bus--viejo')
    expect(iconoBusViejo.options.html).toContain('<svg')
  })

  it('la parada elegida sigue siendo un punto sin glifo', () => {
    expect(iconoParada.options.html).toContain('mk-parada')
    expect(iconoParada.options.html).not.toContain('<svg')
  })
})
