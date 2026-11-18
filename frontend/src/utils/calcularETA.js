// src/utils/calcularETA.js
// Calcula el tiempo estimado de llegada (ETA) de un bus a una parada
// Issue #12 — Tiempo estimado de llegada a parada

/**
 * Calcula la distancia en km entre dos coordenadas usando la fórmula de Haversine
 */
export function distanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371 // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg) {
  return (deg * Math.PI) / 180
}

// Velocidad con la que se estima la llegada. El servidor manda la velocidad reciente de cada bus (velocidad_kmh,
// medida con sus últimas posiciones); sin ella se usa un valor urbano por defecto. Piso y techo evitan estimaciones
// absurdas: un bus detenido en un semáforo no da «una hora» ni un salto del GPS da «ya llegó».
export const VELOCIDAD_DEFECTO_KMH = 25
export const VELOCIDAD_MIN_KMH = 10
export const VELOCIDAD_MAX_KMH = 40

/** ¿El bus trae una velocidad reciente medida por el servidor? */
export function tieneVelocidadReciente(bus) {
  return bus?.velocidad_kmh != null && Number.isFinite(Number(bus.velocidad_kmh))
}

/** Velocidad (km/h) para estimar la llegada de ese bus: la reciente con piso y techo, o la de por defecto. */
export function velocidadParaETA(bus) {
  if (!tieneVelocidadReciente(bus)) return VELOCIDAD_DEFECTO_KMH
  return Math.min(VELOCIDAD_MAX_KMH, Math.max(VELOCIDAD_MIN_KMH, Number(bus.velocidad_kmh)))
}

/** Minutos (sin redondear) para recorrer `km` a la velocidad de ese bus (o a `velocidadKmH`, si se fija). */
function minutosExactos(km, bus, velocidadKmH) {
  const v = Number.isFinite(velocidadKmH) ? velocidadKmH : velocidadParaETA(bus)
  return (km / v) * 60
}

/** Minutos redondeados para recorrer `km` a la velocidad de ese bus (o a `velocidadKmH`, si se fija). */
export function minutosHasta(km, bus, velocidadKmH) {
  return Math.round(minutosExactos(km, bus, velocidadKmH))
}

// ── Patrón Strategy ──────────────────────────────────────────────────────────────────────────────────
// Una estrategia decide CÓMO se estima la llegada de UN bus a una parada; calcularETA decide CUÁL bus llega
// antes y no sabe nada del algoritmo. Para otro cálculo (p. ej. por el trazado de la ruta o con tráfico) basta
// con otra estrategia, sin tocar a quien invoca calcularETA (principio abierto/cerrado).
//
//   interface EstrategiaETA {
//     nombre: string
//     estimar(parada: { lat, lng }, bus: { lat, lng, velocidad_kmh? }): { minutos: number, distanciaKm: number }
//   }
//
// `minutos` va sin redondear (sirve para comparar buses); calcularETA redondea solo el resultado final.

/** Línea recta (Haversine) a la velocidad reciente de cada bus, con piso y techo (ver velocidadParaETA). */
export const estrategiaLineal = {
  nombre: 'lineal',
  estimar(parada, bus) {
    const distancia = distanciaKm(bus.lat, bus.lng, parada.lat, parada.lng)
    return { minutos: minutosExactos(distancia, bus), distanciaKm: distancia }
  },
}

/** Línea recta a una velocidad fija para todos los buses (ignora `velocidad_kmh`). */
export function estrategiaVelocidadFija(velocidadKmH) {
  return {
    nombre: `velocidad-fija-${velocidadKmH}`,
    estimar(parada, bus) {
      const distancia = distanciaKm(bus.lat, bus.lng, parada.lat, parada.lng)
      return { minutos: minutosExactos(distancia, bus, velocidadKmH), distanciaKm: distancia }
    },
  }
}

/**
 * Calcula el ETA en minutos del bus que llegará antes a una parada (el de menor tiempo, que con velocidades
 * distintas no siempre es el más cercano). Cómo se estima cada bus lo decide la estrategia.
 *
 * @param {Object} parada  - { lat, lng }
 * @param {Array}  buses   - [{ id_bus, lat, lng, estado, velocidad_kmh?, ... }]
 * @param {Object} [estrategia=estrategiaLineal] - ver EstrategiaETA
 * @returns {{ etaMinutos: number|null, busCercano: Object|null, distanciaKmVal: number|null }}
 */
export function calcularETA(parada, buses, estrategia = estrategiaLineal) {
  // Solo considerar buses en recorrido con coordenadas válidas
  const busesActivos = buses.filter(
    (b) => b.estado === 'en_recorrido' && b.lat != null && b.lng != null
  )

  if (busesActivos.length === 0) {
    return { etaMinutos: null, busCercano: null, distanciaKmVal: null }
  }

  let busCercano = null
  let mejor = null

  for (const bus of busesActivos) {
    const e = estrategia.estimar(parada, bus)
    if (!mejor || e.minutos < mejor.minutos || (e.minutos === mejor.minutos && e.distanciaKm < mejor.distanciaKm)) {
      mejor = e
      busCercano = bus
    }
  }

  return {
    etaMinutos: Math.round(mejor.minutos),
    busCercano,
    distanciaKmVal: Math.round(mejor.distanciaKm * 100) / 100,
  }
}

/**
 * Formatea el ETA para mostrar en la UI
 */
export function formatearETA(etaMinutos) {
  if (etaMinutos === null) return 'Sin estimación'
  if (etaMinutos < 1) return '< 1 min'
  if (etaMinutos > 30) return '> 30 min'
  return `${etaMinutos} min`
}
