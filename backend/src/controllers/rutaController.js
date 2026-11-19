// src/controllers/rutaController.js
// Endpoints de rutas — Issue #14 (Vista de rutas disponibles)

import { Ruta } from '../models/Ruta.js'
import * as rutaService from '../services/rutaService.js'
import { asyncHandler } from '../middlewares/errorMiddleware.js'
import { notFound } from '../utils/httpError.js'

const ERRORES_RUTA = { RUTA_NO_ENCONTRADA: [404, 'Ruta no encontrada'] }

// GET /api/rutas — lista de rutas con conteo de paradas
export const listarRutas = asyncHandler(async (req, res) => {
  const rutas = await Ruta.todas()
  return res.status(200).json({ rutas })
})

// GET /api/rutas/:id — detalle de una ruta
export const obtenerRuta = asyncHandler(async (req, res) => {
  const ruta = await Ruta.porId(req.params.id)
  if (!ruta) throw notFound('Ruta no encontrada')
  return res.status(200).json({ ruta })
})

// POST /api/rutas
export const crearRuta = asyncHandler(async (req, res) => {
  const { nombre, descripcion, activa } = req.body
  if (!nombre) return res.status(400).json({ error: 'nombre es obligatorio' })

  const id_ruta = await rutaService.crear({ nombre, descripcion, activa })
  return res.status(201).json({ ok: true, id_ruta })
})

// PATCH /api/rutas/:id
export const editarRuta = asyncHandler(async (req, res) => {
  await rutaService.editar(req.params.id, req.body)
  return res.status(200).json({ ok: true })
}, ERRORES_RUTA)

// DELETE /api/rutas/:id
export const eliminarRuta = asyncHandler(async (req, res) => {
  await rutaService.eliminar(req.params.id)
  return res.status(200).json({ ok: true })
}, ERRORES_RUTA)
