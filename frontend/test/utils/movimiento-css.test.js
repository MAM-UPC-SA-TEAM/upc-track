// Contrato de las animaciones de entrada y salida (U29), leído del CSS: jsdom no las ejecuta.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { DURACION_SALIDA_MS } from '../../src/utils/movimiento'

const leer = (f) => readFileSync(`${import.meta.dirname}/../../src/${f}`, 'utf8')
const tokens = leer('styles/tokens.css')
const admin = leer('components/admin/Admin.css')
const layout = leer('components/shared/Layout.css')
const ms = (nombre) => Number(tokens.match(new RegExp(`--${nombre}:\\s*(\\d+)ms`))?.[1])

describe('tiempos', () => {
  it('la salida es más corta que la entrada y coincide con la constante de JS', () => {
    expect(ms('d-salida')).toBeLessThan(ms('d-ui'))
    expect(ms('d-salida')).toBe(DURACION_SALIDA_MS)
  })
  it('todo UI de menos de 300 ms', () => {
    expect(ms('d-ui')).toBeLessThan(300)
    expect(ms('d-toque')).toBeLessThan(200)
  })
})

describe('diálogo de administración', () => {
  it('entra y sale con la curva ease-out del sistema y desvanece el fondo', () => {
    expect(admin).toMatch(/\.dialogo\[open\]\s*\{\s*animation:\s*dialogo-entra var\(--d-ui\) var\(--ease-out\)/)
    expect(admin).toMatch(/\.dialogo\[data-saliendo\]\s*\{\s*animation:\s*dialogo-sale var\(--d-salida\) var\(--ease-out\)/)
    expect(admin).toMatch(/\.dialogo\[open\]::backdrop\s*\{\s*animation:\s*dialogo-fondo-entra/)
    expect(admin).toMatch(/\.dialogo\[data-saliendo\]::backdrop\s*\{\s*animation:\s*dialogo-fondo-sale/)
  })
  it('nada nace de scale(0): la entrada parte de 0,96', () => {
    expect(admin).toMatch(/@keyframes dialogo-entra\s*\{\s*from\s*\{\s*opacity:\s*0;\s*transform:\s*scale\(0\.96\)/)
    expect(admin + layout).not.toMatch(/scale\(0\)/)
  })
  it('un modal no declara un origen: escala desde el centro', () => {
    expect(admin).not.toMatch(/\.dialogo[^{]*\{[^}]*transform-origin/)
  })
  it('durante la salida no recibe toques', () => {
    expect(admin).toMatch(/\.dialogo\[data-saliendo\]\s*\{[^}]*pointer-events:\s*none/)
  })
})

describe('paneles de la barra', () => {
  it('tienen entrada y salida desde el mismo origen, y la salida no recibe toques', () => {
    expect(layout).toMatch(/animation:\s*panel-entra var\(--d-ui\) var\(--ease-out\)/)
    expect(layout).toMatch(/\.topbar-panel--sale\s*\{[^}]*animation:\s*panel-sale var\(--d-salida\) var\(--ease-out\)[^}]*pointer-events:\s*none/)
  })
})
