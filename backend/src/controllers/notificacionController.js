// src/controllers/notificacionController.js
// Endpoints para enviar y consultar notificaciones

import { Notificacion } from '../models/Notificacion.js'
import { Bus }          from '../models/Bus.js'
import { io }           from '../server.js'

// POST /api/notificaciones — conductor envía alerta (RF-04)
export async function enviarNotificacion(req, res) {
  const { tipo, mensaje } = req.body
  const id_conductor = req.usuario.id_usuario

  // Validar campos
  if (!tipo || !mensaje || !mensaje.trim()) {
    return res.status(400).json({ error: 'tipo y mensaje son obligatorios' })
  }

  const tiposValidos = ['cambio_ruta', 'retraso', 'info']
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: 'tipo debe ser cambio_ruta, retraso o info' })
  }

  try {
    // Obtener la ruta del bus del conductor
    const [rows] = await (await import('../config/database.js')).pool.query(
      `SELECT br.id_ruta FROM bus b
       JOIN bus_ruta br ON b.id_bus = br.id_bus
       WHERE b.id_conductor = ?`,
      [id_conductor]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No tienes una ruta asignada' })
    }

    const id_ruta = rows[0].id_ruta

    // Guardar en BD
    const id_notificacion = await Notificacion.guardar({
      id_ruta,
      id_conductor,
      tipo,
      mensaje: mensaje.trim(),
    })

    const notificacion = {
      id_notificacion,
      id_ruta,
      tipo,
      mensaje: mensaje.trim(),
      nombre_conductor: req.usuario.nombre,
      fecha_hora: new Date().toISOString(),
    }

    // Emitir a todos los usuarios del room de la ruta (RF-04 — < 5 segundos)
    io.to(`ruta_${id_ruta}`).emit('notificacion:nueva', notificacion)

    return res.status(201).json({ ok: true, notificacion })

  } catch (error) {
    console.error('Error enviando notificación:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET /api/notificaciones — historial del día
export async function listarNotificaciones(req, res) {
  const { ruta_id } = req.query

  try {
    const notificaciones = ruta_id
      ? await Notificacion.porRutaHoy(ruta_id)
      : await Notificacion.hoy()

    return res.status(200).json({ notificaciones })
  } catch (error) {
    console.error('Error listando notificaciones:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
