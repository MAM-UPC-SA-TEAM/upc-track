// scripts/dev/smoke-api.mjs
// Recorre todas las rutas de la API de punta a punta y guarda, por cada paso, el
// codigo HTTP y la FORMA de la respuesta (nombres de campos y tipos, no valores).
//
// Sirve para comprobar que un cambio en la capa de datos (p. ej. MySQL -> PostgreSQL)
// no altera el contrato de la API: se corre contra dos backends y se comparan los
// archivos de salida.
//
//   node scripts/dev/smoke-api.mjs --base http://localhost:3000 --out salida.json
//
// Requiere el seed de desarrollo (admin / conductor / estudiante, clave Admin123*).
// Todo lo que crea lo borra por la propia API al terminar. No escribe en la BD por SQL.

import { writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d)
const BASE = opt('--base', 'http://localhost:3000').replace(/\/$/, '')
const OUT = opt('--out', null)
const CLAVE = 'Admin123*'

const sufijo = Date.now().toString(36)
const resultados = {}
let fallos = 0

// Reduce un valor JSON a su forma: tipos en vez de valores
function forma(v) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return v.length ? [forma(v[0])] : []
  if (typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, forma(v[k])]))
  return typeof v
}

async function paso(nombre, metodo, ruta, { token, body, esperado } = {}) {
  const res = await fetch(BASE + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  let json = null
  try { json = await res.json() } catch { /* sin cuerpo */ }
  resultados[nombre] = { status: res.status, forma: forma(json) }
  const ok = esperado == null || res.status === esperado
  if (!ok) { fallos++; console.log(`✗ ${nombre}: esperaba ${esperado}, llego ${res.status} ${JSON.stringify(json)}`) }
  else console.log(`✓ ${nombre} -> ${res.status}`)
  return { status: res.status, json }
}

const login = async (usuario) => (await paso(`login ${usuario}`, 'POST', '/api/auth/login', { body: { nombre_usuario: usuario, password: CLAVE }, esperado: 200 })).json.token

// ── Autenticacion ──
await paso('health', 'GET', '/api/health', { esperado: 200 })
const admin = await login('admin')
const conductor = await login('conductor')
const estudiante = await login('estudiante')
await paso('login clave mala', 'POST', '/api/auth/login', { body: { nombre_usuario: 'admin', password: 'incorrecta1' }, esperado: 401 })
await paso('login usuario en mayusculas', 'POST', '/api/auth/login', { body: { nombre_usuario: 'ADMIN', password: CLAVE } })
await paso('me', 'GET', '/api/auth/me', { token: estudiante, esperado: 200 })

// ── Registro ──
const nuevo = { nombre: 'Prueba Smoke', nombre_usuario: `smoke_${sufijo}`, correo: `smoke_${sufijo}@unicesar.edu.co`, password: CLAVE }
const reg = await paso('registro', 'POST', '/api/auth/registro', { body: nuevo, esperado: 201 })
await paso('registro usuario repetido', 'POST', '/api/auth/registro', { body: { ...nuevo, correo: `otro_${sufijo}@unicesar.edu.co` }, esperado: 400 })
await paso('registro correo repetido', 'POST', '/api/auth/registro', { body: { ...nuevo, nombre_usuario: `otro_${sufijo}` }, esperado: 400 })
await paso('registro correo en mayusculas repetido', 'POST', '/api/auth/registro', { body: { ...nuevo, nombre_usuario: `otro2_${sufijo}`, correo: nuevo.correo.toUpperCase() } })
const idNuevo = reg.json.usuario.id_usuario

// ── Usuarios (admin) ──
await paso('usuarios listar', 'GET', '/api/usuarios', { token: admin, esperado: 200 })
await paso('usuarios listar sin permiso', 'GET', '/api/usuarios', { token: estudiante, esperado: 403 })
const u = await paso('usuarios crear', 'POST', '/api/usuarios', { token: admin, body: { nombre: 'Creado Smoke', nombre_usuario: `crea_${sufijo}`, correo: `crea_${sufijo}@unicesar.edu.co`, password: CLAVE, tipo_usuario: 'conductor' }, esperado: 201 })
await paso('usuarios crear repetido', 'POST', '/api/usuarios', { token: admin, body: { nombre: 'Creado Smoke', nombre_usuario: `crea_${sufijo}`, correo: `crea2_${sufijo}@unicesar.edu.co`, password: CLAVE }, esperado: 400 })
await paso('usuarios editar', 'PATCH', `/api/usuarios/${u.json.id_usuario}`, { token: admin, body: { nombre: 'Editado', nombre_usuario: `crea_${sufijo}`, correo: `crea_${sufijo}@unicesar.edu.co`, tipo_usuario: 'estudiante', activo: false }, esperado: 200 })
await paso('usuarios borrar', 'DELETE', `/api/usuarios/${u.json.id_usuario}`, { token: admin, esperado: 200 })

// ── Perfil y contrasena del usuario registrado ──
const tokenNuevo = reg.json.token
await paso('perfil editar', 'PATCH', '/api/usuarios/perfil', { token: tokenNuevo, body: { nombre: 'Prueba Editada', correo: nuevo.correo }, esperado: 200 })
await paso('password cambiar mala', 'PATCH', '/api/usuarios/password', { token: tokenNuevo, body: { password_actual: 'mala12345', password_nueva: 'Nueva1234*' }, esperado: 401 })
await paso('password cambiar', 'PATCH', '/api/usuarios/password', { token: tokenNuevo, body: { password_actual: CLAVE, password_nueva: 'Nueva1234*' }, esperado: 200 })

// ── Rutas, paradas y horarios ──
await paso('rutas listar', 'GET', '/api/rutas', { token: estudiante, esperado: 200 })
await paso('ruta detalle', 'GET', '/api/rutas/1', { token: estudiante, esperado: 200 })
await paso('ruta inexistente', 'GET', '/api/rutas/99999', { token: estudiante, esperado: 404 })
const r = await paso('ruta crear', 'POST', '/api/rutas', { token: admin, body: { nombre: `Ruta smoke ${sufijo}`, descripcion: 'temporal' }, esperado: 201 })
const idRuta = r.json.id_ruta
await paso('ruta editar', 'PATCH', `/api/rutas/${idRuta}`, { token: admin, body: { nombre: `Ruta smoke ${sufijo} b`, descripcion: 'x', activa: false }, esperado: 200 })

await paso('paradas listar', 'GET', '/api/paradas', { token: estudiante, esperado: 200 })
const p = await paso('parada crear', 'POST', '/api/paradas', { token: admin, body: { nombre: 'Parada smoke', lat: 8.31, lng: -73.61, ruta_id: idRuta, orden: 1 }, esperado: 201 })
const idParada = p.json.id_parada
await paso('parada editar', 'PATCH', `/api/paradas/${idParada}`, { token: admin, body: { nombre: 'Parada smoke b', lat: 8.32, lng: -73.62, ruta_id: idRuta, orden: 2, activa: false }, esperado: 200 })
await paso('paradas listar con la nueva', 'GET', '/api/paradas', { token: estudiante, esperado: 200 })

await paso('horarios listar', 'GET', '/api/horarios', { token: estudiante, esperado: 200 })
const h = await paso('horario crear', 'POST', '/api/horarios', { token: admin, body: { ruta_id: idRuta, hora_salida: '05:15', hora_llegada: '05:45' }, esperado: 201 })
await paso('horarios por ruta', 'GET', `/api/horarios?ruta_id=${idRuta}`, { token: estudiante, esperado: 200 })
await paso('horario editar', 'PATCH', `/api/horarios/${h.json.id_horario}`, { token: admin, body: { hora_salida: '05:20', hora_llegada: '05:50' }, esperado: 200 })
await paso('horario borrar', 'DELETE', `/api/horarios/${h.json.id_horario}`, { token: admin, esperado: 200 })

// ── Buses ──
await paso('buses listar', 'GET', '/api/buses', { token: estudiante, esperado: 200 })
const placa = `SM${sufijo}`.toUpperCase().slice(0, 10)
const b = await paso('bus crear', 'POST', '/api/buses', { token: admin, body: { nombre: 'Bus smoke', placa, id_ruta: idRuta }, esperado: 201 })
const idBus = b.json.id_bus
await paso('bus placa repetida', 'POST', '/api/buses', { token: admin, body: { nombre: 'Bus smoke 2', placa }, esperado: 400 })
await paso('bus placa repetida en minusculas', 'POST', '/api/buses', { token: admin, body: { nombre: 'Bus smoke 3', placa: placa.toLowerCase() } })
await paso('bus detalle', 'GET', `/api/buses/${idBus}`, { token: estudiante, esperado: 200 })
await paso('bus editar', 'PATCH', `/api/buses/${idBus}`, { token: admin, body: { nombre: 'Bus smoke b', placa, capacidad: 30, estado: 'detenido', id_ruta: idRuta }, esperado: 200 })
await paso('buses todos con posicion', 'GET', '/api/buses/todos-posicion', { token: estudiante, esperado: 200 })

// ── Flujo del conductor (bus demo del seed) ──
const mi = await paso('mi bus', 'GET', '/api/buses/mi-bus', { token: conductor, esperado: 200 })
const miId = mi.json.bus.id_bus
await paso('estado en recorrido', 'PATCH', `/api/buses/${miId}/estado`, { token: conductor, body: { estado: 'en_recorrido' }, esperado: 200 })
await paso('ubicacion enviar', 'POST', '/api/ubicacion', { token: conductor, body: { id_bus: miId, lat: 8.311, lng: -73.616 }, esperado: 200 })
await paso('ubicacion enviar 2', 'POST', '/api/ubicacion', { token: conductor, body: { id_bus: miId, lat: 8.312, lng: -73.615 }, esperado: 200 })
await paso('buses activos', 'GET', '/api/buses/activos', { token: estudiante, esperado: 200 })
await paso('mi bus con ubicacion', 'GET', '/api/buses/mi-bus', { token: conductor, esperado: 200 })
await paso('notificacion enviar', 'POST', '/api/notificaciones', { token: conductor, body: { tipo: 'info', mensaje: 'Prueba smoke' }, esperado: 201 })
await paso('notificaciones hoy', 'GET', '/api/notificaciones', { token: estudiante, esperado: 200 })
await paso('notificaciones por ruta', 'GET', '/api/notificaciones?ruta_id=1', { token: estudiante, esperado: 200 })
await paso('estado fuera de servicio', 'PATCH', `/api/buses/${miId}/estado`, { token: conductor, body: { estado: 'fuera_de_servicio' }, esperado: 200 })
await paso('logout conductor', 'POST', '/api/auth/logout', { token: conductor, esperado: 200 })
await paso('mi bus tras logout', 'GET', '/api/buses/mi-bus', { token: conductor, esperado: 200 })

// ── Limpieza por la API ──
await paso('bus borrar', 'DELETE', `/api/buses/${idBus}`, { token: admin, esperado: 200 })
await paso('parada borrar', 'DELETE', `/api/paradas/${idParada}`, { token: admin, esperado: 200 })
await paso('ruta borrar', 'DELETE', `/api/rutas/${idRuta}`, { token: admin, esperado: 200 })
await paso('usuario registrado borrar', 'DELETE', `/api/usuarios/${idNuevo}`, { token: admin, esperado: 200 })

if (OUT) writeFileSync(OUT, JSON.stringify(resultados, null, 2))
console.log(fallos ? `\n${fallos} paso(s) con resultado inesperado` : '\nTodos los pasos dieron el codigo esperado')
process.exit(fallos ? 1 : 0)
