// src/routes/paradaRoutes.js

import { Router } from 'express'
import {
	listarParadas,
	crearParada,
	editarParada,
	eliminarParada,
} from '../controllers/paradaController.js'
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js'

const router = Router()

// GET /api/paradas — todas, o filtrar con ?ruta_id=X
router.get('/', authMiddleware, listarParadas)

// CRUD admin de paradas
router.post('/', authMiddleware, roleMiddleware('admin'), crearParada)
router.patch('/:id', authMiddleware, roleMiddleware('admin'), editarParada)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), eliminarParada)

export default router
