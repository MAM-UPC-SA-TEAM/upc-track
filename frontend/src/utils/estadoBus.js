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
