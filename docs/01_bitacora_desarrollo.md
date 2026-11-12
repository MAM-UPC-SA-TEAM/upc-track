# Bitacora de Desarrollo

## Proyecto
Monitoreo de Buses UPC Aguachica

## Objetivo de la bitacora
Registrar avance semanal, decisiones, bloqueos, soluciones y evidencias.

## Semana 1
### Objetivos
- Definir alcance MVP (roles estudiante, conductor, admin).
- Configurar stack base (Node/Express + React/Vite + MySQL).

### Avances
- Estructura inicial de backend y frontend.
- Autenticacion JWT por roles.

### Inconvenientes
- Ajuste de CORS entre frontend y backend.

### Soluciones
- Centralizacion de variables de entorno y origenes permitidos.

### Evidencia sugerida
- Capturas de login por rol.
- Commit principal de arranque.

## Semana 2
### Objetivos
- Mapa en tiempo real y sockets.
- Flujo conductor para envio de ubicacion.

### Avances
- Visualizacion de buses activos en mapa.
- Emision de ubicacion en tiempo real.

### Inconvenientes
- GPS en movil bloqueado por origen inseguro.

### Soluciones
- Uso de HTTPS con ngrok para pruebas moviles.

### Evidencia sugerida
- Video corto de actualizacion de bus en mapa.

## Semana 3
### Objetivos
- Modulo admin: gestion de buses, rutas y paradas.
- Mejoras UX de formularios.

### Avances
- CRUD de paradas y rutas.
- Selector de parada por mapa + busqueda de direccion.

### Inconvenientes
- Modal extenso en movil.

### Soluciones
- Modal responsive (bottom sheet), panel ajustado.

### Evidencia sugerida
- Capturas de formulario de parada en desktop y movil.

## Semana 4
### Objetivos
- Horarios por ruta y consistencia operativa.
- Notificaciones mejoradas.

### Avances
- CRUD de horarios por ruta.
- Tipos de notificacion: retraso, cambio_ruta, info.
- Notificaciones automaticas por cambios de estado del bus.

### Inconvenientes
- Nombre de ruta desactualizado por fallback en conductor.

### Soluciones
- Eliminacion de datos mock y uso de datos reales asignados.

### Evidencia sugerida
- Captura de notificaciones automaticas.
- Prueba de recorrido iniciar/detener/finalizar.

## Semana 5 (QA y cierre)
### Objetivos
- Pruebas funcionales, integracion y validacion para sustentacion.

### Avances
- Ajustes finales de menu por rol.
- Hardening CORS para LAN/ngrok en entorno de desarrollo.

### Inconvenientes
- Host bloqueado por Vite/Ngrok.

### Soluciones
- Ajuste de host permitido y proxy unico por frontend.

### Evidencia sugerida
- Checklist QA diligenciado.
- Registro de incidencias corregidas.

## Registro rapido de incidencias
| Fecha | Incidencia | Impacto | Estado | Solucion |
|---|---|---|---|---|
| AAAA-MM-DD | | | | |
| AAAA-MM-DD | | | | |
