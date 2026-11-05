# Listado de Funciones y Metodos

## Frontend (resumen por modulo)

### AuthContext
- parseJwt(token)
- normalizeUsuario(source)
- getUsuarioGuardado()
- login(token, userData)
- logout()
- actualizarUsuario(cambios)

### RutaProtegida
- RutaProtegida({ children, roles })

### Login
- handleLogin(e)

### MapaTiempoReal
- ControlMapa({ centro })
- cargarParadas(ruta)
- colorEstado(estado)
- textoEstado(estado)

### MiRecorrido
- ControlCamara({ centro })
- iniciarRecorrido()
- finalizarRecorrido()
- alternarDetenido()
- actualizarEstadoBus(nuevoEstado)
- enviarUbicacion(lat, lng)
- enviarAviso()
- agregarLog(msg, tipo)

### GestionRutas
- cargar()
- abrirCrear(), abrirEditar(), cerrarModal(), guardar(), eliminar(id)
- cargarParadas(idRuta), cargarHorarios(idRuta)
- abrirGestionParadas(ruta)
- abrirCrearParada(), abrirEditarParada(), cerrarModalParada(), guardarParada(), eliminarParada(id)
- buscarDireccion(), seleccionarResultadoDireccion(item), seleccionarPuntoParada(lat,lng), usarUbicacionActual()
- abrirCrearHorario(), abrirEditarHorario(), cerrarModalHorario(), guardarHorario(), eliminarHorario(id)

### GestionBuses
- cargar()
- abrirCrear(), abrirEditar(bus), cerrarModal(), guardar(), eliminar(id)
- textoEstado(estado), claseEstado(estado)

## Backend (resumen por capa)

### Controllers
- authController: loginController, logoutController, meController.
- busController: listarBuses, busesActivos, busesConPosicion, miBus, obtenerBus, crearBus, editarBus, eliminarBus, cambiarEstado.
- rutaController: listarRutas, obtenerRuta, crearRuta, editarRuta, eliminarRuta.
- paradaController: listarParadas, crearParada, editarParada, eliminarParada.
- horarioController: listarHorarios, crearHorario, editarHorario, eliminarHorario.
- notificacionController: enviarNotificacion, listarNotificaciones.
- usuarioController: listarUsuarios, crearUsuario, editarUsuario, eliminarUsuario.

### Models
- Bus: todos, activos, todosConPosicion, porId, porConductor, actualizarEstado, obtenerRuta.
- Ruta: todas, porId, obtenerParadas.
- Parada: todas, porRuta, porId, crear, editar, eliminar.
- Horario: porRuta, todos, crear, editar, eliminar, porId.
- Notificacion: guardar, porRutaHoy, hoy.
- Usuario: porCorreo, todos, y metodos asociados al modelo.

## Nota
Este listado esta orientado a sustentacion. Para trazabilidad completa, complementar con referencias de archivo y linea.
