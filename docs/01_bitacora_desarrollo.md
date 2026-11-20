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

## Semanas 6 a 8 (nube, APK y cierre) — noviembre de 2026
Las semanas 1 a 5 de arriba describen el proyecto heredado y su estabilización (MySQL, Vercel y ngrok). Desde aquí el equipo, de una persona, migra el sistema a la nube gratuita y lo lleva a Android. Las decisiones y su motivo están en `12_ruta_trabajo_semestre.md`; el cambio frente al charter, en `project_charter.md` (v2).

### Objetivos
- Salir de ngrok y MySQL local: backend en Render, base de datos en Neon y frontend en Cloudflare.
- Generar un APK Android instalable con Capacitor.
- Endurecer, probar y documentar para el congelamiento del 1 de diciembre.

### Avances
- 11-nov: backend migrado de MySQL a PostgreSQL y conectado a Neon con TLS; migración reproducible y usuarios de producción sin claves públicas (#61, #10, PR #64).
- 13-nov: despliegue en Render y Cloudflare documentado y WebSockets verificados (PR #67, #68); aviso «Despertando el servidor» y reconexión automática (PR #69); frontend preparado para Capacitor (PR #70); APK firmado y publicado por GitHub Actions (PR #79).
- 16-nov: registro solo con correo institucional y aprobación del administrador (PR #143, #144); pulido de interacción y esqueletos de carga (PR #138, #139, #140).
- 18-nov: pirámide de pruebas con PostgreSQL real y e2e (PR #146), defectos de la auditoría corregidos (PR #147), `busService`, `usuarioService` y `rutaService` sin SQL en los controladores (PR #150, #151), `helmet` y dependencias sin vulnerabilidades (PR #156), patrón Strategy del ETA (PR #157), accesibilidad con axe-core (PR #158), permiso de ubicación del conductor (PR #159) y Project Charter v2 (PR #154).
- 20-nov: splash de arranque animado (un bus recorre la línea de ruta hasta la parada), una vez por arranque, estático con `prefers-reduced-motion` y siempre en papel claro como el splash nativo (U35, #148; PR #170, #171, #172).

### Inconvenientes
- Render bloquea el SMTP saliente y el consentimiento de Microsoft depende de la universidad: no se pudo verificar la titularidad del correo.
- Capacitor 7 no compila con JDK 22 o superior; Android Studio reciente trae JDK 25.
- Render free suspende el servicio a los 15 minutos y Neon a los 5: el primer acceso tarda.
- La auditoría de pruebas encontró que editar o eliminar recursos inexistentes respondía 200.

### Soluciones
- Aprobación manual del administrador para las cuentas nuevas (decisión A01).
- JDK 21 exacto documentado en el README y el flujo de CI.
- Aviso de arranque en frío, reconexión del socket y plan de contingencia local.
- 404 uniforme en buses, rutas, usuarios y horarios.

### Evidencia
- Historial de Pull Requests y tablero de GitHub Projects del repositorio.
- `07_pruebas_qa.md`, `testing.md` y `13_auditoria_diseno.md`.

## Registro rapido de incidencias
| Fecha | Incidencia | Impacto | Estado | Solucion |
|---|---|---|---|---|
| 2026-11-13 | Render free suspende el backend tras 15 minutos | La primera carga tarda hasta un minuto | Mitigado | Aviso «Despertando el servidor» y reconexión automática (PR #69) |
| 2026-11-16 | No se puede verificar la titularidad del correo institucional | Cualquiera con un correo del dominio podría registrarse | Resuelto | Cuenta inactiva hasta que un administrador la apruebe (A01) |
| 2026-11-18 | Editar o eliminar un bus, ruta o usuario inexistente respondía 200 | Respuestas engañosas de la API | Resuelto | 404 uniforme (PR #147 y #153) |
| 2026-11-18 | Conductor sin permiso de ubicación quedaba «en recorrido» sin transmitir | Los estudiantes veían un bus fantasma | Resuelto | Verificación del permiso antes de iniciar (PR #159) |
| 2026-11-18 | 5 vulnerabilidades en dependencias de producción (una crítica) | Riesgo de seguridad | Resuelto | `npm audit fix` (PR #156) |
