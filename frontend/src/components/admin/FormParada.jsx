import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, AttributionControl, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFloppyDisk, faTriangleExclamation, faMagnifyingGlass, faLocationCrosshairs } from '@fortawesome/free-solid-svg-icons'
import Campo from '../acceso/Campo'
import './Admin.css'

const CENTRO_DEFECTO = [8.3086, -73.6194] // Aguachica, Cesar
// Parada elegida: el punto amarillo del sistema (el mismo del Mapa)
const iconoParada = L.divIcon({ className: '', html: '<div class="mk-wrap"><span class="mk mk-parada"></span></div>', iconSize: [44, 44], iconAnchor: [22, 22] })

function AlTocar({ onElegir }) {
  useMapEvents({ click: e => onElegir(e.latlng.lat, e.latlng.lng) })
  return null
}

// El mapa nace dentro de un <dialog> cerrado (tamaño 0): hay que recalcular su tamaño al abrir y si cambia el contenedor.
function AjustarTamano() {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer()
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)
    map.invalidateSize()
    return () => ro.disconnect()
  }, [map])
  return null
}

function Recentrar({ centro }) {
  const map = useMap()
  useEffect(() => { map.setView(centro) }, [centro, map])
  return null
}

// Formulario de parada: campos a la izquierda y selector de punto en el mapa a la derecha.
// Los campos de latitud y longitud son la vía por teclado; el mapa es un atajo, no la única forma.
export default function FormParada({ modo, inicial, onGuardar, onCerrar }) {
  const [form, setForm] = useState(inicial)
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState([])
  const [mensajeMapa, setMensajeMapa] = useState(null) // { tipo: 'ok' | 'error', texto }

  const lat = Number(form.lat)
  const lng = Number(form.lng)
  const tienePunto = form.lat !== '' && form.lng !== '' && Number.isFinite(lat) && Number.isFinite(lng)
  // El centro solo cambia cuando cambia el punto (no en cada tecla), para que el mapa no salte
  const centro = useMemo(() => (tienePunto ? [lat, lng] : CENTRO_DEFECTO), [tienePunto, lat, lng])

  const cambiar = key => ev => {
    setForm(p => ({ ...p, [key]: ev.target.value }))
    if (errores[key]) setErrores(p => ({ ...p, [key]: '' }))
  }

  function elegirPunto(la, lo) {
    setForm(p => ({ ...p, lat: Number(la).toFixed(6), lng: Number(lo).toFixed(6) }))
    setErrores(p => ({ ...p, lat: '', lng: '' }))
  }

  function usarMiUbicacion() {
    if (!navigator.geolocation) { setMensajeMapa({ tipo: 'error', texto: 'Tu navegador no ofrece ubicación.' }); return }
    setMensajeMapa(null)
    navigator.geolocation.getCurrentPosition(
      pos => elegirPunto(pos.coords.latitude, pos.coords.longitude),
      () => setMensajeMapa({ tipo: 'error', texto: 'No se pudo obtener tu ubicación. Revisa los permisos del navegador.' }),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function buscarDireccion() {
    if (buscando) return
    const q = busqueda.trim()
    if (q.length < 3) { setMensajeMapa({ tipo: 'error', texto: 'Escribe al menos 3 caracteres para buscar.' }); return }
    setBuscando(true)
    setMensajeMapa(null)
    try {
      // La búsqueda se limita a Aguachica (Cesar, Colombia)
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=co&accept-language=es&q=${encodeURIComponent(`${q}, Aguachica, Cesar, Colombia`)}`
      const data = await (await fetch(url)).json()
      const lista = Array.isArray(data) ? data : []
      setResultados(lista)
      if (lista.length === 0) setMensajeMapa({ tipo: 'error', texto: 'No se encontraron resultados para esa dirección.' })
    } catch {
      setMensajeMapa({ tipo: 'error', texto: 'No se pudo buscar la dirección. Intenta de nuevo.' })
    } finally {
      setBuscando(false)
    }
  }

  async function guardar(e) {
    e.preventDefault()
    if (guardando) return
    const fallos = {}
    if (!form.nombre.trim()) fallos.nombre = 'El nombre de la parada es obligatorio.'
    if (form.lat === '' || !Number.isFinite(lat) || lat < -90 || lat > 90) fallos.lat = 'Escribe una latitud entre -90 y 90.'
    if (form.lng === '' || !Number.isFinite(lng) || lng < -180 || lng > 180) fallos.lng = 'Escribe una longitud entre -180 y 180.'
    if (form.orden === '' || !(Number(form.orden) >= 1)) fallos.orden = 'El orden empieza en 1.'
    setErrores(fallos)
    const primero = ['nombre', 'lat', 'lng', 'orden'].find(k => fallos[k])
    if (primero) { document.getElementById(`par-${primero}`)?.focus(); return }

    setGuardando(true)
    setErrorServidor('')
    try {
      await onGuardar(form)
    } catch (err) {
      setErrorServidor(err.message || 'No se pudo guardar la parada. Intenta de nuevo.')
      setGuardando(false)
    }
  }

  return (
    <form className="dialogo-form" onSubmit={guardar} noValidate>
      <div className="dialogo-cuerpo">
        {errorServidor && (
          <p className="acceso-aviso" role="alert">
            <FontAwesomeIcon icon={faTriangleExclamation} /> <span>{errorServidor}</span>
          </p>
        )}
        <div className="dialogo-parada">
          <div className="dialogo-columna">
            <Campo id="par-nombre" label="Nombre de la parada" value={form.nombre} error={errores.nombre} autoComplete="off" onChange={cambiar('nombre')} />
            <div className="dialogo-fila">
              <Campo id="par-lat" label="Latitud" type="number" step="any" inputMode="decimal" value={form.lat} error={errores.lat} onChange={cambiar('lat')} />
              <Campo id="par-lng" label="Longitud" type="number" step="any" inputMode="decimal" value={form.lng} error={errores.lng} onChange={cambiar('lng')} />
            </div>
            <div className="dialogo-fila">
              <Campo id="par-orden" label="Orden en la ruta" type="number" min="1" inputMode="numeric" value={form.orden} error={errores.orden} onChange={cambiar('orden')} />
              <Campo id="par-estado" label="Estado" control="select" value={form.activa ? 'true' : 'false'}
                onChange={ev => setForm(p => ({ ...p, activa: ev.target.value === 'true' }))}>
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </Campo>
            </div>
          </div>

          <div className="dialogo-columna">
            <div className="selector-busqueda">
              <Campo id="par-buscar" label="Buscar una dirección" value={busqueda} autoComplete="off" placeholder="Calle, barrio o lugar"
                onChange={ev => setBusqueda(ev.target.value)}
                onKeyDown={ev => { if (ev.key === 'Enter') { ev.preventDefault(); buscarDireccion() } }} />
              <button type="button" className="boton-contorno" onClick={buscarDireccion} aria-disabled={buscando}>
                <FontAwesomeIcon icon={faMagnifyingGlass} /> {buscando ? 'Buscando…' : 'Buscar'}
              </button>
            </div>

            {resultados.length > 0 && (
              <ul className="selector-resultados" aria-label="Resultados de la búsqueda">
                {resultados.map(r => (
                  <li key={`${r.place_id}-${r.lat}-${r.lon}`}>
                    <button type="button" onClick={() => { elegirPunto(r.lat, r.lon); setResultados([]) }}>{r.display_name}</button>
                  </li>
                ))}
              </ul>
            )}

            {mensajeMapa && (
              <p className="acceso-aviso" role="alert">
                <FontAwesomeIcon icon={faTriangleExclamation} /> <span>{mensajeMapa.texto}</span>
              </p>
            )}

            <button type="button" className="boton-contorno" onClick={usarMiUbicacion}>
              <FontAwesomeIcon icon={faLocationCrosshairs} /> Usar mi ubicación actual
            </button>

            <div className="selector-mapa">
              <MapContainer center={centro} zoom={16} style={{ width: '100%', height: '100%' }} attributionControl={false}>
                <TileLayer className="tiles-calmos" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                <AttributionControl position="bottomleft" prefix={false} />
                <AjustarTamano />
                <AlTocar onElegir={elegirPunto} />
                <Recentrar centro={centro} />
                {tienePunto && <Marker position={[lat, lng]} icon={iconoParada} interactive={false} />}
              </MapContainer>
            </div>
            <p className="campo-ayuda">Toca el mapa para fijar la parada, o escribe las coordenadas.</p>
          </div>
        </div>
      </div>
      <div className="dialogo-pie">
        <button type="button" className="boton-contorno" onClick={onCerrar}>Cancelar</button>
        <button type="submit" className="boton-verde" aria-disabled={guardando}>
          <FontAwesomeIcon icon={faFloppyDisk} /> {guardando ? 'Guardando…' : modo === 'crear' ? 'Agregar parada' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
