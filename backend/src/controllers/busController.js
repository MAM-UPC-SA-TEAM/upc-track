// src/controllers/busController.js
// Endpoints de buses — sirve datos al módulo de Mapas (#09, #11, #13)

import { Bus } from '../models/Bus.js'
import { Notificacion } from '../models/Notificacion.js'
import { velocidadActual } from '../services/ubicacionService.js'
import * as busService from '../services/busService.js'
import { asyncHandler } from '../middlewares/errorMiddleware.js'
import { notFound } from '../utils/httpError.js'

const PLACA_DUPLICADA = [400, 'Ya existe un bus con esa placa']
const BUS_NO_ENCONTRADO = [404, 'Bus no encontrado']

// GET /api/buses — lista completa
export const listarBuses = asyncHandler(async (req, res) => {
  const buses = await Bus.todos()
  return res.status(200).json({ buses })
})

// GET /api/buses/activos — buses en servicio con última posición (#09, #13)
// Usado por el mapa para mostrar marcadores y lista lateral
export const busesActivos = asyncHandler(async (req, res) => {
  // velocidad_kmh: la reciente de cada bus (null sin datos suficientes); el cliente la usa para el ETA
  const buses = (await Bus.activos()).map((b) => ({ ...b, velocidad_kmh: velocidadActual(b.id_bus) }))
  return res.status(200).json({ buses })
})

// GET /api/buses/todos-posicion — todos los buses con posición (incluye fuera de servicio)
export const busesConPosicion = asyncHandler(async (req, res) => {
  const buses = await Bus.todosConPosicion()
  return res.status(200).json({ buses })
})

// GET /api/buses/mi-bus — bus asignado al conductor logueado
export const miBus = asyncHandler(async (req, res) => {
  const bus = await Bus.porConductor(req.usuario.id_usuario)
  if (!bus) throw notFound('No tienes un bus asignado')
  return res.status(200).json({ bus })
})

// GET /api/buses/:id — detalle de un bus
export const obtenerBus = asyncHandler(async (req, res) => {
  const bus = await Bus.porId(req.params.id)
  if (!bus) throw notFound('Bus no encontrado')
  return res.status(200).json({ bus })
})

// POST /api/buses — crear bus
export const crearBus = asyncHandler(async (req, res) => {
  const { nombre, placa } = req.body

  if (!nombre || !placa) {
    return res.status(400).json({ error: 'nombre y placa son obligatorios' })
  }

  const id_bus = await busService.crear(req.body)
  return res.status(201).json({ ok: true, id_bus })
}, { PLACA_DUPLICADA })

// PATCH /api/buses/:id — editar bus
export const editarBus = asyncHandler(async (req, res) => {
  await busService.editar(req.params.id, req.body)
  return res.status(200).json({ ok: true })
}, { BUS_NO_ENCONTRADO, PLACA_DUPLICADA })

// DELETE /api/buses/:id — eliminar bus
export const eliminarBus = asyncHandler(async (req, res) => {
  await busService.eliminar(req.params.id)
  return res.status(200).json({ ok: true })
}, { BUS_NO_ENCONTRADO })

// PATCH /api/buses/:id/estado — cambiar estado del bus
export const cambiarEstado = asyncHandler(async (req, res) => {
  const { estado } = req.body
  const estadosValidos = ['en_recorrido', 'detenido', 'fuera_de_servicio', 'inactivo']

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Válidos: ${estadosValidos.join(', ')}` })
  }

  await Bus.actualizarEstado(req.params.id, estado)

  // Emitir cambio de estado por socket si io está disponible
  const io = req.app.get('io')
  const bus = await Bus.porId(req.params.id)

  // Notificación automática informativa para usuarios de la ruta.
  if (io && bus && bus.id_ruta) {
    const mensajesPorEstado = {
      en_recorrido: `${bus.nombre} inició su recorrido en ${bus.nombre_ruta || 'su ruta'}.`,
      detenido: `${bus.nombre} se encuentra temporalmente detenido.`,
      fuera_de_servicio: `${bus.nombre} finalizó su recorrido por hoy.`,
    }

    const mensaje = mensajesPorEstado[estado]
    if (mensaje) {
      const idNotificacion = await Notificacion.guardar({
        id_ruta: bus.id_ruta,
        id_conductor: req.usuario.id_usuario,
        tipo: 'info',
        mensaje,
      })

      io.to(`ruta_${bus.id_ruta}`).emit('notificacion:nueva', {
        id_notificacion: idNotificacion,
        id_ruta: bus.id_ruta,
        tipo: 'info',
        mensaje,
        nombre_conductor: req.usuario.nombre,
        nombre_ruta: bus.nombre_ruta,
        fecha_hora: new Date().toISOString(),
      })
    }
  }

  if (io) {
    if (bus && bus.id_ruta) {
      io.to(`ruta_${bus.id_ruta}`).emit('bus:estado', {
        id_bus: Number(req.params.id),
        estado,
      })
    }
  }

  return res.status(200).json({ mensaje: 'Estado actualizado' })
})
