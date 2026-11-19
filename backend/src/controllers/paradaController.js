// src/controllers/paradaController.js
// Endpoints para consultar paradas — Issue #10

import { Parada } from '../models/Parada.js'
import { asyncHandler } from '../middlewares/errorMiddleware.js'
import { notFound } from '../utils/httpError.js'

// GET /api/paradas — todas, o filtrar con ?ruta_id=X
export const listarParadas = asyncHandler(async (req, res) => {
  const { ruta_id } = req.query

  if (ruta_id) {
    const paradas = await Parada.porRuta(ruta_id)
    return res.status(200).json({ paradas })
  }

  const paradas = await Parada.todas()
  return res.status(200).json({ paradas })
})

export const crearParada = asyncHandler(async (req, res) => {
  const { nombre, lat, lng, activa = true, ruta_id, orden } = req.body

  if (!nombre || lat == null || lng == null || !ruta_id || orden == null) {
    return res.status(400).json({ error: 'nombre, lat, lng, ruta_id y orden son obligatorios' })
  }

  const latNum = Number(lat)
  const lngNum = Number(lng)
  const ordenNum = Number(orden)

  if (Number.isNaN(latNum) || Number.isNaN(lngNum) || Number.isNaN(ordenNum)) {
    return res.status(400).json({ error: 'lat, lng y orden deben ser numeros validos' })
  }

  const idParada = await Parada.crear({
    nombre,
    lat: latNum,
    lng: lngNum,
    activa,
    idRuta: Number(ruta_id),
    orden: ordenNum,
  })
  return res.status(201).json({ ok: true, id_parada: idParada })
})

export const editarParada = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { nombre, lat, lng, activa = true, ruta_id, orden } = req.body

  if (!nombre || lat == null || lng == null || !ruta_id || orden == null) {
    return res.status(400).json({ error: 'nombre, lat, lng, ruta_id y orden son obligatorios' })
  }

  const latNum = Number(lat)
  const lngNum = Number(lng)
  const ordenNum = Number(orden)

  if (Number.isNaN(latNum) || Number.isNaN(lngNum) || Number.isNaN(ordenNum)) {
    return res.status(400).json({ error: 'lat, lng y orden deben ser numeros validos' })
  }

  const parada = await Parada.porId(id)
  if (!parada) throw notFound('Parada no encontrada')

  await Parada.editar(Number(id), {
    nombre,
    lat: latNum,
    lng: lngNum,
    activa,
    idRuta: Number(ruta_id),
    orden: ordenNum,
  })

  return res.status(200).json({ ok: true })
})

export const eliminarParada = asyncHandler(async (req, res) => {
  const { id } = req.params
  const parada = await Parada.porId(id)
  if (!parada) throw notFound('Parada no encontrada')

  await Parada.eliminar(Number(id))
  return res.status(200).json({ ok: true })
})
