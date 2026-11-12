// src/routes/ubicacionRoutes.js
// Solo el conductor puede enviar su ubicación

import { Router }           from 'express'
import { recibirUbicacion } from '../controllers/ubicacionController.js'
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js'

const router = Router()

// POST /api/ubicacion — solo conductores autenticados
router.post('/', authMiddleware, roleMiddleware('conductor'), recibirUbicacion)

export default router
