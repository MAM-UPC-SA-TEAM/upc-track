// scripts/dev/smoke-ws.mjs
// Prueba de extremo a extremo de Socket.IO contra un backend desplegado (D08):
//   1. login de conductor y estudiante (JWT)
//   2. el estudiante se une al room de la ruta del bus del conductor
//   3. el conductor envia posiciones por POST /api/ubicacion y por el evento
//      'conductor:ubicacion'; el estudiante debe recibir 'bus:location'
//   4. reconexion: se corta el transporte del estudiante y debe volver solo
//   5. inactividad: se espera --idle segundos y se comprueba que el socket sigue vivo
//
//   COND_USER=... COND_PASS=... EST_USER=... EST_PASS=... \
//     node scripts/dev/smoke-ws.mjs --base https://upc-track.onrender.com \
//       --origin https://upc-track.manuel0726tocora.workers.dev --idle 60
//
// Las credenciales se leen SOLO de variables de entorno. Escribe posiciones reales
// en la BD (POST /api/ubicacion), cerca de la ruta demo.

import { createRequire } from 'node:module'
const require = createRequire(new URL('../../frontend/package.json', import.meta.url))
const { io } = require('socket.io-client')

const args = process.argv.slice(2)
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d)
const BASE = opt('--base', 'http://localhost:3000').replace(/\/$/, '')
const ORIGIN = opt('--origin', undefined)
const IDLE = Number(opt('--idle', '30'))
const { COND_USER, COND_PASS, EST_USER, EST_PASS } = process.env

if (!COND_USER || !COND_PASS || !EST_USER || !EST_PASS) {
  console.error('Define COND_USER, COND_PASS, EST_USER y EST_PASS en el entorno.')
  process.exit(1)
}

let fallos = 0
const ok = (m) => console.log(`  ✓ ${m}`)
const ko = (m) => { fallos++; console.log(`  ✗ ${m}`) }
const check = (c, m) => (c ? ok(m) : ko(m))
const espera = (ms) => new Promise((r) => setTimeout(r, ms))

async function api(path, { token, body } = {}) {
  const t0 = Date.now()
  const res = await fetch(BASE + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(ORIGIN ? { Origin: ORIGIN } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json, ms: Date.now() - t0 }
}

function conectar(token) {
  return io(BASE, {
    transports: ['websocket'],
    auth: { token },
    extraHeaders: ORIGIN ? { Origin: ORIGIN } : undefined,
    reconnectionDelay: 500,
  })
}

const esperarEvento = (socket, evento, ms = 15000) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout esperando ${evento}`)), ms)
    socket.once(evento, (d) => { clearTimeout(t); resolve(d) })
  })

console.log(`Backend: ${BASE}`)
console.log('1. Login (puede tardar si el servidor esta dormido)')
const lc = await api('/api/auth/login', { body: { nombre_usuario: COND_USER, password: COND_PASS } })
const le = await api('/api/auth/login', { body: { nombre_usuario: EST_USER, password: EST_PASS } })
check(lc.status === 200 && lc.json.token, `conductor autenticado (${lc.ms} ms)`)
check(le.status === 200 && le.json.token, `estudiante autenticado (${le.ms} ms)`)
if (fallos) process.exit(1)

const miBus = await api('/api/buses/mi-bus', { token: lc.json.token })
const bus = miBus.json.bus
check(miBus.status === 200 && bus, `conductor tiene bus asignado (id_bus=${bus?.id_bus}, id_ruta=${bus?.id_ruta})`)
if (fallos) process.exit(1)
const { id_bus, id_ruta } = bus

console.log('2. Conexion WebSocket y room')
const est = conectar(le.json.token)
const cond = conectar(lc.json.token)
try {
  await Promise.all([esperarEvento(est, 'connect'), esperarEvento(cond, 'connect')])
  ok(`ambos sockets conectados (transporte: ${est.io.engine.transport.name})`)
} catch (e) { ko(e.message); process.exit(1) }

est.emit('join:ruta', { id_ruta })
cond.emit('join:ruta', { id_ruta })
try {
  const c = await esperarEvento(est, 'join:confirmado')
  check(c.id_ruta === id_ruta, `estudiante unido a ${c.room}`)
} catch (e) { ko(e.message) }
await espera(300)

console.log('3. Posicion del conductor -> mapa del estudiante')
const base = { lat: 8.3088, lng: -73.6163 }

let recibido = esperarEvento(est, 'bus:location')
let t0 = Date.now()
const post = await api('/api/ubicacion', { token: lc.json.token, body: { id_bus, ...base } })
check(post.status === 200, `POST /api/ubicacion 200 (${post.ms} ms)`)
try {
  const d = await recibido
  check(d.id_bus === id_bus && Math.abs(d.lat - base.lat) < 1e-6, `estudiante recibio bus:location por HTTP+socket (${Date.now() - t0} ms)`)
} catch (e) { ko(e.message) }

recibido = esperarEvento(est, 'bus:location')
t0 = Date.now()
cond.emit('conductor:ubicacion', { id_bus, id_ruta, lat: base.lat + 0.0005, lng: base.lng + 0.0005 })
try {
  const d = await recibido
  check(d.id_bus === id_bus, `estudiante recibio bus:location por evento conductor:ubicacion (${Date.now() - t0} ms)`)
} catch (e) { ko(e.message) }

console.log('4. Reconexion automatica')
const antes = est.id
est.io.engine.close() // simula corte de red sin desconexion "limpia"
try {
  await esperarEvento(est, 'connect', 20000)
  ok(`estudiante reconecto solo (id ${antes} -> ${est.id})`)
  est.emit('join:ruta', { id_ruta })
  await esperarEvento(est, 'join:confirmado')
  recibido = esperarEvento(est, 'bus:location')
  await api('/api/ubicacion', { token: lc.json.token, body: { id_bus, lat: base.lat + 0.001, lng: base.lng + 0.001 } })
  await recibido
  ok('tras reconectar y volver a unirse al room, vuelve a recibir posiciones')
} catch (e) { ko(`reconexion: ${e.message}`) }

console.log(`5. Inactividad de ${IDLE} s`)
await espera(IDLE * 1000)
check(est.connected && cond.connected, 'ambos sockets siguen conectados tras la inactividad')
try {
  recibido = esperarEvento(est, 'bus:location')
  cond.emit('conductor:ubicacion', { id_bus, id_ruta, lat: base.lat, lng: base.lng })
  await recibido
  ok('sigue entregando posiciones tras la inactividad')
} catch (e) { ko(e.message) }

est.close()
cond.close()
console.log(fallos ? `\n${fallos} comprobacion(es) fallaron` : '\nTodo OK')
process.exit(fallos ? 1 : 0)
