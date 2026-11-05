// src/models/Notificacion.js
// Clase POO que representa la entidad Notificacion

import { pool } from '../config/database.js'

export class Notificacion {

  // Guardar nueva notificación
  static async guardar({ id_ruta, id_conductor, tipo, mensaje }) {
    const [result] = await pool.query(
      `INSERT INTO notificacion (id_ruta, id_conductor, tipo, mensaje)
       VALUES (?, ?, ?, ?)`,
      [id_ruta, id_conductor, tipo, mensaje]
    )
    return result.insertId
  }

  // Listar notificaciones del día por ruta
  static async porRutaHoy(id_ruta) {
    const [rows] = await pool.query(
      `SELECT n.id_notificacion, n.tipo, n.mensaje, n.fecha_hora,
              u.nombre AS nombre_conductor, r.nombre AS nombre_ruta
       FROM notificacion n
       JOIN usuario u ON n.id_conductor = u.id_usuario
       JOIN ruta r ON n.id_ruta = r.id_ruta
       WHERE n.id_ruta = ?
         AND DATE(n.fecha_hora) = CURDATE()
       ORDER BY n.fecha_hora DESC`,
      [id_ruta]
    )
    return rows
  }

  // Listar todas las notificaciones del día
  static async hoy() {
    const [rows] = await pool.query(
      `SELECT n.id_notificacion, n.tipo, n.mensaje, n.fecha_hora,
              u.nombre AS nombre_conductor, r.nombre AS nombre_ruta, n.id_ruta
       FROM notificacion n
       JOIN usuario u ON n.id_conductor = u.id_usuario
       JOIN ruta r ON n.id_ruta = r.id_ruta
       WHERE DATE(n.fecha_hora) = CURDATE()
       ORDER BY n.fecha_hora DESC`
    )
    return rows
  }
}
