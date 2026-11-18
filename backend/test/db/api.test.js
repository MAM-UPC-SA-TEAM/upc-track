// Integración con PostgreSQL REAL: HTTP (supertest sobre app.js) + consulta directa a la BD para
// comprobar que lo que la API responde coincide con lo que quedó persistido. Nada se mockea.
// Requiere la BD de pruebas: `npm run e2e:db:up` (raíz). Ver docs/testing.md.
import { prepararBD, unico } from '../helpers/bd.js'
import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

await prepararBD()
const { default: app } = await import('../../src/app.js')
const { pool } = await import('../../src/config/database.js')

after(() => pool.end())

const unaFila = async (sql, params) => (await pool.query(sql, params)).rows[0]
const filas = async (sql, params) => (await pool.query(sql, params)).rows

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

describe('auth', () => {
  test('login correcto → 200, token y sin password_hash', async () => {
    const res = await request(app).post('/api/auth/login').send({ nombre_usuario: 'admin', password: 'Admin123*' })
    assert.equal(res.status, 200)
    assert.ok(res.body.token)
    assert.equal(res.body.usuario.tipo_usuario, 'admin')
    assert.equal('password_hash' in res.body.usuario, false)
  })

  test('login con clave errónea → 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ nombre_usuario: 'admin', password: 'incorrecta' })
    assert.equal(res.status, 401)
  })

  test('login sin datos → 400', async () => {
    assert.equal((await request(app).post('/api/auth/login').send({})).status, 400)
  })

  test('ruta protegida sin token → 401; con token basura → 401', async () => {
    assert.equal((await request(app).get('/api/auth/me')).status, 401)
    assert.equal((await request(app).get('/api/auth/me').set({ Authorization: 'Bearer basura' })).status, 401)
  })

  test('registro público → 201 y la cuenta QUEDA INACTIVA en la BD (espera aprobación del admin)', async () => {
    const id = unico()
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'Ana Prueba', nombre_usuario: `ana_${id}`, correo: `ana_${id}@unicesar.edu.co`, password: 'secreta123',
    })
    assert.equal(res.status, 201)
    assert.equal(res.body.token, undefined, 'una cuenta pendiente no recibe token')

    const fila = await unaFila('SELECT * FROM usuario WHERE nombre_usuario = $1', [`ana_${id}`])
    assert.equal(fila.activo, 0)
    assert.equal(fila.tipo_usuario, 'estudiante')
    assert.notEqual(fila.password_hash, 'secreta123', 'la clave se guarda con hash')

    // y mientras esté pendiente no puede entrar
    const login = await request(app).post('/api/auth/login').send({ nombre_usuario: `ana_${id}`, password: 'secreta123' })
    assert.equal(login.status, 403)
  })

  test('registro con contraseña de 7 caracteres → 400 y NO se crea nada (límite)', async () => {
    const id = unico()
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'X', nombre_usuario: `x_${id}`, correo: `x_${id}@unicesar.edu.co`, password: '1234567',
    })
    assert.equal(res.status, 400)
    assert.equal(await unaFila('SELECT 1 FROM usuario WHERE nombre_usuario = $1', [`x_${id}`]), undefined)
  })

  test('registro con 8 caracteres exactos → 201 (límite inferior válido)', async () => {
    const id = unico()
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'X', nombre_usuario: `y_${id}`, correo: `y_${id}@unicesar.edu.co`, password: '12345678',
    })
    assert.equal(res.status, 201)
  })

  test('registro con correo de otro dominio → 400 y no se persiste', async () => {
    const id = unico()
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'X', nombre_usuario: `z_${id}`, correo: `z_${id}@gmail.com`, password: 'secreta123',
    })
    assert.equal(res.status, 400)
    assert.equal(await unaFila('SELECT 1 FROM usuario WHERE nombre_usuario = $1', [`z_${id}`]), undefined)
  })

  test('registro duplicado (mismo correo en otra capitalización) → 400 y sigue habiendo una sola fila', async () => {
    const id = unico()
    const datos = { nombre: 'Dup', nombre_usuario: `dup_${id}`, correo: `dup_${id}@unicesar.edu.co`, password: 'secreta123' }
    assert.equal((await request(app).post('/api/auth/registro').send(datos)).status, 201)
    const otra = { ...datos, nombre_usuario: `dup2_${id}`, correo: datos.correo.toUpperCase() }
    assert.equal((await request(app).post('/api/auth/registro').send(otra)).status, 400)
    assert.equal((await filas('SELECT 1 FROM usuario WHERE correo = $1', [datos.correo])).length, 1)
  })
})

describe('buses', () => {
  const nuevoBus = (extra = {}) => ({ nombre: `Bus ${unico()}`, placa: `P${unico()}`.slice(0, 10).toUpperCase(), ...extra })

  test('crear (admin) → 201 y la fila existe con los valores por defecto', async () => {
    const datos = nuevoBus()
    const res = await request(app).post('/api/buses').set(admin).send(datos)
    assert.equal(res.status, 201)
    const fila = await unaFila('SELECT * FROM bus WHERE id_bus = $1', [res.body.id_bus])
    assert.equal(fila.nombre, datos.nombre)
    assert.equal(fila.capacidad, 45)
    assert.equal(fila.estado, 'inactivo')
  })

  test('crear sin placa → 400 y no se inserta', async () => {
    const antes = (await unaFila('SELECT count(*)::int AS n FROM bus')).n
    assert.equal((await request(app).post('/api/buses').set(admin).send({ nombre: 'Sin placa' })).status, 400)
    assert.equal((await unaFila('SELECT count(*)::int AS n FROM bus')).n, antes)
  })

  test('crear con la placa repetida (otra capitalización) → 400', async () => {
    const datos = nuevoBus()
    assert.equal((await request(app).post('/api/buses').set(admin).send(datos)).status, 201)
    const res = await request(app).post('/api/buses').set(admin).send({ ...datos, placa: datos.placa.toLowerCase() })
    assert.equal(res.status, 400)
  })

  test('crear siendo estudiante → 403; sin token → 401', async () => {
    assert.equal((await request(app).post('/api/buses').set(estudiante).send(nuevoBus())).status, 403)
    assert.equal((await request(app).post('/api/buses').send(nuevoBus())).status, 401)
  })

  test('consultar un bus creado → 200; uno inexistente → 404', async () => {
    const datos = nuevoBus()
    const { body } = await request(app).post('/api/buses').set(admin).send(datos)
    const ok = await request(app).get(`/api/buses/${body.id_bus}`).set(estudiante)
    assert.equal(ok.status, 200)
    assert.equal(ok.body.bus.placa, datos.placa)
    assert.equal(ok.body.bus.nombre, datos.nombre)
    assert.equal((await request(app).get('/api/buses/999999').set(estudiante)).status, 404)
  })

  test('editar → 200 y el cambio queda persistido', async () => {
    const datos = nuevoBus()
    const { body } = await request(app).post('/api/buses').set(admin).send(datos)
    const res = await request(app).patch(`/api/buses/${body.id_bus}`).set(admin)
      .send({ nombre: 'Renombrado', placa: datos.placa, capacidad: 50, estado: 'detenido' })
    assert.equal(res.status, 200)
    const fila = await unaFila('SELECT nombre, capacidad, estado FROM bus WHERE id_bus = $1', [body.id_bus])
    assert.deepEqual({ ...fila }, { nombre: 'Renombrado', capacidad: 50, estado: 'detenido' })
  })

  test('eliminar → 200 y la fila desaparece', async () => {
    const { body } = await request(app).post('/api/buses').set(admin).send(nuevoBus())
    assert.equal((await request(app).delete(`/api/buses/${body.id_bus}`).set(admin)).status, 200)
    assert.equal(await unaFila('SELECT 1 FROM bus WHERE id_bus = $1', [body.id_bus]), undefined)
  })

  test('cambiar estado: el conductor lo cambia (200) y se persiste; estado inventado → 400 sin cambios', async () => {
    const id_bus = (await unaFila(`SELECT id_bus FROM bus WHERE id_conductor = (SELECT id_usuario FROM usuario WHERE nombre_usuario = 'conductor')`)).id_bus
    const ok = await request(app).patch(`/api/buses/${id_bus}/estado`).set(conductor).send({ estado: 'en_recorrido' })
    assert.equal(ok.status, 200)
    assert.equal((await unaFila('SELECT estado FROM bus WHERE id_bus = $1', [id_bus])).estado, 'en_recorrido')

    const mal = await request(app).patch(`/api/buses/${id_bus}/estado`).set(conductor).send({ estado: 'volando' })
    assert.equal(mal.status, 400)
    assert.equal((await unaFila('SELECT estado FROM bus WHERE id_bus = $1', [id_bus])).estado, 'en_recorrido')
  })

  // DEFECTOS CONOCIDOS (hallados al auditar las pruebas, ver docs/testing.md): el negocio exige 404 al operar
  // sobre un bus que no existe, pero hoy responde 200 porque no se mira rowCount. `todo` = se ejecuta y se
  // reporta, sin romper el CI, hasta que se corrija; entonces se quita la marca.
  test('editar un bus inexistente → 404', { todo: 'editarBus responde 200' }, async () => {
    const res = await request(app).patch('/api/buses/999999').set(admin).send({ nombre: 'X', placa: 'ZZZ999', estado: 'inactivo' })
    assert.equal(res.status, 404)
  })

  test('eliminar un bus inexistente → 404', { todo: 'eliminarBus responde 200' }, async () => {
    assert.equal((await request(app).delete('/api/buses/999999').set(admin)).status, 404)
  })

  test('cambiar estado siendo estudiante → 403', async () => {
    assert.equal((await request(app).patch('/api/buses/1/estado').set(estudiante).send({ estado: 'detenido' })).status, 403)
  })
})

describe('horarios', () => {
  const crear = (datos) => request(app).post('/api/horarios').set(admin).send(datos)
  const hhmm = async (id) => (await unaFila(`SELECT hora_salida::text AS s, hora_llegada::text AS l FROM horario WHERE id_horario = $1`, [id]))

  test('crear → 201 y queda persistido con sus horas', async () => {
    const res = await crear({ ruta_id: 1, hora_salida: '06:30', hora_llegada: '07:15' })
    assert.equal(res.status, 201)
    const fila = await hhmm(res.body.id_horario)
    assert.equal(fila.s.slice(0, 5), '06:30')
    assert.equal(fila.l.slice(0, 5), '07:15')
  })

  test('valores límite de la hora: 00:00 y 23:59 válidas; 24:00 y 12:60 → 400', async () => {
    assert.equal((await crear({ ruta_id: 1, hora_salida: '00:00', hora_llegada: '23:59' })).status, 201)
    assert.equal((await crear({ ruta_id: 1, hora_salida: '24:00', hora_llegada: '23:59' })).status, 400)
    assert.equal((await crear({ ruta_id: 1, hora_salida: '12:60', hora_llegada: '13:00' })).status, 400)
  })

  test('faltan campos → 400', async () => {
    assert.equal((await crear({ ruta_id: 1, hora_salida: '06:00' })).status, 400)
  })

  test('editar y eliminar un horario inexistente → 404', async () => {
    assert.equal((await request(app).patch('/api/horarios/999999').set(admin).send({ hora_salida: '06:00', hora_llegada: '07:00' })).status, 404)
    assert.equal((await request(app).delete('/api/horarios/999999').set(admin)).status, 404)
  })

  test('editar → 200 persistido; eliminar → 200 y desaparece; estudiante no puede crear (403)', async () => {
    const { body } = await crear({ ruta_id: 1, hora_salida: '08:00', hora_llegada: '08:45' })
    assert.equal((await request(app).patch(`/api/horarios/${body.id_horario}`).set(admin).send({ hora_salida: '08:10', hora_llegada: '08:50' })).status, 200)
    assert.equal((await hhmm(body.id_horario)).s.slice(0, 5), '08:10')

    assert.equal((await request(app).delete(`/api/horarios/${body.id_horario}`).set(admin)).status, 200)
    assert.equal(await unaFila('SELECT 1 FROM horario WHERE id_horario = $1', [body.id_horario]), undefined)

    assert.equal((await request(app).post('/api/horarios').set(estudiante).send({ ruta_id: 1, hora_salida: '06:00', hora_llegada: '07:00' })).status, 403)
  })
})

describe('usuarios (admin)', () => {
  test('el admin aprueba una cuenta pendiente (PATCH activo) y entonces puede iniciar sesión', async () => {
    const id = unico()
    await request(app).post('/api/auth/registro').send({
      nombre: 'Pend', nombre_usuario: `pend_${id}`, correo: `pend_${id}@unicesar.edu.co`, password: 'secreta123',
    })
    const { id_usuario } = await unaFila('SELECT id_usuario FROM usuario WHERE nombre_usuario = $1', [`pend_${id}`])

    // mismo cuerpo que envía GestionUsuarios.aprobar(): el PATCH reemplaza todos los campos
    const res = await request(app).patch(`/api/usuarios/${id_usuario}`).set(admin).send({
      nombre: 'Pend', nombre_usuario: `pend_${id}`, correo: `pend_${id}@unicesar.edu.co`, tipo_usuario: 'estudiante', activo: true,
    })
    assert.equal(res.status, 200)
    assert.equal((await unaFila('SELECT activo FROM usuario WHERE id_usuario = $1', [id_usuario])).activo, 1)

    const login = await request(app).post('/api/auth/login').send({ nombre_usuario: `pend_${id}`, password: 'secreta123' })
    assert.equal(login.status, 200)
  })

  test('editar un usuario con el cuerpo incompleto → 400 (no 500)', { todo: 'editarUsuario no valida y responde 500' }, async () => {
    const res = await request(app).patch('/api/usuarios/1').set(admin).send({ activo: true })
    assert.equal(res.status, 400)
  })

  test('listar usuarios: admin 200; estudiante 403', async () => {
    assert.equal((await request(app).get('/api/usuarios').set(admin)).status, 200)
    assert.equal((await request(app).get('/api/usuarios').set(estudiante)).status, 403)
  })
})
