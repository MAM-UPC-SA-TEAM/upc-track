// src/models/Parada.js
// Esquema real: parada, ruta_parada

import { pool } from '../config/database.js'

export const Parada = {

  // Todas las paradas
  async todas() {
    const [rows] = await pool.query(`
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
      ORDER BY rp.id_ruta, rp.orden
    `)
    return rows
  },

  // Paradas de una ruta específica
  async porRuta(idRuta) {
    const [rows] = await pool.query(`
      SELECT
        p.id_parada,
        p.nombre,
        p.latitud  AS lat,
        p.longitud AS lng,
        p.activa,
        rp.orden
      FROM parada p
      INNER JOIN ruta_parada rp ON p.id_parada = rp.id_parada
      WHERE rp.id_ruta = ?
      ORDER BY rp.orden ASC
    `, [idRuta])
    return rows
  },

  // Parada por ID
  async porId(id) {
    const [rows] = await pool.query(
      'SELECT id_parada, nombre, latitud AS lat, longitud AS lng, activa FROM parada WHERE id_parada = ?',
      [id]
    )
    return rows[0] || null
  },

  async crear({ nombre, lat, lng, activa = true, idRuta, orden }) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      const [result] = await conn.query(
        `INSERT INTO parada (nombre, latitud, longitud, activa)
         VALUES (?, ?, ?, ?)`,
        [nombre, lat, lng, activa ? 1 : 0]
      )

      const idParada = result.insertId

      await conn.query(
        `INSERT INTO ruta_parada (id_ruta, id_parada, orden)
         VALUES (?, ?, ?)`,
        [idRuta, idParada, orden]
      )

      await conn.commit()
      return idParada
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  },

  async editar(idParada, { nombre, lat, lng, activa = true, idRuta, orden }) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      await conn.query(
        `UPDATE parada
         SET nombre = ?, latitud = ?, longitud = ?, activa = ?
         WHERE id_parada = ?`,
        [nombre, lat, lng, activa ? 1 : 0, idParada]
      )

      await conn.query('DELETE FROM ruta_parada WHERE id_parada = ?', [idParada])

      await conn.query(
        `INSERT INTO ruta_parada (id_ruta, id_parada, orden)
         VALUES (?, ?, ?)`,
        [idRuta, idParada, orden]
      )

      await conn.commit()
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  },

  async eliminar(idParada) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      await conn.query('DELETE FROM ruta_parada WHERE id_parada = ?', [idParada])
      await conn.query('DELETE FROM parada WHERE id_parada = ?', [idParada])
      await conn.commit()
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  },
}