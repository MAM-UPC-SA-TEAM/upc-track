// src/utils/velocidad.js
// Velocidad reciente de un bus a partir de las últimas posiciones que envió el conductor (cada ~4 s).
// Se mide el DESPLAZAMIENTO entre la primera y la última posición de una ventana corta, no la suma de tramos:
// con el bus detenido el GPS «tiembla» unos metros y la suma de tramos inventaría una velocidad.

export const VENTANA_MS = 60_000     // solo cuentan las posiciones del último minuto
export const SPAN_MIN_MS = 20_000    // y hace falta al menos 20 s entre la primera y la última
export const PUNTOS_MIN = 3
export const VELOCIDAD_MAX_KMH = 120 // más que eso es un salto del GPS, no un bus urbano

export function distanciaMetros(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (v) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * @param {Array<{lat:number,lng:number,t:number}>} posiciones  en orden cronológico (t en ms)
 * @param {number} ahora  ms
 * @returns {number|null} km/h con un decimal, o null si no hay datos suficientes (el cliente usa su valor por defecto)
 */
export function velocidadKmh(posiciones, ahora = Date.now()) {
  const recientes = posiciones.filter((p) => ahora - p.t >= 0 && ahora - p.t <= VENTANA_MS)
  if (recientes.length < PUNTOS_MIN) return null

  const primera = recientes[0]
  const ultima = recientes[recientes.length - 1]
  const segundos = (ultima.t - primera.t) / 1000
  if (segundos * 1000 < SPAN_MIN_MS) return null

  const metros = distanciaMetros(primera.lat, primera.lng, ultima.lat, ultima.lng)
  const kmh = (metros / segundos) * 3.6
  if (!Number.isFinite(kmh) || kmh > VELOCIDAD_MAX_KMH) return null
  return Math.round(kmh * 10) / 10
}
