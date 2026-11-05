import { Router } from 'express'
import {
  listarHorarios,
  crearHorario,
  editarHorario,
  eliminarHorario,
} from '../controllers/horarioController.js'
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/', authMiddleware, listarHorarios)
router.post('/', authMiddleware, roleMiddleware('admin'), crearHorario)
router.patch('/:id', authMiddleware, roleMiddleware('admin'), editarHorario)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), eliminarHorario)

export default router
