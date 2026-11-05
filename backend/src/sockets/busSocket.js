// src/sockets/busSocket.js
// Maneja los eventos de Socket.io relacionados a los buses
// Cada ruta tiene su propio room — así solo reciben
// la ubicación los usuarios conectados a esa ruta (RNF1)

export function busSocket(io) {

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`)

    // ── El cliente se une al room de su ruta ────────────────
    // Evento que envía el estudiante o conductor al conectarse
    // Ejemplo: socket.emit('join:ruta', { id_ruta: 1 })
    socket.on('join:ruta', ({ id_ruta }) => {
      const room = `ruta_${id_ruta}`
      socket.join(room)
      console.log(`📍 Socket ${socket.id} unido a ${room}`)

      // Confirmar al cliente que se unió correctamente
      socket.emit('join:confirmado', { room, id_ruta })
    })

    // ── El conductor envía su ubicación ─────────────────────
    // Evento que envía el conductor desde la PWA cada 3-4 seg
    // Payload: { id_bus, id_ruta, lat, lng }
    socket.on('conductor:ubicacion', ({ id_bus, id_ruta, lat, lng }) => {
      if (!id_bus || !id_ruta || !lat || !lng) {
        socket.emit('error', { mensaje: 'Datos de ubicación incompletos' })
        return
      }

      const room = `ruta_${id_ruta}`

      // Emitir la ubicación a todos los usuarios del room
      // excepto al conductor que la envió
      socket.to(room).emit('bus:location', {
        id_bus,
        id_ruta,
        lat,
        lng,
        timestamp: new Date().toISOString(),
      })

      console.log(`🚌 Bus ${id_bus} → lat: ${lat}, lng: ${lng} → room: ${room}`)
    })

    // ── El conductor cambia el estado del bus ────────────────
    // Estados: en_recorrido, detenido, fuera_de_servicio
    socket.on('conductor:estado', ({ id_bus, id_ruta, estado }) => {
      const room = `ruta_${id_ruta}`

      socket.to(room).emit('bus:estado', {
        id_bus,
        estado,
        timestamp: new Date().toISOString(),
      })

      console.log(`🔄 Bus ${id_bus} cambió estado a: ${estado}`)
    })

    // ── Cliente abandona el room ─────────────────────────────
    socket.on('leave:ruta', ({ id_ruta }) => {
      const room = `ruta_${id_ruta}`
      socket.leave(room)
      console.log(`👋 Socket ${socket.id} salió de ${room}`)
    })

    // ── Desconexión ──────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`)
    })
  })
}