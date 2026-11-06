---
version: 1
slug: "frontend-src-pages-dashboard-jsx"
primary_target: "frontend/src/pages/Dashboard.jsx"
related_targets: ["frontend/src/components/shared/Layout.jsx"]
---

## Scope and mode
Pantalla de inicio del estudiante (`/inicio`, `Dashboard.jsx`) y el shell de la app (barra superior y navegación inferior). Modo **Operate**: el estudiante en la parada completa una tarea. Esta superficie funda el sistema visual que luego heredan mapa, rutas, notificaciones, perfil, conductor y administración.

## Audience, task, constraints
Estudiante UPC Aguachica, una mano, pleno sol, datos inestables, mirada de 3 segundos. Tarea: saber cuándo llega SU bus a SU parada y si ese dato es fresco. Estados que importan: sin buses transmitiendo, dato viejo o sin conexión, alerta del conductor. Contenido real: ruta «Centro - UPC», paradas «Parque Principal» y «UPC Seccional Aguachica», Bus 1 (UPC-001). Debe conservar nombre y logo UpcTrack, verde y amarillo, y el logo de la UPC. Peso bajo: celular de gama media.

## Chosen direction
El Talón (candidata 3 de 7, asignada por el sorteo y elegida por el usuario). Aportes de retadoras descartadas: color plano sin sombras (zoo), cifras a contraste máximo (Ikeda), un solo foco a la vez (streaming). Gesto distintivo: el sello rojo que anula la cifra cuando el dato envejece.

## Direction contract
THESIS: Cada dato es un talón: el ETA a tu parada se imprime como tiquete que se valida o se anula con un sello, y la app nunca muestra una cifra vieja como si fuera actual. Rechaza las tarjetas blancas redondeadas con métrica grande y acento azul.
OWN-WORLD: Papel térmico `#FBFAF4`, tinta verde-negra `#14261A`, verde UPC `#1E6B2E` solo para lo accionable y lo válido, amarillo `#F5C400` como franja y aviso, rojo `#C62828` solo para el sello de dato vencido. Archivo de ancho condensado para títulos y cifras; Spline Sans Mono solo para datos del talón (km, segundos). Bordes de 2px, perforación con muescas, color plano, sin sombras ni degradados.
STORY: El estudiante entiende de un vistazo cuándo llega su bus y cuán fresco es el dato; confía en la app y toca «Ver en el mapa» solo si quiere más.
FIRST VIEWPORT: 390x844. Barra superior con logo UpcTrack; talón de ETA con la parada como selector nativo, cifra de 7,5rem con franja amarilla, perforación y fila de datos con estado «VALIDADO hace N s»; mini mapa; aviso del conductor como talón amarillo; navegación inferior de cinco destinos con icono y texto. Acción primaria «Ver en el mapa» en verde, la única pieza verde llena.
FORM: El Talón, candidata 3 de 7 en la lista ordenada; seed: 8ba5a2cc853e85eb.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
Umbrales de frescura (hoy 30 s validado, hasta 120 s sello, luego desaparece del backend); parada favorita guardada solo en el dispositivo hasta que exista endpoint de favoritos; escala del sello en modo oscuro.
