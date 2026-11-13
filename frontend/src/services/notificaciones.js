// Notificaciones del sistema (Factory): @capacitor/local-notifications en la app
// nativa —la WebView de Android no tiene la Notification API— y la Notification API
// del navegador en web/PWA. Las pantallas solo conocen esta interfaz:
//
//   await notificador.estado()        -> 'concedido' | 'denegado' | 'pendiente' | 'no_soportado'
//   await notificador.pedirPermiso()  -> mismo estado, tras preguntar al usuario
//   await notificador.mostrar({ titulo, cuerpo })
//   const quitar = notificador.alTocar(() => ...)
//
// Sin push remoto (FCM): el aviso llega por el socket, así que solo funciona con la
// app abierta o en segundo plano reciente (limitación declarada en el manual).

import { LocalNotifications } from '@capacitor/local-notifications'
import { esNativa } from '../utils/platform'

const CANAL = 'avisos-bus'

function traducir(permiso) {
  if (permiso === 'granted') return 'concedido'
  if (permiso === 'denied') return 'denegado'
  return 'pendiente' // 'default' (web), 'prompt' y 'prompt-with-rationale' (nativo)
}

function crearNotificadorNativo() {
  let canalListo = null
  let siguienteId = Date.now() % 1_000_000_000 // id entero de 32 bits, único en la sesión

  // Android 8+: canal de alta importancia para que el aviso aparezca como banner
  const asegurarCanal = () => {
    canalListo ??= LocalNotifications.createChannel({
      id: CANAL,
      name: 'Avisos del bus',
      description: 'Cambios de estado y avisos del conductor de tu ruta',
      importance: 4,
      visibility: 1,
      vibration: true,
    }).catch(() => {})
    return canalListo
  }

  return {
    async estado() {
      try { return traducir((await LocalNotifications.checkPermissions()).display) } catch { return 'no_soportado' }
    },
    async pedirPermiso() {
      try { return traducir((await LocalNotifications.requestPermissions()).display) } catch { return 'no_soportado' }
    },
    async mostrar({ titulo, cuerpo }) {
      await asegurarCanal()
      await LocalNotifications.schedule({
        notifications: [{
          id: siguienteId++,
          title: titulo,
          body: cuerpo,
          channelId: CANAL,
          smallIcon: 'ic_stat_upctrack',
          iconColor: '#1E6B2E',
        }],
      })
    },
    alTocar(cb) {
      const h = LocalNotifications.addListener('localNotificationActionPerformed', () => cb())
      return () => { h.then(x => x.remove()) }
    },
  }
}

function crearNotificadorWeb() {
  const soportado = typeof window !== 'undefined' && 'Notification' in window
  const oyentes = new Set()

  return {
    async estado() {
      return soportado ? traducir(Notification.permission) : 'no_soportado'
    },
    async pedirPermiso() {
      if (!soportado) return 'no_soportado'
      return traducir(await Notification.requestPermission())
    },
    async mostrar({ titulo, cuerpo }) {
      if (!soportado || Notification.permission !== 'granted') return
      const n = new Notification(titulo, {
        body: cuerpo,
        icon: '/pwa-192x192.png',
        silent: true, // el sonido lo pone la app
        tag: 'bus-notif', // reemplaza la anterior en vez de apilar
      })
      n.onclick = () => { window.focus(); n.close(); oyentes.forEach(cb => cb()) }
    },
    alTocar(cb) {
      oyentes.add(cb)
      return () => oyentes.delete(cb)
    },
  }
}

export function crearNotificador(nativa = esNativa) {
  return nativa ? crearNotificadorNativo() : crearNotificadorWeb()
}

export const notificador = crearNotificador()
