// src/controllers/paradaController.js
// Endpoints para consultar paradas — Issue #10

import { Parada } from '../models/Parada.js'

// GET /api/paradas — todas, o filtrar con ?ruta_id=X
export async function listarParadas(req, res) {
  const { ruta_id } = req.query

  try {
    if (ruta_id) {
      const paradas = await Parada.porRuta(ruta_id)
      return res.status(200).json({ paradas })
    }

    const paradas = await Parada.todas()
    return res.status(200).json({ paradas })
  } catch (error) {
    console.error('Error listando paradas:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export async function crearParada(req, res) {
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

  try {
    const idParada = await Parada.crear({
      nombre,
      lat: latNum,
      lng: lngNum,
      activa,
      idRuta: Number(ruta_id),
      orden: ordenNum,
    })
    return res.status(201).json({ ok: true, id_parada: idParada })
  } catch (error) {
    console.error('Error creando parada:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export async function editarParada(req, res) {
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

  try {
    const parada = await Parada.porId(id)
    if (!parada) return res.status(404).json({ error: 'Parada no encontrada' })

    await Parada.editar(Number(id), {
      nombre,
      lat: latNum,
      lng: lngNum,
      activa,
      idRuta: Number(ruta_id),
      orden: ordenNum,
    })

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error editando parada:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export async function eliminarParada(req, res) {
  const { id } = req.params
  try {
    const parada = await Parada.porId(id)
    if (!parada) return res.status(404).json({ error: 'Parada no encontrada' })

    await Parada.eliminar(Number(id))
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error eliminando parada:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
