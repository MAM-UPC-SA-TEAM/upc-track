# Requisitos Funcionales — Sistema de Monitoreo de Buses UPC Aguachica

> **Proyecto:** Monitoreo de Buses — Universidad Popular del Cesar, Seccional Aguachica
> **Fase:** Análisis de Requisitos

---

## RF1 — Login

| Campo | Detalle |
|---|---|
| **Código** | RF1 |
| **Nombre** | login |
| **Tipo** | Ubicuo |
| **Rol** | Software |
| **Stakeholders** | Programador / Administrador / Conductor / Estudiante |

**Descripción:**
La aplicación web debe incluir un inicio de sesión mediante usuario y contraseña para permitir el acceso al sistema.

---

## RF2 — Cierre de Sesión

| Campo | Detalle |
|---|---|
| **Código** | RF2 |
| **Nombre** | cierreSesion |
| **Tipo** | Ubicuo |
| **Rol** | Software |
| **Stakeholders** | Conductor / Estudiante |

**Descripción:**
El sistema debe permitir el cierre de sesión del usuario de forma manual y automática después de un periodo de inactividad.

---

## RF3 — Ubicación en Tiempo Real

| Campo | Detalle |
|---|---|
| **Código** | RF3 |
| **Nombre** | ubicaciónTiempoReal |
| **Tipo** | Basado en estado |
| **Rol** | Usuario |
| **Stakeholders** | Estudiante |

**Descripción:**
El sistema debe permitir a los estudiantes consultar la ubicación del bus en tiempo real.

---

## RF4 — Notificaciones

| Campo | Detalle |
|---|---|
| **Código** | RF4 |
| **Nombre** | notificaciones |
| **Tipo** | Basado en estado |
| **Rol** | Software |
| **Stakeholders** | Estudiante / Conductor |

**Descripción:**
El sistema debe permitir que el conductor envíe notificaciones a los estudiantes cuando existan cambios en las rutas o retrasos.

---

## RF5 — Ver Rutas

| Campo | Detalle |
|---|---|
| **Código** | RF5 |
| **Nombre** | verRutas |
| **Tipo** | Basado en estado |
| **Rol** | Usuario |
| **Stakeholders** | Estudiante |

**Descripción:**
El sistema debe permitir a los estudiantes visualizar las rutas disponibles antes de utilizar el servicio.

---

## RF6 — Administración del Sistema

| Campo | Detalle |
|---|---|
| **Código** | RF6 |
| **Nombre** | administracionSistema |
| **Tipo** | Ubicuo |
| **Rol** | Admin / System |
| **Stakeholders** | Administrador |

**Descripción:**
El sistema debe permitir a un usuario administrador gestionar y actualizar la información de buses y rutas.

---

## RF7 — Gestión de Usuarios

| Campo | Detalle |
|---|---|
| **Código** | RF7 |
| **Nombre** | gestionUsuarios |
| **Tipo** | Ubicuo |
| **Rol** | Software |
| **Stakeholders** | Administrador / Estudiante |

**Descripción:**
El sistema debe gestionar distintos tipos de usuario, como administrador y estudiante.

---

## RF8 — Actualización de Ubicación

| Campo | Detalle |
|---|---|
| **Código** | RF8 |
| **Nombre** | actualizacionUbicacion |
| **Tipo** | Basado en estado |
| **Rol** | Software |
| **Stakeholders** | Estudiante |

**Descripción:**
El sistema debe actualizar la ubicación de los buses en intervalos de tiempo definidos.

---

## RF9 — Recorrido en Mapa

| Campo | Detalle |
|---|---|
| **Código** | RF9 |
| **Nombre** | recorridoMapa |
| **Tipo** | Basado en estado |
| **Rol** | Usuario |
| **Stakeholders** | Estudiante |

**Descripción:**
El sistema debe mostrar en el mapa el recorrido completo que realiza cada bus.

---

## RF10 — Paraderos

| Campo | Detalle |
|---|---|
| **Código** | RF10 |
| **Nombre** | paraderos |
| **Tipo** | Basado en estado |
| **Rol** | Usuario |
| **Stakeholders** | Estudiante |

**Descripción:**
El sistema debe mostrar los paraderos o puntos donde los estudiantes pueden tomar el bus.

---

## RF11 — Tiempo de Llegada

| Campo | Detalle |
|---|---|
| **Código** | RF11 |
| **Nombre** | tiempoLlegada |
| **Tipo** | Basado en estado |
| **Rol** | Usuario |
| **Stakeholders** | Estudiante |

**Descripción:**
El sistema debe mostrar el tiempo estimado de llegada del bus a cada parada.

---

## RF12 — Estado del Bus / Registro de Estudiante

| Campo | Detalle |
|---|---|
| **Código** | RF12 |
| **Nombre** | estadoBus |
| **Tipo** | Basado en estado |
| **Rol** | Usuario |
| **Stakeholders** | Estudiante |

**Descripción:**
El estudiante debe registrarse en el sistema para poder hacer uso de él.

---

## RF13 — Identificar Bus

| Campo | Detalle |
|---|---|
| **Código** | RF13 |
| **Nombre** | IdentificarBus |
| **Tipo** | Ubicuo |
| **Rol** | Usuario |
| **Stakeholders** | Estudiante |

**Descripción:**
El sistema debe permitir identificar cada bus mediante un número o nombre.

---

## RF14 — Información del Bus

| Campo | Detalle |
|---|---|
| **Código** | RF14 |
| **Nombre** | informacionBus |
| **Tipo** | Basado en estado |
| **Rol** | Usuario |
| **Stakeholders** | Estudiante |

**Descripción:**
El sistema debe mostrar la información básica del bus al seleccionarlo en el mapa.

---

## RF15 — Buses Disponibles

| Campo | Detalle |
|---|---|
| **Código** | RF15 |
| **Nombre** | busesDisponibles |
| **Tipo** | Basado en estado |
| **Rol** | Usuario |
| **Stakeholders** | Estudiante |

**Descripción:**
El sistema debe mostrar los buses disponibles en el momento.

---

## Resumen

| Código | Nombre | Tipo | Stakeholders principales |
|---|---|---|---|
| RF1 | login | Ubicuo | Todos |
| RF2 | cierreSesion | Ubicuo | Conductor / Estudiante |
| RF3 | ubicaciónTiempoReal | Basado en estado | Estudiante |
| RF4 | notificaciones | Basado en estado | Estudiante / Conductor |
| RF5 | verRutas | Basado en estado | Estudiante |
| RF6 | administracionSistema | Ubicuo | Administrador |
| RF7 | gestionUsuarios | Ubicuo | Administrador / Estudiante |
| RF8 | actualizacionUbicacion | Basado en estado | Estudiante |
| RF9 | recorridoMapa | Basado en estado | Estudiante |
| RF10 | paraderos | Basado en estado | Estudiante |
| RF11 | tiempoLlegada | Basado en estado | Estudiante |
| RF12 | estadoBus | Basado en estado | Estudiante |
| RF13 | IdentificarBus | Ubicuo | Estudiante |
| RF14 | informacionBus | Basado en estado | Estudiante |
| RF15 | busesDisponibles | Basado en estado | Estudiante |

**Total: 15 requisitos funcionales**
- Ubicuos: RF1, RF2, RF6, RF7, RF13 (5)
- Basados en estado: RF3, RF4, RF5, RF8, RF9, RF10, RF11, RF12, RF14, RF15 (10)
