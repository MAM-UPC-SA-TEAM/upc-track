// Movimiento suave del marcador del bus entre dos posiciones GPS (U30).
// El conductor envía una posición cada ~4 s: sin interpolar, el bus «teletransporta» ~28 m en cada una.

export const SALTO_MAX_M = 400      // más lejos que esto no es un bus que avanza (reconexión, GPS): se coloca sin animar
export const DESPLAZAMIENTO_MIN_M = 0.5 // menos que esto es ruido: no vale la pena animar
export const DURACION_MIN_MS = 600
export const DURACION_MAX_MS = 4500

const acotar = (v, min, max) => Math.min(max, Math.max(min, v))

/**
 * ¿Se anima el cambio de posición o se coloca de una vez?
 * @param {number} distanciaM  metros entre donde se ve el marcador ahora y la posición nueva
 * @param {number} intervaloMs tiempo desde la posición anterior (0 si es la primera)
 */
export function debeAnimar({ distanciaM, intervaloMs, reducirMovimiento = false }) {
  if (reducirMovimiento || !intervaloMs) return false
  return distanciaM >= DESPLAZAMIENTO_MIN_M && distanciaM <= SALTO_MAX_M
}

/** El movimiento dura lo que tardó en llegar la posición: así es continuo y no a tirones. */
export const duracionMovimiento = (intervaloMs) => acotar(intervaloMs, DURACION_MIN_MS, DURACION_MAX_MS)

/** Posición a la fracción t (0–1) del trayecto. Lineal: el movimiento constante no acelera ni frena. */
export function interpolar(desde, hasta, t) {
  const k = acotar(t, 0, 1)
  return [desde[0] + (hasta[0] - desde[0]) * k, desde[1] + (hasta[1] - desde[1]) * k]
}
