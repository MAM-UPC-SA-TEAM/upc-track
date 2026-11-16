// Presión y foco (U28): se comprueba el contrato en el propio CSS, porque jsdom no calcula :active ni :focus-visible.
// La comprobación visual (Chromium real) se hizo con Playwright y está descrita en el PR.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'

const SRC = `${import.meta.dirname}/../../src`
const leer = (ruta) => readFileSync(`${SRC}/${ruta}`, 'utf8')
const base = leer('styles/base.css')
const regla = (css, selector) => {
  const i = css.indexOf(selector)
  return i === -1 ? '' : css.slice(css.indexOf('{', i) + 1, css.indexOf('}', i))
}

function cssDeLaApp(dir = SRC) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = `${dir}/${nombre}`
    if (statSync(ruta).isDirectory()) return nombre === 'landing' || ruta.includes('features') ? [] : cssDeLaApp(ruta)
    return nombre.endsWith('.css') ? [{ ruta, css: readFileSync(ruta, 'utf8') }] : []
  })
}

describe('presión en filas y navegación', () => {
  it('quita el destello gris del WebView', () => {
    expect(base).toMatch(/html\s*\{\s*-webkit-tap-highlight-color:\s*transparent/)
  })

  it('las filas y pestañas se tiñen al presionar y no se encogen', () => {
    const r = regla(base, 'body .bus-fila:not(:disabled):active')
    expect(r).toMatch(/background-color:\s*var\(--linea-suave\)/)
    expect(r).toMatch(/transform:\s*none/)
    expect(r).toMatch(/transition-duration:\s*0ms/) // al presionar es instantáneo; al soltar vuelve con la transición
  })

  it('la presión va con «body» delante para ganarle al hover sin depender del orden de los CSS', () => {
    for (const sel of ['body .bus-fila', 'body .hoja-fila', 'body .panel-acceso', 'body .topbar-panel-item', 'body .botnav-item', 'body .sidebar-link']) {
      expect(base, sel).toContain(sel)
    }
  })

  it('el icono de la pestaña cede bajo el dedo y se queda quieto con movimiento reducido', () => {
    expect(base).toMatch(/\.botnav-item:active svg\s*\{\s*transform:\s*scale\(0\.88\)/)
    const reducido = base.slice(base.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reducido).toMatch(/\.botnav-item:active svg\s*\{\s*transform:\s*none/)
  })

  it('los enlaces con aspecto de botón también confirman la presión', () => {
    expect(regla(base, "button:not(:disabled):active, a.boton:active")).toMatch(/scale\(0\.97\)/)
    expect(base).toMatch(/a\.boton-contorno:active/)
    expect(base).toMatch(/a\.talon-accion:active/)
  })
})

describe('foco con teclado', () => {
  it('en elementos a todo ancho el anillo va hacia adentro', () => {
    const r = regla(base, '.bus-fila:focus-visible, .hoja-fila:focus-visible')
    expect(r).toMatch(/outline-offset:\s*-3px/)
  })

  it('el anillo se ve sobre la losa verde y en el panel lateral (siempre oscuro)', () => {
    expect(base).toMatch(/\.botnav-item--activo:focus-visible\s*\{\s*outline-color:\s*var\(--sobre-verde\)/)
    expect(base).toMatch(/\.sidebar-link:focus-visible,\s*\.sidebar-logout:focus-visible\s*\{\s*outline-color:\s*#f1eedf/)
  })
})

describe('movimiento', () => {
  it('ningún CSS de la app usa «transition: all»', () => {
    for (const { ruta, css } of cssDeLaApp()) {
      expect(css, ruta).not.toMatch(/transition:\s*all/)
    }
  })

  it('no hay animaciones con ease-in (se sienten lentas al empezar)', () => {
    for (const { ruta, css } of cssDeLaApp()) {
      expect(css.replace(/ease-in-out/g, ''), ruta).not.toMatch(/\bease-in\b/)
    }
  })
})
