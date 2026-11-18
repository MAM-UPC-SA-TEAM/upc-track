// scripts/dev/simular-recorrido.mjs
// Simula a un conductor: pone su bus «en recorrido» y envía una posición cada pocos segundos recorriendo
// las paradas de su ruta de ida y vuelta. Sirve para demostraciones en un salón (sin bus real), ensayos
// y pruebas de usabilidad. Ctrl+C deja el bus «fuera de servicio».
//
//   COND_USER=conductor COND_PASS=... node scripts/dev/simular-recorrido.mjs \
//     [--base http://localhost:3000] [--origin https://...] [--velocidad 25] [--intervalo 4] \
//     [--pausa-parada 6] [--vueltas 0] [--confirmar-produccion]
//
// Las credenciales se leen SOLO del entorno. Escribe posiciones reales en la base del backend indicado: contra
// un backend que no sea local exige --confirmar-produccion (el bus del conductor aparecerá en el mapa de todos).

import { pathToFileURL } from 'node:url'

const R_TIERRA_M = 6371000
const rad = (g) => (g * Math.PI) / 180

/** Distancia en metros entre dos puntos { lat, lng } (Haversine). */
export function distanciaM(a, b) {
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R_TIERRA_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/** Largo total de una línea quebrada de puntos { lat, lng }, en metros. */
export function largoM(puntos) {
  let t = 0
  for (let i = 1; i < puntos.length; i++) t += distanciaM(puntos[i - 1], puntos[i])
  return t
}

/**
 * Punto a `dM` metros del inicio de la línea quebrada. Se queda en el extremo si se pasa del final
 * o en el inicio si es negativo. Devuelve también el índice de la parada más cercana por detrás.
 */
export function posicionEnRuta(puntos, dM) {
  if (puntos.length < 2) throw new Error('Se necesitan al menos 2 puntos')
  if (dM <= 0) return { lat: puntos[0].lat, lng: puntos[0].lng, indice: 0 }
  let resto = dM
  for (let i = 1; i < puntos.length; i++) {
    const tramo = distanciaM(puntos[i - 1], puntos[i])
    if (resto <= tramo) {
      const f = tramo === 0 ? 0 : resto / tramo
      return {
        lat: puntos[i - 1].lat + (puntos[i].lat - puntos[i - 1].lat) * f,
        lng: puntos[i - 1].lng + (puntos[i].lng - puntos[i - 1].lng) * f,
        indice: f === 1 ? i : i - 1,
      }
    }
    resto -= tramo
  }
  const fin = puntos[puntos.length - 1]
  return { lat: fin.lat, lng: fin.lng, indice: puntos.length - 1 }
}

/** Ida y vuelta: las paradas y luego las mismas en orden inverso (sin repetir la última). */
export function idaYVuelta(paradas) {
  return [...paradas, ...paradas.slice(0, -1).reverse()]
}

async function main() {
  const args = process.argv.slice(2)
  const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d)
  const BASE = opt('--base', 'http://localhost:3000').replace(/\/$/, '')
  const ORIGIN = opt('--origin', undefined)
  const VEL_KMH = Number(opt('--velocidad', '25'))
  const INTERVALO_S = Number(opt('--intervalo', '4'))
  const PAUSA_S = Number(opt('--pausa-parada', '0'))
  const VUELTAS = Number(opt('--vueltas', '0')) // 0 = hasta Ctrl+C
  const { COND_USER, COND_PASS } = process.env

  if (!COND_USER || !COND_PASS) {
    console.error('Define COND_USER y COND_PASS (credenciales de un conductor con bus asignado) en el entorno.')
    process.exit(1)
  }
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE)
  if (!local && !args.includes('--confirmar-produccion')) {
    console.error(`«${BASE}» no es un backend local: esto escribirá posiciones reales visibles para todos. Repite con --confirmar-produccion si es lo que quieres.`)
    process.exit(1)
  }
  if (!(VEL_KMH > 0) || !(INTERVALO_S > 0)) {
    console.error('--velocidad e --intervalo deben ser números positivos.')
    process.exit(1)
  }

  const cabeceras = (token) => ({ 'Content-Type': 'application/json', ...(ORIGIN ? { Origin: ORIGIN } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) })
  const api = async (metodo, ruta, token, cuerpo) => {
    const r = await fetch(BASE + ruta, { method: metodo, headers: cabeceras(token), body: cuerpo ? JSON.stringify(cuerpo) : undefined })
    const datos = await r.json().catch(() => null)
    if (!r.ok) throw Object.assign(new Error(datos?.error || `HTTP ${r.status}`), { status: r.status })
    return datos
  }

  console.log(`Backend: ${BASE} (puede tardar hasta 1 min si está dormido)`)
  const { token } = await api('POST', '/api/auth/login', null, { nombre_usuario: COND_USER, password: COND_PASS })
  const { bus } = await api('GET', '/api/buses/mi-bus', token)
  const { paradas } = await api('GET', '/api/paradas', token)
  const puntos = paradas
    .filter((p) => p.id_ruta === bus.id_ruta)
    .sort((a, b) => a.orden - b.orden)
    .map((p) => ({ lat: Number(p.lat), lng: Number(p.lng), nombre: p.nombre }))
  if (puntos.length < 2) throw new Error(`La ruta «${bus.nombre_ruta}» tiene menos de 2 paradas: no hay recorrido que simular.`)

  const recorrido = idaYVuelta(puntos)
  const total = largoM(recorrido)
  const pasoM = (VEL_KMH * 1000 / 3600) * INTERVALO_S
  console.log(`Bus «${bus.nombre}» (${bus.placa}) · ruta «${bus.nombre_ruta}» · ${puntos.length} paradas · vuelta de ${(total / 1000).toFixed(2)} km a ${VEL_KMH} km/h (un envío cada ${INTERVALO_S} s)`)

  let detenido = false
  const terminar = async () => {
    if (detenido) return
    detenido = true
    try { await api('PATCH', `/api/buses/${bus.id_bus}/estado`, token, { estado: 'fuera_de_servicio' }) } catch { /* sin red: el bus caduca por antigüedad */ }
    console.log('\nSimulación terminada: bus fuera de servicio.')
    process.exit(0)
  }
  process.on('SIGINT', terminar)
  process.on('SIGTERM', terminar)

  await api('PATCH', `/api/buses/${bus.id_bus}/estado`, token, { estado: 'en_recorrido' })
  const dormir = (s) => new Promise((r) => setTimeout(r, s * 1000))
  let d = 0
  let vuelta = 0
  let ultimaParada = -1
  while (!detenido) {
    const pos = posicionEnRuta(recorrido, d)
    try {
      await api('POST', '/api/ubicacion', token, { id_bus: bus.id_bus, lat: pos.lat, lng: pos.lng })
      console.log(`${new Date().toLocaleTimeString('es-CO')}  vuelta ${vuelta + 1}  ${(d / 1000).toFixed(2)} km  (${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)})`)
    } catch (e) {
      console.error(`Envío fallido: ${e.message}`)
      if (e.status === 401 || e.status === 403) return terminar()
    }
    if (PAUSA_S > 0 && pos.indice !== ultimaParada && distanciaM(pos, recorrido[pos.indice]) < pasoM / 2) {
      ultimaParada = pos.indice
      console.log(`  parada «${recorrido[pos.indice].nombre}»: espera ${PAUSA_S} s`)
      await dormir(PAUSA_S)
    }
    await dormir(INTERVALO_S)
    d += pasoM
    if (d >= total) {
      d = 0
      vuelta++
      ultimaParada = -1
      if (VUELTAS > 0 && vuelta >= VUELTAS) return terminar()
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(`Error: ${e.message}`); process.exit(1) })
}
