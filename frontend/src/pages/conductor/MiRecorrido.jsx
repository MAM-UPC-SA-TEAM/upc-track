import { Fragment, useEffect, useState } from 'react'
import {
  MapContainer, Marker, Polyline, CircleMarker, Tooltip, TileLayer, ZoomControl, AttributionControl, useMap,
} from 'react-leaflet'
import L from 'leaflet'
import Layout from '../../components/shared/Layout'
import { iconoBus, iconoBusViejo } from '../../utils/marcadores'
import TalonConductor, { FRESCO_MAX_S } from '../../components/conductor/TalonConductor'
import api from '../../services/api'
import { useRecorrido } from '../../context/RecorridoContext'

const CENTRO_DEFECTO = [8.3086, -73.6194]

const paradaActiva = p => p.activa !== false && p.activa !== 0

// El talón tapa parte del mapa: lo que se mira debe quedar en la zona libre (abajo en móvil, a la derecha en escritorio)
function zonaLibre() {
  const hoja = document.querySelector('.cond-hoja')
  if (!hoja) return { dx: 0, dy: 0, tl: [40, 72], br: [64, 48] }
  if (window.innerWidth >= 1024) {
    const ocupado = hoja.offsetLeft + hoja.offsetWidth
    return { dx: -ocupado / 2, dy: 0, tl: [ocupado + 64, 72], br: [64, 48] }
  }
  return { dx: 0, dy: hoja.offsetHeight / 2, tl: [40, 72], br: [64, hoja.offsetHeight + 16] }
}

function Camara({ gps, ruta }) {
  const map = useMap()

  // Con GPS, el bus se sigue centrado en la zona libre
  useEffect(() => {
    if (!gps) return
    const z = Math.max(map.getZoom(), 16)
    const { dx, dy } = zonaLibre()
    const punto = map.project([gps.lat, gps.lng], z).add([dx, dy])
    map.setView(map.unproject(punto, z), z, { animate: true })
  }, [gps, map])

  // Sin GPS, se encuadra la ruta asignada
  useEffect(() => {
    if (gps || ruta.length < 2) return
    const { tl, br } = zonaLibre()
    map.fitBounds(L.latLngBounds(ruta), { paddingTopLeft: tl, paddingBottomRight: br, animate: false })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- solo cuando llega la ruta; el GPS lo maneja el efecto de arriba
  }, [ruta, map])

  return null
}

export default function MiRecorrido() {
  // El recorrido (GPS, estado del bus, envío de posición) vive en RecorridoContext: sobrevive a ir a Alertas o Perfil
  const {
    busInfo, enRecorrido, estado, colgado, gps, historialGps, estadoConexion, ultimoEnvioMs, inicioMs,
    errorCargaBus, errorGps, errorAccion,
    iniciarRecorrido, finalizarRecorrido, alternarDetenido, enviarAviso,
  } = useRecorrido()
  const [ahora, setAhora] = useState(() => Date.now())
  const [paradasRuta, setParadasRuta] = useState([])
  const [geometriaRuta, setGeometriaRuta] = useState([])

  // Cargar paradas + geometría OSRM cuando cambia la ruta asignada
  useEffect(() => {
    const idRuta = busInfo?.id_ruta
    if (!idRuta) return

    async function cargarRuta() {
      try {
        const data = await api.get(`/api/paradas?ruta_id=${idRuta}`)
        const lista = (Array.isArray(data) ? data : data.paradas || [])
          .filter(p => p.lat && p.lng)
          .sort((a, b) => (a.orden || 0) - (b.orden || 0))
        setParadasRuta(lista)

        if (lista.length < 2) return
        // Construir geometría vial via OSRM
        const coords = lista.map(p => `${p.lng},${p.lat}`).join(';')
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
        )
        const json = await res.json()
        if (json.code === 'Ok' && json.routes?.length > 0) {
          setGeometriaRuta(json.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]))
        } else {
          setGeometriaRuta(lista.map(p => [p.lat, p.lng]))
        }
      } catch {
        // Silencioso: la ruta sigue funcionando sin geometría OSRM
      }
    }
    cargarRuta()
  }, [busInfo?.id_ruta])

  // Reloj de 1 s para la antigüedad del último envío (solo mientras importa)
  useEffect(() => {
    if (!enRecorrido && !colgado) return undefined
    const t = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [enRecorrido, colgado])

  // Vista del talón: el estado de ESTE teléfono manda sobre el que dice el servidor
  const sinRed = estadoConexion === 'offline' || estadoConexion === 'retrying'
  const haEnviado = enRecorrido && ultimoEnvioMs != null && inicioMs != null && ultimoEnvioMs >= inicioMs
  const edad = ultimoEnvioMs != null ? Math.max(0, (ahora - ultimoEnvioMs) / 1000) : null
  let vista
  if (!busInfo) vista = 'sin-bus'
  else if (colgado) vista = 'colgado'
  else if (!enRecorrido) vista = 'libre'
  else if (sinRed || (haEnviado && edad > FRESCO_MAX_S)) vista = 'viejo'
  else if (!haEnviado) vista = 'buscando'
  else vista = estado === 'detenido' ? 'detenido' : 'vivo'

  const centroMapa = gps ? [gps.lat, gps.lng] : (paradasRuta[0] ? [paradasRuta[0].lat, paradasRuta[0].lng] : CENTRO_DEFECTO)
  const trazoRecorrido = historialGps.map(p => [p.lat, p.lng])
  const errores = { carga: errorCargaBus, lista: [errorGps, errorAccion].filter(Boolean) }

  return (
    <Layout titulo="Mi recorrido" sinPadding>
      <div className="cond-pantalla">
        <div className="cond-mapa">
          <MapContainer center={centroMapa} zoom={16} style={{ width: '100%', height: '100%' }} zoomControl={false} attributionControl={false}>
            <TileLayer className="tiles-calmos" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            <ZoomControl position="topright" />
            <AttributionControl position="topleft" prefix={false} />
            <Camara gps={gps} ruta={geometriaRuta} />

            {/* Ruta asignada: un trazo verde con casing de papel, igual que en el Mapa */}
            {geometriaRuta.length > 1 && (
              <>
                <Polyline positions={geometriaRuta} interactive={false} className="ruta-casing" color="#fbfaf4" weight={9} />
                <Polyline positions={geometriaRuta} interactive={false} className="ruta-verde" color="#1e6b2e" weight={5} />
              </>
            )}

            {/* Paradas: punto visible pequeño + zona de toque de 22 px que abre su nombre */}
            {paradasRuta.map(p => (
              <Fragment key={p.id_parada}>
                <CircleMarker center={[p.lat, p.lng]} radius={8} interactive={false}
                  className={`parada-punto ${paradaActiva(p) ? '' : 'parada-punto--inactiva'}`} pathOptions={{ weight: 2 }} />
                <CircleMarker center={[p.lat, p.lng]} radius={22} bubblingMouseEvents={false} pathOptions={{ stroke: false, fillOpacity: 0 }}>
                  <Tooltip direction="top" offset={[0, -12]} className="etiqueta-mapa">
                    {paradaActiva(p) ? p.nombre : `${p.nombre} · inactiva`}
                  </Tooltip>
                </CircleMarker>
              </Fragment>
            ))}

            {/* Trazo de lo recorrido: puntos finos de tinta */}
            {trazoRecorrido.length > 1 && (
              <Polyline positions={trazoRecorrido} interactive={false} className="ruta-tinta" color="#14261a" weight={3} dashArray="2 9" />
            )}

            {/* El bus; si el dato está anulado, marcador hueco como lo ven los estudiantes */}
            {gps && <Marker position={[gps.lat, gps.lng]} icon={vista === 'viejo' ? iconoBusViejo : iconoBus} interactive={false} />}
          </MapContainer>
        </div>

        <div className="cond-hoja">
          <TalonConductor
            vista={vista}
            bus={busInfo}
            estado={estado}
            edad={edad}
            ultimoEnvioMs={ultimoEnvioMs}
            sinRed={sinRed}
            errores={errores}
            onIniciar={iniciarRecorrido}
            onDetener={alternarDetenido}
            onFinalizar={finalizarRecorrido}
            onAviso={enviarAviso}
          />
        </div>
      </div>
    </Layout>
  )
}
