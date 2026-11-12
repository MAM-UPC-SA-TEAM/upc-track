// Edad de un dato en texto corto: «12 s» hasta 90 s, luego en minutos.
export function textoEdad(seg) {
  if (seg == null) return ''
  const s = Math.max(0, Math.round(seg))
  return s < 90 ? `${s} s` : `${Math.round(s / 60)} min`
}

// «Ahora», «Hace 5 min», «Hace 2 h», «Hace 3 d» a partir de una fecha (avisos y notificaciones).
export function textoHace(fecha, ahora = Date.now()) {
  const min = Math.floor((ahora - new Date(fecha).getTime()) / 60000)
  if (!Number.isFinite(min) || min < 1) return 'Ahora'
  if (min < 60) return `Hace ${min} min`
  if (min < 1440) return `Hace ${Math.floor(min / 60)} h`
  return `Hace ${Math.floor(min / 1440)} d`
}
