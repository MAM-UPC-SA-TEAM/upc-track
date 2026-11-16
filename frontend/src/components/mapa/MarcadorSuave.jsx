import { useEffect, useRef, useState } from 'react'
import { Marker, useMap } from 'react-leaflet'
import { debeAnimar, duracionMovimiento, interpolar } from '../../utils/interpolar'

// Marker que, cuando llega una posición nueva, se DESLIZA hasta ella en vez de saltar. Movimiento lineal que dura
// lo que tardó en llegar la posición (continuo), y que no se anima si:
//  · es la primera posición, o el salto es grande (reconexión);
//  · el usuario pidió «reducir movimiento»;
//  · el mapa está haciendo zoom (Leaflet reposiciona los marcadores por su cuenta durante el zoom).
const reducirMovimiento = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

export default function MarcadorSuave({ position, ...resto }) {
  const map = useMap()
  const ref = useRef(null)
  const [posicionInicial] = useState(position) // el Marker se crea una vez; el movimiento lo lleva este componente
  const estado = useRef({ raf: 0, ultimaLlegada: null, destino: position, enZoom: false }) // ultimaLlegada null: aún no llegó ninguna posición
  const [lat, lng] = position

  useEffect(() => {
    const marcador = ref.current
    if (!marcador) return undefined
    const e = estado.current
    const destino = [lat, lng]
    e.destino = destino
    cancelAnimationFrame(e.raf)

    const llegada = performance.now()
    const intervalo = e.ultimaLlegada === null ? 0 : llegada - e.ultimaLlegada
    e.ultimaLlegada = llegada

    // Con el mapa haciendo zoom no se toca el marcador (Leaflet lo reposiciona solo); al terminar se coloca en destino
    if (e.enZoom) return undefined

    const actual = marcador.getLatLng() // donde se VE ahora (puede ir a mitad de un movimiento anterior)
    const desde = [actual.lat, actual.lng]
    const distanciaM = actual.distanceTo(destino)
    if (!debeAnimar({ distanciaM, intervaloMs: intervalo, reducirMovimiento: reducirMovimiento() })) {
      marcador.setLatLng(destino)
      return undefined
    }

    const duracion = duracionMovimiento(intervalo)
    const t0 = llegada
    const paso = (ahora) => {
      marcador.setLatLng(interpolar(desde, destino, (ahora - t0) / duracion))
      if (ahora - t0 < duracion) e.raf = requestAnimationFrame(paso)
    }
    e.raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(e.raf)
  }, [lat, lng])

  // Durante el zoom no se mueve el marcador; al terminar se coloca en su destino
  useEffect(() => {
    const e = estado.current
    const alEmpezarZoom = () => { e.enZoom = true; cancelAnimationFrame(e.raf) }
    const alTerminarZoom = () => { e.enZoom = false; ref.current?.setLatLng(e.destino) }
    map.on('zoomstart', alEmpezarZoom)
    map.on('zoomend', alTerminarZoom)
    return () => { map.off('zoomstart', alEmpezarZoom); map.off('zoomend', alTerminarZoom) }
  }, [map])

  return <Marker ref={ref} position={posicionInicial} {...resto} />
}
