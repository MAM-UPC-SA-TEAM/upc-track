# Backlog Jira Desde Cero - Monitoreo de Buses UPCA

## Objetivo
Construir un backlog de Jira como si el proyecto iniciara hoy, pero usando el alcance real ya definido en requisitos funcionales (RF1-RF15), no funcionales (RNF1-RNF15) y casos de uso.

## Estado actual y enfoque de trabajo
El proyecto tiene Sprint 0 completado a nivel de planeacion inicial. A partir de ahora, el trabajo debe ejecutarse en Jira por historias de usuario dentro de Sprint 1 en adelante.

### Sprint 0 (ya realizado)
- Periodo: Semanas 1 a 3 (Agosto 2026).
- Entregables cerrados:
  - Registro de equipo y propuesta de proyecto (ABP).
  - Repositorio en GitHub configurado.
  - Project Charter firmado.
  - Tablero agil activo en Jira.
  - Levantamiento de requerimientos desde entrevista (RF y RNF).

### Como registrar Sprint 0 en Jira (trazabilidad academica)
1. Crear sprint: Sprint 0 - Planificacion Inicial.
2. Crear 5 issues de tipo Story o Task y asociarlos a la epica EP-00:
  - HU-00.1 Registro de equipo y propuesta ABP.
  - HU-00.2 Repositorio GitHub creado.
  - HU-00.3 Project Charter firmado.
  - HU-00.4 Tablero Jira creado y configurado.
  - HU-00.5 Requerimientos RF y RNF levantados.
3. Adjuntar evidencia (documento, link o captura) en cada issue.
4. Mover los 5 issues a Done.
5. Cerrar Sprint 0.

### Que hacer desde ahora
1. Crear Sprint 1 - Desarrollo Base.
2. Pasar al sprint: HU-01, HU-02, HU-03, HU-04, HU-05, HU-06, HU-07.
3. Tomar primero HU-01 y moverla a In Progress.
4. Trabajar historia por historia hasta Done con evidencia de prueba.

## Estructura recomendada en Jira
- Proyecto: MONBUS
- Jerarquia: Epica -> Historia de Usuario -> Tarea tecnica -> Subtarea
- Priorizacion: MoSCoW (Must, Should, Could)
- Estimacion sugerida: Story Points en historias (1, 2, 3, 5, 8, 13)

## Como combinar epicas y sprints sin confusion
- Epica: organiza por tema grande del proyecto (que se construye).
- Sprint: organiza por tiempo (cuando se trabaja).
- Una epica puede repartirse en varios sprints.
- Un sprint puede incluir historias de varias epicas.

### Regla visual
- Vista backlog: ordenar por epicas.
- Vista tablero: mover historias por estado (To Do, In Progress, In Review, Done).

### Epica recomendada para lo ya realizado
Crear una epica adicional para trazabilidad academica:
- EP-00 Inicio del Proyecto (ABP).

Historias dentro de EP-00:
- HU-00.1 Registro de equipo y propuesta de proyecto (ABP).
- HU-00.2 Creacion del repositorio GitHub.
- HU-00.3 Elaboracion y firma del Project Charter.
- HU-00.4 Creacion y configuracion del tablero Jira.
- HU-00.5 Levantamiento inicial de requisitos (RF y RNF).

## Epicas propuestas

### EP-01 Fundaciones del Proyecto
- HU-01 Configurar repositorios, ramas y convenciones de desarrollo.
- HU-02 Configurar entorno local y variables de entorno de backend y frontend.
- HU-03 Definir modelo inicial de datos para usuarios, buses, rutas, paradas y ubicaciones.
- HU-04 Definir criterios de calidad, Definition of Done y estrategia de pruebas.

### EP-02 Autenticacion y Roles
- HU-05 Login con usuario y contrasena (RF1).
- HU-06 Cierre de sesion manual y por inactividad (RF2, RNF8).
- HU-07 Gestion de roles y permisos (RF7).
- HU-08 Seguridad de acceso: bloqueo por intentos fallidos y politicas de contrasena (RNF7, RNF11).

### EP-03 Monitoreo en Tiempo Real
- HU-09 Publicar ubicacion del bus desde conductor (RF8).
- HU-10 Ver ubicacion del bus en tiempo real para estudiante (RF3).
- HU-11 Mostrar estado operativo del bus (RF12).
- HU-12 Listar buses disponibles en tiempo real (RF15).

### EP-04 Rutas, Paraderos y ETA
- HU-13 Visualizar rutas disponibles (RF5).
- HU-14 Mostrar recorrido completo en mapa (RF9).
- HU-15 Mostrar paraderos por ruta (RF10).
- HU-16 Calcular y mostrar tiempo estimado de llegada (RF11).
- HU-17 Identificar bus por codigo/nombre unico y mostrar datos basicos (RF13, RF14).

### EP-05 Notificaciones Operativas
- HU-18 Envio de notificaciones por cambios de ruta o retrasos (RF4).
- HU-19 Visualizacion y confirmacion de recepcion de notificaciones por estudiante.
- HU-20 Notificaciones en tiempo real via sockets.

### EP-06 Administracion del Sistema
- HU-21 CRUD de buses (RF6).
- HU-22 CRUD de rutas (RF6).
- HU-23 CRUD de paraderos y horarios.
- HU-24 Asignacion de conductor a bus/ruta.

### EP-07 UX, Compatibilidad y Accesibilidad
- HU-25 UI responsive para movil/tablet/escritorio (RNF6).
- HU-26 Cumplir identidad visual institucional (RNF4, RNF14).
- HU-27 Compatibilidad con navegadores principales (RNF5, RNF13).
- HU-28 Mejora de usabilidad y flujo de navegacion (RNF9).

### EP-08 Calidad, Rendimiento y Seguridad
- HU-29 Suite de pruebas unitarias, integracion y caja negra.
- HU-30 Pruebas de carga basica sobre envio de ubicaciones.
- HU-31 Observabilidad, manejo de errores y logs.
- HU-32 Cumplir objetivos de tiempo de respuesta (< 3 segundos) (RNF12).

### EP-09 Despliegue y Operacion
- HU-33 Pipeline de build y despliegue para frontend y backend.
- HU-34 Configuracion de despliegue cloud y variables por ambiente.
- HU-35 Manual tecnico, manual de usuario y plan de soporte.

## Historias priorizadas para MVP (Sprints 1 a 3)
- HU-05 Login.
- HU-06 Cierre de sesion.
- HU-09 Publicar ubicacion.
- HU-10 Ver ubicacion en tiempo real.
- HU-13 Ver rutas.
- HU-15 Ver paraderos.
- HU-12 Buses disponibles.
- HU-18 Notificaciones.
- HU-21 CRUD buses.
- HU-22 CRUD rutas.

## Criterios de aceptacion base (plantilla)
Usar este formato en cada historia de Jira:

1. Dado un usuario con rol valido y sesion activa,
2. Cuando ejecuta la accion principal de la historia,
3. Entonces el sistema responde en <= 3 segundos en condiciones normales,
4. Y persiste/actualiza informacion correctamente,
5. Y registra evento de auditoria o log en caso de error.

## Dependencias clave
- HU-05 depende de HU-01, HU-02 y HU-03.
- HU-09 depende de HU-05 y HU-07.
- HU-10 depende de HU-09.
- HU-16 depende de HU-09, HU-13 y HU-15.
- HU-18 depende de HU-05, HU-07 y HU-13.
- HU-21/HU-22 dependen de HU-07.

## Propuesta de sprints (2 semanas)

### Sprint 0 - Planificacion Inicial (cerrado)
- HU-00.1 Registro de equipo y propuesta ABP.
- HU-00.2 Repositorio y flujo base de trabajo.
- HU-00.3 Charter del proyecto.
- HU-00.4 Tablero Jira y backlog inicial.
- HU-00.5 Requerimientos funcionales y no funcionales.

### Sprint 1 - Base tecnica y acceso
- HU-01, HU-02, HU-03, HU-04, HU-05, HU-06, HU-07.

### Sprint 2 - Operacion en tiempo real
- HU-09, HU-10, HU-11, HU-12.

### Sprint 3 - Rutas y experiencia del estudiante
- HU-13, HU-14, HU-15, HU-17.

### Sprint 4 - Notificaciones y administracion
- HU-18, HU-19, HU-20, HU-21, HU-22, HU-24.

### Sprint 5 - Horarios, ETA, UX y calidad
- HU-16, HU-23, HU-25, HU-26, HU-28, HU-29.

### Sprint 6 - Hardening y release
- HU-27, HU-30, HU-31, HU-32, HU-33, HU-34, HU-35.

## Uso minimo del tablero Jira
- Columnas sugeridas: To Do, In Progress, In Review, Done.
- Las epicas no son columnas: solo agrupan historias relacionadas.
- Regla de trabajo:
  - Una historia en In Progress por persona.
  - No mover a Done sin evidencia minima (prueba, validacion o demo).
  - Si aparece un problema, crear Bug y vincularlo a la historia.

## Riesgos y mitigacion
- Riesgo: latencia en ubicacion tiempo real.
  - Mitigacion: pruebas de carga tempranas y ajuste de frecuencia de actualizacion.
- Riesgo: inconsistencias entre estado de bus y mapa.
  - Mitigacion: eventos socket idempotentes y reconciliacion periodica.
- Riesgo: fallos por configuracion de ambientes.
  - Mitigacion: checklist de variables y validaciones al iniciar backend.

## Definicion de Hecho (DoD) sugerida
- Historia con criterios de aceptacion cumplidos.
- Pruebas funcionales y tecnicas ejecutadas sin bloqueantes.
- Logs de error controlados y mensajes de usuario claros.
- Revisado por par y documentado en manual tecnico cuando aplique.
