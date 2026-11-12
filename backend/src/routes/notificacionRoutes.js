// src/routes/notificacionRoutes.js

import { Router } from 'express'
import { enviarNotificacion, listarNotificaciones } from '../controllers/notificacionController.js'
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js'

const router = Router()

// POST /api/notificaciones — solo conductores
router.post('/', authMiddleware, roleMiddleware('conductor'), enviarNotificacion)

// GET /api/notificaciones — cualquier usuario autenticado
router.get('/', authMiddleware, listarNotificaciones)

export default router
