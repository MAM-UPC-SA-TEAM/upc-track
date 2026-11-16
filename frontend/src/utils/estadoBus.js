import { textoEdad } from './formato'

export const FRESCO_MAX_S = 30 // dato visible actualizado en ≤ 30 s: misma meta en Inicio, Mapa, Buses y conductor

// ¿La posición del bus ya no vale? Sin señal declarada, o «en recorrido» con el último dato de hace más de 30 s.
export function busViejo(bus, edad) {
  return bus.estado === 'sin_senal' || (bus.estado === 'en_recorrido' && edad > FRESCO_MAX_S)
}

// Estado visible del bus: lo vivo es verde; lo vencido, sello rojo; el resto, neutro
export function etiquetaBus(bus, edad) {
  if (busViejo(bus, edad)) return { tipo: 'viejo', texto: `Hace ${textoEdad(edad)}` }
  if (bus.estado === 'en_recorrido') return { tipo: 'vivo', texto: `Validado · ${textoEdad(edad)}` }
  if (bus.estado === 'detenido') return { tipo: 'neutro', texto: 'Detenido' }
  return { tipo: 'neutro', texto: 'Fuera de servicio' }
}

// Entre dos consultas, la antigüedad que mide el servidor (segundos enteros) y la latencia de red varían un poco.
// Por debajo de este margen (menos que el envío del conductor, cada 4 s) la posición se considera la misma.
export const MARGEN_POSICION_NUEVA_MS = 2500

// «Ancla» de cada bus: el momento (ms) en que se registró su última posición. Solo avanza cuando llega una
// posición NUEVA; una consulta que devuelve la misma no la mueve. Así «hace N s» crece sin saltos ni reinicios
// aunque se consulte cada 10 s, y la franja del talón solo se «imprime» con un dato nuevo.
export function actualizarAnclas(previas, buses, ahora = Date.now()) {
  const nuevas = {}
  for (const b of buses) {
    const t = ahora - (Number(b.edad_segundos) || 0) * 1000
    const previa = previas[b.id_bus]
    nuevas[b.id_bus] = previa === undefined || t > previa + MARGEN_POSICION_NUEVA_MS ? t : previa
  }
  return nuevas
}
