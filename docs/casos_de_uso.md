# Casos de Uso del Sistema

**Autores:** Anabel Cadena Torres, Manuel David Castro Tocora, Mayra Yuliana Toro Pino  
**Fuente:** Entrevista  
**Versión:** 1.0 — 19/03/2026

---

## RF-01 · Login

| Campo | Detalle |
|-------|---------|
| **Versión** | 1.0 — 19/03/2026 |
| **Objetivo** | Permitir el acceso de los usuarios a la plataforma mediante autenticación. |
| **Descripción** | La aplicación web incluirá un login donde se requiere un nombre de usuario y una contraseña para validar el acceso al sistema. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Frecuencia esperada** | 30 usuarios / hora |

**Precondiciones**
- El estudiante debe estar previamente registrado en el sistema.
- El sistema debe estar disponible.

**Secuencia Normal**

| Paso | Acción |
|------|--------|
| 1 | El estudiante ingresa su nombre de usuario y contraseña en los campos de inicio de sesión. |
| 2 | El sistema valida que los campos no estén vacíos. |
| 3 | El sistema consulta la base de datos para verificar si las credenciales son correctas. |
| 4 | Si las credenciales son correctas, el sistema redirige al usuario a la página principal. |

**Postcondición:** El estudiante accede correctamente a la aplicación web y tiene acceso a las funcionalidades de la plataforma.

**Excepciones**

| Paso | Acción |
|------|--------|
| 1 | Si el usuario deja campos vacíos, el sistema muestra un mensaje de error indicando que debe diligenciar todos los campos. |
| 2 | Si el usuario ingresa credenciales incorrectas, el sistema muestra un mensaje de error. |
| 3 | Si el sistema no valida por problemas de red o base de datos, muestra un mensaje de error. |

**Rendimiento:** Validación de credenciales — máx. 3 segundos.

> **Comentario:** Se recomienda implementar medidas de seguridad como bloqueo temporal tras múltiples intentos fallidos.

---

## RF-02 · Cierre de Sesión

| Campo | Detalle |
|-------|---------|
| **Versión** | 1.0 — 19/03/2026 |
| **Objetivo** | Permitir al usuario salir del sistema de forma segura. |
| **Descripción** | El sistema debe permitir que el usuario cierre sesión de forma manual y también automáticamente después de un periodo de inactividad. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Frecuencia esperada** | 30 usuarios / hora |

**Precondiciones**
- El usuario debe haber iniciado sesión en el sistema.
- El sistema debe estar disponible.

**Secuencia Normal**

| Paso | Acción |
|------|--------|
| 1 | El usuario selecciona la opción de cerrar sesión. |
| 2 | El sistema finaliza la sesión del usuario. |
| 3 | El sistema redirige al usuario a la página de inicio. |

**Postcondición:** El usuario ha cerrado sesión y no tiene acceso a las funcionalidades del sistema.

**Excepciones**

| Paso | Acción |
|------|--------|
| 1 | Si ocurre un error al cerrar sesión, el sistema muestra un mensaje de error. |

**Rendimiento:** Cierre de sesión — máx. 3 segundos.

> **Comentario:** El sistema debe cerrar la sesión automáticamente después de un tiempo de inactividad.

---

## RF-03 · Ubicación en Tiempo Real

| Campo | Detalle |
|-------|---------|
| **Versión** | 1.0 — 19/03/2026 |
| **Objetivo** | Permitir que los estudiantes consulten la ubicación en tiempo real de los buses universitarios. |
| **Descripción** | El sistema debe mostrar en un mapa la ubicación actual de los buses activos. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Frecuencia esperada** | 30 usuarios / hora |

**Precondiciones**
- El estudiante debe tener la sesión iniciada.
- El sistema debe estar disponible.

**Secuencia Normal**

| Paso | Acción |
|------|--------|
| 1 | El estudiante accede al módulo de mapa en la aplicación. |
| 2 | El sistema muestra la ubicación del bus. |
| 3 | El sistema actualiza la ubicación automáticamente. |

**Postcondición:** El estudiante puede ver la ubicación actual de los buses en el mapa con trazabilidad del recorrido.

**Excepciones**

| Paso | Acción |
|------|--------|
| 1 | Si no hay conexión, el sistema muestra un mensaje de error. |
| 2 | Si no hay buses activos en ese momento, el sistema informa al estudiante. |

**Rendimiento:** Actualización de posición GPS — cada 3–4 segundos.

> **Comentario:** La actualización de ubicación debe realizarse cada 3 o 4 segundos según lo indicado por el stakeholder.

---

## RF-04 · Notificaciones de Cambios en Rutas o Retrasos

| Campo | Detalle |
|-------|---------|
| **Versión** | 1.0 — 19/03/2026 |
| **Objetivo** | Permitir que el conductor envíe notificaciones a los estudiantes sobre cambios en las rutas o retrasos. |
| **Descripción** | El sistema debe enviar notificaciones a los usuarios cuando se registre un cambio en la ruta de un bus o se detecte un retraso en el servicio. |
| **Importancia** | Importante |
| **Urgencia** | Hay presión |
| **Frecuencia esperada** | Variable |

**Precondiciones**
- El conductor ha iniciado sesión en el sistema.
- El sistema está disponible.

**Secuencia Normal**

| Paso | Acción |
|------|--------|
| 1 | El conductor registra un cambio de ruta o el sistema detecta un retraso. |
| 2 | El sistema genera una notificación con el detalle del cambio. |
| 3 | El sistema identifica los usuarios que utilizan la ruta afectada. |
| 4 | El sistema envía la notificación a los estudiantes correspondientes. |
| 5 | El estudiante recibe y visualiza la notificación en la aplicación. |

**Postcondición:** Los estudiantes afectados quedan notificados del cambio o retraso en su ruta.

**Excepciones**

| Paso | Acción |
|------|--------|
| 1 | Si el mensaje está vacío, el sistema muestra un error. |
| 2 | Si ocurre un error en el envío, el sistema informa al conductor. |

**Rendimiento:** Envío de notificación — máx. 5 segundos desde el registro del cambio.

> **Comentario:** Las notificaciones deben especificar la ruta afectada y el detalle del cambio.

---

## RF-05 · Ver Rutas Disponibles

| Campo | Detalle |
|-------|---------|
| **Versión** | 1.0 — 19/03/2026 |
| **Objetivo** | Permitir que los estudiantes consulten las rutas disponibles antes de utilizar el servicio de buses. |
| **Descripción** | El sistema debe mostrar al estudiante el listado de rutas de buses disponibles para que pueda escoger la mejor opción de transporte. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Frecuencia esperada** | 30 usuarios / hora |

**Precondiciones**
- El estudiante debe tener sesión activa.
- Deben existir rutas registradas en el sistema.

**Secuencia Normal**

| Paso | Acción |
|------|--------|
| 1 | El estudiante accede al módulo de rutas en la aplicación. |
| 2 | El sistema recupera la lista de rutas disponibles. |
| 3 | El sistema muestra la lista de rutas con su nombre y puntos de recorrido. |
| 4 | El sistema muestra el recorrido completo de la ruta seleccionada en el mapa. |

**Postcondición:** El estudiante puede visualizar y comparar las rutas disponibles para planificar su viaje.

**Excepciones**

| Paso | Acción |
|------|--------|
| 1 | Si no hay rutas registradas, el sistema informa al estudiante. |
| 2 | Si una ruta está temporalmente suspendida, el sistema la marca como no disponible. |

**Rendimiento:** Carga de lista de rutas — máx. 3 segundos.

> **Comentario:** Las rutas deben mostrarse visualmente en el mapa para facilitar la selección del estudiante.

---

## RF-06 · Administrar el Sistema

| Campo | Detalle |
|-------|---------|
| **Versión** | 1.0 — 19/03/2026 |
| **Objetivo** | Permitir al administrador gestionar y configurar la información del sistema, incluyendo buses y rutas. |
| **Descripción** | El sistema debe permitir que el administrador gestione la configuración, y agregue, modifique o elimine información de buses y rutas. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Frecuencia esperada** | 2 usuarios / hora |

**Precondiciones**
- El usuario debe tener rol de administrador y sesión activa.

**Secuencia Normal**

| Paso | Acción |
|------|--------|
| 1 | El administrador accede al panel de administración del sistema. |
| 2 | El administrador selecciona la sección que desea administrar. |
| 3 | El administrador realiza los cambios necesarios y confirma. |
| 4 | El sistema guarda los cambios y los refleja en tiempo real para todos los usuarios. |

**Postcondición:** Los cambios realizados por el administrador quedan guardados y se reflejan en el sistema.

**Excepciones**

| Paso | Acción |
|------|--------|
| 1 | Si ocurre un error al guardar, el sistema informa al administrador. |
| 2 | Si los datos ingresados son inválidos, el sistema muestra mensajes de error descriptivos. |

**Rendimiento:** Guardado de cambios — máx. 3 segundos · Carga del panel — máx. 4 segundos.

> **Comentario:** Solo usuarios con rol de administrador pueden acceder a este módulo.

---

## RF-07 · Gestión de Usuarios

| Campo | Detalle |
|-------|---------|
| **Versión** | 1.0 — 19/03/2026 |
| **Objetivo** | Permitir al sistema gestionar distintos tipos de usuario según su rol. |
| **Descripción** | El sistema debe gestionar los roles de usuario (administrador, estudiante, conductor) garantizando que cada uno acceda solo a las funciones que le corresponden. |
| **Importancia** | Importante |
| **Urgencia** | Hay presión |
| **Frecuencia esperada** | 3 usuarios / hora |

**Precondiciones**
- El administrador debe tener sesión activa.
- Deben existir roles configurados en el sistema.

**Secuencia Normal**

| Paso | Acción |
|------|--------|
| 1 | El administrador accede al módulo de gestión de usuarios. |
| 2 | El sistema muestra los tipos de usuarios disponibles. |
| 3 | El administrador selecciona un usuario para asignar o modificar su rol. |
| 4 | El administrador asigna el rol correspondiente y confirma. |
| 5 | El sistema actualiza los permisos del usuario según el nuevo rol asignado. |

**Postcondición:** Los usuarios quedan registrados o actualizados con el rol correspondiente dentro del sistema.

**Excepciones**

| Paso | Acción |
|------|--------|
| 1 | Si los datos ingresados son incorrectos, el sistema muestra un mensaje de error. |
| 2 | Si ocurre un error al guardar, el sistema informa al administrador. |

**Rendimiento:** Actualización de rol — máx. 3 segundos.

> **Comentario:** Cada rol debe tener permisos claramente definidos.

---

## RF-08 · Actualización de Ubicación

| Campo | Detalle |
|-------|---------|
| **Versión** | 1.0 — 19/03/2026 |
| **Objetivo** | Mantener actualizada la posición de los buses en tiempo real. |
| **Descripción** | El sistema debe realizar la actualización periódica de la posición de cada bus activo y reflejarla en el mapa de la aplicación. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Frecuencia esperada** | Continua durante todo el tiempo de operación de los buses |

**Precondiciones**
- El conductor ha iniciado sesión en el sistema.
- El sistema está disponible.
- El servicio de ubicación está activo.

**Secuencia Normal**

| Paso | Acción |
|------|--------|
| 1 | El conductor inicia el recorrido. |
| 2 | El sistema obtiene la ubicación del bus. |
| 3 | El servidor procesa las nuevas coordenadas y actualiza la base de datos. |
| 4 | El mapa de los usuarios se actualiza mostrando la posición actual del bus. |
| 5 | El proceso se repite automáticamente en intervalos de tiempo definidos. |

**Postcondición:** La ubicación del bus se mantiene actualizada en el sistema.

**Excepciones**

| Paso | Acción |
|------|--------|
| 1 | Si no hay señal GPS, el sistema muestra un mensaje de error. |
| 2 | Si ocurre un fallo en la actualización, el sistema informa al usuario. |

**Rendimiento:** Ciclo de actualización de ubicación — cada 3–4 segundos.

> **Comentario:** El intervalo de 3–4 segundos fue definido por el stakeholder en la entrevista. Este parámetro debe ser configurable.

---

## RF-09 · Recorrido en el Mapa

| Campo | Detalle |
|-------|---------|
| **Versión** | 1.0 — 19/03/2026 |
| **Objetivo** | Mostrar en el mapa el recorrido completo que realiza cada bus para que el usuario identifique su trayectoria. |
| **Descripción** | El sistema debe mostrar en el mapa el recorrido completo de un bus específico, permitiendo al usuario identificar la trayectoria que ha tenido y tendrá el autobús. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Frecuencia esperada** | 40 usuarios / hora |

**Precondiciones**
- El usuario debe tener sesión activa.
- El bus debe estar en operación o tener historial de recorrido.

**Secuencia Normal**

| Paso | Acción |
|------|--------|
| 1 | El estudiante accede al módulo de mapa. |
| 2 | El sistema muestra la ruta del bus en el mapa. |
| 3 | El usuario visualiza toda la trayectoria y la posición del bus en ella. |

**Postcondición:** El estudiante visualiza el recorrido completo del bus en el mapa.

**Excepciones**

| Paso | Acción |
|------|--------|
| 1 | Si el bus no tiene ruta asignada, el sistema muestra solo su posición actual. |
| 2 | Si el mapa no carga, el sistema muestra un mensaje de error. |

**Rendimiento:** Dibujo del recorrido en mapa — máx. 3 segundos.

> **Comentario:** El recorrido debe ser claro y fácil de interpretar para el usuario.

---

## RF-10 · Puntos de Parada

| Campo | Detalle |
|-------|---------|
| **Versión** | 1.0 — 19/03/2026 |
| **Objetivo** | Indicar en el mapa los puntos donde los estudiantes pueden abordar o descender del bus. |
| **Descripción** | El sistema debe mostrar en el mapa los paraderos o puntos de parada disponibles en las rutas. |
| **Importancia** | Importante |
| **Urgencia** | Hay presión |
| **Frecuencia esperada** | 35 usuarios / hora |

**Precondiciones**
- El usuario debe tener sesión activa.
- Los paraderos deben estar registrados en el sistema.

**Secuencia Normal**

| Paso | Acción |
|------|--------|
| 1 | El estudiante accede al mapa. |
| 2 | El sistema recupera los puntos de parada asociados a la ruta. |
| 3 | El estudiante visualiza los puntos disponibles para abordar el bus. |

**Postcondición:** El estudiante puede identificar visualmente los lugares donde puede abordar o descender del bus.

**Excepciones**

| Paso | Acción |
|------|--------|
| 1 | Si un paradero está temporalmente inhabilitado, el sistema lo muestra diferenciado como inactivo. |
| 2 | Si no hay paraderos registrados para una ruta, el sistema informa al usuario. |

**Rendimiento:** Carga de paraderos en mapa — máx. 3 segundos.

> **Comentario:** Los paraderos deben estar claramente diferenciados en el mapa.

---

## RF-11 · Tiempo Estimado de Llegada

| Campo | Detalle |
|-------|---------|
| **Versión** | 1.0 — 19/03/2026 |
| **Objetivo** | Reducir el tiempo de espera de los estudiantes mostrando el tiempo estimado de llegada del bus a cada paradero. |
| **Descripción** | El sistema debe calcular y mostrar el tiempo estimado de llegada del bus a un paradero específico. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Frecuencia esperada** | 40 usuarios / hora |

**Precondiciones**
- El usuario debe tener sesión activa.
- La ubicación del bus está activa.

**Secuencia Normal**

| Paso | Acción |
|------|--------|
| 1 | El estudiante selecciona un paradero en el mapa. |
| 2 | El sistema identifica los buses que se dirigen a ese paradero. |
| 3 | El sistema calcula el tiempo estimado de llegada. |
| 4 | El tiempo se actualiza automáticamente con cada actualización de posición del bus. |

**Postcondición:** El estudiante puede planificar su llegada al paradero conociendo el tiempo estimado de llegada del bus.

**Excepciones**

| Paso | Acción |
|------|--------|
| 1 | Si el bus está fuera de servicio, el sistema indica que no hay estimación disponible. |
| 2 | Si la estimación supera 30 minutos, el sistema lo indica claramente al estudiante. |

**Rendimiento:** Cálculo y despliegue del tiempo estimado — máx. 3 segundos.

> **Comentario:** El tiempo estimado puede variar dependiendo del tráfico o condiciones del recorrido.

---

## RF-12 · Mostrar Estado del Bus

| Campo | Detalle |
|-------|---------|
| **Versión** | 1.0 — 19/03/2026 |
| **Objetivo** | Informar al usuario sobre el estado operativo actual de cada bus: en recorrido, detenido o fuera de servicio. |
| **Descripción** | El sistema debe mostrar el estado del bus para clarificar la disponibilidad que tiene dentro de la ruta en cada momento. |
| **Importancia** | Importante |
| **Urgencia** | Hay presión |
| **Frecuencia esperada** | 40 usuarios / hora |

**Precondiciones**
- El usuario debe tener sesión activa.
- El bus debe estar registrado en el sistema.

**Secuencia Normal**

| Paso | Acción |
|------|--------|
| 1 | El usuario selecciona un bus en el mapa o en la lista de buses. |
| 2 | El sistema obtiene el estado del bus: En recorrido, Detenido o Fuera de servicio. |
| 3 | El sistema muestra el estado del bus al usuario. |

**Postcondición:** El usuario puede conocer la disponibilidad y estado operativo del bus seleccionado.

**Excepciones**

| Paso | Acción |
|------|--------|
| 1 | Si el bus pierde conexión GPS, el sistema marca su estado como Sin señal. |
| 2 | Si el conductor marca manualmente el bus como fuera de servicio, el estado se actualiza de inmediato. |

**Rendimiento:** Actualización de estado — cada 3–4 segundos.

> **Comentario:** El estado del bus debe actualizarse constantemente para brindar información confiable.

---

## RF-13 · Identificar Bus

| Campo | Detalle |
|-------|---------|
| **Versión** | 1.0 — 19/03/2026 |
| **Objetivo** | Permitir la identificación individual de cada bus mediante un número o nombre único dentro de la aplicación. |
| **Descripción** | El sistema debe permitir identificar cada bus por su número o nombre para saber qué recorrido va a realizar o está realizando. |
| **Importancia** | Importante |
| **Urgencia** | Hay presión |
| **Frecuencia esperada** | 30 usuarios / hora |

**Precondiciones**
- El administrador debe haber registrado el bus con su identificador.
- El usuario debe tener sesión activa.

**Secuencia Normal**

| Paso | Acción |
|------|--------|
| 1 | El administrador registra el bus con su número o nombre identificador único. |
| 2 | El sistema asigna el identificador al bus y lo asocia con su ruta. |
| 3 | El usuario visualiza los buses en el mapa con su identificador visible. |
| 4 | El sistema muestra el bus encontrado y lo resalta en el mapa. |

**Postcondición:** Cada bus es identificable de forma única en la aplicación mediante su número o nombre asignado.

**Excepciones**

| Paso | Acción |
|------|--------|
| 1 | Si se intenta registrar un identificador duplicado, el sistema rechaza el registro e informa al administrador. |
| 2 | Si el bus buscado no existe, el sistema informa al usuario. |

**Rendimiento:** Búsqueda de bus por identificador — máx. 3 segundos.

> **Comentario:** La identificación debe ser clara para evitar confusión entre los buses.

---

## RF-14 · Información Básica del Bus

| Campo | Detalle |
|-------|---------|
| **Versión** | 1.0 — 19/03/2026 |
| **Objetivo** | Permitir que los usuarios consulten la información básica de un bus al seleccionarlo en el mapa. |
| **Descripción** | El sistema debe mostrar la información básica del autobús al seleccionarlo en el mapa, permitiendo identificarlo dentro de la ruta escolar. |
| **Importancia** | Importante |
| **Urgencia** | Hay presión |
| **Frecuencia esperada** | 30 usuarios / hora |

**Precondiciones**
- El usuario debe tener sesión activa.
- El bus debe estar registrado y visible en el mapa.

**Secuencia Normal**

| Paso | Acción |
|------|--------|
| 1 | El usuario hace clic o toca el ícono de un bus en el mapa. |
| 2 | El sistema recupera la información básica del bus seleccionado. |
| 3 | El sistema muestra una tarjeta informativa con: número o nombre del bus, ruta asignada, estado actual y conductor. |

**Postcondición:** El usuario puede identificar el bus seleccionado con su información básica y tomar decisiones informadas.

**Excepciones**

| Paso | Acción |
|------|--------|
| 1 | Si la información del bus está incompleta, el sistema muestra solo los campos disponibles. |
| 2 | Si el bus fue dado de baja, el sistema informa que ya no está en servicio. |

**Rendimiento:** Carga de información del bus — máx. 3 segundos.

> **Comentario:** La información mostrada debe ser clara y relevante para el usuario.

---

## RF-15 · Buses Disponibles

| Campo | Detalle |
|-------|---------|
| **Versión** | 1.0 — 19/03/2026 |
| **Objetivo** | Mostrar en tiempo real los buses que están disponibles y operativos para evitar esperas innecesarias. |
| **Descripción** | El sistema debe mostrar los buses disponibles en cada momento para que el estudiante pueda planificar su viaje sin esperar un servicio que no está operativo. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Frecuencia esperada** | 50 usuarios / hora |

**Precondiciones**
- El usuario debe tener sesión activa.
- Deben existir buses registrados en el sistema.

**Secuencia Normal**

| Paso | Acción |
|------|--------|
| 1 | El estudiante accede al módulo de buses disponibles en la aplicación. |
| 2 | El sistema consulta el estado actual de los buses registrados. |
| 3 | El estudiante visualiza la lista con nombre, ruta, estado y tiempo estimado de llegada. |
| 4 | El sistema actualiza la lista periódicamente con cada ciclo de actualización. |

**Postcondición:** El estudiante puede identificar cuáles buses están disponibles y planificar su viaje sin esperas innecesarias.

**Excepciones**

| Paso | Acción |
|------|--------|
| 1 | Si no hay buses disponibles, el sistema informa al estudiante y sugiere consultar más tarde. |
| 2 | Si un bus sale de servicio mientras el usuario consulta la lista, el sistema lo actualiza automáticamente. |

**Rendimiento:** Carga de lista — máx. 3 segundos · Actualización de disponibilidad — cada 3–4 segundos.

> **Comentario:** La lista debe mostrar solo buses activos.
