import { Horario } from '../models/Horario.js'
import { asyncHandler } from '../middlewares/errorMiddleware.js'
import { notFound } from '../utils/httpError.js'

function esHoraValida(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''))
}

export const listarHorarios = asyncHandler(async (req, res) => {
  const { ruta_id } = req.query

  if (ruta_id) {
    const horarios = await Horario.porRuta(Number(ruta_id))
    return res.status(200).json({ horarios })
  }

  const horarios = await Horario.todos()
  return res.status(200).json({ horarios })
})

export const crearHorario = asyncHandler(async (req, res) => {
  const { ruta_id, hora_salida, hora_llegada } = req.body

  if (!ruta_id || !hora_salida || !hora_llegada) {
    return res.status(400).json({ error: 'ruta_id, hora_salida y hora_llegada son obligatorios' })
  }

  if (!esHoraValida(hora_salida) || !esHoraValida(hora_llegada)) {
    return res.status(400).json({ error: 'Formato de hora invalido. Usa HH:mm' })
  }

  const idHorario = await Horario.crear({
    id_ruta: Number(ruta_id),
    hora_salida,
    hora_llegada,
  })

  return res.status(201).json({ ok: true, id_horario: idHorario })
})

export const editarHorario = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { hora_salida, hora_llegada } = req.body

  if (!hora_salida || !hora_llegada) {
    return res.status(400).json({ error: 'hora_salida y hora_llegada son obligatorios' })
  }

  if (!esHoraValida(hora_salida) || !esHoraValida(hora_llegada)) {
    return res.status(400).json({ error: 'Formato de hora invalido. Usa HH:mm' })
  }

  const horario = await Horario.porId(Number(id))
  if (!horario) throw notFound('Horario no encontrado')

  await Horario.editar(Number(id), { hora_salida, hora_llegada })
  return res.status(200).json({ ok: true })
})

export const eliminarHorario = asyncHandler(async (req, res) => {
  const { id } = req.params

  const horario = await Horario.porId(Number(id))
  if (!horario) throw notFound('Horario no encontrado')

  await Horario.eliminar(Number(id))
  return res.status(200).json({ ok: true })
})
