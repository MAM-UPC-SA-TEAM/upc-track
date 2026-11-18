// rutaService aislado: el modelo Ruta se sustituye por dobles.
import '../helpers/env.js'
import { test, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

const { Ruta } = await import('../../src/models/Ruta.js')
const rutaService = await import('../../src/services/rutaService.js')
const { Bus } = await import('../../src/models/Bus.js')
const busService = await import('../../src/services/busService.js')

afterEach(() => mock.restoreAll())

test('crear: descripción vacía y activa=1 por defecto; devuelve el id', async () => {
  const crear = mock.method(Ruta, 'crear', async () => 8)
  assert.equal(await rutaService.crear({ nombre: 'Centro' }), 8)
  assert.deepEqual(crear.mock.calls[0].arguments[0], { nombre: 'Centro', descripcion: '', activa: 1 })
})

test('crear: activa=false → 0; solo false exacto desactiva (0, null y undefined cuentan como activa)', async () => {
  const crear = mock.method(Ruta, 'crear', async () => 1)
  await rutaService.crear({ nombre: 'A', activa: false })
  await rutaService.crear({ nombre: 'B', activa: 0 })
  assert.equal(crear.mock.calls[0].arguments[0].activa, 0)
  assert.equal(crear.mock.calls[1].arguments[0].activa, 1)
})

test('editar: aplica los mismos valores por defecto y usa el id recibido', async () => {
  const actualizar = mock.method(Ruta, 'actualizar', async () => 1)
  await rutaService.editar('4', { nombre: 'N', descripcion: 'd', activa: false })
  assert.deepEqual(actualizar.mock.calls[0].arguments, ['4', { nombre: 'N', descripcion: 'd', activa: 0 }])
})

test('eliminar: delega en el modelo', async () => {
  const eliminar = mock.method(Ruta, 'eliminar', async () => 1)
  await rutaService.eliminar('4')
  assert.deepEqual(eliminar.mock.calls[0].arguments, ['4'])
})

test('editar y eliminar: ruta inexistente (0 filas) → RUTA_NO_ENCONTRADA', async () => {
  mock.method(Ruta, 'actualizar', async () => 0)
  mock.method(Ruta, 'eliminar', async () => 0)
  await assert.rejects(rutaService.editar('9', { nombre: 'N' }), { message: 'RUTA_NO_ENCONTRADA' })
  await assert.rejects(rutaService.eliminar('9'), { message: 'RUTA_NO_ENCONTRADA' })
})

test('busService.liberarDeConductor: deja inactivo el bus del conductor', async () => {
  const desactivar = mock.method(Bus, 'desactivarDeConductor', async () => {})
  await busService.liberarDeConductor(2)
  assert.deepEqual(desactivar.mock.calls[0].arguments, [2])
})
