// src/services/busService.js
// Reglas de negocio de las escrituras de buses (B01). El controlador solo valida HTTP y traduce errores.
// Los errores de dominio son Error con un código en `message`, igual que authService:
//   PLACA_DUPLICADA · BUS_NO_ENCONTRADO

import { Bus } from '../models/Bus.js'
import { transaccion, esDuplicado } from '../config/database.js'

const CAPACIDAD_POR_DEFECTO = 45

/** Crea el bus y, si viene, su ruta, en una sola transacción. Devuelve id_bus. */
export async function crear({ nombre, placa, capacidad, id_ruta, estado, id_conductor }) {
  try {
    return await transaccion(async (db) => {
      const idBus = await Bus.crear({
        nombre, placa,
        capacidad: capacidad || CAPACIDAD_POR_DEFECTO,
        estado: estado || 'inactivo',
        id_conductor: id_conductor || null,
      }, db)
      if (id_ruta) await Bus.asignarRuta(idBus, id_ruta, db)
      return idBus
    })
  } catch (error) {
    if (esDuplicado(error)) throw new Error('PLACA_DUPLICADA', { cause: error })
    throw error
  }
}

/**
 * Edita el bus y, si `id_ruta` viene (aunque sea null), reemplaza su asignación; todo o nada.
 * `id_ruta === undefined` deja la ruta como está; `null`/0 la quita.
 */
export async function editar(idBus, { nombre, placa, capacidad, estado, id_ruta, id_conductor }) {
  try {
    await transaccion(async (db) => {
      const cambiadas = await Bus.actualizar(idBus, {
        nombre, placa,
        capacidad: capacidad || CAPACIDAD_POR_DEFECTO,
        estado,
        id_conductor: id_conductor || null,
      }, db)
      if (cambiadas === 0) throw new Error('BUS_NO_ENCONTRADO')

      if (id_ruta !== undefined) {
        await Bus.quitarRutas(idBus, db)
        if (id_ruta) await Bus.asignarRuta(idBus, id_ruta, db)
      }
    })
  } catch (error) {
    if (esDuplicado(error)) throw new Error('PLACA_DUPLICADA', { cause: error })
    throw error
  }
}

export async function eliminar(idBus) {
  if (await Bus.eliminar(idBus) === 0) throw new Error('BUS_NO_ENCONTRADO')
}

/** Cierre de sesión del conductor: su bus deja de figurar en servicio. */
export function liberarDeConductor(idConductor) {
  return Bus.desactivarDeConductor(idConductor)
}
