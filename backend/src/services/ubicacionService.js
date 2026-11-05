// src/services/ubicacionService.js
// Recibe GPS del conductor, guarda en BD y emite por socket

import { Ubicacion } from '../models/Ubicacion.js'
import { Bus }       from '../models/Bus.js'
import { Notificacion } from '../models/Notificacion.js'

const DISTANCIA_MINIMA_MOVIMIENTO_M = 25
const UMBRAL_RETRASO_MS = 3 * 60 * 1000
const COOLDOWN_NOTIFICACION_MS = 10 * 60 * 1000
const estadoMovimientoBus = new Map()

function distanciaMetros(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (v) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
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

  // 3. Emitir evento por socket al room de la ruta
  if (io && ruta) {
    io.to(`ruta_${ruta.id_ruta}`).emit('bus:location', {
      id_bus:    idBus,
      lat:       parseFloat(lat),
      lng:       parseFloat(lng),
      timestamp: new Date().toISOString(),
    })
  }

  const bus = await Bus.porId(idBus)
  await detectarRetrasoYNotificar(io, bus, parseFloat(lat), parseFloat(lng))
}