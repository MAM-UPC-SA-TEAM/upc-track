---
version: 1
slug: "frontend-src-pages-mapatiemporeal-jsx"
primary_target: "frontend/src/pages/MapaTiempoReal.jsx"
related_targets: []
---

## Scope and mode
Pantalla «Mapa» (`/mapa`, `MapaTiempoReal.jsx`). Modo **Operate**. Extiende el mundo «El Talón» ya documentado en DESIGN.md: no hay nueva ronda de direcciones ni cambio del sistema.

## Audience, task, constraints
Estudiante que quiere orientarse: ver dónde está el bus sobre las calles y tocar una parada para ver su ETA y qué tan fresco es el dato. Estados que importan: sin buses, bus sin señal (dato viejo), sin conexión, carga inicial fallida. Mapa base: calles reales de OpenStreetMap, calmadas con tono papel (decisión del usuario). Debe conservar la funcionalidad existente: buscar bus, chips de ruta con «Todas», paradas y buses tocables, ETA por parada, geometría de ruta por OSRM, preselección por `?ruta=` y `?bus=`.

## Chosen pattern
Hoja inferior que reutiliza el talón: al tocar una parada muestra el ETA del bus más cercano; al tocar un bus muestra su ETA a la próxima parada. Sin selección: lista de buses. Barra superior de papel con buscador (solo si hay más de 3 buses) y chips de ruta que hacen de leyenda. Marcadores propios (sin emoji); bus sin señal = marcador hueco de anillo discontinuo. Un solo trazo verde por ruta; con varias rutas se distinguen por estilo de línea (continua, rayas, puntos), no por una paleta de colores.

## Unresolved
Seguir un bus (centrar y acompañarlo) queda fuera de este pase. Umbral de frescura 30 s igual que Inicio.
