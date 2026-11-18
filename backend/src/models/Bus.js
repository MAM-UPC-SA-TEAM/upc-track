// src/models/Bus.js
// Esquema real: bus, bus_ruta, ubicacion_bus

import { pool } from '../config/database.js'

export const Bus = {

  // Todos los buses con su ruta asignada
  async todos() {
    const { rows: rows } = await pool.query(`
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
    const { rows: rows } = await pool.query(`
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
        ub.fecha_hora AS ultima_actualizacion,
        FLOOR(EXTRACT(EPOCH FROM (now() - ub.fecha_hora)))::int AS edad_segundos
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
        AND ub.fecha_hora >= (now() - INTERVAL '2 minutes')
      ORDER BY b.nombre
    `)
    return rows
  },

  // Todos los buses con posición (incluye inactivos)
  async todosConPosicion() {
    const { rows: rows } = await pool.query(`
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
        ub.fecha_hora AS ultima_actualizacion,
        FLOOR(EXTRACT(EPOCH FROM (now() - ub.fecha_hora)))::int AS edad_segundos
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
    const { rows: rows } = await pool.query(`
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
      WHERE b.id_bus = $1
    `, [id])
    return rows[0] || null
  },

  // Bus asignado a un conductor
  async porConductor(idusuario) {
    const { rows: rows } = await pool.query(`
      SELECT
        b.id_bus,
        b.nombre,
        b.placa,
        b.estado,
        r.id_ruta,
        r.nombre AS nombre_ruta,
        FLOOR(EXTRACT(EPOCH FROM (now() - ult.fecha_hora)))::int AS edad_segundos
      FROM bus b
      LEFT JOIN (
        SELECT id_bus, MAX(id_ruta) AS id_ruta
        FROM bus_ruta
        GROUP BY id_bus
      ) br ON b.id_bus = br.id_bus
      LEFT JOIN ruta r ON br.id_ruta = r.id_ruta
      LEFT JOIN (
        SELECT id_bus, MAX(fecha_hora) AS fecha_hora
        FROM ubicacion_bus
        GROUP BY id_bus
      ) ult ON b.id_bus = ult.id_bus
      WHERE b.id_conductor = $1
    `, [idusuario])
    return rows[0] || null
  },

  // Actualizar estado
  async actualizarEstado(idBus, estado) {
    await pool.query(
      'UPDATE bus SET estado = $1 WHERE id_bus = $2',
      [estado, idBus]
    )
  },

  // Escrituras: reciben `db` (pool por defecto o el cliente de una transacción) para componerse en el servicio.
  async crear({ nombre, placa, capacidad, estado, id_conductor }, db = pool) {
    const { rows } = await db.query(
      `INSERT INTO bus (nombre, placa, capacidad, estado, id_conductor)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_bus`,
      [nombre, placa, capacidad, estado, id_conductor]
    )
    return rows[0].id_bus
  },

  // Devuelve cuántas filas cambió (0 = el bus no existe)
  async actualizar(idBus, { nombre, placa, capacidad, estado, id_conductor }, db = pool) {
    const { rowCount } = await db.query(
      `UPDATE bus SET nombre=$1, placa=$2, capacidad=$3, estado=$4, id_conductor=$5
       WHERE id_bus=$6`,
      [nombre, placa, capacidad, estado, id_conductor, idBus]
    )
    return rowCount
  },

  // Devuelve cuántas filas borró (0 = el bus no existe)
  async eliminar(idBus, db = pool) {
    const { rowCount } = await db.query('DELETE FROM bus WHERE id_bus = $1', [idBus])
    return rowCount
  },

  async asignarRuta(idBus, idRuta, db = pool) {
    await db.query('INSERT INTO bus_ruta (id_bus, id_ruta) VALUES ($1, $2)', [idBus, idRuta])
  },

  async quitarRutas(idBus, db = pool) {
    await db.query('DELETE FROM bus_ruta WHERE id_bus = $1', [idBus])
  },

  // Obtener ruta del bus
  async obtenerRuta(idBus) {
    const { rows: rows } = await pool.query(`
      SELECT r.*
      FROM ruta r
      INNER JOIN bus_ruta br ON r.id_ruta = br.id_ruta
      WHERE br.id_bus = $1
    `, [idBus])
    return rows[0] || null
  },

  // id_ruta del bus que maneja el conductor (null si no tiene bus o su bus no tiene ruta)
  async rutaDeConductor(idConductor) {
    const { rows } = await pool.query(
      `SELECT br.id_ruta FROM bus b
       JOIN bus_ruta br ON b.id_bus = br.id_bus
       WHERE b.id_conductor = $1`,
      [idConductor]
    )
    return rows[0]?.id_ruta ?? null
  },

  // Deja inactivo el bus del conductor (cierre de sesión); no toca los que ya lo están
  async desactivarDeConductor(idConductor) {
    await pool.query(
      `UPDATE bus SET estado = 'inactivo' WHERE id_conductor = $1 AND estado != 'inactivo'`,
      [idConductor]
    )
  },
}
