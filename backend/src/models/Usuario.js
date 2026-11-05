// src/models/Usuario.js
// Clase POO que representa la entidad Usuario
// Métodos según diagrama de clases: consultarRutas(), verBuses(), marcarFavorito()

import { pool } from '../config/database.js'

export class Usuario {

  // Buscar usuario por ID
  static async porId(id_usuario) {
    const [rows] = await pool.query(
      `SELECT id_usuario, nombre, correo, tipo_usuario, fecha_creacion
       FROM usuario WHERE id_usuario = ?`,
      [id_usuario]
    )
    return rows[0] || null
  }

  // Buscar usuario por correo (usado en login)
  static async porCorreo(correo) {
    const [rows] = await pool.query(
      `SELECT * FROM usuario WHERE correo = ? AND activo = 1`,
      [correo]
    )
    return rows[0] || null
  }

  // Buscar usuario por nombre_usuario (usado en login universitario)
  static async porNombreUsuario(nombre_usuario) {
    const [rows] = await pool.query(
      `SELECT * FROM usuario WHERE nombre_usuario = ? AND activo = 1`,
      [nombre_usuario]
    )
    return rows[0] || null
  }

  // consultarRutas() — diagrama de clases
  // Retorna las rutas disponibles para el usuario
  static async consultarRutas() {
    const [rows] = await pool.query(
      `SELECT id_ruta, nombre, descripcion, activa FROM ruta WHERE activa = 1`
    )
    return rows
  }

  // verBuses() — diagrama de clases
  // Retorna los buses con su estado y ruta
  static async verBuses() {
    const [rows] = await pool.query(
      `SELECT b.id_bus, b.placa, b.nombre, b.capacidad, b.estado,
              u.nombre AS nombre_conductor,
              r.id_ruta, r.nombre AS nombre_ruta
       FROM bus b
       LEFT JOIN usuario u ON b.id_conductor = u.id_usuario
       LEFT JOIN bus_ruta br ON b.id_bus = br.id_bus
       LEFT JOIN ruta r ON br.id_ruta = r.id_ruta`
    )
    return rows
  }

  // marcarFavorito(bus) — diagrama de clases
  // Agrega o quita un bus (por su ruta) de los favoritos del usuario
  static async marcarFavorito(id_usuario, id_ruta) {
    // Verificar si ya es favorito
    const [existe] = await pool.query(
      `SELECT * FROM favoritos WHERE id_usuario = ? AND id_ruta = ?`,
      [id_usuario, id_ruta]
    )

    if (existe.length > 0) {
      // Si ya existe, lo quita (toggle)
      await pool.query(
        `DELETE FROM favoritos WHERE id_usuario = ? AND id_ruta = ?`,
        [id_usuario, id_ruta]
      )
      return { accion: 'eliminado' }
    }

    // Si no existe, lo agrega
    await pool.query(
      `INSERT INTO favoritos (id_usuario, id_ruta) VALUES (?, ?)`,
      [id_usuario, id_ruta]
    )
    return { accion: 'agregado' }
  }

  // Listar favoritos de un usuario
  static async obtenerFavoritos(id_usuario) {
    const [rows] = await pool.query(
      `SELECT r.id_ruta, r.nombre, r.descripcion
       FROM favoritos f
       JOIN ruta r ON f.id_ruta = r.id_ruta
       WHERE f.id_usuario = ?`,
      [id_usuario]
    )
    return rows
  }

  // Listar todos los usuarios (para admin)
  static async todos() {
    const [rows] = await pool.query(
      `SELECT id_usuario, nombre, nombre_usuario, correo, tipo_usuario, activo, fecha_creacion
       FROM usuario`
    )
    return rows
  }
}
