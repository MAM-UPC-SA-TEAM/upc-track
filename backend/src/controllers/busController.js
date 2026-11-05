// src/controllers/busController.js
// Endpoints de buses — sirve datos al módulo de Mapas (#09, #11, #13)

import { Bus } from '../models/Bus.js'
import { Notificacion } from '../models/Notificacion.js'

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
    const buses = await Bus.activos()
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
  const { nombre, placa, capacidad, id_ruta, estado, id_conductor } = req.body

  if (!nombre || !placa) {
    return res.status(400).json({ error: 'nombre y placa son obligatorios' })
  }

  try {
    const [result] = await (await import('../config/database.js')).pool.query(
      `INSERT INTO bus (nombre, placa, capacidad, estado, id_conductor)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, placa, capacidad || 45, estado || 'inactivo', id_conductor || null]
    )
    const id_bus = result.insertId

    // Asignar ruta si viene
    if (id_ruta) {
      await (await import('../config/database.js')).pool.query(
        `INSERT INTO bus_ruta (id_bus, id_ruta) VALUES (?, ?)`,
        [id_bus, id_ruta]
      )
    }

    return res.status(201).json({ ok: true, id_bus })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un bus con esa placa' })
    }
    console.error('Error creando bus:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// PATCH /api/buses/:id — editar bus
export async function editarBus(req, res) {
  const { id } = req.params
  const { nombre, placa, capacidad, estado, id_ruta, id_conductor } = req.body

  try {
    await (await import('../config/database.js')).pool.query(
      `UPDATE bus SET nombre=?, placa=?, capacidad=?, estado=?, id_conductor=?
       WHERE id_bus=?`,
      [nombre, placa, capacidad || 45, estado, id_conductor || null, id]
    )

    if (id_ruta !== undefined) {
      const { pool } = await import('../config/database.js')
      // Elimina cualquier asignación anterior antes de insertar la nueva
      await pool.query(`DELETE FROM bus_ruta WHERE id_bus = ?`, [id])
      if (id_ruta) {
        await pool.query(
          `INSERT INTO bus_ruta (id_bus, id_ruta) VALUES (?, ?)`,
          [id, id_ruta]
        )
      }
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error editando bus:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// DELETE /api/buses/:id — eliminar bus
export async function eliminarBus(req, res) {
  const { id } = req.params
  try {
    await (await import('../config/database.js')).pool.query(
      `DELETE FROM bus WHERE id_bus = ?`, [id]
    )
    return res.status(200).json({ ok: true })
  } catch (error) {
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
        en_recorrido: `${bus.nombre} inicio su recorrido en ${bus.nombre_ruta || 'su ruta'}.`,
        detenido: `${bus.nombre} se encuentra temporalmente detenido.`,
        fuera_de_servicio: `${bus.nombre} finalizo su recorrido por hoy.`,
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
