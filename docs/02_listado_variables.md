# Listado de Variables

## Variables de entorno Backend
Archivo: backend/.env

- PORT: puerto del servidor backend.
- DB_HOST: host de base de datos.
- DB_PORT: puerto de base de datos.
- DB_USER: usuario de base de datos.
- DB_PASSWORD: clave de base de datos.
- DB_NAME: nombre de base de datos.
- JWT_SECRET: secreto para firmar tokens.
- JWT_EXPIRES_IN: tiempo de expiracion del token.
- CLIENT_URL: origen(es) permitidos para CORS.

## Variables de entorno Frontend
Archivo: frontend/.env

- VITE_API_URL: URL base opcional para API y socket.

## Variables de estado Frontend (principales)

### AuthContext
- usuario
- cargando

### MapaTiempoReal
- buses, rutas, paradas
- rutaSeleccionada, busSeleccionado, paradaSeleccionada
- busqueda, filtro
- centro
- panelExpandido, panelVisible

### MiRecorrido (Conductor)
- busInfo
- enRecorrido
- estado
- gps
- historialGps
- estadoConexion
- ultimaActualizacion
- mensaje
- tipoAviso
- log
- panelMovil
- paradasRuta
- geometriaRuta
- errorCargaBus
- errorGps

### GestionRutas
- rutas, rutaSeleccionada
- paradas, horarios
- formularios: form, formParada, formHorario
- estados de modal: modal, modalParada, modalHorario
- direccionBusqueda, resultadosDireccion, buscandoDireccion

### GestionBuses
- buses, rutas, usuarios
- form
- modal, editandoId

## Variables backend de dominio (resumen)
- Bus: id_bus, nombre, placa, estado, id_conductor, id_ruta, nombre_ruta.
- Ruta: id_ruta, nombre, descripcion, activa.
- Parada: id_parada, nombre, latitud/lat, longitud/lng, activa, orden.
- Horario: id_horario, id_ruta, hora_salida, hora_llegada.
- Notificacion: id_notificacion, id_ruta, id_conductor, tipo, mensaje, fecha_hora.
