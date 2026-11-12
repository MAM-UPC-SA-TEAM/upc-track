---
version: 1
slug: "frontend-src-pages-rutas-jsx"
primary_target: "frontend/src/pages/Rutas.jsx"
related_targets:
  - "frontend/src/pages/Buses.jsx"
  - "frontend/src/pages/Notificaciones.jsx"
  - "frontend/src/components/listas/EstadoLista.jsx"
  - "frontend/src/components/listas/Listas.css"
  - "frontend/src/utils/estadoBus.js"
---

## Scope and mode
Listas del estudiante: Rutas (`/rutas`), Buses (`/buses`, solo escritorio en la navegación) y Notificaciones (`/notificaciones`, también conductor y admin). Modo **Operate**. Extienden el mundo «El Talón» ya documentado en DESIGN.md: no hay nueva ronda de direcciones. Atienden F-19 (notificaciones sin estado de lectura y con botón redundante) y F-18 (borde lateral) de `docs/13_auditoria_diseno.md`.

## Audience, task, constraints
Estudiante que consulta de pie, con una mano y datos inestables: ¿qué rutas y horarios hay?, ¿qué buses van ahora y qué tan fresco es el dato?, ¿qué avisaron los conductores? Debe conservar: carga de `/api/rutas` + `/api/horarios`, `/api/buses/activos` + `/api/paradas` con actualización por socket (`bus:estado`, `bus:location`), `/api/notificaciones` con `notificacion:nueva`, y los enlaces `?ruta=` y `?bus=` al Mapa.

## Chosen pattern
El talón como contenedor, filas de 60 px o más, bordes de 2 px, sin sombras. Rutas: una hoja por ruta con horarios en mono y acción de contorno. Buses: una hoja con filas-enlace que repiten la etiqueta de frescura del Mapa; la posición vencida no muestra ETA. Notificaciones: lo nuevo es la losa amarilla del aviso con la palabra «Nueva»; lo leído, hoja blanca; «leída» se recuerda en el dispositivo. Un `EstadoLista` común resuelve cargando (esqueleto y mensaje de servidor dormido), error de carga (nunca disfrazado de vacío) y vacío. Se eliminan los tres botones «Ver todas…» que no hacían nada, los chips de color por turno, los iconos de colores por tipo y las filas `div` con `onClick`.

## Unresolved
- «Leída» no se guarda en el servidor ni se sincroniza con la campana de la barra superior.
- El ETA de Buses es a la parada más cercana en línea recta, no a la próxima parada.
- Un bus que empieza el recorrido no aparece en Buses hasta recargar (comportamiento previo).
