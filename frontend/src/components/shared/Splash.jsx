import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBus } from '@fortawesome/free-solid-svg-icons'
import { EVENTO_SERVIDOR } from '../../services/api'
import {
  DURACION_MAX_MS, DURACION_MIN_MS, DURACION_MIN_REDUCIDA_MS, DURACION_SALIDA_MS,
  debeMostrarSplash, marcarSplashMostrado, prefiereMenosMovimiento,
} from '../../utils/splash'
import './Splash.css'

// Splash de arranque (U35): un bus recorre la línea de ruta hasta la parada. Toma el relevo del splash nativo
// (papel + marca, mismo fondo, sin destello) y se despide con un fundido.
//
// Reglas:
//  · Una vez por arranque en frío: volver del fondo no remonta la app, y una vez mostrado no se repite.
//  · Dura lo que el bus tarda en llegar (DURACION_MIN_MS) y nunca retiene la app más de DURACION_MAX_MS.
//  · Si el servidor está despertando (Render, ~1 min en frío) se retira de inmediato: el aviso «Despertando el
//    servidor» toma el relevo y no hay dos pantallas de espera seguidas.
//  · Con prefers-reduced-motion no hay movimiento ni fundido: forma fija y salida en el acto.
//  · En el navegador la landing (/) abre directo; el splash es de la app (APK, PWA instalada y rutas internas).
//  · Siempre en papel claro, aunque el tema de la app sea oscuro: el splash nativo de Android es siempre claro y sigue
//    el modo del sistema, no el tema elegido en la app. Así el relevo no cambia de color y, al terminar, el fundido
//    de salida revela la interfaz (clara u oscura) en lugar de un destello.

export default function Splash() {
  const [fase, setFase] = useState(() => (debeMostrarSplash() ? 'visible' : 'oculto'))

  useEffect(() => {
    if (fase !== 'visible') return undefined
    const reducido = prefiereMenosMovimiento()
    let cerrado = false
    const timers = []

    const salir = () => {
      if (cerrado) return
      cerrado = true
      timers.forEach(clearTimeout)
      marcarSplashMostrado()
      if (reducido) { setFase('oculto'); return }
      setFase('saliendo')
      setTimeout(() => setFase('oculto'), DURACION_SALIDA_MS)
    }

    // Servidor dormido: el aviso «Despertando el servidor» toma el relevo
    const alServidor = (e) => { if (e.detail?.activo) salir() }
    window.addEventListener(EVENTO_SERVIDOR, alServidor)

    timers.push(setTimeout(salir, reducido ? DURACION_MIN_REDUCIDA_MS : DURACION_MIN_MS))
    // Tope: aunque algo falle, nunca retiene la app (el temporizador mínimo ya cierra antes; esto es un seguro)
    timers.push(setTimeout(salir, DURACION_MAX_MS))

    return () => {
      cerrado = true
      timers.forEach(clearTimeout)
      window.removeEventListener(EVENTO_SERVIDOR, alServidor)
    }
  }, [fase])

  if (fase === 'oculto') return null

  return (
    <div className="splash" data-fase={fase} role="status" aria-label="Cargando UpcTrack">
      <div className="splash-centro" aria-hidden="true">
        <img src="/brand/upc-track-mark.png" alt="" className="splash-marca" />
        <div className="splash-debajo">
          <p className="splash-nombre">UpcTrack</p>
          <div className="splash-ruta">
            <span className="splash-origen" />
            <span className="splash-parada" />
            <span className="splash-bus"><FontAwesomeIcon icon={faBus} /></span>
          </div>
        </div>
      </div>
    </div>
  )
}
