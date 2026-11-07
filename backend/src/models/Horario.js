// src/models/Horario.js
// Clase POO que representa la entidad Horario
// Atributos según diagrama: id_horario, hora_salida, hora_llegada

import { pool } from '../config/database.js'

export class Horario {

  // Listar horarios de una ruta
  static async porRuta(id_ruta) {
    const { rows: rows } = await pool.query(
      `SELECT id_horario, hora_salida, hora_llegada
       FROM horario
       WHERE id_ruta = $1
       ORDER BY hora_salida`,
      [id_ruta]
    )
    return rows
  }

  // Listar todos los horarios
  static async todos() {
    const { rows: rows } = await pool.query(
      `SELECT h.id_horario, h.hora_salida, h.hora_llegada,
              r.id_ruta, r.nombre AS nombre_ruta
       FROM horario h
       JOIN ruta r ON h.id_ruta = r.id_ruta
       ORDER BY r.id_ruta, h.hora_salida`
    )
    return rows
  }

  static async crear({ id_ruta, hora_salida, hora_llegada }) {
    const { rows } = await pool.query(
      `INSERT INTO horario (id_ruta, hora_salida, hora_llegada)
       VALUES ($1, $2, $3)
       RETURNING id_horario`,
      [id_ruta, hora_salida, hora_llegada]
    )
    return rows[0].id_horario
  }

  static async editar(id_horario, { hora_salida, hora_llegada }) {
    await pool.query(
      `UPDATE horario
       SET hora_salida = $1, hora_llegada = $2
       WHERE id_horario = $3`,
      [hora_salida, hora_llegada, id_horario]
    )
  }

  static async eliminar(id_horario) {
    await pool.query('DELETE FROM horario WHERE id_horario = $1', [id_horario])
  }

  static async porId(id_horario) {
    const { rows: rows } = await pool.query(
      `SELECT id_horario, id_ruta, hora_salida, hora_llegada
       FROM horario
       WHERE id_horario = $1`,
      [id_horario]
    )
    return rows[0] || null
  }
}
