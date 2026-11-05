import { Router } from 'express'
import { listarUsuarios, crearUsuario, editarUsuario, eliminarUsuario, editarPerfil, cambiarPassword } from '../controllers/usuarioController.js'
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js'

const router = Router()

// Rutas propias del usuario autenticado (antes de /:id para evitar conflictos)
router.patch('/perfil',   authMiddleware, editarPerfil)
router.patch('/password', authMiddleware, cambiarPassword)

// Rutas de administración
router.get('/',       authMiddleware, roleMiddleware('admin'), listarUsuarios)
router.post('/',      authMiddleware, roleMiddleware('admin'), crearUsuario)
router.patch('/:id',  authMiddleware, roleMiddleware('admin'), editarUsuario)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), eliminarUsuario)

export default router