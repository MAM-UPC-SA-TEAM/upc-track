// Pruebas HTTP de POST /api/ubicacion (controller + ubicacionService), con los modelos mockeados.
// La detección de retraso usa un reloj simulado para no esperar minutos reales.
import '../helpers/env.js'
import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

const { default: app } = await import('../../src/app.js')
const { Ubicacion } = await import('../../src/models/Ubicacion.js')
const { Bus } = await import('../../src/models/Bus.js')
const { Notificacion } = await import('../../src/models/Notificacion.js')
const { generarToken } = await import('../../src/utils/jwt.js')

let registrar, emitidos
beforeEach(() => {
  mock.method(console, 'error', () => {})
  registrar = mock.method(Ubicacion, 'registrarUbicacion', async () => 1)
  mock.method(Bus, 'obtenerRuta', async () => ({ id_ruta: 3 }))
  mock.method(Bus, 'porId', async () => ({ id_bus: 1, estado: 'detenido' }))
  emitidos = []
  app.set('io', { to: (room) => ({ emit: (evento, datos) => emitidos.push({ room, evento, datos }) }) })
})
afterEach(() => { mock.timers.reset(); mock.restoreAll(); app.set('io', undefined) })

const auth = (tipo) => ({ Authorization: `Bearer ${generarToken({ id_usuario: 2, tipo_usuario: tipo, nombre: 'Pedro' })}` })
const enviar = (cuerpo, tipo = 'conductor') => request(app).post('/api/ubicacion').set(auth(tipo)).send(cuerpo)
const punto = { id_bus: 1, lat: 10.47, lng: -73.6 }

// ── Validaciones ────────────────────────────────────────────
test('sin token → 401 y estudiante → 403', async () => {
  assert.equal((await request(app).post('/api/ubicacion').send(punto)).status, 401)
  assert.equal((await enviar(punto, 'estudiante')).status, 403)
})

test('faltan id_bus, lat o lng → 400', async () => {
  assert.equal((await enviar({ lat: 1, lng: 1 })).status, 400)
  assert.equal((await enviar({ id_bus: 1, lng: 1 })).status, 400)
  assert.equal((await enviar({ id_bus: 1, lat: 1 })).status, 400)
})

test('lat/lng no numéricos → 400', async () => {
  assert.equal((await enviar({ id_bus: 1, lat: 'abc', lng: 1 })).status, 400)
})

test('coordenadas fuera de rango → 400', async () => {
  assert.equal((await enviar({ id_bus: 1, lat: 91, lng: 0 })).status, 400)
  assert.equal((await enviar({ id_bus: 1, lat: -91, lng: 0 })).status, 400)
  assert.equal((await enviar({ id_bus: 1, lat: 0, lng: 181 })).status, 400)
  assert.equal((await enviar({ id_bus: 1, lat: 0, lng: -181 })).status, 400)
})

test('lat y lng en 0 son válidos (no se confunden con vacío)', async () => {
  assert.equal((await enviar({ id_bus: 1, lat: 0, lng: 0 })).status, 200)
})

// ── Camino feliz ────────────────────────────────────────────
test('guarda la posición y emite bus:location a la sala de la ruta', async () => {
  const res = await enviar({ id_bus: 1, lat: '10.47', lng: '-73.6' })
  assert.equal(res.status, 200)
  assert.deepEqual(registrar.mock.calls[0].arguments, [1, 10.47, -73.6])
  assert.equal(emitidos.length, 1)
  assert.equal(emitidos[0].room, 'ruta_3')
  assert.equal(emitidos[0].evento, 'bus:location')
  assert.deepEqual([emitidos[0].datos.lat, emitidos[0].datos.lng], [10.47, -73.6])
})

test('bus sin ruta: guarda pero no emite', async () => {
  Bus.obtenerRuta.mock.mockImplementation(async () => null)
  assert.equal((await enviar(punto)).status, 200)
  assert.equal(emitidos.length, 0)
})

test('sin io disponible: guarda y responde 200', async () => {
  app.set('io', undefined)
  assert.equal((await enviar(punto)).status, 200)
  assert.equal(registrar.mock.callCount(), 1)
})

test('→ 500 si falla el guardado', async () => {
  registrar.mock.mockImplementation(async () => { throw new Error('BD caída') })
  assert.equal((await enviar(punto)).status, 500)
})

// ── Detección de retraso (ubicacionService) ─────────────────
function busEnRecorrido(id) {
  Bus.porId.mock.mockImplementation(async () => ({
    id_bus: id, estado: 'en_recorrido', id_ruta: 3, id_conductor: 2, nombre: `Bus ${id}`, nombre_ruta: 'Ruta A', nombre_conductor: 'Pedro',
  }))
}
const retrasos = () => emitidos.filter((e) => e.evento === 'notificacion:nueva')

test('un bus detenido más de 3 min genera UNA notificación de retraso y respeta el cooldown', async () => {
  mock.timers.enable({ apis: ['Date'], now: 1_000_000 })
  busEnRecorrido(101)
  const guardar = mock.method(Notificacion, 'guardar', async () => 9)
  const mismo = { id_bus: 101, lat: 10.47, lng: -73.6 }

  await enviar(mismo)                       // primera lectura: solo se recuerda
  await enviar(mismo)                       // sin moverse: empieza a contar el tiempo detenido
  assert.equal(retrasos().length, 0)

  mock.timers.tick(4 * 60 * 1000)           // 4 min detenido
  await enviar(mismo)
  assert.equal(retrasos().length, 1)
  assert.equal(guardar.mock.calls[0].arguments[0].tipo, 'retraso')
  assert.match(guardar.mock.calls[0].arguments[0].mensaje, /retraso en Ruta A \(detencion de 4 min\)/)

  mock.timers.tick(60 * 1000)               // 1 min después: aún en cooldown (10 min)
  await enviar(mismo)
  assert.equal(retrasos().length, 1)
})

test('si el bus se mueve ≥ 25 m se reinicia el conteo y no hay retraso', async () => {
  mock.timers.enable({ apis: ['Date'], now: 2_000_000 })
  busEnRecorrido(102)
  mock.method(Notificacion, 'guardar', async () => 9)

  await enviar({ id_bus: 102, lat: 10.47, lng: -73.6 })
  await enviar({ id_bus: 102, lat: 10.47, lng: -73.6 })
  mock.timers.tick(4 * 60 * 1000)
  await enviar({ id_bus: 102, lat: 10.48, lng: -73.6 })   // ~1,1 km: se movió
  assert.equal(retrasos().length, 0)
})

test('un bus que no está en_recorrido nunca genera retraso', async () => {
  mock.timers.enable({ apis: ['Date'], now: 3_000_000 })
  const guardar = mock.method(Notificacion, 'guardar', async () => 9)
  const mismo = { id_bus: 103, lat: 10.47, lng: -73.6 }   // porId devuelve estado 'detenido'
  await enviar(mismo)
  await enviar(mismo)
  mock.timers.tick(4 * 60 * 1000)
  await enviar(mismo)
  assert.equal(guardar.mock.callCount(), 0)
})
