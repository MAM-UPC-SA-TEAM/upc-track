// src/services/rutaService.js
// Escrituras de rutas (B02): normaliza los valores por defecto; el controlador solo habla HTTP.
// Error de dominio (código en `message`): RUTA_NO_ENCONTRADA

import { Ruta } from '../models/Ruta.js'

const activaComoNumero = (activa) => (activa === false ? 0 : 1)

/** Devuelve id_ruta. Descripción vacía por defecto; activa salvo que venga `false`. */
export function crear({ nombre, descripcion, activa }) {
  return Ruta.crear({ nombre, descripcion: descripcion || '', activa: activaComoNumero(activa) })
}

export async function editar(id, { nombre, descripcion, activa }) {
  const cambiadas = await Ruta.actualizar(id, { nombre, descripcion: descripcion || '', activa: activaComoNumero(activa) })
  if (cambiadas === 0) throw new Error('RUTA_NO_ENCONTRADA')
}

export async function eliminar(id) {
  if (await Ruta.eliminar(id) === 0) throw new Error('RUTA_NO_ENCONTRADA')
}
