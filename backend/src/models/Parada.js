// src/models/Parada.js
// Esquema real: parada, ruta_parada

import { pool, transaccion } from '../config/database.js'

export const Parada = {

  // Todas las paradas
  async todas() {
    const { rows: rows } = await pool.query(`
      SELECT
        p.id_parada,
        p.nombre,
        p.latitud  AS lat,
        p.longitud AS lng,
        p.activa,
        rp.id_ruta,
        rp.orden,
        r.nombre   AS nombre_ruta
      FROM parada p
      LEFT JOIN ruta_parada rp ON p.id_parada = rp.id_parada
      LEFT JOIN ruta r         ON rp.id_ruta  = r.id_ruta
      ORDER BY rp.id_ruta NULLS FIRST, rp.orden
    `)
    return rows
  },

  // Paradas de una ruta específica
  async porRuta(idRuta) {
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

  // Parada por ID
  async porId(id) {
    const { rows: rows } = await pool.query(
      'SELECT id_parada, nombre, latitud AS lat, longitud AS lng, activa FROM parada WHERE id_parada = $1',
      [id]
    )
    return rows[0] || null
  },

  async crear({ nombre, lat, lng, activa = true, idRuta, orden }) {
    return transaccion(async (conn) => {
      const { rows } = await conn.query(
        `INSERT INTO parada (nombre, latitud, longitud, activa)
         VALUES ($1, $2, $3, $4)
         RETURNING id_parada`,
        [nombre, lat, lng, activa ? 1 : 0]
      )
      const idParada = rows[0].id_parada

      await conn.query(
        `INSERT INTO ruta_parada (id_ruta, id_parada, orden)
         VALUES ($1, $2, $3)`,
        [idRuta, idParada, orden]
      )
      return idParada
    })
  },

  async editar(idParada, { nombre, lat, lng, activa = true, idRuta, orden }) {
    await transaccion(async (conn) => {
      await conn.query(
        `UPDATE parada
         SET nombre = $1, latitud = $2, longitud = $3, activa = $4
         WHERE id_parada = $5`,
        [nombre, lat, lng, activa ? 1 : 0, idParada]
      )

      await conn.query('DELETE FROM ruta_parada WHERE id_parada = $1', [idParada])

      await conn.query(
        `INSERT INTO ruta_parada (id_ruta, id_parada, orden)
         VALUES ($1, $2, $3)`,
        [idRuta, idParada, orden]
      )
    })
  },

  async eliminar(idParada) {
    await transaccion(async (conn) => {
      await conn.query('DELETE FROM ruta_parada WHERE id_parada = $1', [idParada])
      await conn.query('DELETE FROM parada WHERE id_parada = $1', [idParada])
    })
  },
}
