import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/instrument-sans'
import './index.css'
import FeriaPage from './features/feria/FeriaPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FeriaPage />
  </StrictMode>,
)
