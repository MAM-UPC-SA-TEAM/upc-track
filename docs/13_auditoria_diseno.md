# Auditoría de diseño móvil — UpcTrack

> **Issue:** #23 (U01) · **Fecha:** 05-nov-2026 · **Alcance:** `frontend/` (app React + Vite), 14 pantallas de los 3 roles, pensada para PWA y APK (Capacitor).
> **Rama auditada:** `develop` en `2a4e6e3`. Este documento **no corrige nada**: diagnostica y reparte el trabajo entre U02–U10, M01 y M08.

## 1. Método y límites

**Qué se hizo.** La app se levantó completa (backend + MySQL de desarrollo + Vite) y se recorrieron 14 pantallas a **390×844 px**, con táctil emulado, en tema claro (y oscuro en 4 pantallas clave). Se midió en el DOM real —no a ojo— y se complementó con el detector estático de Impeccable y una lectura del CSS con la lente de Emil Kowalski (movimiento y sensación nativa). Las mediciones están en [`img/auditoria/medidas.json`](img/auditoria/medidas.json) y se repiten con [`scripts/dev/auditoria-movil.mjs`](../scripts/dev/auditoria-movil.mjs).

**Datos de prueba.** La BD de desarrollo traía 1 bus y 0 notificaciones; para auditar el mapa se dejó un bus «en recorrido» con una posición y 2 notificaciones, creados por la API. **Todo se revirtió** al terminar (0 notificaciones, 0 ubicaciones, bus inactivo, 3 usuarios).

**Lo que NO se probó (y por qué importa).**
- **Gestos táctiles reales** (arrastrar la hoja del conductor, zoom del mapa): un viewport emulado prueba *layout*, no el gesto. Requiere dispositivo físico (M11).
- **Teclado y lector de pantalla** (TalkBack/VoiceOver): solo se midió lo verificable en el DOM.
- **Contraste**: estimado sobre fondos planos; se omiten imágenes, degradados y el mapa. 350 textos evaluados.
- **Un solo ancho (390 px)**: no se barrieron 320 ni 768.
- **Crítica de diseño en un solo contexto.** Las observaciones visuales (§4) las hizo una sola pasada; no se ejecutó el protocolo de `critique` con dos sub-agentes aislados y snapshot.
- **Modo de la superficie: Operate** (herramienta de tarea). Ojo: `PRODUCT.md` describe solo la **landing** (modo Persuade), no la app; ver §7.

## 2. Puntuación

| # | Dimensión | Nota | Hallazgo clave |
|---|---|---|---|
| 1 | Accesibilidad | **2** | 8 inputs sin etiqueta asociada, botones solo-icono sin nombre, ningún `h1`, sin `prefers-reduced-motion`. A favor: alt completo, landmarks en 11/11, inputs de 16 px |
| 2 | Rendimiento | **2** | Bundle de 618 kB (184 kB gzip) con el aviso silenciado en 900 kB; 14 `transition: all`; solo la landing carga diferida |
| 3 | Tematización | **2** | 290 colores hexadecimales fijos (`#1e6b2e` ×77) y 10 custom properties; el verde de marca no pasa contraste en oscuro |
| 4 | Responsive | **2** | Desborde horizontal en 4/14 pantallas (hasta 308 px); objetivos < 44 px en 13/14; sin gestión de WebView |
| 5 | Integridad de implementación | **3** | Sistema coherente de componentes; detector con 5 avisos menores; identidad genérica y desconectada de la landing |
| | **Total** | **11/20** | **Aceptable — hace falta trabajo significativo** |

### Veredicto de integridad: pasa con reservas
La app expresa un sistema coherente (tarjetas, barra superior, chips, jerarquía clara) y el detector solo encuentra 5 avisos de estilo (3 bordes laterales de acento, 1 borde superior, Inter por defecto). No hay decoración vacía ni contenido engañoso. Las reservas son de sistema: sin tokens (§F-14), tres nombres de producto conviviendo (§F-17) y una identidad visual que no comparte nada con la landing, que ya tiene marca propia.

## 3. Resumen ejecutivo

- **19 hallazgos:** 0 P0 · **7 P1** · 9 P2 · 3 P3. No hay ninguno que impida por completo una tarea de estudiante o conductor; los P1 son los que rompen reglas AA o la confianza en el dato.
- **Lo más barato y de más valor:** una sola línea CSS (`.layout-main { min-width: 0 }`) elimina los cuatro desbordes (43, 308, 45 y 14 px → 0). **Verificado en el navegador**, aunque en las tablas del admin solo mueve el problema (ver F-02).
- **Lo más serio para el producto:** si el conductor recarga a mitad de ruta, los estudiantes siguen viendo «En recorrido» sin que nadie transmita (F-07).
- **Lo más extendido:** 77 de 159 controles interactivos miden menos de 44 px; la topbar —presente en 11 pantallas— falla en sus tres botones.
- **Contraste general bueno:** el 97,1 % de los textos evaluados pasa AA; los 10 fallos son localizables (F-06).

## 4. Hallazgos

Severidad: **P0** bloquea · **P1** dificultad significativa o fallo AA, corregir antes de entregar · **P2** molestia con alternativa · **P3** pulido. «Issue» indica dónde se resuelve.

### P1 — Mayor

#### F-01 · Desborde horizontal por un hijo flex sin `min-width: 0`
- **Dónde:** `components/shared/Layout.css` (`.layout-main`, hijo de `.layout { display: flex }`).
- **Evidencia:** `layout-main` mide 433/698/435/403 px en un viewport de 390. En **Inicio del estudiante** el avatar y las tarjetas quedan cortados por el borde derecho ([captura](img/auditoria/est-inicio.jpg)); en Usuarios el contenido llega a 698 px.
- **Causa:** `min-width: auto` en un ítem flex hace que crezca hasta el ancho mínimo de su contenido (tabla, mapa Leaflet) en vez de encogerse.
- **Prueba de la corrección:** inyectando `.layout-main{min-width:0}` el desborde pasa a **0 px en las 4 pantallas**.
- **Estándar:** WCAG 1.4.10 Reflow (AA).
- **Issue:** #25 (U03).

| Pantalla | Desborde | Con la corrección |
|---|---|---|
| Inicio (estudiante) | 43 px | 0 |
| Gestión de usuarios | 308 px | 0 |
| Gestión de buses | 45 px | 0 |
| Gestión de rutas | 14 px | 0 |

#### F-02 · Las tablas del administrador recortan Estado y Acciones en móvil
- **Dónde:** `pages/admin/Gestion*.jsx` y su CSS.
- **Evidencia:** tras la corrección de F-01 el contenedor de la tabla no hace scroll y **oculta** las columnas finales ([captura](img/auditoria/adm-usuarios-hipotesis.jpg)). Sin la corrección, «Agregar bus» y las acciones quedan cortados ([captura](img/auditoria/adm-buses.jpg)); el chip «En servicio» se parte en dos líneas.
- **Impacto:** el admin no puede editar ni eliminar desde el teléfono. Es una vista de uso mayormente de escritorio, por eso no es P0.
- **Recomendación:** mitigación inmediata con `overflow-x: auto` en el contenedor y `white-space: nowrap` en los chips; la conversión a tarjetas queda en el backlog futuro (antes U08).
- **Issue:** #25 (U03) para la mitigación.

#### F-03 · Objetivos táctiles por debajo de 44 px en 13 de 14 pantallas
- **Evidencia (77 de 159 controles):**

| Control | Tamaño | Pantallas |
|---|---|---|
| Botón de menú `topbar-menu-btn` | 41×40 | 11 |
| Tema / notificaciones `topbar-btn` | 40×36 | 11 |
| Editar/borrar `btn-accion` | 36×36 | 3 |
| Mostrar contraseña (`login-toggle-pass`, `reg-toggle-pass`) | 18–20×36 | 2 |
| «Agregar …» | 129–153×36 | 3 |
| Zoom de Leaflet | 30×30 | 1 |
| Marcadores del bus | 14×14 y 22×22 | 2 |
| Chip de ruta, cabecera del panel, «Ver en mapa» | 36–38 de alto | 3 |

- **Causa:** `index.css` fija `button { min-height: 36px }` bajo un comentario que dice «44×44». Además, 5 pantallas tienen algún control por debajo del mínimo AA de 24 px (los ojos de contraseña son 18 px de ancho).
- **Estándar:** WCAG 2.5.8 (24 px, AA) y 2.5.5 (44 px, AAA); guía de plataforma de 44–48 px.
- **Issue:** #25 (U03); marcadores y zoom en #26 (U05).

#### F-04 · Campos de formulario sin etiqueta asociada
- **Evidencia:** login 2, registro 5, buscador del mapa 1. Las etiquetas existen visualmente («Usuario», «Contraseña») pero no están ligadas con `for`/`id`, y el placeholder hace de única pista programática.
- **Impacto:** un lector de pantalla anuncia «campo de edición» sin decir cuál; tocar la etiqueta no enfoca el campo.
- **Estándar:** WCAG 1.3.1, 3.3.2 y 4.1.2.
- **Issue:** #28 (U07) para login/registro y #30 (U10) para el buscador.

#### F-05 · Botones solo-icono sin nombre accesible
- **Evidencia:** en las 11 pantallas logueadas, el botón de menú ☰ y los `btn-accion` no tienen texto, `aria-label` ni `title`. «Cambiar tema» y «Notificaciones» dependen solo de `title` (nombre débil). Los ojos de contraseña tampoco tienen nombre.
- **Estándar:** WCAG 4.1.2.
- **Issue:** #30 (U10).

#### F-06 · Contraste insuficiente: el verde de marca sobre oscuro y el pie de página
- **Evidencia (estimada):**

| Texto | Contraste | Mínimo |
|---|---|---|
| «Activo» en tema oscuro (18 px) | 2,54:1 | 3:1 |
| «Estudiante» en tema oscuro (16 px) | 2,85:1 | 4,5:1 |
| «1 buses en ruta» en tema oscuro (12 px) | 2,66:1 | 4,5:1 |
| «© Universidad Popular del Cesar…» en login y registro (12 px) | 2,85:1 | 4,5:1 |

- **Nota de verificación:** los botones «Detener» y «Finalizar» del conductor también salen con 2,08 y 2,31:1, pero están **deshabilitados** y WCAG los exime. Es un falso positivo del cálculo, aunque señala que el estado deshabilitado se ve como un pastel de otro color y no como «no disponible» (ver F-07).
- **Estándar:** WCAG 1.4.3.
- **Issue:** #24 (U02): hace falta una variante clara del verde para fondos oscuros.

#### F-07 · Conductor: el estado del bus y la transmisión del GPS pueden contradecirse
- **Dónde:** `pages/conductor/MiRecorrido.jsx` (líneas 37–38 y 62).
- **Evidencia:** el chip toma su valor del **servidor** (`setEstado(data.bus.estado)`), pero `enRecorrido` —que activa `watchPosition` y habilita «Detener/Finalizar»— arranca en `false` en local. Con el bus «en recorrido» en el servidor, la pantalla muestra el chip verde «En recorrido» y a la vez ofrece «Iniciar» ([captura](img/auditoria/cond-recorrido.jpg)).
- **Impacto:** si el conductor recarga la página, se cae la app o el teléfono se reinicia a mitad de ruta, los estudiantes siguen viendo el bus «en recorrido» con una posición cada vez más vieja, y el conductor cree que sigue transmitiendo. Daña la confianza en el dato, que es el valor del producto.
- **Recomendación:** distinguir en pantalla «estado del bus» de «este dispositivo está transmitiendo»; al montar con estado `en_recorrido`, ofrecer «Reanudar transmisión»; mostrar la antigüedad de la última posición.
- **Issue:** #27 (U06).

### P2 — Menor

#### F-08 · Sin respuesta al toque y hover pegajoso
- **Evidencia:** **0 reglas `:active`** en la app; hay **41 reglas `:hover` y ninguna dentro de `@media (hover: hover)`**. En un teléfono el `:hover` se queda aplicado tras tocar. `MiRecorrido.css:215–220` además levanta 1 px el botón principal del conductor en hover.
- **Impacto:** los botones no confirman que el toque se registró; el hover pegajoso deja controles «activados» a la vista.
- **Issue:** #25 (U03).

#### F-09 · `transition: all` y curvas genéricas
- **Evidencia:** 14 `transition: all` (p. ej. `Layout.css:84`); solo 1 `cubic-bezier` en toda la app (la hoja del conductor), el resto `ease` por defecto. La hoja del conductor anima `max-height` (`MiRecorrido.css:575`), una propiedad de layout.
- **Issue:** #24 (U02): definir curvas y duraciones como tokens.

#### F-10 · Ninguna regla `prefers-reduced-motion` en la app
- **Evidencia:** la app tiene 0 reglas; las que existen en el repo pertenecen a la landing. La app tiene `pulse-dot` (infinito), `spin`, `fadeDown`, `slideDown` y `toast-entrar`, todas sin alternativa.
- **Estándar:** WCAG 2.3.3 (AAA) y buena práctica de movimiento reducido.
- **Issue:** #30 (U10).

#### F-11 · Ninguna pantalla tiene `h1`
- **Evidencia:** 0 de 11 pantallas logueadas tienen `h1`; el título de página vive en un `h2` de la topbar. Los landmarks `main`, `nav` y `header` sí están (11/11).
- **Estándar:** WCAG 1.3.1 / 2.4.6.
- **Issue:** #30 (U10).

#### F-12 · CSS pensado para navegador, no para WebView/PWA instalada
- **Evidencia:** `100vh` ×9 frente a `100dvh` ×3; `env(safe-area-inset-*)` en **1** sitio; **0** `touch-action`, **0** `-webkit-tap-highlight-color`, **0** `user-select`. En Android WebView el toque dibuja el resaltado gris por defecto y en móvil el alto de `100vh` cambia con la barra de direcciones.
- **Issue:** #25 (U03).

#### F-13 · Texto de 10–11 px
- **Evidencia:** «MODO CONDUCTOR» (10 px), `notif-hace` (11 px), chip de ruta del mapa (11 px), atribución de Leaflet (11,25 px).
- **Issue:** #24 (U02): escala tipográfica con mínimo de 12 px.

#### F-14 · Sin sistema de tokens
- **Evidencia:** 290 colores hexadecimales fijos en las hojas de la app, `#1e6b2e` 77 veces; solo 10 custom properties definidas; variables huérfanas de la plantilla de Vite (`--border`, `--accent`, `--text-h`, `--social-bg`, `--shadow`); `App.css` está muerto (no se importa) y trae `.hero`; el tema depende solo de `body[data-tema]` y no respeta `prefers-color-scheme`.
- **Issue:** #24 (U02).

#### F-15 · Un solo bundle de 618 kB
- **Evidencia:** `index-*.js` pesa 617,6 kB (183,7 kB gzip) y `vite.config.js` sube `chunkSizeWarningLimit` a 900 para silenciar el aviso. Todas las pantallas se importan de forma estática en `App.jsx`; solo la landing es `lazy`. Pesa en el arranque de la PWA y en el APK.
- **Issue:** #31 (M01): dividir por ruta en el build nativo.

#### F-16 · Textos sin tilde en las notificaciones
- **Evidencia:** «**Informacion** — Centro - UPC», «Bus 1 **inicio** su recorrido» y «**finalizo**» (títulos en `Layout.jsx`; mensajes en `busController.js`).
- **Issue:** #29 (U09), con la corrección de una línea en el backend.

### P3 — Pulido

#### F-17 · Identidad: tres nombres, dos logos apilados y ningún parentesco con la landing
- **Evidencia:** «Sistema de Monitoreo de Rutas» (login/topbar), «BusUPCSA» (manifest) y «UpcTrack» (landing) conviven. El login apila el logo universitario y el de la app: ≈ 300 px antes del formulario ([captura](img/auditoria/login.jpg)). La landing usa verde `#2f8f2a` + amarillo; la app, `#1e6b2e` sin amarillo.
- **Issue:** #36 (M08) y #24 (U02), según D-21 y D-18.

#### F-18 · Avisos del detector
- 3 «side-tab» (borde lateral de 4 px): `Layout.css:96` (enlace activo), `Layout.css:596` (toast) y `Notificaciones.css:86`; 1 borde superior de 4 px en el panel del mapa (`MapaTiempoReal.css:277`); Inter como fuente por defecto, mientras la landing ya eligió Archivo + Instrument Sans.
- **Issue:** #24 (U02).

#### F-19 · Notificaciones: redundancia y estado de lectura
- **Evidencia:** la pantalla de notificaciones incluye el botón «Ver todas las notificaciones» ([captura](img/auditoria/est-notificaciones.jpg)); todas las tarjetas llevan el mismo borde verde, sin distinguir leídas de no leídas, aunque la insignia dice «2».
- **Issue:** #29 (U09).

## 5. Revisión de movimiento y sensación nativa (lente de Emil)

Criterio: ¿debe animarse?, ¿con qué curva y duración?, ¿solo `transform`/`opacity`?, ¿se siente bien al tacto? Frecuencia: la app se abre varias veces al día y los controles de la topbar se tocan decenas; por eso el movimiento debe ser corto y funcional.

| Antes (código actual) | Después | Por qué |
|---|---|---|
| `transition: all 0.2s;` en `Layout.css:84` (y 13 más) | `transition: background-color 160ms ease-out, opacity 160ms ease-out;` | Animar solo lo que cambia; `all` arrastra propiedades de layout y oculta regresiones |
| Ninguna regla `:active` en la app | `button:active { transform: scale(0.97); }` con `transition: transform 160ms ease-out` | El botón debe confirmar el toque al instante; hoy no hay respuesta |
| `.topbar-btn:hover { background: var(--borde); }` (`Layout.css:184`) | Mismo estilo dentro de `@media (hover: hover) and (pointer: fine)` | En táctil el hover se queda pegado tras tocar |
| `.conductor-btn:hover:not(:disabled) { transform: translateY(-1px); }` (`MiRecorrido.css:218`) | Quitar el levantamiento; usar `:active { scale(0.97) }` | El botón principal del conductor no debe moverse bajo el dedo |
| `@keyframes toast-entrar { from { transform: translateX(40px) } }` (`Layout.css:641`) en un toast que en móvil ocupa todo el ancho | Entrar desde abajo: `translateY(16px)` + `opacity`, con `transition` y `@starting-style`; salida más rápida que la entrada | Consistencia espacial (el toast vive abajo) y evita desbordar a lo ancho durante la animación |
| `transition: max-height 0.32s cubic-bezier(0.4,0,0.2,1)` en la hoja del conductor (`MiRecorrido.css:575`) | `transform: translateY(...)` con `cubic-bezier(0.32, 0.72, 0, 1)` a ~300 ms | `max-height` fuerza layout en cada fotograma; las hojas se animan con `transform` y la curva de cajón |
| `transition: transform 0.24s ease, …` en `.mapa-panel` (`MapaTiempoReal.css:171`) | `transition: transform 240ms cubic-bezier(0.23, 1, 0.32, 1), opacity 200ms ease-out;` | `ease` es débil; una curva *ease-out* fuerte se siente inmediata |
| `animation: pulse-dot 1.8s ease-in-out infinite;` (`Dashboard.css:190`) sin alternativa | Añadir `@media (prefers-reduced-motion: reduce) { animation: none }` conservando el color | El movimiento infinito necesita alternativa de movimiento reducido |
| `button:not(.conductor-log-dot) { min-height: 36px; }` bajo un comentario «44×44» (`index.css:67`) | `min-height: 44px;` | El código contradice su propio comentario |

**Qué está bien:** no hay ningún `ease-in` ni `scale(0)`; las duraciones están casi todas entre 150 y 240 ms; los `backdrop-filter` son de 8 px (acotados); las animaciones de entrada son sutiles.

## 6. Patrones sistémicos

1. **Valores sueltos en vez de tokens** (F-14, F-09, F-13, F-18): color, tamaño de texto, curva y duración se repiten literales en 16 hojas.
2. **Pensada para escritorio y adaptada a la fuerza** (F-01, F-02, F-03, F-12): sidebar con hamburguesa, tablas anchas y controles de 36 px. Es el trabajo de U03.
3. **Accesibilidad por defecto del navegador** (F-04, F-05, F-10, F-11): faltan nombres, etiquetas, `h1` y movimiento reducido; ningún caso es difícil, son muchos.
4. **El estado local y el del servidor no se reconcilian** (F-07): la causa es de datos, no de estilo.

## 7. Qué funciona (conservar y replicar)

- Jerarquía clara en tarjetas de resumen, listas y chips de estado; la pantalla de login es sobria y se completa sin zoom (`font-size` ≥ 16 px en todos los inputs).
- 97,1 % de los textos evaluados cumple AA; `alt` presente en todas las imágenes; `main`, `nav` y `header` en 11 de 11 pantallas.
- El tema oscuro funciona de forma estructural en todo el layout; solo falla el verde de marca (F-06).
- Mapa con ruta, paradas y bus legibles, buscador flotante y botón de acción alcanzable con el pulgar.
- Aviso de «sin conexión», indicador de actualización y `viewport-fit=cover` ya presentes.
- Motion contenido: sin `ease-in`, sin `scale(0)`, duraciones cortas.

## 8. Reparto de los hallazgos por issue

| Issue | Hallazgos |
|---|---|
| **#24 U02** Tokens, tema y fuentes | F-06, F-09, F-13, F-14, F-17, F-18 |
| **#25 U03** Navegación móvil y base táctil | F-01, F-02, F-03, F-08, F-12 |
| **#26 U05** Mapa móvil | F-03 (marcadores 14–22 px, zoom 30 px) |
| **#27 U06** Pantalla del conductor | F-07 |
| **#28 U07** Login, registro y estudiante | F-04 |
| **#29 U09** Estados de interfaz | F-16, F-19 |
| **#30 U10** Accesibilidad | F-04 (buscador), F-05, F-10, F-11 |
| **#31 M01** Frontend para Capacitor | F-15 |
| **#36 M08** Identidad nativa | F-17 |

Cada issue recibe una sección «Hallazgos de la auditoría» con sus tareas. El catálogo `scripts/github/issues.mjs` conserva el alcance original; el alcance vigente es el de los issues.

## 9. Acciones recomendadas (en orden)

1. **[P1] `$impeccable layout`** — `.layout-main { min-width: 0 }` y contenedores de tabla con scroll (F-01, F-02): una hora y elimina los desbordes.
2. **[P1] `$impeccable adapt`** — barra inferior, objetivos de 44 px, safe areas y `dvh` (F-03, F-12).
3. **[P1] `$impeccable harden`** — estado del conductor frente a la transmisión (F-07).
4. **[P1] `$impeccable colorize` + `$impeccable typeset`** — tokens, variante del verde para oscuro y escala tipográfica (F-06, F-13, F-14).
5. **[P1] `$impeccable clarify`** — etiquetas, nombres accesibles y textos con tilde (F-04, F-05, F-16).
6. **[P2] `$impeccable animate`** — `:active`, hover condicionado, curvas y movimiento reducido (F-08, F-09, F-10).
7. **[P2] `$impeccable optimize`** — división por rutas del bundle (F-15).
8. **`$impeccable polish`** — pasada final.

Repetir `node scripts/dev/auditoria-movil.mjs` tras los arreglos para comparar las cifras de este documento (desbordes, controles < 44 px, contraste, etiquetas).

## 10. Contexto de diseño pendiente

`PRODUCT.md` solo cubre la landing de la feria (modo Persuade) y la skill lo marca como obsoleto. La app es una herramienta de tarea (modo Operate) y no tiene contexto propio ni `DESIGN.md`. Conviene ejecutar `$impeccable init` para fijar usuarios, tono y principios de la app, y `$impeccable document` cuando existan los tokens de U02; sin ese contexto, U02–U07 corren el riesgo de heredar la identidad de la landing por defecto.
