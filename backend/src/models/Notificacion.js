// src/models/Notificacion.js
// Clase POO que representa la entidad Notificacion

import { pool } from '../config/database.js'

export class Notificacion {

  // Guardar nueva notificación
  static async guardar({ id_ruta, id_conductor, tipo, mensaje }) {
    const { rows } = await pool.query(
      `INSERT INTO notificacion (id_ruta, id_conductor, tipo, mensaje)
       VALUES ($1, $2, $3, $4)
       RETURNING id_notificacion`,
      [id_ruta, id_conductor, tipo, mensaje]
    )
    return rows[0].id_notificacion
  }

  // Listar notificaciones del día por ruta
  static async porRutaHoy(id_ruta) {
    const { rows: rows } = await pool.query(
      `SELECT n.id_notificacion, n.tipo, n.mensaje, n.fecha_hora,
              u.nombre AS nombre_conductor, r.nombre AS nombre_ruta
       FROM notificacion n
       JOIN usuario u ON n.id_conductor = u.id_usuario
       JOIN ruta r ON n.id_ruta = r.id_ruta
       WHERE n.id_ruta = $1
         AND (n.fecha_hora AT TIME ZONE 'America/Bogota')::date = (now() AT TIME ZONE 'America/Bogota')::date
       ORDER BY n.fecha_hora DESC, n.id_notificacion DESC`,
      [id_ruta]
    )
    return rows
  }

  // Últimos avisos que envió un conductor (más recientes primero)
  static async porConductor(id_conductor, limite = 30) {
    const { rows } = await pool.query(
      `SELECT n.id_notificacion, n.tipo, n.mensaje, n.fecha_hora, n.id_ruta, r.nombre AS nombre_ruta
       FROM notificacion n
       JOIN ruta r ON n.id_ruta = r.id_ruta
       WHERE n.id_conductor = $1
       ORDER BY n.fecha_hora DESC, n.id_notificacion DESC
       LIMIT $2`,
      [id_conductor, limite]
    )
    return rows
  }

  // Listar todas las notificaciones del día
  static async hoy() {
    const { rows: rows } = await pool.query(
      `SELECT n.id_notificacion, n.tipo, n.mensaje, n.fecha_hora,
              u.nombre AS nombre_conductor, r.nombre AS nombre_ruta, n.id_ruta
       FROM notificacion n
       JOIN usuario u ON n.id_conductor = u.id_usuario
       JOIN ruta r ON n.id_ruta = r.id_ruta
       WHERE (n.fecha_hora AT TIME ZONE 'America/Bogota')::date = (now() AT TIME ZONE 'America/Bogota')::date
       ORDER BY n.fecha_hora DESC, n.id_notificacion DESC`
    )
    return rows
  }
}
