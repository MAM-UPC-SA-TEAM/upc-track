import { io } from 'socket.io-client'

const BASE_URL = (import.meta.env.VITE_API_URL || '').trim()

const socket = io(BASE_URL, {
  autoConnect: false,
  auth: {
    get token() {
      return localStorage.getItem('token')
    },
  },
})

// Las salas (ruta_N) viven en el servidor y se pierden en cada reconexión
// (red caída, app en segundo plano). Se recuerdan aquí y se vuelven a pedir al conectar.
const rutasUnidas = new Set()

export function unirseRuta(id_ruta) {
  rutasUnidas.add(id_ruta)
  if (socket.connected) socket.emit('join:ruta', { id_ruta })
}

export function salirRuta(id_ruta) {
  rutasUnidas.delete(id_ruta)
  if (socket.connected) socket.emit('leave:ruta', { id_ruta })
}

socket.on('connect', () => {
  rutasUnidas.forEach(id_ruta => socket.emit('join:ruta', { id_ruta }))
})

// Al cerrar sesión no se arrastran salas al siguiente usuario
export function olvidarRutas() {
  rutasUnidas.clear()
}

export default socket
