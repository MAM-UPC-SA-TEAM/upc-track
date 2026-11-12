// src/routes/rutaRoutes.js

import { Router } from 'express'
import { listarRutas, obtenerRuta, crearRuta, editarRuta, eliminarRuta } from '../controllers/rutaController.js'
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js'

const router = Router()

// GET /api/rutas — cualquier usuario autenticado
router.get('/', authMiddleware, listarRutas)

// GET /api/rutas/:id — detalle de una ruta
router.get('/:id', authMiddleware, obtenerRuta)

router.post('/',      authMiddleware, roleMiddleware('admin'), crearRuta)

router.patch('/:id',  authMiddleware, roleMiddleware('admin'), editarRuta)

router.delete('/:id', authMiddleware, roleMiddleware('admin'), eliminarRuta)

export default router
