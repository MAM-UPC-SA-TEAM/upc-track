// src/controllers/notificacionController.js
// Endpoints para enviar y consultar notificaciones

import { Notificacion } from '../models/Notificacion.js'
import { Bus }          from '../models/Bus.js'
import { asyncHandler } from '../middlewares/errorMiddleware.js'
import { notFound } from '../utils/httpError.js'

// POST /api/notificaciones — conductor envía alerta (RF-04)
export const enviarNotificacion = asyncHandler(async (req, res) => {
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

  // Obtener la ruta del bus del conductor
  const id_ruta = await Bus.rutaDeConductor(id_conductor)

  if (!id_ruta) throw notFound('No tienes una ruta asignada')

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
  req.app.get('io').to(`ruta_${id_ruta}`).emit('notificacion:nueva', notificacion)

  return res.status(201).json({ ok: true, notificacion })
})

// GET /api/notificaciones/mias — avisos que envió el conductor autenticado
export const listarMisNotificaciones = asyncHandler(async (req, res) => {
  const notificaciones = await Notificacion.porConductor(req.usuario.id_usuario)
  return res.status(200).json({ notificaciones })
})

// GET /api/notificaciones — historial del día
export const listarNotificaciones = asyncHandler(async (req, res) => {
  const { ruta_id } = req.query

  const notificaciones = ruta_id
    ? await Notificacion.porRutaHoy(ruta_id)
    : await Notificacion.hoy()

  return res.status(200).json({ notificaciones })
})
