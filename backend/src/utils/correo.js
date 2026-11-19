// src/utils/correo.js
// Validación del correo institucional en el servidor (A01). Nunca confiar solo en el formulario.
// Validar el dominio NO prueba titularidad del buzón: eso lo resuelve la verificación (ver issue A01).

const PREDETERMINADO = 'unicesar.edu.co'

/** Dominios permitidos para el registro público (variable DOMINIOS_CORREO_PERMITIDOS, separados por coma). */
export function dominiosPermitidos(env = process.env) {
  const lista = String(env.DOMINIOS_CORREO_PERMITIDOS || PREDETERMINADO)
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
  return lista.length ? lista : [PREDETERMINADO]
}

/** Recorta y pasa a minúsculas. */
export function normalizarCorreo(correo) {
  return String(correo ?? '').trim().toLowerCase()
}

/**
 * true si el correo es de un dominio permitido, por igualdad EXACTA del dominio tras la última «@».
 * Rechaza `x@unicesar.edu.co.evil.com`, `x@evilunicesar.edu.co`, subdominios no listados
 * y cualquier carácter fuera de ASCII imprimible (homoglifos Unicode como la «а» cirílica).
 */
export function esCorreoPermitido(correo, permitidos = dominiosPermitidos()) {
  const c = normalizarCorreo(correo)
  if (!/^[\x21-\x7e]+$/.test(c)) return false // sin espacios, sin controles, solo ASCII
  const arroba = c.lastIndexOf('@')
  if (arroba < 1) return false // sin parte local
  const local = c.slice(0, arroba)
  const dominio = c.slice(arroba + 1)
  if (local.includes('@')) return false
  return permitidos.includes(dominio)
}

export function mensajeCorreoNoPermitido(permitidos = dominiosPermitidos()) {
  return `Usa tu correo institucional @${permitidos[0]}`
}
