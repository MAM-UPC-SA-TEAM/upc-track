import { describe, it, expect, vi, beforeEach } from 'vitest'

const statusBar = vi.hoisted(() => ({
  setStyle: vi.fn(() => Promise.resolve()),
  setBackgroundColor: vi.fn(() => Promise.resolve()),
}))
vi.mock('@capacitor/status-bar', () => ({ StatusBar: statusBar, Style: { Light: 'LIGHT', Dark: 'DARK' } }))

// tema.js lee esNativa del módulo de plataforma: se reimporta con cada valor
async function cargarTema(nativa) {
  vi.resetModules()
  vi.doMock('../../src/utils/platform', () => ({ esNativa: nativa }))
  return import('../../src/utils/tema')
}

beforeEach(() => {
  localStorage.clear()
  document.body.removeAttribute('data-tema')
  document.head.innerHTML = '<meta name="theme-color" content="#000">'
  statusBar.setStyle.mockClear()
  statusBar.setBackgroundColor.mockClear()
})

describe('temaInicialOscuro', () => {
  it('usa el tema guardado «oscuro»', async () => {
    localStorage.setItem('tema', 'oscuro')
    expect((await cargarTema(false)).temaInicialOscuro()).toBe(true)
  })
  it('usa el tema guardado «claro» aunque el sistema sea oscuro', async () => {
    localStorage.setItem('tema', 'claro')
    window.matchMedia = vi.fn(() => ({ matches: true }))
    expect((await cargarTema(false)).temaInicialOscuro()).toBe(false)
  })
  it('sin elegir nada arranca en claro, aunque el teléfono esté en oscuro', async () => {
    window.matchMedia = vi.fn(() => ({ matches: true }))
    expect((await cargarTema(false)).temaInicialOscuro()).toBe(false)
  })
  it('«auto» sigue al teléfono', async () => {
    localStorage.setItem('tema', 'auto')
    window.matchMedia = vi.fn(() => ({ matches: true }))
    expect((await cargarTema(false)).temaInicialOscuro()).toBe(true)
    window.matchMedia = vi.fn(() => ({ matches: false }))
    expect((await cargarTema(false)).temaInicialOscuro()).toBe(false)
  })
  it('si el almacenamiento falla, arranca en claro', async () => {
    window.matchMedia = vi.fn(() => ({ matches: true }))
    const espia = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado') })
    expect((await cargarTema(false)).temaInicialOscuro()).toBe(false)
    espia.mockRestore()
  })
})

describe('aplicarTema', () => {
  it('en web fija data-tema y theme-color, sin tocar la barra nativa', async () => {
    (await cargarTema(false)).aplicarTema(true)
    expect(document.body.dataset.tema).toBe('oscuro')
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe('#111b21')
    expect(statusBar.setStyle).not.toHaveBeenCalled()
  })
  it('tema claro usa el color de papel claro', async () => {
    (await cargarTema(false)).aplicarTema(false)
    expect(document.body.dataset.tema).toBe('claro')
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe('#fbfaf4')
  })
  it('en la app nativa también ajusta la barra de estado', async () => {
    (await cargarTema(true)).aplicarTema(true)
    expect(statusBar.setStyle).toHaveBeenCalledWith({ style: 'DARK' })
    expect(statusBar.setBackgroundColor).toHaveBeenCalledWith({ color: '#111b21' })
  })
  it('en nativa con tema claro usa Style.Light', async () => {
    (await cargarTema(true)).aplicarTema(false)
    expect(statusBar.setStyle).toHaveBeenCalledWith({ style: 'LIGHT' })
  })
})

describe('preferencia de tema (U33)', () => {
  it('lee solo valores válidos; cualquier otra cosa es «claro»', async () => {
    const t = await cargarTema(false)
    expect(t.leerPreferenciaTema()).toBe('claro')
    for (const v of ['claro', 'oscuro', 'auto']) { localStorage.setItem('tema', v); expect(t.leerPreferenciaTema()).toBe(v) }
    localStorage.setItem('tema', 'azul')
    expect(t.leerPreferenciaTema()).toBe('claro')
  })
  it('guarda la preferencia', async () => {
    (await cargarTema(false)).guardarPreferenciaTema('auto')
    expect(localStorage.getItem('tema')).toBe('auto')
  })
  it('esOscuro: «oscuro» siempre, «claro» nunca y «auto» según el teléfono', async () => {
    const t = await cargarTema(false)
    window.matchMedia = vi.fn(() => ({ matches: true }))
    expect(t.esOscuro('oscuro')).toBe(true)
    expect(t.esOscuro('claro')).toBe(false)
    expect(t.esOscuro('auto')).toBe(true)
    window.matchMedia = vi.fn(() => ({ matches: false }))
    expect(t.esOscuro('auto')).toBe(false)
  })
})
