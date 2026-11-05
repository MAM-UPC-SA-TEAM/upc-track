# Issues para GitHub Projects — Monitoreo de Buses UPC Aguachica
## Fase 3 — Construcción

> Copia cada issue como una tarjeta en GitHub Projects.
> Asigna el módulo, prioridad y fechas según tu planificación.
> Los comentarios de avance diario van dentro de cada issue.

**Actualizado:** incluye criterios de aceptación derivados de los RNF (RNF1–RNF15).

---

## 🗄️ MÓDULO: Base de Datos

### #01 — Diseñar esquema de base de datos
**Módulo:** Base de datos | **Prioridad:** Alta
**RF relacionados:** RF-01, RF-03, RF-05, RF-06, RF-07, RF-08

**Descripción:**
Crear el esquema completo con las siguientes tablas:
- `usuarios` (id, nombre, email, password_hash, rol, activo)
- `roles` (id, nombre: administrador / estudiante / conductor)
- `buses` (id, nombre, numero_identificador, estado, conductor_id, ruta_id)
- `rutas` (id, nombre, descripcion, activa)
- `paradas` (id, nombre, lat, lng, ruta_id, orden, activa)
- `ubicaciones` (id, bus_id, lat, lng, timestamp) — historial GPS
- `notificaciones` (id, ruta_id, mensaje, tipo, fecha)

**Criterio de aceptación:** Script SQL ejecuta sin errores, tablas con relaciones correctas y datos de prueba cargados.

---

### #02 — Crear script SQL y datos de prueba
**Módulo:** Base de datos | **Prioridad:** Alta
**RF relacionados:** RF-05, RF-10, RF-13

**Descripción:**
- Script `schema.sql` con CREATE TABLE y relaciones
- Script `seed.sql` con datos iniciales:
  - 2-3 rutas reales de los buses UPC Aguachica
  - Paradas reales con coordenadas (lat/lng de Aguachica)
  - 1 usuario administrador, 2 conductores, 5 estudiantes de prueba
  - 2-3 buses registrados

**Criterio de aceptación:** Base de datos funciona con datos reales de Aguachica listos para pruebas.

---

## 🔐 MÓDULO: Autenticación

### #03 — Endpoint POST /api/auth/login
**Módulo:** Autenticación | **Prioridad:** Alta
**RF relacionados:** RF-01
**RNF relacionados:** RNF7, RNF11, RNF12

**Descripción:**
- Recibe `{ email, password }`
- Valida campos no vacíos (error 400 si vacíos)
- Verifica credenciales contra BD con bcrypt
- Retorna JWT si son correctas (error 401 si no)
- Responde en menos de 3 segundos (RNF12)
- Bloqueo temporal tras 5 intentos fallidos (RNF11)
- Contraseña debe tener mínimo 8 caracteres — validar en registro y login (RNF7)

**Criterio de aceptación:** Login funciona para los 3 roles. Errores correctamente manejados. Bloqueo activo tras 5 intentos. Contraseñas menores a 8 caracteres rechazadas.

---

### #04 — Endpoint POST /api/auth/logout
**Módulo:** Autenticación | **Prioridad:** Alta
**RF relacionados:** RF-02
**RNF relacionados:** RNF8

**Descripción:**
- Invalida el token JWT del usuario
- Cierre de sesión manual por botón
- Cierre automático por inactividad configurado en 30 minutos (RNF8)
- Redirige a página de inicio tras cerrar sesión

**Criterio de aceptación:** Sesión cerrada correctamente, token inválido tras logout. Cierre automático activo a los 30 minutos de inactividad.

---

### #05 — Middleware de autenticación y roles
**Módulo:** Autenticación | **Prioridad:** Alta
**RF relacionados:** RF-06, RF-07

**Descripción:**
- Middleware que verifica JWT en cada ruta protegida
- Middleware de rol: bloquea acceso según rol (admin, conductor, estudiante)
- Responde 401 si no autenticado, 403 si no tiene permiso

**Criterio de aceptación:** Rutas admin inaccesibles para estudiantes y conductores. Token expirado rechazado.

---

## 📡 MÓDULO: GPS y Rastreo en Tiempo Real

### #06 — Configurar Socket.io en el servidor
**Módulo:** GPS / Tiempo real | **Prioridad:** Alta
**RF relacionados:** RF-03, RF-08
**RNF relacionados:** RNF1, RNF12

**Descripción:**
- Instalar y configurar Socket.io en Express
- Crear rooms por ruta (un room por cada ruta activa)
- Evento `bus:location` que emite `{ bus_id, lat, lng, timestamp }`
- El servidor recibe la ubicación del conductor y la retransmite solo al room de esa ruta (no broadcast global)
- Usar rooms correctamente para soportar múltiples usuarios concurrentes sin degradación (RNF1)

**Criterio de aceptación:** Conductor emite posición → estudiantes del mismo room la reciben en menos de 1 segundo. Múltiples rutas activas simultáneamente sin interferencia.

---

### #07 — Endpoint POST /api/ubicacion (recibir GPS del conductor)
**Módulo:** GPS / Tiempo real | **Prioridad:** Alta
**RF relacionados:** RF-08
**RNF relacionados:** RNF10, RNF12

**Descripción:**
- Recibe `{ bus_id, lat, lng, timestamp }` desde la PWA del conductor
- Valida que el conductor tenga ese bus asignado
- Valida que las coordenadas sean valores numéricos válidos (RNF10 — confiabilidad)
- Guarda en tabla `ubicaciones`
- Emite evento Socket.io `bus:location` al room correspondiente
- Ciclo cada 3-4 segundos según RF-08

**Criterio de aceptación:** Posición guardada en BD y emitida por socket en tiempo real. Coordenadas inválidas rechazadas con error descriptivo.

---

### #08 — PWA del conductor (envío de ubicación)
**Módulo:** GPS / Tiempo real | **Prioridad:** Alta
**RF relacionados:** RF-08, RF-12

**Descripción:**
- Página web optimizada para móvil (PWA)
- Usa `navigator.geolocation.watchPosition()` para obtener GPS del celular
- Envía coordenadas al servidor cada 3-4 segundos via fetch o socket
- Botón "Iniciar recorrido" / "Finalizar recorrido"
- Botón para cambiar estado del bus: En recorrido / Detenido / Fuera de servicio
- Funciona con pantalla bloqueada (wakeLock API)

**Criterio de aceptación:** Conductor abre la URL, activa GPS y la posición aparece en el mapa de estudiantes.

---

## 🗺️ MÓDULO: Mapas y Visualización

### #09 — Vista del mapa principal con Leaflet.js
**Módulo:** Mapas | **Prioridad:** Alta
**RF relacionados:** RF-03, RF-09
**RNF relacionados:** RNF6, RNF12, RNF13

**Descripción:**
- Integrar Leaflet.js con tiles de OpenStreetMap
- Centrar mapa en Aguachica, Cesar (lat: 8.3086, lng: -73.6194)
- Mostrar marcadores de buses activos con su identificador visible
- Marcadores se mueven en tiempo real al recibir eventos Socket.io
- Dibujar trayectoria de la ruta como polilínea en el mapa
- Diseño responsive: mapa usable en celular, tablet y escritorio (RNF6)
- No requiere instalación de ningún programa adicional — funciona en navegador (RNF13)

**Criterio de aceptación:** Mapa carga en menos de 3 segundos. Bus se mueve sin recargar página. Vista correcta en móvil y escritorio.

---

### #10 — Mostrar puntos de parada en el mapa
**Módulo:** Mapas | **Prioridad:** Media
**RF relacionados:** RF-10

**Descripción:**
- Cargar paradas desde `/api/paradas?ruta_id=X`
- Mostrar marcadores diferenciados para paradas (ícono distinto al del bus)
- Paradas inactivas con marcador diferente (color gris o tachado)
- Clic en parada muestra nombre y estado

**Criterio de aceptación:** Paradas visibles en mapa, claramente diferenciadas de los buses.

---

### #11 — Tarjeta de información del bus al hacer clic
**Módulo:** Mapas | **Prioridad:** Media
**RF relacionados:** RF-14, RF-12, RF-13

**Descripción:**
- Al hacer clic en el marcador del bus, mostrar popup/tarjeta con:
  - Número o nombre del bus
  - Ruta asignada
  - Estado actual (En recorrido / Detenido / Fuera de servicio / Sin señal)
  - Nombre del conductor
- Si pierde señal GPS, mostrar estado "Sin señal"

**Criterio de aceptación:** Popup aparece al clic, información actualizada en tiempo real.

---

### #12 — Tiempo estimado de llegada a parada
**Módulo:** Mapas | **Prioridad:** Media
**RF relacionados:** RF-11

**Descripción:**
- Al seleccionar una parada, calcular ETA del bus más cercano
- Cálculo: distancia entre posición actual del bus y la parada / velocidad promedio estimada
- Se actualiza con cada nueva posición del bus
- Si ETA > 30 minutos, indicarlo claramente
- Si bus fuera de servicio, mostrar "Sin estimación disponible"

**Criterio de aceptación:** ETA visible al seleccionar parada, se actualiza automáticamente.

---

### #13 — Lista de buses disponibles
**Módulo:** Mapas | **Prioridad:** Alta
**RF relacionados:** RF-15

**Descripción:**
- Panel lateral o vista con lista de buses activos
- Muestra: nombre del bus, ruta, estado, ETA al próximo paradero
- Se actualiza cada 3-4 segundos
- Si no hay buses activos, mensaje informativo

**Criterio de aceptación:** Lista actualizada en tiempo real, solo muestra buses operativos.

---

### #14 — Vista de rutas disponibles
**Módulo:** Mapas | **Prioridad:** Alta
**RF relacionados:** RF-05

**Descripción:**
- Endpoint `GET /api/rutas` retorna lista de rutas
- Vista que muestra listado de rutas con nombre y descripción
- Al seleccionar una ruta, se dibuja su recorrido completo en el mapa
- Rutas suspendidas marcadas como no disponibles

**Criterio de aceptación:** Rutas se dibujan correctamente en el mapa de Aguachica.

---

## 🔔 MÓDULO: Notificaciones

### #15 — Endpoint POST /api/notificaciones (conductor envía alerta)
**Módulo:** Notificaciones | **Prioridad:** Media
**RF relacionados:** RF-04

**Descripción:**
- Conductor envía `{ ruta_id, mensaje, tipo }` (tipo: cambio_ruta / retraso)
- Valida que el mensaje no esté vacío
- Sistema identifica estudiantes de esa ruta
- Emite evento Socket.io `notificacion:nueva` a los usuarios del room
- Guarda notificación en BD
- Entrega en menos de 5 segundos (RF-04)

**Criterio de aceptación:** Notificación llega a todos los estudiantes de la ruta afectada.

---

### #16 — Mostrar notificaciones en el frontend
**Módulo:** Notificaciones | **Prioridad:** Media
**RF relacionados:** RF-04

**Descripción:**
- Banner o toast que aparece al recibir evento `notificacion:nueva`
- Muestra: ruta afectada + detalle del mensaje
- Persiste hasta que el usuario la descarta
- Historial de notificaciones del día accesible

**Criterio de aceptación:** Notificación visible en menos de 5 segundos tras envío del conductor.

---

## 👤 MÓDULO: Administración

### #17 — Panel de administración (CRUD buses)
**Módulo:** Administración | **Prioridad:** Alta
**RF relacionados:** RF-06, RF-13

**Descripción:**
- Vista solo para rol administrador
- Crear bus: nombre, número identificador único (sin duplicados), asignar ruta y conductor
- Editar y eliminar buses
- Si identificador duplicado, mostrar error (RF-13)
- Cambios reflejados en tiempo real para todos los usuarios

**Criterio de aceptación:** Admin puede gestionar buses completo, sin acceso para otros roles.

---

### #18 — Panel de administración (CRUD rutas y paradas)
**Módulo:** Administración | **Prioridad:** Alta
**RF relacionados:** RF-06, RF-05, RF-10

**Descripción:**
- Crear, editar y suspender rutas
- Agregar/editar/inhabilitar paradas con sus coordenadas en el mapa
- Rutas suspendidas se marcan automáticamente como no disponibles

**Criterio de aceptación:** Cambios en rutas y paradas visibles de inmediato en el mapa.

---

### #19 — Gestión de usuarios por el administrador
**Módulo:** Administración | **Prioridad:** Media
**RF relacionados:** RF-07

**Descripción:**
- Listar usuarios registrados
- Asignar o cambiar rol (estudiante / conductor / administrador)
- Activar o desactivar usuarios
- Permisos actualizados de inmediato tras cambio de rol

**Criterio de aceptación:** Rol actualizado se aplica sin necesidad de que el usuario cierre sesión.

---

## 🧪 MÓDULO: Pruebas e Integración

### #20 — Prueba de flujo completo: conductor → mapa estudiante
**Módulo:** Pruebas | **Prioridad:** Alta
**RF relacionados:** RF-03, RF-08

**Descripción:**
Probar el flujo end-to-end:
1. Conductor abre PWA en celular e inicia recorrido
2. Posición se envía al servidor cada 3-4 segundos
3. Mapa del estudiante muestra el bus moviéndose
4. Latencia total menor a 5 segundos

---

### #21 — Prueba de autenticación por roles
**Módulo:** Pruebas | **Prioridad:** Alta
**RF relacionados:** RF-01, RF-07

**Descripción:**
- Estudiante: puede ver mapa, rutas, paradas, buses. No puede acceder a admin.
- Conductor: puede enviar ubicación y notificaciones. No puede acceder a admin.
- Administrador: acceso completo a todo el sistema.
- Credenciales incorrectas: mensaje de error correcto.

---

### #22 — Prueba de rendimiento (cotas de tiempo RF)
**Módulo:** Pruebas | **Prioridad:** Media
**RF relacionados:** Todos los RF
**RNF relacionados:** RNF12

**Descripción:**
Verificar que el sistema cumple las cotas de tiempo definidas:
- Login: < 3 segundos
- Actualización GPS: cada 3-4 segundos
- Carga de rutas/paradas: < 3 segundos
- Envío de notificación: < 5 segundos
- ETA: < 3 segundos

---

## 🎨 MÓDULO: Frontend / UI

### #23 — Modo claro / oscuro e identidad institucional UPC
**Módulo:** Frontend | **Prioridad:** Media
**RNF relacionados:** RNF2, RNF4, RNF14, RNF9

**Descripción:**
- Implementar toggle de tema visual: modo claro y modo oscuro (RNF2)
- Preferencia guardada en localStorage para persistir entre sesiones
- Aplicar colores institucionales de la UPC Aguachica en toda la interfaz (RNF4)
- Incluir logo de la universidad en el header de todas las vistas (RNF14)
- Interfaz simple e intuitiva: navegación clara, íconos descriptivos, textos legibles (RNF9)

**Criterio de aceptación:** Toggle claro/oscuro funciona en todas las vistas. Logo y colores UPC presentes. Interfaz validada como intuitiva por al menos un usuario de prueba.

---

### #24 — Pruebas de responsividad y compatibilidad de navegadores
**Módulo:** Pruebas | **Prioridad:** Media
**RNF relacionados:** RNF5, RNF6, RNF13

**Descripción:**
- Probar todas las vistas en los siguientes navegadores sin configuración adicional (RNF5):
  - Google Chrome (escritorio y móvil)
  - Firefox
  - Microsoft Edge
- Probar en los siguientes dispositivos (RNF6):
  - Celular Android (mínimo 360px ancho)
  - Tablet (768px)
  - Computador (1280px+)
- Verificar que la PWA del conductor funciona correctamente en Chrome móvil Android
- Confirmar que no se requiere instalar ningún programa adicional en ningún caso (RNF13)

**Criterio de aceptación:** Todas las vistas funcionales y visualmente correctas en los 3 navegadores y los 3 tipos de dispositivo.

---

### #25 — Configurar servidor de despliegue (disponibilidad 24/7)
**Módulo:** Infraestructura | **Prioridad:** Alta
**RNF relacionados:** RNF3, RNF15

**Descripción:**
- Desplegar el backend (Node.js) en Railway o Render (plan gratuito suficiente para el proyecto)
- Desplegar el frontend (React) en Vercel o Netlify
- Configurar base de datos en la nube (Railway PostgreSQL o PlanetScale)
- Variables de entorno en `.env` — nunca hardcodeadas en el código (RNF15 — mantenibilidad)
- URL pública accesible sin VPN ni configuración especial (RNF3)
- Documentar en el README cómo actualizar o redesplegar sin afectar el funcionamiento (RNF15)

**Criterio de aceptación:** Sistema accesible desde URL pública las 24 horas. Redespliegue posible sin tiempo de inactividad prolongado. README con instrucciones de deploy.

---

## Resumen de issues por módulo

| Módulo | Issues | Prioridad |
|---|---|---|
| Base de datos | #01, #02 | Alta |
| Autenticación | #03, #04, #05 | Alta |
| GPS / Tiempo real | #06, #07, #08 | Alta |
| Mapas / Visualización | #09, #10, #11, #12, #13, #14 | Alta/Media |
| Notificaciones | #15, #16 | Media |
| Administración | #17, #18, #19 | Alta/Media |
| Pruebas e integración | #20, #21, #22, #24 | Alta/Media |
| Frontend / UI | #23 | Media |
| Infraestructura | #25 | Alta |

**Total: 25 issues**

## Orden sugerido para empezar

1. #01 → #02 (Base de datos primero, todo depende de esto)
2. #03 → #04 → #05 (Autenticación, segundo pilar)
3. #06 → #07 → #08 (Socket.io + GPS, el corazón del sistema)
4. #09 → #14 → #10 (Mapa base, luego rutas, luego paradas)
5. #11 → #12 → #13 (Detalles del mapa)
6. #17 → #18 → #19 (Admin)
7. #15 → #16 (Notificaciones)
8. #23 (Modo oscuro + identidad UPC — puede hacerse en paralelo con cualquier módulo frontend)
9. #25 (Deploy — antes de las pruebas finales)
10. #20 → #21 → #22 → #24 (Pruebas finales)
