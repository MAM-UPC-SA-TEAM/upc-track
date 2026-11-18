// src/middlewares/errorMiddleware.js
// Manejo de errores centralizado: los controladores dejan de repetir try/catch + console.error + res.status(500).
//
//   export const editarBus = asyncHandler(async (req, res) => {
//     await busService.editar(req.params.id, req.body)   // si lanza, lo atiende errorHandler
//     return res.status(200).json({ ok: true })
//   }, { BUS_NO_ENCONTRADO: [404, 'Bus no encontrado'], PLACA_DUPLICADA: [400, 'Ya existe un bus con esa placa'] })
//
// El segundo parámetro traduce los errores de dominio de los servicios (el código va en `error.message`) a
// `[status, mensaje, extra?]`. Lo que no se traduce llega a `errorHandler`: los HttpError, a su código; el
// resto es un 500 genérico que se registra. La forma de la respuesta siempre es `{ error: string }`.

import { HttpError } from '../utils/httpError.js'

/** Envuelve un handler async: cualquier error (o rechazo) pasa a `next` en lugar de colgar la petición. */
export function asyncHandler(handler, traducciones = {}) {
  return async function manejador(req, res, next) {
    try {
      await handler(req, res, next)
    } catch (error) {
      const t = Object.hasOwn(traducciones, error?.message) ? traducciones[error.message] : null
      if (t) {
        const [status, mensaje, extra] = t
        next(new HttpError(status, mensaje, { extra, cause: error }))
      } else {
        next(error)
      }
    }
  }
}

/** Ruta que no existe: va al final de las rutas. */
export function rutaNoEncontrada(_req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' })
}

/** Último middleware de Express: convierte cualquier error en `{ error }` con su código HTTP. */
// Express reconoce el manejador de errores por sus 4 parámetros: `next` debe estar aunque a veces no se use
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.publico, ...err.extra })
  }
  // Cuerpo que no es JSON válido (express.json): antes respondía con una página HTML de error
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' })
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'El cuerpo de la petición es demasiado grande' })
  }

  console.error(`Error en ${req.method} ${req.originalUrl}:`, err)
  return res.status(500).json({ error: 'Error interno del servidor' })
}
