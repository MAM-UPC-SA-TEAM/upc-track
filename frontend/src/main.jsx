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
import Splash from './components/shared/Splash'
import { aplicarTema, fijarBarraEstadoClara, temaInicialOscuro } from './utils/tema'
import { debeMostrarSplash } from './utils/splash'
import { esNativa } from './utils/platform'

// Con splash, la barra de estado se queda clara mientras dure (lo suelta el propio splash); antes del primer aplicarTema
fijarBarraEstadoClara(debeMostrarSplash())
aplicarTema(temaInicialOscuro())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Splash />
  </StrictMode>
)

// En la app nativa el splash se mantiene hasta que React pinta el primer cuadro:
// así no hay un destello en blanco entre el splash y la interfaz.
if (esNativa) requestAnimationFrame(() => SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {}))
