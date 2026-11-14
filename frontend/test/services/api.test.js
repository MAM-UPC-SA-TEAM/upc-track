import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import api, { EVENTO_SERVIDOR } from '../../src/services/api'

const respuesta = (status, cuerpo, tipo = 'application/json') => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: () => tipo },
  json: async () => cuerpo,
  text: async () => (typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo)),
})

let fetchMock
beforeEach(() => {
  localStorage.clear()
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('api: peticiones', () => {
  it('GET devuelve el JSON y no envía Authorization sin token', async () => {
    fetchMock.mockResolvedValue(respuesta(200, { ok: true }))
    expect(await api.get('/api/buses')).toEqual({ ok: true })
    const [url, config] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/buses')
    expect(config.headers.Authorization).toBeUndefined()
  })

  it('adjunta el token guardado como Bearer', async () => {
    localStorage.setItem('token', 'abc')
    fetchMock.mockResolvedValue(respuesta(200, {}))
    await api.get('/x')
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer abc')
  })

  it('post/patch/delete usan el método y serializan el cuerpo', async () => {
    fetchMock.mockResolvedValue(respuesta(200, {}))
    await api.post('/a', { x: 1 })
    await api.patch('/b', { y: 2 })
    await api.delete('/c')
    const [post, patch, del] = fetchMock.mock.calls.map((c) => c[1])
    expect([post.method, post.body]).toEqual(['POST', '{"x":1}'])
    expect([patch.method, patch.body]).toEqual(['PATCH', '{"y":2}'])
    expect(del.method).toBe('DELETE')
  })

  it('respuesta no JSON se devuelve como { message }', async () => {
    fetchMock.mockResolvedValue(respuesta(200, 'hola', 'text/plain'))
    expect(await api.get('/x')).toEqual({ message: 'hola' })
  })

  it('cuerpo vacío no JSON devuelve null', async () => {
    fetchMock.mockResolvedValue(respuesta(204, '', 'text/plain'))
    expect(await api.get('/x')).toBeNull()
  })

  it('JSON malformado se tolera como null', async () => {
    const r = respuesta(200, {})
    r.json = async () => { throw new Error('mal') }
    fetchMock.mockResolvedValue(r)
    expect(await api.get('/x')).toBeNull()
  })

  it('texto ilegible se tolera como null', async () => {
    const r = respuesta(200, '', 'text/plain')
    r.text = async () => { throw new Error('mal') }
    fetchMock.mockResolvedValue(r)
    expect(await api.get('/x')).toBeNull()
  })

  it('error 4xx lanza { status, message } con el error del servidor', async () => {
    fetchMock.mockResolvedValue(respuesta(401, { error: 'Token inválido' }))
    await expect(api.get('/x')).rejects.toEqual({ status: 401, message: 'Token inválido' })
  })

  it('error sin mensaje usa uno genérico', async () => {
    fetchMock.mockResolvedValue(respuesta(500, {}))
    await expect(api.get('/x')).rejects.toEqual({ status: 500, message: 'Error del servidor' })
  })
})

describe('api: servidor dormido (reintentos)', () => {
  it('reintenta ante 503, avisa a la interfaz y la apaga al recuperarse', async () => {
    vi.useFakeTimers()
    const avisos = []
    const oyente = (e) => avisos.push(e.detail.activo)
    window.addEventListener(EVENTO_SERVIDOR, oyente)
    fetchMock.mockResolvedValueOnce(respuesta(503, {})).mockResolvedValueOnce(respuesta(200, { listo: 1 }))

    const p = api.get('/x')
    await vi.advanceTimersByTimeAsync(3000)

    expect(await p).toEqual({ listo: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(avisos).toEqual([true, false])
    window.removeEventListener(EVENTO_SERVIDOR, oyente)
  })

  it('reintenta ante un fallo de red', async () => {
    vi.useFakeTimers()
    fetchMock.mockRejectedValueOnce(new TypeError('red')).mockResolvedValueOnce(respuesta(200, { ok: 1 }))
    const p = api.get('/x')
    await vi.advanceTimersByTimeAsync(3000)
    expect(await p).toEqual({ ok: 1 })
  })

  it('un 4xx no se reintenta', async () => {
    fetchMock.mockResolvedValue(respuesta(404, { error: 'no' }))
    await expect(api.get('/x')).rejects.toMatchObject({ status: 404 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('tras 90 s deja de reintentar un 502 y lanza el mensaje del proxy', async () => {
    vi.useFakeTimers()
    fetchMock.mockResolvedValue(respuesta(502, {}))
    const p = api.get('/x').catch((e) => e)
    await vi.advanceTimersByTimeAsync(95000)
    const error = await p
    expect(error.status).toBe(502)
    expect(error.message).toMatch(/502/)
  })

  it('tras 90 s un fallo de red se propaga', async () => {
    vi.useFakeTimers()
    fetchMock.mockRejectedValue(new TypeError('sin red'))
    const p = api.get('/x').catch((e) => e)
    await vi.advanceTimersByTimeAsync(95000)
    expect(await p).toBeInstanceOf(TypeError)
  })
})
