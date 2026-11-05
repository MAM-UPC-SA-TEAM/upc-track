// src/controllers/ubicacionController.js
// POST /api/ubicacion — recibe GPS del conductor (#07)

import { procesarUbicacion } from '../services/ubicacionService.js'

export async function recibirUbicacion(req, res) {
  const { id_bus, lat, lng } = req.body

  // Validar campos requeridos (RNF10 — confiabilidad)
  if (!id_bus || lat == null || lng == null) {
    return res.status(400).json({ error: 'Se requieren id_bus, lat y lng' })
  }

  // Validar que lat y lng sean números válidos
  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lng)

  if (isNaN(latNum) || isNaN(lngNum)) {
    return res.status(400).json({ error: 'lat y lng deben ser números válidos' })
  }

  if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    return res.status(400).json({ error: 'Coordenadas fuera de rango válido' })
  }

  try {
    const io = req.app.get('io')
    await procesarUbicacion(io, id_bus, latNum, lngNum)
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error guardando ubicación:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}