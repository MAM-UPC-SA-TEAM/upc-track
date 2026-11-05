// src/models/Horario.js
// Clase POO que representa la entidad Horario
// Atributos según diagrama: id_horario, hora_salida, hora_llegada

import { pool } from '../config/database.js'

export class Horario {

  // Listar horarios de una ruta
  static async porRuta(id_ruta) {
    const [rows] = await pool.query(
      `SELECT id_horario, hora_salida, hora_llegada
       FROM horario
       WHERE id_ruta = ?
       ORDER BY hora_salida`,
      [id_ruta]
    )
    return rows
  }

  // Listar todos los horarios
  static async todos() {
    const [rows] = await pool.query(
      `SELECT h.id_horario, h.hora_salida, h.hora_llegada,
              r.id_ruta, r.nombre AS nombre_ruta
       FROM horario h
       JOIN ruta r ON h.id_ruta = r.id_ruta
       ORDER BY r.id_ruta, h.hora_salida`
    )
    return rows
  }

  static async crear({ id_ruta, hora_salida, hora_llegada }) {
    const [result] = await pool.query(
      `INSERT INTO horario (id_ruta, hora_salida, hora_llegada)
       VALUES (?, ?, ?)`,
      [id_ruta, hora_salida, hora_llegada]
    )
    return result.insertId
  }

  static async editar(id_horario, { hora_salida, hora_llegada }) {
    await pool.query(
      `UPDATE horario
       SET hora_salida = ?, hora_llegada = ?
       WHERE id_horario = ?`,
      [hora_salida, hora_llegada, id_horario]
    )
  }

  static async eliminar(id_horario) {
    await pool.query('DELETE FROM horario WHERE id_horario = ?', [id_horario])
  }

  static async porId(id_horario) {
    const [rows] = await pool.query(
      `SELECT id_horario, id_ruta, hora_salida, hora_llegada
       FROM horario
       WHERE id_horario = ?`,
      [id_horario]
    )
    return rows[0] || null
  }
}
