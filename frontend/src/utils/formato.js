// Edad de un dato en texto corto: «12 s» hasta 90 s, luego en minutos.
export function textoEdad(seg) {
  if (seg == null) return ''
  const s = Math.max(0, Math.round(seg))
  return s < 90 ? `${s} s` : `${Math.round(s / 60)} min`
}
