// Adapter de geolocalizacion: @capacitor/geolocation en la app nativa y la API del
// navegador en web/PWA. Las pantallas solo conocen esta interfaz.
//
//   const h = watchPosition(({ lat, lng }) => ..., (err) => ..., { precisionAlta: true })
//   h.detener()
//   const { lat, lng } = await getCurrentPosition()
//
// Los errores llegan como { codigo, mensaje } con codigo:
//   'permiso_denegado' | 'no_disponible' | 'tiempo_agotado' | 'inseguro'

import { Geolocation } from '@capacitor/geolocation'
import { esNativa } from '../utils/platform'

const MENSAJES = {
  permiso_denegado: esNativa
    ? 'Permiso de ubicación denegado. Actívalo en Ajustes > Aplicaciones > UpcTrack > Permisos > Ubicación.'
    : 'Permiso de ubicación denegado. Actívalo en los permisos del sitio del navegador (candado junto a la dirección) y recarga.',
  no_disponible: 'No se pudo obtener la ubicación. Revisa que el GPS esté encendido.',
  tiempo_agotado: 'La ubicación tardó demasiado. Sal a un lugar abierto e inténtalo de nuevo.',
  inseguro: 'GPS bloqueado: esta página debe abrirse por HTTPS (o localhost) para usar la ubicación.',
}

function error(codigo) {
  return { codigo, mensaje: MENSAJES[codigo] }
}

// Traduce el error del navegador o del plugin a uno de los codigos anteriores
function normalizar(err) {
  if (err?.codigo) return err
  const texto = `${err?.message || ''}`.toLowerCase()
  if (err?.code === 1 || texto.includes('denied') || texto.includes('permission')) return error('permiso_denegado')
  if (err?.code === 3 || texto.includes('timeout') || texto.includes('timed out')) return error('tiempo_agotado')
  return error('no_disponible')
}

const aPunto = (pos) => ({ lat: pos.coords.latitude, lng: pos.coords.longitude })

// En nativo pide el permiso si aun no esta concedido. Lanza error('permiso_denegado').
async function asegurarPermiso() {
  let estado = await Geolocation.checkPermissions()
  if (estado.location !== 'granted') estado = await Geolocation.requestPermissions()
  if (estado.location !== 'granted' && estado.coarseLocation !== 'granted') throw error('permiso_denegado')
}

export function disponible() {
  return esNativa || (typeof navigator !== 'undefined' && 'geolocation' in navigator)
}

export async function getCurrentPosition({ precisionAlta = true, timeout = 10000 } = {}) {
  if (!esNativa) {
    if (!window.isSecureContext) throw error('inseguro')
    if (!navigator.geolocation) throw error('no_disponible')
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(aPunto(pos)),
        (err) => reject(normalizar(err)),
        { enableHighAccuracy: precisionAlta, timeout }
      )
    })
  }
  try {
    await asegurarPermiso()
    return aPunto(await Geolocation.getCurrentPosition({ enableHighAccuracy: precisionAlta, timeout }))
  } catch (err) {
    throw normalizar(err)
  }
}

// Devuelve de inmediato un manejador { detener }; la suscripcion nativa es asincrona.
export function watchPosition(alPosicion, alError, { precisionAlta = true, timeout = 10000, maximumAge = 3000 } = {}) {
  let detenido = false
  let limpiar = () => {}
  const handle = { detener() { detenido = true; limpiar() } }

  if (!esNativa) {
    if (!window.isSecureContext) { alError(error('inseguro')); return handle }
    if (!navigator.geolocation) { alError(error('no_disponible')); return handle }
    const id = navigator.geolocation.watchPosition(
      (pos) => alPosicion(aPunto(pos)),
      (err) => alError(normalizar(err)),
      { enableHighAccuracy: precisionAlta, maximumAge, timeout }
    )
    limpiar = () => navigator.geolocation.clearWatch(id)
    return handle
  }

  asegurarPermiso()
    .then(() => Geolocation.watchPosition(
      { enableHighAccuracy: precisionAlta, maximumAge, timeout },
      (pos, err) => {
        if (detenido) return
        if (err) alError(normalizar(err))
        else if (pos) alPosicion(aPunto(pos))
      }
    ))
    .then((id) => {
      limpiar = () => Geolocation.clearWatch({ id })
      if (detenido) limpiar()
    })
    .catch((err) => { if (!detenido) alError(normalizar(err)) })
  return handle
}
