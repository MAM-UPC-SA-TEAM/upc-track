// src/utils/httpError.js
// Error con código HTTP. Los controladores lo lanzan (o `asyncHandler` lo construye a partir de un error de
// dominio) y el `errorHandler` final lo convierte en la respuesta `{ error: string }`.
//
//   throw notFound('Bus no encontrado')
//   throw new HttpError(403, 'Tu cuenta aún no está activa.', { extra: { codigo: 'CUENTA_INACTIVA' } })

export class HttpError extends Error {
  /**
   * @param {number} status   código HTTP
   * @param {string} mensaje  texto que ve el cliente (`error` en el JSON)
   * @param {{ detalle?: string, extra?: object, cause?: unknown }} [opciones]
   *   `detalle`: texto interno para los registros y las pruebas, si difiere del público;
   *   `extra`: campos adicionales del JSON (p. ej. `codigo`).
   */
  constructor(status, mensaje, { detalle, extra, cause } = {}) {
    super(detalle ?? mensaje, cause === undefined ? undefined : { cause })
    this.name = 'HttpError'
    this.status = status
    this.publico = mensaje
    this.extra = extra
  }
}

export const badRequest = (mensaje, opciones) => new HttpError(400, mensaje, opciones)
export const unauthorized = (mensaje, opciones) => new HttpError(401, mensaje, opciones)
export const forbidden = (mensaje, opciones) => new HttpError(403, mensaje, opciones)
export const notFound = (mensaje, opciones) => new HttpError(404, mensaje, opciones)
export const conflict = (mensaje, opciones) => new HttpError(409, mensaje, opciones)
