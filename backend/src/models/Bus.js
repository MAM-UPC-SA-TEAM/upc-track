// src/models/Bus.js
// Esquema real: bus, bus_ruta, ubicacion_bus

import { pool } from '../config/database.js'

export const Bus = {

  // Todos los buses con su ruta asignada
  async todos() {
    const [rows] = await pool.query(`
      SELECT
        b.id_bus,
        b.nombre,
        b.placa,
        b.capacidad,
        b.estado,
        b.id_conductor,
        u.nombre      AS nombre_conductor,
        r.id_ruta,
        r.nombre      AS nombre_ruta
      FROM bus b
      LEFT JOIN usuario u   ON b.id_conductor = u.id_usuario
      LEFT JOIN bus_ruta br  ON b.id_bus = br.id_bus
      LEFT JOIN ruta r       ON br.id_ruta = r.id_ruta
      ORDER BY b.nombre
    `)
    return rows
  },

  // Buses activos con última posición GPS (#09, #13)
  async activos() {
    const [rows] = await pool.query(`
      SELECT
        b.id_bus,
        b.nombre,
        b.placa,
        b.estado,
        b.id_conductor,
        u.nombre      AS nombre_conductor,
        r.id_ruta,
        r.nombre      AS nombre_ruta,
        ub.latitud    AS lat,
        ub.longitud   AS lng,
        ub.fecha_hora AS ultima_actualizacion
      FROM bus b
      LEFT JOIN usuario u   ON b.id_conductor = u.id_usuario
      LEFT JOIN bus_ruta br  ON b.id_bus = br.id_bus
      LEFT JOIN ruta r       ON br.id_ruta = r.id_ruta
      LEFT JOIN (
        SELECT ub1.id_bus, ub1.latitud, ub1.longitud, ub1.fecha_hora
        FROM ubicacion_bus ub1
        INNER JOIN (
          SELECT id_bus, MAX(fecha_hora) AS max_fh
          FROM ubicacion_bus
          GROUP BY id_bus
        ) ub2 ON ub1.id_bus = ub2.id_bus AND ub1.fecha_hora = ub2.max_fh
      ) ub ON b.id_bus = ub.id_bus
      WHERE b.estado = 'en_recorrido'
        AND b.id_conductor IS NOT NULL
        AND u.activo = 1
        AND ub.fecha_hora IS NOT NULL
        AND ub.fecha_hora >= (NOW() - INTERVAL 2 MINUTE)
      ORDER BY b.nombre
    `)
    return rows
  },

  // Todos los buses con posición (incluye inactivos)
  async todosConPosicion() {
    const [rows] = await pool.query(`
      SELECT
        b.id_bus,
        b.nombre,
        b.placa,
        b.estado,
        b.id_conductor,
        u.nombre      AS nombre_conductor,
        r.id_ruta,
        r.nombre      AS nombre_ruta,
        ub.latitud    AS lat,
        ub.longitud   AS lng,
        ub.fecha_hora AS ultima_actualizacion
      FROM bus b
      LEFT JOIN usuario u   ON b.id_conductor = u.id_usuario
      LEFT JOIN bus_ruta br  ON b.id_bus = br.id_bus
      LEFT JOIN ruta r       ON br.id_ruta = r.id_ruta
      LEFT JOIN (
        SELECT ub1.id_bus, ub1.latitud, ub1.longitud, ub1.fecha_hora
        FROM ubicacion_bus ub1
        INNER JOIN (
          SELECT id_bus, MAX(fecha_hora) AS max_fh
          FROM ubicacion_bus
          GROUP BY id_bus
        ) ub2 ON ub1.id_bus = ub2.id_bus AND ub1.fecha_hora = ub2.max_fh
      ) ub ON b.id_bus = ub.id_bus
      ORDER BY b.nombre
    `)
    return rows
  },

  // Bus por ID
  async porId(id) {
    const [rows] = await pool.query(`
      SELECT
        b.id_bus,
        b.nombre,
        b.placa,
        b.estado,
        b.id_conductor,
        u.nombre     AS nombre_conductor,
        r.id_ruta,
        r.nombre     AS nombre_ruta
      FROM bus b
      LEFT JOIN usuario u  ON b.id_conductor = u.id_usuario
      LEFT JOIN bus_ruta br ON b.id_bus = br.id_bus
      LEFT JOIN ruta r      ON br.id_ruta = r.id_ruta
      WHERE b.id_bus = ?
    `, [id])
    return rows[0] || null
  },

  // Bus asignado a un conductor
  async porConductor(idusuario) {
    const [rows] = await pool.query(`
      SELECT
        b.id_bus,
        b.nombre,
        b.placa,
        b.estado,
        r.id_ruta,
        r.nombre AS nombre_ruta
      FROM bus b
      LEFT JOIN (
        SELECT id_bus, MAX(id_ruta) AS id_ruta
        FROM bus_ruta
        GROUP BY id_bus
      ) br ON b.id_bus = br.id_bus
      LEFT JOIN ruta r ON br.id_ruta = r.id_ruta
      WHERE b.id_conductor = ?
    `, [idusuario])
    return rows[0] || null
  },

  // Actualizar estado
  async actualizarEstado(idBus, estado) {
    await pool.query(
      'UPDATE bus SET estado = ? WHERE id_bus = ?',
      [estado, idBus]
    )
  },

  // Obtener ruta del bus
  async obtenerRuta(idBus) {
    const [rows] = await pool.query(`
      SELECT r.*
      FROM ruta r
      INNER JOIN bus_ruta br ON r.id_ruta = br.id_ruta
      WHERE br.id_bus = ?
    `, [idBus])
    return rows[0] || null
  },
}