// busService aislado: el modelo Bus y la transacción se sustituyen por dobles (inyección vía mock.method),
// así se prueban las reglas de negocio sin BD ni HTTP.
import '../helpers/env.js'
import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

const { pool } = await import('../../src/config/database.js')
const { Bus } = await import('../../src/models/Bus.js')
const busService = await import('../../src/services/busService.js')

let cliente, llamadas
beforeEach(() => {
  llamadas = []
  cliente = { query: async (sql) => { llamadas.push(sql); return { rows: [] } }, release() {} }
  mock.method(pool, 'connect', async () => cliente)
})
afterEach(() => mock.restoreAll())

test('crear: aplica los valores por defecto (capacidad 45, estado inactivo, sin conductor)', async () => {
  const crear = mock.method(Bus, 'crear', async () => 7)
  const asignar = mock.method(Bus, 'asignarRuta', async () => {})

  const id = await busService.crear({ nombre: 'B1', placa: 'ABC123' })

  assert.equal(id, 7)
  assert.deepEqual(crear.mock.calls[0].arguments[0], {
    nombre: 'B1', placa: 'ABC123', capacidad: 45, estado: 'inactivo', id_conductor: null,
  })
  assert.equal(asignar.mock.callCount(), 0)
  assert.deepEqual(llamadas, ['BEGIN', 'COMMIT'])
})

test('crear: con id_ruta asigna la ruta al bus recién creado, en la misma transacción', async () => {
  mock.method(Bus, 'crear', async () => 7)
  const asignar = mock.method(Bus, 'asignarRuta', async () => {})

  await busService.crear({ nombre: 'B1', placa: 'ABC123', capacidad: 30, id_ruta: 4 })

  assert.deepEqual(asignar.mock.calls[0].arguments.slice(0, 2), [7, 4])
  assert.equal(asignar.mock.calls[0].arguments[2], cliente, 'usa el cliente de la transacción')
})

test('crear: placa repetida (23505) se traduce a PLACA_DUPLICADA y hace ROLLBACK', async () => {
  mock.method(Bus, 'crear', async () => { throw Object.assign(new Error('dup'), { code: '23505' }) })
  await assert.rejects(busService.crear({ nombre: 'B', placa: 'P' }), { message: 'PLACA_DUPLICADA' })
  assert.deepEqual(llamadas, ['BEGIN', 'ROLLBACK'])
})

test('crear: un error inesperado se propaga tal cual', async () => {
  mock.method(Bus, 'crear', async () => { throw new Error('BD caída') })
  await assert.rejects(busService.crear({ nombre: 'B', placa: 'P' }), { message: 'BD caída' })
})

test('editar: id_ruta indefinido no toca la asignación', async () => {
  mock.method(Bus, 'actualizar', async () => 1)
  const quitar = mock.method(Bus, 'quitarRutas', async () => {})
  await busService.editar(1, { nombre: 'N', placa: 'P', estado: 'inactivo' })
  assert.equal(quitar.mock.callCount(), 0)
})

test('editar: id_ruta null quita la asignación y no asigna otra (límite)', async () => {
  mock.method(Bus, 'actualizar', async () => 1)
  const quitar = mock.method(Bus, 'quitarRutas', async () => {})
  const asignar = mock.method(Bus, 'asignarRuta', async () => {})
  await busService.editar(1, { nombre: 'N', placa: 'P', estado: 'inactivo', id_ruta: null })
  assert.equal(quitar.mock.callCount(), 1)
  assert.equal(asignar.mock.callCount(), 0)
})

test('editar: con id_ruta reemplaza la asignación anterior', async () => {
  mock.method(Bus, 'actualizar', async () => 1)
  const quitar = mock.method(Bus, 'quitarRutas', async () => {})
  const asignar = mock.method(Bus, 'asignarRuta', async () => {})
  await busService.editar(1, { nombre: 'N', placa: 'P', estado: 'inactivo', id_ruta: 9 })
  assert.equal(quitar.mock.callCount(), 1)
  assert.deepEqual(asignar.mock.calls[0].arguments.slice(0, 2), [1, 9])
})

test('editar: bus inexistente lanza BUS_NO_ENCONTRADO sin tocar rutas y con ROLLBACK', async () => {
  mock.method(Bus, 'actualizar', async () => 0)
  const quitar = mock.method(Bus, 'quitarRutas', async () => {})
  await assert.rejects(busService.editar(99, { nombre: 'N', placa: 'P', estado: 'inactivo', id_ruta: 3 }), { message: 'BUS_NO_ENCONTRADO' })
  assert.equal(quitar.mock.callCount(), 0)
  assert.deepEqual(llamadas, ['BEGIN', 'ROLLBACK'])
})

test('editar: capacidad 0 o ausente vuelve a 45 y conductor vacío queda null', async () => {
  const actualizar = mock.method(Bus, 'actualizar', async () => 1)
  await busService.editar(1, { nombre: 'N', placa: 'P', estado: 'inactivo', capacidad: 0, id_conductor: '' })
  const datos = actualizar.mock.calls[0].arguments[1]
  assert.equal(datos.capacidad, 45)
  assert.equal(datos.id_conductor, null)
})

test('eliminar: existente → resuelve; inexistente → BUS_NO_ENCONTRADO', async () => {
  const eliminar = mock.method(Bus, 'eliminar', async () => 1)
  await busService.eliminar(1)
  eliminar.mock.mockImplementation(async () => 0)
  await assert.rejects(busService.eliminar(99), { message: 'BUS_NO_ENCONTRADO' })
})
