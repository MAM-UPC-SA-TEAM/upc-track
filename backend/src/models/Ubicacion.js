// src/models/Ubicacion.js
// Esquema real: ubicacion_bus (latitud, longitud, fecha_hora)

import { pool } from '../config/database.js'

export const Ubicacion = {

  // Guardar nueva posición GPS del conductor
  async registrarUbicacion(idBus, lat, lng) {
    const [result] = await pool.query(
      'INSERT INTO ubicacion_bus (id_bus, latitud, longitud) VALUES (?, ?, ?)',
      [idBus, lat, lng]
    )
    return result.insertId
  },

  // Última posición de un bus
  async ultimaPorBus(idBus) {
    const [rows] = await pool.query(`
      SELECT latitud AS lat, longitud AS lng, fecha_hora
      FROM ubicacion_bus
      WHERE id_bus = ?
      ORDER BY fecha_hora DESC
      LIMIT 1
    `, [idBus])
    return rows[0] || null
  },

  // Historial de posiciones de un bus (últimas N)
  async historicoReciente(idBus, limite = 50) {
    const [rows] = await pool.query(`
      SELECT latitud AS lat, longitud AS lng, fecha_hora
      FROM ubicacion_bus
      WHERE id_bus = ?
      ORDER BY fecha_hora DESC
      LIMIT ?
    `, [idBus, limite])
    return rows
  },
}