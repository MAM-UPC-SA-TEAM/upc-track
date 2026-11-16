// src/services/ubicacionService.js
// Recibe GPS del conductor, guarda en BD y emite por socket

import { Ubicacion } from '../models/Ubicacion.js'
import { Bus }       from '../models/Bus.js'
import { Notificacion } from '../models/Notificacion.js'
import { distanciaMetros, velocidadKmh, VENTANA_MS } from '../utils/velocidad.js'

const DISTANCIA_MINIMA_MOVIMIENTO_M = 25
const UMBRAL_RETRASO_MS = 3 * 60 * 1000
const COOLDOWN_NOTIFICACION_MS = 10 * 60 * 1000
const estadoMovimientoBus = new Map()

// Últimas posiciones de cada bus (solo el último minuto): de ahí sale la velocidad reciente para el ETA.
// Vive en memoria: tras reiniciar el servidor tarda ~20 s en tener datos y mientras tanto no hay velocidad (null).
const posicionesRecientes = new Map()

function registrarPosicion(idBus, lat, lng, t = Date.now()) {
  const lista = (posicionesRecientes.get(idBus) || []).filter((p) => t - p.t <= VENTANA_MS)
  lista.push({ lat, lng, t })
  posicionesRecientes.set(idBus, lista)
}

/** Velocidad reciente del bus en km/h, o null si aún no hay datos suficientes. */
export function velocidadActual(idBus, ahora = Date.now()) {
  return velocidadKmh(posicionesRecientes.get(idBus) || [], ahora)
}

/** Solo para pruebas. */
export function olvidarPosiciones() {
  posicionesRecientes.clear()
}

async function detectarRetrasoYNotificar(io, bus, lat, lng) {
  if (!io || !bus?.id_bus || bus.estado !== 'en_recorrido') return

  const ahora = Date.now()
  const previo = estadoMovimientoBus.get(bus.id_bus) || {
    ultimaLat: null,
    ultimaLng: null,
    detenidoDesde: null,
    ultimaNotificacion: 0,
  }

  const actual = {
    ...previo,
    ultimaLat: lat,
    ultimaLng: lng,
  }

  if (previo.ultimaLat != null && previo.ultimaLng != null) {
    const distancia = distanciaMetros(previo.ultimaLat, previo.ultimaLng, lat, lng)
    const seMovio = distancia >= DISTANCIA_MINIMA_MOVIMIENTO_M

    if (seMovio) {
      actual.detenidoDesde = null
      estadoMovimientoBus.set(bus.id_bus, actual)
      return
    }

    if (!actual.detenidoDesde) {
      actual.detenidoDesde = ahora
      estadoMovimientoBus.set(bus.id_bus, actual)
      return
    }

    const tiempoDetenido = ahora - actual.detenidoDesde
    const enCooldown = ahora - (actual.ultimaNotificacion || 0) < COOLDOWN_NOTIFICACION_MS

    if (tiempoDetenido >= UMBRAL_RETRASO_MS && !enCooldown && bus.id_ruta && bus.id_conductor) {
      const minutos = Math.max(1, Math.round(tiempoDetenido / 60000))
      const mensaje = `${bus.nombre} presenta retraso en ${bus.nombre_ruta || 'su ruta'} (detencion de ${minutos} min).`

      const idNotificacion = await Notificacion.guardar({
        id_ruta: bus.id_ruta,
        id_conductor: bus.id_conductor,
        tipo: 'retraso',
        mensaje,
      })

      io.to(`ruta_${bus.id_ruta}`).emit('notificacion:nueva', {
        id_notificacion: idNotificacion,
        id_ruta: bus.id_ruta,
        tipo: 'retraso',
        mensaje,
        nombre_conductor: bus.nombre_conductor,
        nombre_ruta: bus.nombre_ruta,
        fecha_hora: new Date().toISOString(),
      })

      actual.ultimaNotificacion = ahora
    }
  }

  estadoMovimientoBus.set(bus.id_bus, actual)
}

export async function procesarUbicacion(io, idBus, lat, lng) {
  // 1. Guardar en BD
  await Ubicacion.registrarUbicacion(idBus, lat, lng)

  // 2. Obtener la ruta del bus para emitir al room correcto
  const ruta = await Bus.obtenerRuta(idBus)

  registrarPosicion(idBus, parseFloat(lat), parseFloat(lng))

  // 3. Emitir evento por socket al room de la ruta
  if (io && ruta) {
    io.to(`ruta_${ruta.id_ruta}`).emit('bus:location', {
      id_bus:    idBus,
      lat:       parseFloat(lat),
      lng:       parseFloat(lng),
      velocidad_kmh: velocidadActual(idBus),
      timestamp: new Date().toISOString(),
    })
  }

  const bus = await Bus.porId(idBus)
  await detectarRetrasoYNotificar(io, bus, parseFloat(lat), parseFloat(lng))
}