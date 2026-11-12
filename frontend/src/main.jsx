import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/spline-sans-mono'
import 'leaflet/dist/leaflet.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/mapa.css'
import App from './App'

try {
  const guardado = localStorage.getItem('tema')
  const oscuro = guardado ? guardado === 'oscuro' : window.matchMedia('(prefers-color-scheme: dark)').matches
  document.body.dataset.tema = oscuro ? 'oscuro' : 'claro'
} catch { /* sin almacenamiento: tema claro */ }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)