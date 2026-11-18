// Integración con PostgreSQL REAL (parte 2): rutas, perfil, contraseña, logout y avisos del conductor.
// Comprueba que el SQL movido a los modelos/servicios (B02) sigue persistiendo lo correcto.
import { prepararBD, unico } from '../helpers/bd.js'
import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

await prepararBD()
const { default: app } = await import('../../src/app.js')
const { pool } = await import('../../src/config/database.js')

after(() => pool.end())

const unaFila = async (sql, params) => (await pool.query(sql, params)).rows[0]

async function token(usuario, password = 'Admin123*') {
  const res = await request(app).post('/api/auth/login').send({ nombre_usuario: usuario, password })
  assert.equal(res.status, 200, `login de ${usuario}`)
  return { Authorization: `Bearer ${res.body.token}` }
}

let admin, conductor, estudiante
before(async () => {
  admin = await token('admin')
  conductor = await token('conductor')
  estudiante = await token('estudiante')
})

describe('rutas (admin)', () => {
  test('crear → 201 con valores por defecto persistidos; editar y eliminar quedan en la BD', async () => {
    const nombre = `Ruta ${unico()}`
    const creada = await request(app).post('/api/rutas').set(admin).send({ nombre })
    assert.equal(creada.status, 201)
    const id = creada.body.id_ruta
    const fila = await unaFila('SELECT nombre, descripcion, activa FROM ruta WHERE id_ruta = $1', [id])
    assert.deepEqual({ ...fila }, { nombre, descripcion: '', activa: 1 })

    const editada = await request(app).patch(`/api/rutas/${id}`).set(admin).send({ nombre: `${nombre}b`, descripcion: 'x', activa: false })
    assert.equal(editada.status, 200)
    const tras = await unaFila('SELECT nombre, descripcion, activa FROM ruta WHERE id_ruta = $1', [id])
    assert.deepEqual({ ...tras }, { nombre: `${nombre}b`, descripcion: 'x', activa: 0 })

    assert.equal((await request(app).delete(`/api/rutas/${id}`).set(admin)).status, 200)
    assert.equal(await unaFila('SELECT 1 FROM ruta WHERE id_ruta = $1', [id]), undefined)
  })

  test('crear sin nombre → 400; siendo estudiante → 403', async () => {
    assert.equal((await request(app).post('/api/rutas').set(admin).send({})).status, 400)
    assert.equal((await request(app).post('/api/rutas').set(estudiante).send({ nombre: 'X' })).status, 403)
  })
})

describe('usuarios: alta, perfil y contraseña', () => {
  async function cuentaActiva() {
    const id = unico()
    const res = await request(app).post('/api/usuarios').set(admin).send({
      nombre: 'Perfil', nombre_usuario: `perfil_${id}`, correo: `perfil_${id}@unicesar.edu.co`, password: 'clave12345',
    })
    assert.equal(res.status, 201)
    return { id, id_usuario: res.body.id_usuario, cabecera: await token(`perfil_${id}`, 'clave12345') }
  }

  test('admin crea un usuario: 201, hash en la BD y rol por defecto estudiante', async () => {
    const { id_usuario } = await cuentaActiva()
    const fila = await unaFila('SELECT tipo_usuario, activo, password_hash FROM usuario WHERE id_usuario = $1', [id_usuario])
    assert.equal(fila.tipo_usuario, 'estudiante')
    assert.equal(fila.activo, 1)
    assert.notEqual(fila.password_hash, 'clave12345')
  })

  test('crear un usuario con el nombre repetido (otra capitalización) → 400', async () => {
    const { id } = await cuentaActiva()
    const res = await request(app).post('/api/usuarios').set(admin).send({
      nombre: 'Otro', nombre_usuario: `PERFIL_${id}`, correo: `otro_${id}@unicesar.edu.co`, password: 'clave12345',
    })
    assert.equal(res.status, 400)
  })

  test('editar perfil: 200, persiste, token nuevo; el login sirve con el nombre nuevo y no con el viejo', async () => {
    const { id, cabecera } = await cuentaActiva()
    const nuevo = `nuevo_${id}`
    const res = await request(app).patch('/api/usuarios/perfil').set(cabecera).send({ nombre: 'Nombre Nuevo', nombre_usuario: nuevo })
    assert.equal(res.status, 200)
    assert.ok(res.body.token)
    assert.equal((await unaFila('SELECT nombre FROM usuario WHERE nombre_usuario = $1', [nuevo])).nombre, 'Nombre Nuevo')

    assert.equal((await request(app).post('/api/auth/login').send({ nombre_usuario: nuevo, password: 'clave12345' })).status, 200)
    assert.equal((await request(app).post('/api/auth/login').send({ nombre_usuario: `perfil_${id}`, password: 'clave12345' })).status, 401)
  })

  test('editar perfil con un nombre de usuario ya tomado → 409 y no cambia nada', async () => {
    const { cabecera, id_usuario } = await cuentaActiva()
    const res = await request(app).patch('/api/usuarios/perfil').set(cabecera).send({ nombre: 'X', nombre_usuario: 'admin' })
    assert.equal(res.status, 409)
    assert.notEqual((await unaFila('SELECT nombre_usuario FROM usuario WHERE id_usuario = $1', [id_usuario])).nombre_usuario, 'admin')
  })

  test('editar perfil: nombre de usuario de 21 caracteres → 400; de 20 → 200 (límite máximo)', async () => {
    const { cabecera } = await cuentaActiva()
    const veinte = unico().padStart(20, 'a')
    assert.equal(veinte.length, 20)
    assert.equal((await request(app).patch('/api/usuarios/perfil').set(cabecera).send({ nombre: 'X', nombre_usuario: `${veinte}b` })).status, 400)
    assert.equal((await request(app).patch('/api/usuarios/perfil').set(cabecera).send({ nombre: 'X', nombre_usuario: veinte })).status, 200)
  })

  test('cambiar contraseña: clave actual errónea → 401 sin cambios; correcta → 200 y rige la nueva', async () => {
    const { id, cabecera } = await cuentaActiva()
    const usuario = `perfil_${id}`
    assert.equal((await request(app).patch('/api/usuarios/password').set(cabecera).send({ password_actual: 'mala', password_nueva: 'otra123456' })).status, 401)
    assert.equal((await request(app).post('/api/auth/login').send({ nombre_usuario: usuario, password: 'clave12345' })).status, 200)

    assert.equal((await request(app).patch('/api/usuarios/password').set(cabecera).send({ password_actual: 'clave12345', password_nueva: 'otra123456' })).status, 200)
    assert.equal((await request(app).post('/api/auth/login').send({ nombre_usuario: usuario, password: 'otra123456' })).status, 200)
    assert.equal((await request(app).post('/api/auth/login').send({ nombre_usuario: usuario, password: 'clave12345' })).status, 401)
  })

  test('cambiar contraseña: nueva de 7 caracteres → 400; admin elimina el usuario → 200 y desaparece', async () => {
    const { cabecera, id_usuario } = await cuentaActiva()
    assert.equal((await request(app).patch('/api/usuarios/password').set(cabecera).send({ password_actual: 'clave12345', password_nueva: '1234567' })).status, 400)
    assert.equal((await request(app).delete(`/api/usuarios/${id_usuario}`).set(admin)).status, 200)
    assert.equal(await unaFila('SELECT 1 FROM usuario WHERE id_usuario = $1', [id_usuario]), undefined)
  })
})

describe('conductor: logout y avisos', () => {
  test('logout del conductor deja su bus inactivo en la BD', async () => {
    const { id_bus } = await unaFila(`SELECT id_bus FROM bus WHERE id_conductor = (SELECT id_usuario FROM usuario WHERE nombre_usuario = 'conductor')`)
    await pool.query(`UPDATE bus SET estado = 'en_recorrido' WHERE id_bus = $1`, [id_bus])
    assert.equal((await request(app).post('/api/auth/logout').set(conductor)).status, 200)
    assert.equal((await unaFila('SELECT estado FROM bus WHERE id_bus = $1', [id_bus])).estado, 'inactivo')
  })

  test('enviar aviso: 201, se guarda para la ruta del conductor y se emite a su sala', async () => {
    const emitidos = []
    app.set('io', { to: (sala) => ({ emit: (evento) => emitidos.push({ sala, evento }) }) })
    const res = await request(app).post('/api/notificaciones').set(conductor).send({ tipo: 'retraso', mensaje: `  Retraso ${unico()}  ` })
    app.set('io', undefined)

    assert.equal(res.status, 201)
    assert.equal(res.body.notificacion.mensaje, res.body.notificacion.mensaje.trim())
    const fila = await unaFila('SELECT id_ruta, tipo FROM notificacion WHERE id_notificacion = $1', [res.body.notificacion.id_notificacion])
    assert.deepEqual({ ...fila }, { id_ruta: res.body.notificacion.id_ruta, tipo: 'retraso' })
    assert.deepEqual(emitidos, [{ sala: `ruta_${fila.id_ruta}`, evento: 'notificacion:nueva' }])
  })

  test('enviar aviso: tipo inválido → 400; estudiante → 403', async () => {
    assert.equal((await request(app).post('/api/notificaciones').set(conductor).send({ tipo: 'otro', mensaje: 'x' })).status, 400)
    assert.equal((await request(app).post('/api/notificaciones').set(estudiante).send({ tipo: 'info', mensaje: 'x' })).status, 403)
  })
})
