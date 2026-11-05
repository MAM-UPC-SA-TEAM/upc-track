# Issues Frontend — Monitoreo de Buses UPC Aguachica
## Fase 3 — Construcción Frontend (React + Vite)

> Complementa los issues de backend (#01–#25).
> Cada issue corresponde a una vista definida en los mockups del entregable.
> Orden sugerido al final del documento.

---

## 🎨 MÓDULO: Configuración base del proyecto

### #F01 — Inicializar proyecto React + Vite y configurar estructura base
**Módulo:** Configuración | **Prioridad:** Alta
**Mockup relacionado:** Todas las vistas
**Issues backend relacionados:** #03, #05

**Descripción:**
Crear y configurar el proyecto base del que dependen todas las vistas:
- `npm create vite@latest` con template React
- Instalar dependencias: `react-router-dom`, `leaflet`, `react-leaflet`, `socket.io-client`
- Configurar React Router v6 con rutas protegidas por rol (`/login`, `/inicio`, `/mapa`, `/rutas`, `/buses`, `/notificaciones`, `/perfil`, `/admin`, `/conductor`)
- Crear estructura de carpetas: `pages/`, `components/`, `services/`, `hooks/`, `context/`
- Crear `services/api.js` (singleton con fetch/axios apuntando al backend)
- Crear `services/socket.js` (instancia única de Socket.io-client)
- Crear `hooks/useAuth.js` (lee JWT del localStorage, expone `usuario`, `rol`, `logout`)
- Crear `context/BusContext.jsx` (estado global de buses en tiempo real)
- Crear componente `Layout.jsx` con sidebar verde UPC y topbar (modo claro/oscuro, notificaciones, avatar)
- Variables CSS con colores institucionales UPC: verde `#1e6b2e`, verde oscuro `#145220`, blanco, gris claro
- Configurar modo claro y oscuro (toggle en topbar, preferencia guardada en localStorage)

**Criterio de aceptación:** `npm run dev` levanta la app. Login redirige según rol. Sidebar y topbar visibles en todas las vistas protegidas. Modo oscuro funciona en toda la app.

---

## 🔐 MÓDULO: Autenticación

### #F02 — Vista Login (Mockup 1)
**Módulo:** Autenticación | **Prioridad:** Alta
**Mockup:** Vista 1 — Login
**Issues backend relacionados:** #03, #04, #05

**Descripción:**
Implementar `pages/Login.jsx` fiel al mockup:
- Logo UPC + nombre "Universidad Popular del Cesar" en la cabecera
- Ilustración de bus con mapa (SVG o imagen del mockup)
- Título "Sistema de Monitoreo de Rutas"
- Campo "Usuario" con ícono de persona y placeholder "Ingrese su usuario"
- Campo "Contraseña" con ícono de candado, toggle show/hide (ícono ojo)
- Botón "ACCEDER" verde con ícono de flecha — llama a `POST /api/auth/login`
- Link "¿Olvidó su contraseña?" (puede ser modal informativo por ahora)
- Link "¿No tienes cuenta? Regístrate aquí" → redirige a vista de registro o muestra modal
- Pie de página: "© Universidad Popular del Cesar – Seccional Aguachica 2026"
- Fondo con decoración verde en esquinas (igual al mockup)
- Al hacer login exitoso: detecta `tipo_usuario` del JWT y redirige:
  - `estudiante` → `/inicio`
  - `conductor` → `/conductor`
  - `administrador` → `/admin`
- Mensajes de error visibles bajo el botón (credenciales incorrectas, campos vacíos)
- Responsive: funciona bien en móvil (360px) y escritorio

**Criterio de aceptación:** Login funciona con los 3 roles. Redirige correctamente. Errores visibles. Idéntico al mockup en colores y estructura.

---

## 🏠 MÓDULO: Dashboard y navegación

### #F03 — Layout compartido: sidebar + topbar
**Módulo:** Navegación | **Prioridad:** Alta
**Mockup:** Vistas 2–12 (presente en todas)
**Issues backend relacionados:** #05

**Descripción:**
Implementar `components/Layout.jsx` que envuelve todas las vistas protegidas:

**Sidebar (panel izquierdo verde oscuro):**
- Logo UPC en la parte superior
- Links de navegación con íconos según rol:
  - Estudiante: Inicio, Mapa en tiempo real, Rutas, Buses, Notificaciones, Perfil, Cerrar sesión
  - Conductor: Inicio, Mi recorrido, Notificaciones, Cerrar sesión
  - Admin: Inicio, Usuarios, Buses, Rutas, Cerrar sesión
- Item activo resaltado en verde más claro con fondo diferenciado
- "Cerrar sesión" llama a `useAuth().logout()` y redirige a `/login`

**Topbar (barra superior):**
- Título de la sección actual
- Ícono luna/sol para toggle claro/oscuro
- Ícono campana de notificaciones (con badge rojo si hay notificaciones sin leer)
- Avatar del usuario (iniciales o foto)

**Criterio de aceptación:** Sidebar correcto para cada rol. Toggle de tema funciona. Ítem activo resaltado según ruta actual.

---

### #F04 — Vista Dashboard / Inicio (Mockup 2 y 3)
**Módulo:** Dashboard | **Prioridad:** Alta
**Mockup:** Vista 2 (modo claro) y Vista 3 (modo oscuro)
**Issues backend relacionados:** #07, #14

**Descripción:**
Implementar `pages/Dashboard.jsx`:
- Título "Bienvenido al Sistema de Monitoreo de Rutas"
- Sección "Resumen de transporte" con 3 tarjetas métricas:
  - Buses disponibles (dato de `GET /api/buses`)
  - Rutas activas (dato de `GET /api/rutas`)
  - Próximo bus en X minutos (ETA calculado)
- Sección "Mapa en tiempo real": versión mini del mapa Leaflet (no interactivo, solo preview) con botón "Ver mapa completo" → navega a `/mapa`
- Sección "Accesos rápidos": dos botones "Ver rutas" y "Ver buses"
- Las 3 tarjetas se actualizan con datos reales del backend
- Modo oscuro: fondo oscuro, tarjetas oscuras (igual al mockup 3)

**Criterio de aceptación:** Datos reales en las tarjetas. Mapa preview visible. Botones de acceso rápido navegan correctamente. Modo oscuro idéntico al mockup.

---

## 🗺️ MÓDULO: Mapa

### #F05 — Vista Mapa en tiempo real (Mockup 4)
**Módulo:** Mapa | **Prioridad:** Alta
**Mockup:** Vista 4 — Mapa en tiempo real
**Issues backend relacionados:** #06, #07, #09, #10, #11, #12

**Descripción:**
Implementar `pages/MapaTiempoReal.jsx`:
- Barra superior con:
  - Buscador "Buscar ruta o bus" (filtra marcadores en el mapa)
  - Selector dropdown "Todos los buses" (filtra por bus específico)
- Mapa Leaflet centrado en Aguachica (`lat: 8.3086, lng: -73.6194`) ocupando ~60% del ancho
- Marcadores de buses que se mueven en tiempo real al recibir evento `bus:location` del socket
- Marcadores de paradas diferenciados (ícono distinto al del bus)
- Polilínea dibujada con el trayecto de la ruta seleccionada
- Panel derecho "Información del bus" al hacer clic en un marcador:
  - Bus: #01
  - Ruta: Centro
  - Estado: ✓ En recorrido (con color según estado)
  - Próxima parada: Bloque 3
  - Llegada estimada: 8 min
  - Botón "Ver detalle del bus"
- Si un bus pierde señal: estado "Sin señal" en el panel
- Responsive: en móvil el panel de info aparece como bottom sheet

**Criterio de aceptación:** Bus se mueve en tiempo real sin recargar. Info del bus actualizada al hacer clic. Polilínea de ruta dibujada. Funciona en móvil.

---

## 🚏 MÓDULO: Rutas y Buses

### #F06 — Vista Rutas disponibles (Mockup 5)
**Módulo:** Rutas | **Prioridad:** Alta
**Mockup:** Vista 5 — Rutas disponibles
**Issues backend relacionados:** #14

**Descripción:**
Implementar `pages/Rutas.jsx`:
- Título "Rutas disponibles"
- Lista de rutas cargada desde `GET /api/rutas`
- Cada ítem de ruta muestra:
  - Ícono de ruta (línea con puntos, verde)
  - Nombre de la ruta (ej. "Ruta 1 - Centro")
  - Número de paradas
  - Estado (Activa / Suspendida con colores diferenciados)
  - Botón "Ver en mapa" → navega a `/mapa` con esa ruta preseleccionada
- Rutas suspendidas con estilo atenuado/gris
- Botón "Ver todas las rutas" al final (si hay paginación)
- Estado vacío: mensaje si no hay rutas activas

**Criterio de aceptación:** Lista carga desde el backend. "Ver en mapa" abre el mapa con la ruta dibujada. Rutas suspendidas diferenciadas visualmente.

---

### #F07 — Vista Buses disponibles (Mockup 6)
**Módulo:** Buses | **Prioridad:** Alta
**Mockup:** Vista 6 — Buses disponibles
**Issues backend relacionados:** #13

**Descripción:**
Implementar `pages/Buses.jsx`:
- Título "Buses disponibles"
- Lista de buses cargada desde `GET /api/buses`
- Cada ítem muestra:
  - Ícono de bus (verde si en servicio, gris si fuera de servicio)
  - Nombre del bus (Bus #01, Bus #02...)
  - Ruta asignada
  - Estado: "En recorrido" (verde) / "Fuera de servicio" (rojo) / "Detenido" (amarillo)
  - Llegada estimada en minutos (o "--" si fuera de servicio)
  - Flecha ">" que navega al detalle o abre panel lateral
- Lista actualizada cada 3-4 segundos (o via socket)
- Botón "Ver todos los buses" si hay paginación

**Criterio de aceptación:** Lista en tiempo real. Estados con colores correctos. Navegación al detalle funciona.

---

## 🔔 MÓDULO: Notificaciones

### #F08 — Vista Notificaciones (Mockup 7)
**Módulo:** Notificaciones | **Prioridad:** Media
**Mockup:** Vista 7 — Notificaciones
**Issues backend relacionados:** #15, #16

**Descripción:**
Implementar `pages/Notificaciones.jsx`:
- Título "Notificaciones" + botón "Marcar todas como leídas" alineado a la derecha
- Lista de notificaciones cargada desde `GET /api/notificaciones`
- Cada notificación muestra:
  - Ícono circular con color según tipo: ⚠️ amarillo (retraso), 🔄 azul (cambio de ruta), ✅ verde (normal)
  - Título de la notificación (ej. "Retraso en Ruta 2")
  - Descripción breve
  - Tiempo relativo (ej. "Hace 5 min", "Hace 30 min")
- Notificaciones no leídas con fondo levemente diferenciado
- Nuevas notificaciones aparecen en tiempo real via evento `notificacion:nueva` del socket (sin recargar)
- Badge en el ícono de campana del topbar con el contador de no leídas
- Botón "Ver todas las notificaciones" si hay paginación

**Criterio de aceptación:** Notificaciones en tiempo real. Badge actualizado. "Marcar como leídas" funciona. Íconos con colores correctos por tipo.

---

## 👤 MÓDULO: Perfil

### #F09 — Vista Mi perfil — Estudiante (Mockup 8)
**Módulo:** Perfil | **Prioridad:** Media
**Mockup:** Vista 8 — Mi perfil (Estudiante)
**Issues backend relacionados:** #19

**Descripción:**
Implementar `pages/Perfil.jsx` (compartida con adaptaciones por rol):
- Título "Mi perfil"
- Avatar circular con inicial del nombre (o foto si existe)
- Nombre completo y correo debajo del avatar
- Campos de solo lectura en tarjetas:
  - Nombre completo
  - Documento
  - Correo
  - Rol (Estudiante / Conductor / Administrador)
- Datos cargados desde el JWT o `GET /api/usuarios/me`
- Posibilidad de editar nombre en futuras iteraciones (botón "Editar" deshabilitado por ahora)

**Criterio de aceptación:** Datos reales del usuario logueado. Campos correctamente mostrados. Avatar con inicial generada.

---

## ⚙️ MÓDULO: Administración

### #F10 — Vista Panel Administrador (Mockup 9)
**Módulo:** Administración | **Prioridad:** Alta
**Mockup:** Vista 9 — Panel Administrador
**Issues backend relacionados:** #17, #18, #19

**Descripción:**
Implementar `pages/admin/PanelAdmin.jsx`:
- Título "Panel de Administrador"
- Grid de 3 tarjetas de acceso rápido con ícono grande y descripción:
  - "Gestionar usuarios" → navega a `/admin/usuarios`
  - "Gestionar buses" → navega a `/admin/buses`
  - "Gestionar rutas" → navega a `/admin/rutas`
- Sidebar exclusivo del admin: Inicio, Usuarios, Buses, Rutas, Cerrar sesión
- Vista bloqueada para otros roles (redirección si no es admin)

**Criterio de aceptación:** Solo accesible con rol administrador. Las 3 tarjetas navegan correctamente. Sidebar con ítems exclusivos de admin.

---

### #F11 — Vista Gestión de usuarios — Admin (Mockup 10)
**Módulo:** Administración | **Prioridad:** Alta
**Mockup:** Vista 10 — Gestión de usuarios
**Issues backend relacionados:** #19

**Descripción:**
Implementar `pages/admin/GestionUsuarios.jsx`:
- Título "Gestión de usuarios" + botón "+ Agregar usuario" (abre modal o navega a formulario)
- Tabla con columnas: Nombre, Correo, Rol, Estado, Acciones
- Cada fila muestra:
  - Nombre y correo del usuario
  - Rol (Estudiante / Conductor / Administrador)
  - Estado: "Activo" (texto) o badge "inactivo" (fondo rosado/rojo claro)
  - Íconos de acción: ✏️ editar (abre modal) y 🗑️ eliminar (con confirmación)
- Datos cargados desde `GET /api/usuarios`
- Paginación: "Mostrando X a Y de Z usuarios"
- Modal de edición: permite cambiar nombre, rol y estado activo/inactivo
- Modal de agregar: nombre, correo, contraseña, rol

**Criterio de aceptación:** CRUD completo funcional. Estado "inactivo" con badge visual. Paginación correcta. Modales abren y cierran correctamente.

---

### #F12 — Vista Gestión de buses — Admin (Mockup 11)
**Módulo:** Administración | **Prioridad:** Alta
**Mockup:** Vista 11 — Gestión de buses
**Issues backend relacionados:** #17

**Descripción:**
Implementar `pages/admin/GestionBuses.jsx`:
- Título "Gestión de buses" + botón "+ Agregar bus"
- Tabla con columnas: Bus, Ruta asignada, Estado, Acciones
- Cada fila muestra:
  - Identificador del bus (Bus #01, Bus #02...)
  - Ruta asignada
  - Estado: badge "En servicio" (fondo verde claro) o "Fuera de servicio" (fondo rojo claro)
  - Íconos ✏️ editar y 🗑️ eliminar
- Datos de `GET /api/buses`
- Modal de agregar/editar: nombre del bus, placa, ruta asignada (select), conductor asignado (select)
- Identificador único — error si ya existe (RF-13)
- Paginación al pie

**Criterio de aceptación:** CRUD de buses funcional. Badges de estado con colores correctos. Select de rutas y conductores cargados desde la API.

---

### #F13 — Vista Gestión de rutas — Admin (Mockup 12)
**Módulo:** Administración | **Prioridad:** Alta
**Mockup:** Vista 12 — Gestión de rutas
**Issues backend relacionados:** #18

**Descripción:**
Implementar `pages/admin/GestionRutas.jsx`:
- Título "Gestión de rutas" + botón "+ Agregar ruta"
- Tabla con columnas: Ruta, Paradas, Estado, Acciones
- Cada fila muestra:
  - Nombre de la ruta (Centro, Norte, Sur)
  - Número de paradas
  - Estado: badge "Activa" (verde claro)
  - Íconos ✏️ editar y 🗑️ eliminar
- Datos de `GET /api/rutas`
- Modal de agregar/editar: nombre, descripción, estado activa/suspendida
- Rutas eliminadas o suspendidas se reflejan inmediatamente en el mapa
- Paginación al pie

**Criterio de aceptación:** CRUD de rutas funcional. Cambios visibles en el mapa sin recargar. Paginación correcta.

---

## 🚌 MÓDULO: Conductor

### #F14 — Vista Panel Conductor — Mi recorrido (Mockup 13)
**Módulo:** Conductor | **Prioridad:** Alta
**Mockup:** Vista 13 — Panel Conductor
**Issues backend relacionados:** #07, #08, #15

**Descripción:**
Implementar `pages/conductor/MiRecorrido.jsx`:
- Sidebar exclusivo del conductor: Inicio, Mi recorrido, Notificaciones, Cerrar sesión
- Sección "Mi recorrido" con:
  - Ilustración/mapa pequeño del bus en ruta
  - Tarjeta de información del lado derecho:
    - Bus asignado (ej. Bus #01) — cargado de `GET /api/buses/mi-bus`
    - Ruta (ej. Centro)
    - Estado actual: badge "En recorrido" (verde) — editable
    - Próxima parada
    - Llegada estimada
  - Botón "Iniciar recorrido" (verde, lleno) → activa `watchPosition`, empieza a enviar GPS cada 3-4 s
  - Botón "Finalizar recorrido" (borde rojo) → detiene el GPS, cambia estado a fuera de servicio
- Sección "Enviar aviso":
  - Textarea "Escribe un mensaje..."
  - Botón "Enviar" → llama a `POST /api/notificaciones`
- GPS con `navigator.geolocation.watchPosition()` enviando a `POST /api/ubicacion`
- WakeLock API para mantener pantalla encendida mientras el recorrido está activo
- Funciona en móvil Chrome Android (PWA)

**Criterio de aceptación:** GPS activo al iniciar recorrido. Posición llega al mapa del estudiante en tiempo real. Avisos enviados visibles en la vista de notificaciones. Botones con estados correctos.

---

## Resumen de issues frontend

| # | Vista (Mockup) | Módulo | Prioridad |
|---|---|---|---|
| #F01 | Setup base + router + servicios | Configuración | Alta |
| #F02 | Login (Mockup 1) | Autenticación | Alta |
| #F03 | Layout sidebar + topbar | Navegación | Alta |
| #F04 | Dashboard / Inicio (Mockups 2 y 3) | Dashboard | Alta |
| #F05 | Mapa en tiempo real (Mockup 4) | Mapa | Alta |
| #F06 | Rutas disponibles (Mockup 5) | Rutas | Alta |
| #F07 | Buses disponibles (Mockup 6) | Buses | Alta |
| #F08 | Notificaciones (Mockup 7) | Notificaciones | Media |
| #F09 | Mi perfil estudiante (Mockup 8) | Perfil | Media |
| #F10 | Panel administrador (Mockup 9) | Administración | Alta |
| #F11 | Gestión de usuarios (Mockup 10) | Administración | Alta |
| #F12 | Gestión de buses (Mockup 11) | Administración | Alta |
| #F13 | Gestión de rutas (Mockup 12) | Administración | Alta |
| #F14 | Panel conductor (Mockup 13) | Conductor | Alta |

**Total: 14 issues frontend** (13 vistas + 1 de configuración base)

---

## Orden sugerido para implementar

1. **#F01** — Setup base primero, todo depende de esto
2. **#F02** — Login, sin esto no se puede probar nada
3. **#F03** — Layout/sidebar, base visual de todas las vistas protegidas
4. **#F04** — Dashboard, primera vista que ve el usuario al entrar
5. **#F05** — Mapa en tiempo real, la vista más compleja y central del sistema
6. **#F06 + #F07** — Rutas y Buses, complementan el mapa
7. **#F14** — Panel conductor, necesario para que el mapa tenga datos reales
8. **#F08** — Notificaciones
9. **#F09** — Perfil
10. **#F10 → #F11 → #F12 → #F13** — Panel admin y sus 3 sub-vistas

## Notas de implementación

- Los issues #F01–#F14 se agregan a la misma tabla de GitHub Projects junto con los issues #01–#25 de backend.
- El issue #08 del backend (PWA del conductor) queda **reemplazado** por #F14 para evitar duplicados — #F14 es la versión React.
- El issue #23 del backend (modo claro/oscuro) queda **absorbido** por #F01 y #F03 — se implementa desde el inicio como parte del layout.
