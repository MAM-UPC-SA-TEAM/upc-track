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
  it('sin tema guardado sigue al sistema', async () => {
    window.matchMedia = vi.fn(() => ({ matches: true }))
    expect((await cargarTema(false)).temaInicialOscuro()).toBe(true)
  })
  it('si el almacenamiento falla, cae al sistema', async () => {
    window.matchMedia = vi.fn(() => ({ matches: false }))
    const espia = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado') })
    expect((await cargarTema(false)).temaInicialOscuro()).toBe(false)
    espia.mockRestore()
  })
})

describe('aplicarTema', () => {
  it('en web fija data-tema y theme-color, sin tocar la barra nativa', async () => {
    (await cargarTema(false)).aplicarTema(true)
    expect(document.body.dataset.tema).toBe('oscuro')
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe('#101a13')
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
    expect(statusBar.setBackgroundColor).toHaveBeenCalledWith({ color: '#101a13' })
  })
  it('en nativa con tema claro usa Style.Light', async () => {
    (await cargarTema(true)).aplicarTema(false)
    expect(statusBar.setStyle).toHaveBeenCalledWith({ style: 'LIGHT' })
  })
})
