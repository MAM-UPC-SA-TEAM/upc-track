// src/controllers/busController.js
// Endpoints de buses — sirve datos al módulo de Mapas (#09, #11, #13)

import { Bus } from '../models/Bus.js'
import { Notificacion } from '../models/Notificacion.js'
import { velocidadActual } from '../services/ubicacionService.js'
import * as busService from '../services/busService.js'

// GET /api/buses — lista completa
export async function listarBuses(req, res) {
  try {
    const buses = await Bus.todos()
    return res.status(200).json({ buses })
  } catch (error) {
    console.error('Error listando buses:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET /api/buses/activos — buses en servicio con última posición (#09, #13)
// Usado por el mapa para mostrar marcadores y lista lateral
export async function busesActivos(req, res) {
  try {
    // velocidad_kmh: la reciente de cada bus (null sin datos suficientes); el cliente la usa para el ETA
    const buses = (await Bus.activos()).map((b) => ({ ...b, velocidad_kmh: velocidadActual(b.id_bus) }))
    return res.status(200).json({ buses })
  } catch (error) {
    console.error('Error obteniendo buses activos:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET /api/buses/todos-posicion — todos los buses con posición (incluye fuera de servicio)
export async function busesConPosicion(req, res) {
  try {
    const buses = await Bus.todosConPosicion()
    return res.status(200).json({ buses })
  } catch (error) {
    console.error('Error obteniendo buses:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET /api/buses/mi-bus — bus asignado al conductor logueado
export async function miBus(req, res) {
  try {
    const bus = await Bus.porConductor(req.usuario.id_usuario)
    if (!bus) {
      return res.status(404).json({ error: 'No tienes un bus asignado' })
    }
    return res.status(200).json({ bus })
  } catch (error) {
    console.error('Error obteniendo mi bus:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET /api/buses/:id — detalle de un bus
export async function obtenerBus(req, res) {
  try {
    const bus = await Bus.porId(req.params.id)
    if (!bus) {
      return res.status(404).json({ error: 'Bus no encontrado' })
    }
    return res.status(200).json({ bus })
  } catch (error) {
    console.error('Error obteniendo bus:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// POST /api/buses — crear bus
export async function crearBus(req, res) {
  const { nombre, placa } = req.body

  if (!nombre || !placa) {
    return res.status(400).json({ error: 'nombre y placa son obligatorios' })
  }

  try {
    const id_bus = await busService.crear(req.body)
    return res.status(201).json({ ok: true, id_bus })
  } catch (error) {
    if (error.message === 'PLACA_DUPLICADA') {
      return res.status(400).json({ error: 'Ya existe un bus con esa placa' })
    }
    console.error('Error creando bus:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// PATCH /api/buses/:id — editar bus
export async function editarBus(req, res) {
  try {
    await busService.editar(req.params.id, req.body)
    return res.status(200).json({ ok: true })
  } catch (error) {
    if (error.message === 'BUS_NO_ENCONTRADO') {
      return res.status(404).json({ error: 'Bus no encontrado' })
    }
    if (error.message === 'PLACA_DUPLICADA') {
      return res.status(400).json({ error: 'Ya existe un bus con esa placa' })
    }
    console.error('Error editando bus:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// DELETE /api/buses/:id — eliminar bus
export async function eliminarBus(req, res) {
  try {
    await busService.eliminar(req.params.id)
    return res.status(200).json({ ok: true })
  } catch (error) {
    if (error.message === 'BUS_NO_ENCONTRADO') {
      return res.status(404).json({ error: 'Bus no encontrado' })
    }
    console.error('Error eliminando bus:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// PATCH /api/buses/:id/estado — cambiar estado del bus
export async function cambiarEstado(req, res) {
  const { estado } = req.body
  const estadosValidos = ['en_recorrido', 'detenido', 'fuera_de_servicio', 'inactivo']

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Válidos: ${estadosValidos.join(', ')}` })
  }

  try {
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
  } catch (error) {
    console.error('Error cambiando estado:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
