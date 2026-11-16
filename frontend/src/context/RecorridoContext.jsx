import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import api from '../services/api'
import { watchPosition, disponible } from '../services/geolocation'
import { alCambiarRed, hayRed } from '../services/red'
import { useAuth } from './AuthContext'

// El recorrido del conductor vive POR ENCIMA de las rutas: ir a Alertas o a Perfil desmonta la pantalla
// «Mi recorrido», pero el teléfono debe seguir transmitiendo y el bus debe seguir en servicio.
// El bus solo se cierra al finalizar, al cerrar sesión o al cerrar la app.

const INTERVALO_ENVIO_MS = 4000
const ahoraMs = () => Date.now() // helper de módulo: se llama desde manejadores, nunca al renderizar

const RecorridoContext = createContext(null)
const CerrarRecorridoContext = createContext(async () => {})

export function RecorridoProvider({ children }) {
  const { usuario } = useAuth()
  const esConductor = usuario?.tipo_usuario === 'conductor'

  const [busInfo, setBusInfo] = useState(null)
  const [enRecorrido, setEnRecorrido] = useState(false) // este teléfono está transmitiendo
  const [estado, setEstado] = useState('fuera_de_servicio') // estado del bus en el servidor
  const [gps, setGps] = useState(null)
  const [historialGps, setHistorialGps] = useState([])
  const [estadoConexion, setEstadoConexion] = useState(() => (hayRed() ? 'online' : 'offline'))
  const [ultimoEnvioMs, setUltimoEnvioMs] = useState(null)
  const [inicioMs, setInicioMs] = useState(null)
  const [errorCargaBus, setErrorCargaBus] = useState('')
  const [errorGps, setErrorGps] = useState('')
  const [errorAccion, setErrorAccion] = useState('')

  const watchRef = useRef(null)
  const ultimoEnvioRef = useRef(0)
  const busRef = useRef(null)
  const debeCerrarRef = useRef(false)

  // El servidor dice «en recorrido» o «detenido» pero este teléfono no transmite (recarga, caída, reinicio)
  const servidorActivo = estado === 'en_recorrido' || estado === 'detenido'
  const colgado = !enRecorrido && servidorActivo
  useEffect(() => { debeCerrarRef.current = enRecorrido || colgado }, [enRecorrido, colgado])

  // Apaga el GPS y, si el bus seguía en servicio, lo deja inactivo. Estable: solo lee refs.
  const cerrarSiActivo = useCallback(async () => {
    watchRef.current?.detener()
    watchRef.current = null
    const idBus = busRef.current?.id_bus
    if (debeCerrarRef.current && idBus) {
      debeCerrarRef.current = false
      try { await api.patch(`/api/buses/${idBus}/estado`, { estado: 'inactivo' }) } catch { /* sin red: el bus caduca por antigüedad */ }
    }
  }, [])

  // Solo el conductor carga su bus; al terminar su sesión (o al cerrar la app) se cierra el recorrido
  useEffect(() => {
    if (!esConductor) return undefined
    let vigente = true
    async function cargar() {
      try {
        const data = await api.get('/api/buses/mi-bus')
        if (!vigente) return
        if (data.bus) {
          busRef.current = data.bus
          setBusInfo(data.bus)
          setEstado(data.bus.estado || 'fuera_de_servicio')
          // Antigüedad de la última posición que el servidor tiene de este bus (si recargamos a mitad de ruta)
          if (data.bus.edad_segundos != null) setUltimoEnvioMs(Date.now() - data.bus.edad_segundos * 1000)
          setErrorCargaBus('')
        }
      } catch (err) {
        if (!vigente) return
        busRef.current = null
        setBusInfo(null)
        setEstado('fuera_de_servicio')
        setErrorCargaBus(err?.status === 404
          ? 'No tienes un bus o ruta asignada actualmente.'
          : 'No se pudo cargar la información del bus.')
      }
    }
    cargar()
    return () => {
      vigente = false
      cerrarSiActivo()
      busRef.current = null
      setBusInfo(null)
      setEnRecorrido(false)
      setEstado('fuera_de_servicio')
      setGps(null)
      setHistorialGps([])
      setUltimoEnvioMs(null)
      setInicioMs(null)
    }
  }, [esConductor, cerrarSiActivo])

  useEffect(() => alCambiarRed((conectado) => {
    setEstadoConexion(prev => (conectado ? (prev === 'offline' ? 'retrying' : prev) : 'offline'))
  }), [])

  async function actualizarEstadoBus(nuevoEstado) {
    const idBus = busRef.current?.id_bus
    if (!idBus) {
      setErrorAccion('No hay un bus asignado para actualizar su estado.')
      return
    }
    try {
      await api.patch(`/api/buses/${idBus}/estado`, { estado: nuevoEstado })
      setErrorAccion('')
    } catch {
      setErrorAccion('No se pudo actualizar el estado del bus. Revisa tu conexión.')
    }
  }

  async function enviarUbicacion(lat, lng) {
    const idBus = busRef.current?.id_bus
    if (!idBus) return
    try {
      setEstadoConexion('syncing')
      await api.post('/api/ubicacion', { id_bus: idBus, lat, lng })
      setEstadoConexion('online')
      setUltimoEnvioMs(Date.now())
    } catch {
      setEstadoConexion(hayRed() ? 'retrying' : 'offline')
    }
  }

  function iniciarRecorrido() {
    if (!disponible()) {
      setErrorGps('GPS no disponible en este dispositivo.')
      return
    }

    setErrorGps('')
    setErrorAccion('')
    setEnRecorrido(true)
    setEstado('en_recorrido')
    setInicioMs(ahoraMs())
    ultimoEnvioRef.current = 0
    actualizarEstadoBus('en_recorrido')

    watchRef.current?.detener()
    watchRef.current = watchPosition(
      ({ lat, lng }) => {
        const t = Date.now()
        setErrorGps('')
        setGps({ lat, lng })
        setHistorialGps(prev => [...prev.slice(-19), { lat, lng, id: t }])
        if (!ultimoEnvioRef.current || (t - ultimoEnvioRef.current) >= INTERVALO_ENVIO_MS) {
          ultimoEnvioRef.current = t
          enviarUbicacion(lat, lng)
        }
      },
      (err) => { setErrorGps(err.mensaje) },
      { precisionAlta: true, maximumAge: 3000, timeout: 10000 }
    )

    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').catch(() => {})
    }
  }

  function finalizarRecorrido() {
    setEnRecorrido(false)
    setEstado('fuera_de_servicio')
    setGps(null)
    setHistorialGps([])
    setErrorGps('')
    ultimoEnvioRef.current = 0
    watchRef.current?.detener()
    watchRef.current = null
    actualizarEstadoBus('fuera_de_servicio')
  }

  function alternarDetenido() {
    if (!enRecorrido) return
    const nuevoEstado = estado === 'detenido' ? 'en_recorrido' : 'detenido'
    setEstado(nuevoEstado)
    actualizarEstadoBus(nuevoEstado)
  }

  async function enviarAviso(tipo, mensaje) {
    try {
      await api.post('/api/notificaciones', { mensaje, tipo })
      return true
    } catch {
      return false
    }
  }

  const valor = {
    busInfo, enRecorrido, estado, colgado, gps, historialGps, estadoConexion, ultimoEnvioMs, inicioMs,
    errorCargaBus, errorGps, errorAccion,
    iniciarRecorrido, finalizarRecorrido, alternarDetenido, enviarAviso,
  }

  return (
    <CerrarRecorridoContext.Provider value={cerrarSiActivo}>
      <RecorridoContext.Provider value={valor}>{children}</RecorridoContext.Provider>
    </CerrarRecorridoContext.Provider>
  )
}

// Estado y acciones del recorrido (solo lo usa la pantalla «Mi recorrido»)
export function useRecorrido() {
  return useContext(RecorridoContext)
}

// Función estable para cerrar el recorrido antes de salir (cerrar sesión). No provoca renders por cada posición.
export function useCerrarRecorrido() {
  return useContext(CerrarRecorridoContext)
}
