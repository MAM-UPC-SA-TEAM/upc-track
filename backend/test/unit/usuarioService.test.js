// usuarioService aislado: el modelo Usuario se sustituye por dobles (mock.method); bcrypt y JWT son reales.
import '../helpers/env.js'
import { test, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'

const { Usuario } = await import('../../src/models/Usuario.js')
const usuarioService = await import('../../src/services/usuarioService.js')
const { verificarToken } = await import('../../src/utils/jwt.js')

afterEach(() => mock.restoreAll())

const duplicado = (constraint) => Object.assign(new Error('dup'), { code: '23505', constraint })

test('crear: guarda la clave con hash, usuario en minúsculas, rol estudiante y activo por defecto', async () => {
  const crear = mock.method(Usuario, 'crear', async () => 12)

  const id = await usuarioService.crear({ nombre: 'Ana', nombre_usuario: 'ANA', correo: 'a@u.co', password: 'clave1234' })

  assert.equal(id, 12)
  const datos = crear.mock.calls[0].arguments[0]
  assert.equal(datos.nombre_usuario, 'ana')
  assert.equal(datos.tipo_usuario, 'estudiante')
  assert.equal(datos.activo, 1)
  assert.notEqual(datos.password_hash, 'clave1234')
  assert.ok(await bcrypt.compare('clave1234', datos.password_hash))
})

test('crear: activo=false se guarda como 0 y conserva el rol pedido', async () => {
  const crear = mock.method(Usuario, 'crear', async () => 1)
  await usuarioService.crear({ nombre: 'C', nombre_usuario: 'cond', correo: 'c@u.co', password: 'clave1234', tipo_usuario: 'conductor', activo: false })
  const datos = crear.mock.calls[0].arguments[0]
  assert.equal(datos.activo, 0)
  assert.equal(datos.tipo_usuario, 'conductor')
})

test('crear: la violación UNIQUE se traduce según la columna que chocó', async () => {
  const crear = mock.method(Usuario, 'crear', async () => { throw duplicado('usuario_nombre_usuario_key') })
  await assert.rejects(usuarioService.crear({ nombre: 'A', nombre_usuario: 'a', correo: 'a@u.co', password: 'clave1234' }), { message: 'USUARIO_YA_REGISTRADO' })
  crear.mock.mockImplementation(async () => { throw duplicado('usuario_correo_key') })
  await assert.rejects(usuarioService.crear({ nombre: 'A', nombre_usuario: 'a', correo: 'a@u.co', password: 'clave1234' }), { message: 'CORREO_YA_REGISTRADO' })
})

test('crear: un error que no es duplicado se propaga sin traducir', async () => {
  mock.method(Usuario, 'crear', async () => { throw new Error('BD caída') })
  await assert.rejects(usuarioService.crear({ nombre: 'A', nombre_usuario: 'a', correo: 'a@u.co', password: 'clave1234' }), { message: 'BD caída' })
})

test('editar: sin password no manda hash; con password sí, y activo=false → 0', async () => {
  const actualizar = mock.method(Usuario, 'actualizar', async () => 1)
  const base = { nombre: 'N', nombre_usuario: 'NU', correo: 'n@u.co', tipo_usuario: 'admin' }

  await usuarioService.editar(7, base)
  assert.equal(actualizar.mock.calls[0].arguments[1].password_hash, undefined)
  assert.equal(actualizar.mock.calls[0].arguments[1].nombre_usuario, 'nu')

  await usuarioService.editar(7, { ...base, activo: false, password: 'otraclave1' })
  const datos = actualizar.mock.calls[1].arguments[1]
  assert.equal(datos.activo, 0)
  assert.ok(await bcrypt.compare('otraclave1', datos.password_hash))
})

test('editar y eliminar: usuario inexistente (0 filas) → USUARIO_NO_ENCONTRADO', async () => {
  mock.method(Usuario, 'actualizar', async () => 0)
  mock.method(Usuario, 'eliminar', async () => 0)
  await assert.rejects(usuarioService.editar(99, { nombre: 'N', nombre_usuario: 'n', correo: 'n@u.co', tipo_usuario: 'admin' }), { message: 'USUARIO_NO_ENCONTRADO' })
  await assert.rejects(usuarioService.eliminar(99), { message: 'USUARIO_NO_ENCONTRADO' })
})

test('editarPerfil: devuelve el usuario y un token nuevo con los datos actualizados', async () => {
  mock.method(Usuario, 'actualizarPerfil', async () => ({
    id_usuario: 5, nombre: 'Nuevo', nombre_usuario: 'nuevo', correo: 'n@u.co', tipo_usuario: 'estudiante',
  }))
  const { usuario, token } = await usuarioService.editarPerfil(5, { nombre: 'Nuevo', correo: null, nombre_usuario: 'nuevo' })
  assert.equal(usuario.nombre, 'Nuevo')
  const payload = verificarToken(token)
  assert.equal(payload.id_usuario, 5)
  assert.equal(payload.nombre_usuario, 'nuevo')
})

test('editarPerfil: usuario que ya no existe → USUARIO_NO_ENCONTRADO', async () => {
  mock.method(Usuario, 'actualizarPerfil', async () => null)
  await assert.rejects(usuarioService.editarPerfil(99, { nombre: 'X' }), { message: 'USUARIO_NO_ENCONTRADO' })
})

test('editarPerfil: nombre de usuario tomado → USUARIO_YA_REGISTRADO', async () => {
  mock.method(Usuario, 'actualizarPerfil', async () => { throw duplicado('usuario_nombre_usuario_key') })
  await assert.rejects(usuarioService.editarPerfil(5, { nombre: 'X', nombre_usuario: 'tomado' }), { message: 'USUARIO_YA_REGISTRADO' })
})

test('cambiarPassword: con la clave actual correcta guarda el hash NUEVO (no la clave en claro)', async () => {
  mock.method(Usuario, 'hashDe', async () => bcrypt.hash('vieja1234', 4))
  const cambiar = mock.method(Usuario, 'cambiarHash', async () => {})

  await usuarioService.cambiarPassword(5, 'vieja1234', 'nueva12345')

  const [id, hash] = cambiar.mock.calls[0].arguments
  assert.equal(id, 5)
  assert.notEqual(hash, 'nueva12345')
  assert.ok(await bcrypt.compare('nueva12345', hash))
})

test('cambiarPassword: clave actual errónea → PASSWORD_ACTUAL_INCORRECTA y no se guarda nada', async () => {
  mock.method(Usuario, 'hashDe', async () => bcrypt.hash('vieja1234', 4))
  const cambiar = mock.method(Usuario, 'cambiarHash', async () => {})
  await assert.rejects(usuarioService.cambiarPassword(5, 'equivocada', 'nueva12345'), { message: 'PASSWORD_ACTUAL_INCORRECTA' })
  assert.equal(cambiar.mock.callCount(), 0)
})

test('cambiarPassword: usuario inexistente → USUARIO_NO_ENCONTRADO (antes era un TypeError → 500)', async () => {
  mock.method(Usuario, 'hashDe', async () => null)
  await assert.rejects(usuarioService.cambiarPassword(99, 'a', 'bbbbbbbb'), { message: 'USUARIO_NO_ENCONTRADO' })
})

test('eliminar: delega en el modelo', async () => {
  const eliminar = mock.method(Usuario, 'eliminar', async () => 1)
  await usuarioService.eliminar(3)
  assert.deepEqual(eliminar.mock.calls[0].arguments, [3])
})
