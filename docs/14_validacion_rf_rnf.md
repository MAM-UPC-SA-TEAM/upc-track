# Validación de RF y RNF (Q02)

Fecha de ejecución: 18-nov-2026 · Responsable: equipo de desarrollo · Issue: #41 (Q02)

Este documento es la evidencia de las checklists [`checklist_validacion_rf.md`](checklist_validacion_rf.md) y [`checklist_validacion_rnf.md`](checklist_validacion_rnf.md).

## 1. Cómo se validó

La validación se hizo en tres frentes. Hay que leer cada resultado con su frente, porque no todo se pudo medir en la nube:

| Frente | Qué es | Qué cubre |
|---|---|---|
| **Réplica local** | Backend y frontend idénticos al desplegado, con una base PostgreSQL desechable (`docker-compose.e2e.yml`) y los usuarios demo. | Todo lo que exige iniciar sesión: login de los tres roles, tiempos de respuesta, GPS de punta a punta, notificaciones, concurrencia, roles y bloqueo por intentos fallidos. |
| **Nube, solo lectura** | Render (backend), Cloudflare (frontend) y Neon, sin escribir datos. | Estado, arranque en frío, latencia, CORS, Socket.IO y fallback de la SPA. |
| **Automatizado** | Playwright (20 pruebas e2e en Chromium), 379 pruebas de frontend y 277 de backend, auditoría móvil y axe-core. | Flujos de pantalla, accesibilidad y regresión. |

**Limitación declarada.** Producción no tiene los usuarios de demostración (`Admin123*`, por seguridad) y no se crearon usuarios de prueba en la base real para no escribir ni borrar datos de producción. Por eso los tiempos de los endpoints autenticados, la transmisión GPS y el bloqueo por intentos fallidos **no se midieron en la nube**; la guía de la sección 5 permite completarlo manualmente en unos 15 minutos.

## 2. Resumen

| | Cumple | Parcial | Pendiente de validación manual | Total |
|---|---|---|---|---|
| **RF** | 10 | 1 | 4 | 15 |
| **RNF** | 10 | 4 | 1 | 15 |

Todos los RF clasificados como *Must* del flujo principal (login, ubicación en tiempo real, notificaciones, rutas, administración, ETA, registro, buses) cumplen. Los pendientes son de **validación visual del mapa** y de pruebas en **dispositivo real** (#39).

## 3. Resultados por requisito funcional

| RF | Resultado | Evidencia |
|---|---|---|
| RF1 Login | **Cumple** | Los tres roles inician sesión (200) y reciben su rol; una contraseña incorrecta da 401 «Usuario o contraseña incorrectos». e2e: `acceso.spec.js` (login por rol, error, campos vacíos). |
| RF2 Cierre de sesión | **Cumple** | e2e: cerrar sesión devuelve al login y la sesión no sobrevive a recargar. El cierre por inactividad (30 min) se verificó con la prueba automatizada de `AuthContext` (temporizador simulado), no esperando 30 minutos reales. |
| RF3 Ubicación en tiempo real | **Cumple** | El conductor inicia el recorrido y el estudiante recibe `bus:location` por Socket.IO: 8 de 8 envíos recibidos. e2e: `tiempo-real.spec.js` (el bus aparece y desaparece en vivo). |
| RF4 Notificaciones | **Cumple** | Manuales: los tres tipos (retraso, cambio de ruta, info) llegan por socket y quedan en la lista del estudiante. Automática: con el bus detenido, la alerta «presenta retraso … (detención de 3 min)» llegó a los **191 s**. |
| RF5 Ver rutas | **Cumple** | e2e: las rutas con sus paradas y horarios salen de la base real y «abrir en el mapa» navega al mapa. |
| RF6 Administración | **Cumple** | Crear, editar y eliminar ruta y bus; los cambios se reflejan en la lista del estudiante; editar o eliminar algo inexistente da 404 (en las tres entidades). |
| RF7 Gestión de usuarios | **Cumple** | El admin lista, crea y cambia el rol; el estudiante recibe 403 en `/api/usuarios`, el conductor 403 al crear buses, un estudiante 403 al transmitir y sin token 401. e2e: alta y baja de usuarios. |
| RF8 Actualización de ubicación | **Parcial** | Se envía cada 4 s (intervalo medido entre eventos: 4,00 a 4,01 s) y el estudiante ve cambios continuos. La **pérdida y recuperación de red** se cubre con pruebas automatizadas (reconexión de salas, estado «reintentando»), pero no se probó con un teléfono real cortando la red: queda para #39. |
| RF9 Recorrido en mapa | **Pendiente** | Hay pruebas del mapa (`mapa-bus.test.jsx`), pero la comprobación visual de varias rutas a la vez y de cruces cercanos requiere revisión manual con buses transmitiendo. |
| RF10 Paraderos | **Pendiente** | Las paradas activas e inactivas se distinguen en la gestión de rutas (pruebas de admin); la diferencia visual en el mapa requiere revisión manual. |
| RF11 Tiempo estimado de llegada | **Cumple** | Con el bus acercándose a una parada, el ETA calculado con la lógica del cliente bajó de 7 a 4 min al pasar de 3,0 a 1,6 km. Prueba de pantalla: una velocidad nueva por socket actualiza el ETA. |
| RF12 Registro y estado del bus | **Cumple** | Registro con correo institucional (400 con otro dominio); la cuenta queda pendiente (login 403 «aún no está activa»), el admin la aprueba y entonces entra (200). El estado del bus (`en_recorrido`, `detenido`, `fuera_de_servicio`) cambia y se refleja. e2e: registro y aprobación. |
| RF13 Identificar bus | **Pendiente** | La placa de cada bus es única (restricción `UNIQUE` en la base); la ausencia de ambigüedad entre buses en el mapa requiere revisión manual. |
| RF14 Información del bus | **Pendiente** | La API entrega nombre, placa, ruta, conductor y estado; falta confirmar visualmente la ficha al seleccionar un bus en el mapa. |
| RF15 Buses disponibles | **Cumple** | e2e: la lista de buses refleja en vivo cuando el conductor inicia o finaliza el recorrido. |

## 4. Resultados por requisito no funcional

Las cifras de tiempo de la réplica local **no** incluyen la latencia de red ni el arranque en frío de la nube; las de la nube se indican aparte.

| RNF | Resultado | Evidencia |
|---|---|---|
| RNF1 Concurrencia | **Cumple** (local) | 13 sesiones de socket, 3 conductores transmitiendo en paralelo y 10 consultas simultáneas por ronda: 104 peticiones, **0 errores 5xx, 0 errores 4xx, 0 desconexiones**, 288 eventos entregados, máximo 60 ms. En la nube (Render free) no se probó. |
| RNF2 Tema claro/oscuro | **Cumple** | Pruebas automatizadas de tema y configuración (Claro, Oscuro y Automático, persistido). |
| RNF3 Disponibilidad 24/7 | **Parcial** | El endpoint `/api/health` responde (0,29 s con el servicio despierto) y hay plan de contingencia. Los planes gratuitos **no garantizan 24/7**: Render suspende a los 15 min (arranque en frío medido: **16,5 s**) y Neon a los 5. Se acepta como excepción documentada (riesgo R4 del charter v2). |
| RNF4 Identidad institucional | **Pendiente** | La paleta está definida en `DESIGN.md` y `styles/tokens.css`; la conformidad con la identidad institucional la valida el docente visualmente. |
| RNF5 Navegadores | **Parcial** | Flujo login → inicio → mapa verificado en **Chrome 157 y Edge 157** (mapa con 15 teselas, 0 errores de JavaScript). **Firefox y Safari no se probaron**: manual. |
| RNF6 Responsive | **Cumple** | Móvil 390 px y tablet 768 px (18 mediciones cada uno): 0 desbordes horizontales, 0 controles menores de 24 px, un `h1` por pantalla, texto mínimo de 12 px, 0 fallos de contraste en la app y 0 errores de consola. Escritorio (1280 px): flujo login → mapa en Chrome y Edge sin errores y los e2e de Playwright. |
| RNF7 Contraseña mínima de 8 | **Cumple** | El registro y el login con menos de 8 caracteres devuelven 400. |
| RNF8 Cierre por inactividad | **Cumple** | 30 minutos de inactividad cierran la sesión; verificado con prueba automatizada con temporizador simulado. |
| RNF9 Usabilidad | **Parcial** | Las tareas básicas (login, ver mapa, ver rutas) se completan sin ayuda en los e2e, y la navegación es consistente por rol. La usabilidad con usuarios reales y los mensajes de error se validan en las pruebas con la comunidad (#42, Q03). |
| RNF10 Confiabilidad de la información | **Cumple** | El estado del bus coincide entre conductor y estudiante (e2e de tiempo real), las notificaciones llegan con el evento real y el ETA cambia al mover el bus. Un dato viejo se anula con un sello en lugar de mostrarse vigente. |
| RNF11 Bloqueo por intentos fallidos | **Cumple** (local) | Se permiten 5 fallos por IP en 15 minutos y el 6.º da **429** con «Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.»; durante el bloqueo ni un login válido entra. La recuperación tras la ventana se verifica por configuración (`windowMs` de 15 min) y no esperando el tiempo real. |
| RNF12 Tiempo de respuesta < 3 s | **Parcial** | **Local** (medianas de 15 muestras): login 75 ms, rutas 3 ms, buses 3 ms, buses activos 4 ms, posiciones 3 ms. **Nube** (servicio despierto): health 0,29 s; login rechazado, que consulta Neon, 0,33 a 0,37 s; frontend 0,44 s. Los endpoints autenticados de la nube no se midieron (ver sección 1). Excepción declarada: el primer arranque en frío tarda ~17 s. |
| RNF13 Portabilidad | **Cumple** | El frontend en Cloudflare responde 200, las rutas de la SPA caen en `index.html` (200 en `/login`) y todo funciona desde el navegador sin instalar nada; el APK es opcional. |
| RNF14 Logo institucional | **Cumple** | Prueba automatizada del logo del Seccional en login y en el layout, también en modo oscuro. |
| RNF15 Mantenibilidad | **Cumple** | Separación en capas (rutas, controladores, servicios, modelos) documentada en el manual técnico; 656 pruebas automatizadas más 20 e2e y CI obligatorio: los cambios de los últimos PR no rompieron funcionalidad. |

### Medición de la propagación del GPS (RNF «3 a 4 s»)

Con un conductor transmitiendo cada 4 s: el evento llega al estudiante en **6 ms de mediana (máximo 7 ms)** en la réplica local, y el intervalo entre eventos es de 4,00 a 4,01 s, es decir, la cadencia la fija el conductor (cada ~4 s) y no la red. En la nube hay que sumar la latencia del móvil y de Render (~0,3 s por petición con el servicio despierto), por lo que la meta de negocio de **≤ 30 s** queda con amplio margen.

## 5. Hallazgos y decisiones

| # | Hallazgo | Decisión |
|---|---|---|
| 1 | **Producción aún no tiene `helmet` ni las dependencias corregidas.** Las cabeceras de la nube muestran `x-powered-by: Express` y no hay HSTS: Render despliega `main` y esos cambios (PR #156) están en `develop`. | Se resuelve con la release de `develop` a `main` (#45, Q07). Debe verificarse después con `curl -I`. |
| 2 | Un origen rechazado por CORS responde **500** en lugar de 403. No afecta a los navegadores (que lo bloquean igual). | **Resuelto en #20** (B05, errores centralizados): ahora responde 403 en JSON. |
| 3 | No garantiza 24/7 en planes gratuitos (RNF3) y el arranque en frío tarda ~17 s (RNF12). | **Excepción documentada** (riesgo R4 del charter v2): aviso «Despertando el servidor», reconexión automática y plan B local. Calentar el servicio antes de la sustentación. |
| 4 | RF9, RF10, RF13, RF14 y RNF4 necesitan revisión visual; RF8 y RNF5 necesitan dispositivo y navegadores reales. | Se ejecutan en #39 (M11, APK en dispositivos reales) y en las pruebas de #42 (Q03). |

No se encontró ningún requisito en estado «No cumple».

## 6. Guía para completar la validación manual en producción (~15 min)

Requiere una cuenta de administrador de producción; las cuentas de prueba se crean con `npm run db:usuario` en `backend/` y se eliminan al terminar.

1. Abrir `https://upc-track.onrender.com/api/health` y esperar el 200 (calienta el servicio).
2. Con las herramientas de desarrollo del navegador (pestaña *Network*), iniciar sesión con cada rol y anotar el tiempo de `login`, `rutas`, `buses/activos` y `todos-posicion`. Objetivo: menor a 3 s.
3. Con un teléfono (APK o navegador), iniciar un recorrido de conductor y comprobar en otro dispositivo, como estudiante, que el bus se mueve en el mapa y que su ficha muestra nombre, placa, ruta, conductor y estado (RF9, RF10, RF13, RF14).
4. Cortar y recuperar los datos móviles del conductor y confirmar que la transmisión se reanuda sola (RF8).
5. Abrir el flujo login → mapa en Firefox y, si es posible, en Safari (RNF5).
6. Revisar la paleta y el logo contra la identidad institucional (RNF4).
7. Tras la release a `main`, comprobar `curl -I https://upc-track.onrender.com/api/health`: deben aparecer `strict-transport-security` y desaparecer `x-powered-by`.
