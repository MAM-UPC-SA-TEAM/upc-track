// src/services/rutaService.js
// Escrituras de rutas (B02): normaliza los valores por defecto; el controlador solo habla HTTP.

import { Ruta } from '../models/Ruta.js'

const activaComoNumero = (activa) => (activa === false ? 0 : 1)

/** Devuelve id_ruta. Descripción vacía por defecto; activa salvo que venga `false`. */
export function crear({ nombre, descripcion, activa }) {
  return Ruta.crear({ nombre, descripcion: descripcion || '', activa: activaComoNumero(activa) })
}

export async function editar(id, { nombre, descripcion, activa }) {
  await Ruta.actualizar(id, { nombre, descripcion: descripcion || '', activa: activaComoNumero(activa) })
}

export async function eliminar(id) {
  await Ruta.eliminar(id)
}
