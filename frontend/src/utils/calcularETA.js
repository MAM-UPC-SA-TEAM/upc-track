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

/**
 * Calcula el ETA en minutos del bus más cercano a una parada.
 * Velocidad promedio estimada: 25 km/h (zona urbana Aguachica).
 *
 * @param {Object} parada  - { lat, lng }
 * @param {Array}  buses   - [{ id_bus, lat, lng, estado, ... }]
 * @param {number} velocidadKmH - velocidad promedio (default 25)
 * @returns {{ etaMinutos: number|null, busCercano: Object|null, distanciaKmVal: number|null }}
 */
export function calcularETA(parada, buses, velocidadKmH = 25) {
  // Solo considerar buses en recorrido con coordenadas válidas
  const busesActivos = buses.filter(
    (b) => b.estado === 'en_recorrido' && b.lat != null && b.lng != null
  )

  if (busesActivos.length === 0) {
    return { etaMinutos: null, busCercano: null, distanciaKmVal: null }
  }

  let busCercano = null
  let menorDistancia = Infinity

  for (const bus of busesActivos) {
    const d = distanciaKm(bus.lat, bus.lng, parada.lat, parada.lng)
    if (d < menorDistancia) {
      menorDistancia = d
      busCercano = bus
    }
  }

  const etaMinutos = Math.round((menorDistancia / velocidadKmH) * 60)

  return {
    etaMinutos,
    busCercano,
    distanciaKmVal: Math.round(menorDistancia * 100) / 100,
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
