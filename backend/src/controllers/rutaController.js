// src/controllers/rutaController.js
// Endpoints de rutas — Issue #14 (Vista de rutas disponibles)

import { Ruta } from '../models/Ruta.js'
import { pool } from '../config/database.js'

// GET /api/rutas — lista de rutas con conteo de paradas
export async function listarRutas(req, res) {
  try {
    const rutas = await Ruta.todas()
    return res.status(200).json({ rutas })
  } catch (error) {
    console.error('Error listando rutas:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET /api/rutas/:id — detalle de una ruta
export async function obtenerRuta(req, res) {
  try {
    const ruta = await Ruta.porId(req.params.id)
    if (!ruta) {
      return res.status(404).json({ error: 'Ruta no encontrada' })
    }
    return res.status(200).json({ ruta })
  } catch (error) {
    console.error('Error obteniendo ruta:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// POST /api/rutas
export async function crearRuta(req, res) {
  const { nombre, descripcion, activa } = req.body
  if (!nombre) return res.status(400).json({ error: 'nombre es obligatorio' })

  try {
    const { rows } = await pool.query(
      `INSERT INTO ruta (nombre, descripcion, activa) VALUES ($1, $2, $3) RETURNING id_ruta`,
      [nombre, descripcion || '', activa === false ? 0 : 1]
    )
    return res.status(201).json({ ok: true, id_ruta: rows[0].id_ruta })
  } catch (error) {
    console.error('Error creando ruta:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// PATCH /api/rutas/:id
export async function editarRuta(req, res) {
  const { id } = req.params
  const { nombre, descripcion, activa } = req.body

  try {
    await pool.query(
      `UPDATE ruta SET nombre=$1, descripcion=$2, activa=$3 WHERE id_ruta=$4`,
      [nombre, descripcion || '', activa === false ? 0 : 1, id]
    )
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error editando ruta:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// DELETE /api/rutas/:id
export async function eliminarRuta(req, res) {
  const { id } = req.params
  try {
    await pool.query(
      `DELETE FROM ruta WHERE id_ruta=$1`, [id]
    )
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error eliminando ruta:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
