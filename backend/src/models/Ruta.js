// src/models/Ruta.js
// Esquema real: ruta, ruta_parada, parada

import { pool } from '../config/database.js'

export const Ruta = {

  // Todas las rutas con conteo de paradas
  async todas() {
    const { rows: rows } = await pool.query(`
      SELECT
        r.id_ruta,
        r.nombre,
        r.descripcion,
        r.activa,
        COUNT(rp.id_parada) AS num_paradas
      FROM ruta r
      LEFT JOIN ruta_parada rp ON r.id_ruta = rp.id_ruta
      GROUP BY r.id_ruta
      ORDER BY r.nombre
    `)
    return rows
  },

  // Ruta por ID
  async porId(id) {
    const { rows: rows } = await pool.query(
      'SELECT * FROM ruta WHERE id_ruta = $1',
      [id]
    )
    return rows[0] || null
  },

  // Paradas de una ruta (ordenadas para polilínea) (#10, #14)
  async obtenerParadas(idRuta) {
    const { rows: rows } = await pool.query(`
      SELECT
        p.id_parada,
        p.nombre,
        p.latitud  AS lat,
        p.longitud AS lng,
        p.activa,
        rp.orden
      FROM parada p
      INNER JOIN ruta_parada rp ON p.id_parada = rp.id_parada
      WHERE rp.id_ruta = $1
      ORDER BY rp.orden ASC
    `, [idRuta])
    return rows
  },

  async crear({ nombre, descripcion, activa }) {
    const { rows } = await pool.query(
      'INSERT INTO ruta (nombre, descripcion, activa) VALUES ($1, $2, $3) RETURNING id_ruta',
      [nombre, descripcion, activa]
    )
    return rows[0].id_ruta
  },

  async actualizar(idRuta, { nombre, descripcion, activa }) {
    const { rowCount } = await pool.query(
      'UPDATE ruta SET nombre=$1, descripcion=$2, activa=$3 WHERE id_ruta=$4',
      [nombre, descripcion, activa, idRuta]
    )
    return rowCount
  },

  async eliminar(idRuta) {
    const { rowCount } = await pool.query('DELETE FROM ruta WHERE id_ruta=$1', [idRuta])
    return rowCount
  },
}
