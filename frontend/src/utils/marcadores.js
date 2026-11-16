// Marcadores del mapa compartidos (Inicio, Mapa en tiempo real y Mi recorrido).
// El bus es un glifo de bus sobre un disco de tinta, no un punto; sin señal se anula: disco hueco y borde discontinuo.
import L from 'leaflet'
import { faBus } from '@fortawesome/free-solid-svg-icons'

const [ancho, alto, , , trazo] = faBus.icon
const glifo = `<svg class="mk-glifo" viewBox="0 0 ${ancho} ${alto}" aria-hidden="true" focusable="false"><path fill="currentColor" d="${trazo}"/></svg>`

// El contenedor mide 44 px (área táctil); el disco visible es más pequeño.
const icono = (clase, contenido = '') => L.divIcon({
  className: '',
  html: `<div class="mk-wrap"><span class="mk ${clase}">${contenido}</span></div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
})

export const iconoBus = icono('mk-bus', glifo)
export const iconoBusViejo = icono('mk-bus mk-bus--viejo', glifo)
export const iconoParada = icono('mk-parada')
