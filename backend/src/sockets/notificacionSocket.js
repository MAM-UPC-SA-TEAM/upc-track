// src/sockets/notificacionSocket.js
// Maneja eventos de Socket.io relacionados a notificaciones
// Las notificaciones se emiten desde el controller directamente
// Este archivo es para eventos adicionales si se necesitan en el futuro

export function notificacionSocket(io) {
  // Las notificaciones se emiten desde notificacionController.js
  // usando io.to(`ruta_${id_ruta}`).emit('notificacion:nueva', ...)
  // No se requiere lógica adicional de socket aquí por ahora
}
