import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SplashScreen } from '@capacitor/splash-screen'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/spline-sans-mono'
import 'leaflet/dist/leaflet.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/mapa.css'
import App from './App'
import { aplicarTema, temaInicialOscuro } from './utils/tema'
import { esNativa } from './utils/platform'

aplicarTema(temaInicialOscuro())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// En la app nativa el splash se mantiene hasta que React pinta el primer cuadro:
// así no hay un destello en blanco entre el splash y la interfaz.
if (esNativa) requestAnimationFrame(() => SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {}))
