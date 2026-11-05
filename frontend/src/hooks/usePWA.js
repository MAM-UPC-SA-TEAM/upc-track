/**
 * usePWA — hook para gestionar instalación PWA y estado de red
 *
 * Uso:
 *   const { puedeInstalar, instalar, estaOffline, actualizacionDisponible } = usePWA()
 */
import { useState, useEffect, useCallback } from 'react'

export function usePWA() {
  const [promptInstalacion, setPromptInstalacion] = useState(null)
  const [puedeInstalar, setPuedeInstalar]          = useState(false)
  const [estaOffline, setEstaOffline]              = useState(!navigator.onLine)
  const [actualizacionDisponible, setActualizacion] = useState(false)

  useEffect(() => {
    // ── Capturar el evento de instalación del navegador ──
    const handleBeforeInstall = (e) => {
      e.preventDefault()          // evitar prompt automático
      setPromptInstalacion(e)
      setPuedeInstalar(true)
    }

    // ── Detectar cuando ya está instalada (standalone) ──
    const yaInstalada =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (!yaInstalada) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    }

    // ── Monitorear red online/offline ──
    const onOnline  = () => setEstaOffline(false)
    const onOffline = () => setEstaOffline(true)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)

    // ── Service Worker: detectar actualización disponible ──
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setActualizacion(true)
      })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  // Ejecutar el prompt de instalación
  const instalar = useCallback(async () => {
    if (!promptInstalacion) return false
    promptInstalacion.prompt()
    const { outcome } = await promptInstalacion.userChoice
    if (outcome === 'accepted') {
      setPromptInstalacion(null)
      setPuedeInstalar(false)
    }
    return outcome === 'accepted'
  }, [promptInstalacion])

  // Recargar para aplicar actualización del SW
  const aplicarActualizacion = useCallback(() => {
    window.location.reload()
  }, [])

  return {
    puedeInstalar,
    instalar,
    estaOffline,
    actualizacionDisponible,
    aplicarActualizacion,
  }
}
