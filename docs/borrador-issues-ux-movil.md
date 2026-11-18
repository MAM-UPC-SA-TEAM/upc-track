# Borrador de issues: experiencia móvil (apuntes del 16-nov-2026)

Estado: **borrador, nada publicado en GitHub.** Numeración `[U11]` en adelante (el último U existente es U10). Ningún issue duplica los abiertos (U02–U10, A01, #74); donde hay solape se indica.

Cada issue sigue el flujo de `CONTRIBUTING.md`: una rama `feature/<issue>-<tema>`, un PR a `develop`, CI en verde.

Severidad: P0 bloquea el uso · P1 error visible · P2 inconsistencia · P3 pulido.

---

## Resumen de la auditoría dirigida (solo lectura, código)

Superficies revisadas: admin, login/acceso, menú de perfil, inicio, buses, mapa, nav y Mi recorrido. No se ejecutó la app ni se midió en un dispositivo: lo marcado «por verificar» se debe confirmar al renderizar.

Lo que ya está bien y se conserva: diálogo nativo `<dialog>` en admin, estados de carga/vacío/error comunes, tokens claro/oscuro, tooltips del mapa legibles en ambos temas, botones táctiles de 44 px en el diálogo.

Hallazgos que **no estaban en tus apuntes**:
- El conductor no puede abrir Alertas ni Perfil sin cerrar su recorrido (ver E1): es la causa de tu apunte «el bus se va el servicio».
- Los enlaces «Ver rutas» y «Ver buses» del inicio duplican el nav y el botón «Ver rutas y horarios» del talón.
- `Buses` es solo escritorio en el nav móvil (`soloEscritorio: true`), de ahí que «ver buses» sea una pantalla huérfana en móvil.
- Una regla de `DESIGN.md` («el rojo es solo para el dato vencido») choca con tu petición de un aviso rojo en el login (ver D1).

---

# Parte 1. Errores lógicos (se pueden corregir sin decidir nada)

## [U11] Conductor: no cerrar el recorrido al abrir Alertas o Perfil — P0
**Apunte:** «el bus se está yendo el servicio al moverme a notificaciones o perfil».
**Causa (verificada):** `pages/conductor/MiRecorrido.jsx:149-155` envía `PATCH /estado {inactivo}` cuando el componente se desmonta. El nav del conductor (`Layout.jsx:94-98`) solo tiene Mi recorrido, Alertas y Perfil, así que cualquier otra pestaña desmonta la pantalla y apaga el bus.
**Descripción:** el recorrido debe sobrevivir a la navegación interna. Subir el watch de posición y el estado del recorrido a un contexto (o a un nivel por encima de las rutas) y cerrar el bus solo al finalizar, al cerrar sesión o al cerrar la app.
**Criterios de aceptación**
- Con un recorrido en curso, ir a Alertas o Perfil y volver no cambia el estado del bus ni interrumpe el envío de posición.
- Los estudiantes siguen viendo el bus en el mapa durante esa navegación.
- Cerrar sesión o «Finalizar» sí cierra el recorrido; cerrar la pestaña mantiene el comportamiento actual (el bus caduca por antigüedad).
- Prueba funcional que navega fuera y dentro de Mi recorrido y comprueba que no se llama `PATCH inactivo`.
**Relación:** toca #74 (M12, permiso de ubicación) y U06; coordinar para no pisarse en `MiRecorrido.jsx`.

## [U12] «Ver bus» abre la ruta del bus elegido — P1
**Apunte:** «los buses en ver buses: mal redireccionamiento; con otro bus tiene error, no manda a su propia ruta».
**Causa (verificada):** `Buses.jsx` enlaza a `/mapa?bus=ID` sin ruta. `MapaTiempoReal.jsx:144-157` carga la primera ruta activa con bus y luego selecciona el bus; si el bus es de otra ruta, el filtro `busesDeRuta` (línea 310) lo oculta.
**Criterios de aceptación**
- `/mapa?bus=ID` selecciona la ruta de ese bus, encuadra la ruta y deja el bus seleccionado y visible.
- Con dos rutas activas, tocar un bus de la segunda ruta abre la segunda ruta.
- Si el bus ya no está activo, se muestra el mapa normal con un aviso, sin error.
- Prueba funcional con dos buses de rutas distintas.

## [U13] Admin: el formulario no se pierde al tocar fuera — P1
**Apunte:** «si toco a un lado se cierra todo y no se guarda lo que hice».
**Causa (verificada):** `components/admin/DialogoForm.jsx:33` cierra el diálogo con cualquier clic en el fondo, y el estado del formulario se descarta al desmontar.
**Criterios de aceptación**
- Tocar el fondo o pulsar Esc con cambios sin guardar no cierra el diálogo directamente: pide confirmar el descarte (o simplemente no lo cierra).
- Sin cambios, cerrar sigue siendo inmediato.
- Los botones «Cancelar» y «✕» conservan su función.
- Vale para usuarios, buses, rutas y paradas; la confirmación de eliminar queda como está.
**Opciones y recomendación:** (a) ignorar el clic en el fondo, (b) confirmar solo si hay cambios. Recomiendo **(b)**: no estorba cuando no hay nada que perder.

## [U14] Controles de zoom del mapa sobre el menú de perfil — P2 (por verificar)
**Apunte:** «las barritas de zoom están superpuestas al abrir el pop de perfil».
**Hipótesis:** los controles de Leaflet (z-index 800–1000) quedan por encima de `.topbar-panel` en el mapa. Confirmar en pantalla.
**Criterios de aceptación**
- Con el menú de perfil o el de notificaciones abierto sobre el mapa, ningún control de Leaflet lo tapa, en 360 px y 412 px.
- Misma comprobación en tema oscuro.
- Los z-index quedan como tokens, no como números sueltos.

## [U15] El indicador «Validado · hace Xs» no debe reiniciarse sin motivo — P2 (por verificar)
**Apunte:** «revisar por qué muestra el cronómetro de validado en el bus y se reinicia».
**Hipótesis:** `TalonETA.jsx:64` usa `key={recibidoEn}` en la franja, de modo que cada actualización la reconstruye; y `Dashboard.jsx` recalcula la edad como edad del servidor + tiempo local desde `recibidoEn`, que se reinicia en cada refresco aunque la posición del bus no haya cambiado.
**Criterios de aceptación**
- El contador solo se reinicia cuando llega una posición **nueva** del bus, no en cada sondeo.
- Sin parpadeo ni salto visible entre «hace 3 s» y «hace 0 s» sin dato nuevo.
- Prueba con un bus detenido: la edad crece de forma continua.
**Relación:** depende de D6 (frecuencia de actualización).

## [U16] Mapa: marcador del bus como ícono de bus, no como punto — P2
**Apunte:** «que salga icono del bus y no un puntico».
**Causa:** `.mk-bus` en `styles/mapa.css:7` es un cuadro de color plano; el inicio usa el mismo ícono.
**Criterios de aceptación**
- El bus se dibuja con un glifo de bus reconocible, legible a 28–44 px, sobre el papel claro y oscuro.
- El estado «sin señal» (hueco, discontinuo) sigue distinguiéndose.
- Mismo marcador en mapa, inicio y detalle de ruta.
- Área táctil de 44 px, sin tapar la parada cercana.

## [U17] Alertas de aviso: del amarillo a un verde suave — P2
**Apunte (dos veces):** «alerta de inicio en recorrido, cambiar el tono del amarillo» y «cambiar el amarillo de la alerta por un tono verde suavecito».
**Alcance:** `.aviso` (`Talon.css:143`), avisos del conductor (`Layout.css:188-208`) y `pwa-banner--update`. El amarillo se mantiene como franja de marca.
**Criterios de aceptación**
- Fondo verde suave como token nuevo en `tokens.css` (claro y oscuro), con contraste ≥ 4,5:1 del texto.
- Un aviso de «retraso» sigue distinguiéndose de un aviso informativo (no depender solo del color: ícono y rótulo).
- Cambiar `DESIGN.md` en la sección de componentes para reflejarlo.
**Ojo:** verde = «todo bien» en la lógica del producto. Un retraso en verde puede leerse como buena noticia; ver D2.

## [U18] Modo oscuro: logos sin bloque blanco — P2
**Apunte:** «en modo oscuro no me gusta que se vean tanto los logos con ese fondo blanco».
**Causa:** `Acceso.css:113-114` pone `background: #fbfaf4` bajo el logo de la UPC por falta de versión para fondo oscuro.
**Criterios de aceptación**
- En oscuro, el logo de la UPC (y el del Seccional, ver U22) se ve integrado: sin recuadro de papel, o con una variante clara del logo.
- Sin pérdida de legibilidad ni de proporciones.
**Depende de** D4 (versión del logo).

## [U19] El mapa no se oscurece con el tema oscuro — P2
**Apunte:** «mapa que no se ponga oscuro».
**Causa:** `styles/mapa.css:58` invierte las teselas en oscuro.
**Criterios de aceptación**
- Las teselas conservan el tratamiento «calmo» claro en ambos temas.
- La ruta, las paradas, el bus y los tooltips mantienen contraste ≥ 3:1 sobre el mapa claro (ya usan tinta/papel fijos).
- Mapa del inicio y mapa en tiempo real iguales.
- Revisar que un mapa claro dentro de una pantalla oscura no deslumbre: añadir un borde o marco de la hoja.
**Decisión pequeña (D7):** si prefieres que el mapa siga el tema pero menos oscuro, es una variante. Por defecto aplico tu apunte tal cual.

---

# Parte 2. Cambios de diseño o de producto con decisión pendiente

Cada uno tiene **opciones y una recomendación**. Márcame cuál eliges y creo el issue definitivo. Hasta entonces el issue lleva solo el alcance.

## D1 → [U20] Aviso de error del login más visible
**Apunte:** «advertencia en otro color al momento del login, como un rojo, para que sea más perceptible».
**Conflicto:** `DESIGN.md` y `Acceso.css:2` dicen «el rojo es solo para el dato vencido». Hoy el error es una caja de tinta con ícono.
| Opción | Efecto |
|---|---|
| A. Rojo `--sello` en el error de credenciales | Más visible; rompe la regla «rojo = dato vencido». |
| B. Mantener la caja de tinta y reforzarla: borde grueso, ícono, `role="alert"`, foco al error | Respeta DESIGN.md. |
| C. Rojo solo en errores de formulario (login/registro), no en datos | Cambia la regla a «rojo = algo está mal», coherente y simple. |
**Recomendación: C.** Actualizando `DESIGN.md`, el rojo sigue siendo «algo falló» y no solo «dato vencido». Con sol directo, el rojo es mucho más perceptible que una caja de tinta.
**Criterios de aceptación (con C):** error visible bajo el campo y en caja general, contraste ≥ 4,5:1 en claro y oscuro, anunciado a lectores de pantalla, regla de color actualizada en `DESIGN.md`.

## D2 → relacionado con U17
**Pregunta:** ¿un aviso de **retraso** también va en verde? Recomiendo: informativos (inicio de recorrido) en verde suave y retrasos/cambios de ruta con otro tratamiento (tinta con ícono de advertencia), para no leer un retraso como «bien».

## D3 → [U21] Perfil vs. Configuración
**Apunte:** «ver perfil y configuración redirigen a lo mismo; que el perfil solo muestre los datos y configuración permita editarlos».
**Hoy:** ambos botones llevan a `/perfil` (`Layout.jsx:405-411`); `Perfil.jsx` mezcla datos y edición.
| Opción | Efecto |
|---|---|
| A. Dos rutas: `/perfil` (solo lectura) y `/configuracion` (editar datos, contraseña, tema, avisos) | Lo que pides; más código. |
| B. Una sola pantalla con pestañas «Datos» y «Ajustes» y un solo acceso en el menú | Menos rutas. |
| C. Quitar «Configuración» del menú y dejar el ícono de editar dentro del perfil | Lo más simple. |
**Recomendación: A.** Es lo que describes, y deja el nav inferior con «Perfil» sin sobrecarga.
**Criterios (A):** `/perfil` muestra datos sin campos editables; `/configuracion` edita nombre, usuario, contraseña, tema y avisos; cada acceso del menú lleva a su pantalla; el nav marca activa la correcta.

## D4 → [U22] Logo del Seccional Aguachica
**Apunte (dos veces):** «integrar el seccional Aguachica en el logo de la U».
**Falta un recurso tuyo:** el logo del Seccional (o la versión oficial con «Seccional Aguachica») en SVG/PNG, y su variante para fondo oscuro.
| Opción | Efecto |
|---|---|
| A. Logo oficial con el Seccional, si existe | Fiel a la marca. |
| B. Logo UPC + rótulo de texto «Seccional Aguachica» | No exige asset nuevo. |
**Recomendación: A si el recurso existe; si no, B como puente.** Lugares: pie del acceso, cabecera de la app, landing, ícono/splash nativo (#36, M08).

## D5 → [U23] Nombre de usuario editable por cada usuario
**Apunte:** «que se pueda actualizar y cambiar el user name cada user».
**Hoy:** `Perfil.jsx` edita nombre, correo y documento, pero no `nombre_usuario`; el login lo usa como credencial.
**Preguntas:** ¿unicidad? (sí, ya es credencial) ¿límite de cambios? ¿invalida la sesión abierta?
**Recomendación:** editable en Configuración (D3-A), mismas reglas que el registro (3–20, `[a-zA-Z0-9._-]`), único sin distinguir mayúsculas, error claro si está tomado, token reemitido tras el cambio. Sin límite de cambios por ahora.
**Criterios:** cambio persistido en BD; el login funciona con el nuevo nombre y no con el viejo; duplicado rechazado con 409 y mensaje; pruebas de backend y de la pantalla.

## D6 → [U24] ETA según la velocidad real
**Apunte:** «el tiempo de llegada depende de la velocidad en tiempo real que se quiera actualizar».
**Hoy:** velocidad fija de 25 km/h en línea recta (`Buses.jsx:14`, `calcularETA`). La geolocalización del conductor no envía velocidad. `PRODUCT.md` deja abierta la decisión OSRM.
| Opción | Efecto |
|---|---|
| A. Mantener 25 km/h | Sin cambios; ETA tosco. |
| B. Velocidad media reciente del bus (últimas N posiciones), con piso y techo (ej. 10–40 km/h) | Mejor ETA con $0 y sin servicios. |
| C. ETA por carretera (OSRM) | Más preciso; depende de un servicio externo. |
**Recomendación: B.** Mide velocidad con las posiciones que ya llegan cada 4 s, no añade dependencias y degrada a 25 km/h si faltan datos.
**Criterios (B):** el ETA usa la velocidad suavizada del bus; con bus detenido no se dispara a infinito; la pantalla dice «estimado según la velocidad actual»; pruebas unitarias con trayectorias sintéticas. Encaja con el issue B07 (patrón Strategy del ETA).
**Aparte:** «cada cuánto se actualiza» queda como constante documentada (hoy el conductor emite cada 4 s y el inicio sondea cada ≥ 2,5 s).

## D8 → [U25] Qué queda en Inicio y cómo se navega
**Apuntes:** «el inicio que sea mucho», «¿qué debe quedar en inicio?», «acceso rápido: agregar lo de ver rutas», «hay cosas redundantes, enlaces como ver ruta y ver bus», «agregar ver bus como ícono en el nav».
**Hoy (verificado):** el inicio tiene talón de ETA con selector de parada, aviso del conductor, mini mapa y dos enlaces («Ver rutas», «Ver buses»); el talón además trae «Ver rutas y horarios»; el nav móvil del estudiante oculta Buses (`soloEscritorio`).
| Opción | Efecto |
|---|---|
| A. Inicio = talón + aviso + mini mapa. Quitar los enlaces de pie. Nav móvil: Inicio · Mapa · Rutas · Buses · Perfil (Alertas pasa a la campana de la barra superior) | Menos ruido, cinco destinos. |
| B. Igual que A pero conservar un «Acceso rápido» con Rutas y Buses | Redundante con el nav. |
| C. Nav de seis ítems (con Alertas) | Apretado a 360 px; objetivos táctiles < 44 px. |
**Recomendación: A.** Un solo camino a cada destino, el ETA sigue siendo lo primero, y el nav no pasa de cinco.
**Criterios (A):** sin enlaces duplicados en Inicio; «Buses» visible en el nav móvil del estudiante con ícono de bus; «Alertas» accesible desde la campana con contador; nav ≤ 5 ítems con objetivos de 44 px en 360 px; prueba funcional del nav por rol.
**Decisión conjunta:** «acceso rápido: agregar ver rutas» queda cubierto por Rutas en el nav.

## D9 → [U26] Conductor: de Alertas a Enviar aviso
**Apunte:** «en el perfil de conductor no es útil que las notificaciones lleguen también; mejor enfocado al estudiante; aprovechar ese espacio para que desde ahí se envíen las notificaciones del conductor».
**Hoy:** la pestaña Alertas del conductor muestra la lista de avisos; el envío de retraso/cambio de ruta vive dentro de Mi recorrido.
| Opción | Efecto |
|---|---|
| A. Reemplazar «Alertas» por «Avisar»: pestaña con envío de retraso/cambio de ruta y su historial enviado | Lo que pides. |
| B. Quitar Alertas y dejar el envío solo en Mi recorrido | Más simple, un nav más corto. |
| C. Mantener ambas | No cumple el apunte. |
**Recomendación: A.** Libera Mi recorrido para conducir (U06) y da a «Avisar» un lugar claro. Requiere U11 resuelto (que navegar no cierre el recorrido).
**Criterios (A):** el conductor no recibe notificaciones de otros; «Avisar» envía retraso o cambio de ruta a los estudiantes de su ruta; muestra lo ya enviado; mensaje de confirmación; pruebas del envío.

## D10 → [U27] Campo «Documento»
**Apunte:** «lo del documento, si no tiene un propósito no es necesario».
**Hecho (corregido al implementar):** `documento` no existe en el backend ni en la base de datos (`editarPerfil` solo lee `nombre` y `correo`, y no hay columna). En la interfaz era un campo sin efecto: se escribía, «guardaba» y nunca persistía. Se retira de la interfaz; no hay migración ni cambio de API.
| Opción | Efecto |
|---|---|
| A. Quitarlo de la interfaz (Perfil, admin) y mantener la columna | Reversible, sin migración. |
| B. Quitarlo de interfaz, API y BD (migración) | Limpio, pero toca datos y documentación (`06_documentacion_bd.md`). |
| C. Dejarlo | Dato personal sin propósito (menos privacidad). |
**Recomendación: A ahora, B si #51 (verificación de titularidad) no lo necesita.** Confírmame si el documento servirá para A01; si no, es dato personal sobrante.

## Ajuste a un issue existente (no es issue nuevo)
**Apunte:** «el conductor no va a tener correo institucional, así que no debe ser requisito».
**Acción:** comentar en #51 (A01) que la restricción `@unicesar.edu.co` aplica solo al **registro público de estudiantes**; el alta de conductores y administradores la hace el admin y no exige ese dominio. Hoy el registro público solo crea estudiantes, así que no hay error vigente. Lo anoto en `PRODUCT.md` cuando lo apruebes.

---

# Parte 3. Fase de pulido con /emil-design-eng (después de las Partes 1 y 2)

Se abrirán cuando U11–U19 estén integrados, para no pulir pantallas que aún cambian:
- **[U28]** Estados de presión y foco en botones, filas de buses/rutas y nav inferior.
- **[U29]** Transición del diálogo de admin y de los paneles de la barra superior (origen, duración, `prefers-reduced-motion`).
- **[U30]** Transición del ETA y del marcador del bus (sin saltos al llegar posición nueva).

---

# Mapa apuntes → issue

| Apunte | Issue |
|---|---|
| Admin: tocar a un lado cierra y pierde lo hecho | U13 |
| Logos con fondo blanco en oscuro | U18 |
| Advertencia roja en el login | D1 → U20 |
| Integrar el Seccional Aguachica en el logo (×2) | D4 → U22 |
| Cada usuario cambia su nombre de usuario | D5 → U23 |
| Mapa que no se ponga oscuro | U19 |
| Alerta de inicio de recorrido: otro tono / verde suave (×2) | U17 (+ D2) |
| Ícono de bus en vez de un punto | U16 |
| Ver perfil y Configuración van a lo mismo | D3 → U21 |
| Zoom superpuesto al menú de perfil | U14 |
| Documento sin propósito | D10 → U27 |
| El bus pierde el servicio al ir a Alertas/Perfil | U11 |
| Cronómetro de «validado» se reinicia | U15 |
| Enlaces redundantes (ver ruta / ver bus) | D8 → U25 |
| ETA según velocidad en tiempo real | D6 → U24 |
| Conductor sin correo institucional | comentario en #51 |
| Ver buses redirige mal a la ruta | U12 |
| El inicio es mucho / qué debe quedar | D8 → U25 |
| Acceso rápido: agregar ver rutas | D8 → U25 |
| Ver bus como ícono en el nav | D8 → U25 |
| Conductor: Alertas → enviar avisos | D9 → U26 |
