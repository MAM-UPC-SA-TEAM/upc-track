// src/routes/busRoutes.js

import { Router } from 'express'
import {
  listarBuses,
  busesActivos,
  busesConPosicion,
  miBus,
  obtenerBus,
  crearBus,
  editarBus,
  eliminarBus,
  cambiarEstado,
} from '../controllers/busController.js'
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js'


const router = Router()

// GET /api/buses — lista completa (cualquier usuario autenticado)
router.get('/', authMiddleware, listarBuses)

// POST /api/buses — crear bus (solo admin)
router.post('/', authMiddleware, roleMiddleware('admin'), crearBus)

// GET /api/buses/activos — buses en servicio con última posición (para el mapa)
router.get('/activos', authMiddleware, busesActivos)

// GET /api/buses/todos-posicion — todos los buses con posición
router.get('/todos-posicion', authMiddleware, busesConPosicion)

// GET /api/buses/mi-bus — solo conductores
router.get('/mi-bus', authMiddleware, roleMiddleware('conductor'), miBus)

// GET /api/buses/:id — detalle de un bus
router.get('/:id', authMiddleware, obtenerBus)

// PATCH /api/buses/:id — editar bus (solo admin)
router.patch('/:id', authMiddleware, roleMiddleware('admin'), editarBus)

// DELETE /api/buses/:id — eliminar bus (solo admin)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), eliminarBus)

// PATCH /api/buses/:id/estado — solo conductores
router.patch('/:id/estado', authMiddleware, roleMiddleware('conductor'), cambiarEstado)

router.post('/',     authMiddleware, roleMiddleware('admin'), crearBus)
router.patch('/:id', authMiddleware, roleMiddleware('admin', 'conductor'), editarBus)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), eliminarBus)

export default router
