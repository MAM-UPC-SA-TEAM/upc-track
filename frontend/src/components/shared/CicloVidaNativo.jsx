import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { escucharBotonAtras, salirDeLaApp } from '../../services/cicloVida'

// Pantallas de entrada de cada rol: desde aquí «atrás» cierra la app en vez de navegar.
const RAICES = new Set(['/', '/login', '/inicio', '/conductor', '/admin'])

// Botón atrás de Android: primero cierra lo que esté abierto (diálogo, panel),
// luego navega hacia atrás y solo sale de la app desde una raíz.
export default function CicloVidaNativo() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const rutaRef = useRef(pathname)
  useEffect(() => { rutaRef.current = pathname }, [pathname])

  useEffect(() => escucharBotonAtras((puedeVolver) => {
    const dialogo = document.querySelector('dialog[open]')
    if (dialogo) { dialogo.close(); return }
    if (RAICES.has(rutaRef.current) || !puedeVolver) salirDeLaApp()
    else navigate(-1)
  }), [navigate])

  return null
}
