import { Horario } from '../models/Horario.js'

function esHoraValida(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''))
}

export async function listarHorarios(req, res) {
  const { ruta_id } = req.query

  try {
    if (ruta_id) {
      const horarios = await Horario.porRuta(Number(ruta_id))
      return res.status(200).json({ horarios })
    }

    const horarios = await Horario.todos()
    return res.status(200).json({ horarios })
  } catch (error) {
    console.error('Error listando horarios:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export async function crearHorario(req, res) {
  const { ruta_id, hora_salida, hora_llegada } = req.body

  if (!ruta_id || !hora_salida || !hora_llegada) {
    return res.status(400).json({ error: 'ruta_id, hora_salida y hora_llegada son obligatorios' })
  }

  if (!esHoraValida(hora_salida) || !esHoraValida(hora_llegada)) {
    return res.status(400).json({ error: 'Formato de hora invalido. Usa HH:mm' })
  }

  try {
    const idHorario = await Horario.crear({
      id_ruta: Number(ruta_id),
      hora_salida,
      hora_llegada,
    })

    return res.status(201).json({ ok: true, id_horario: idHorario })
  } catch (error) {
    console.error('Error creando horario:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export async function editarHorario(req, res) {
  const { id } = req.params
  const { hora_salida, hora_llegada } = req.body

  if (!hora_salida || !hora_llegada) {
    return res.status(400).json({ error: 'hora_salida y hora_llegada son obligatorios' })
  }

  if (!esHoraValida(hora_salida) || !esHoraValida(hora_llegada)) {
    return res.status(400).json({ error: 'Formato de hora invalido. Usa HH:mm' })
  }

  try {
    const horario = await Horario.porId(Number(id))
    if (!horario) return res.status(404).json({ error: 'Horario no encontrado' })

    await Horario.editar(Number(id), { hora_salida, hora_llegada })
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error editando horario:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export async function eliminarHorario(req, res) {
  const { id } = req.params

  try {
    const horario = await Horario.porId(Number(id))
    if (!horario) return res.status(404).json({ error: 'Horario no encontrado' })

    await Horario.eliminar(Number(id))
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error eliminando horario:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
