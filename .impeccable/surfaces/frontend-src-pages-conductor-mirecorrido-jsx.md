---
version: 1
slug: "frontend-src-pages-conductor-mirecorrido-jsx"
primary_target: "frontend/src/pages/conductor/MiRecorrido.jsx"
related_targets:
  - "frontend/src/components/conductor/TalonConductor.jsx"
  - "frontend/src/components/conductor/Conductor.css"
---

## Scope and mode
Pantalla del conductor (`/conductor`, «Mi recorrido»). Modo **Operate**. Extiende el mundo «El Talón» ya documentado en DESIGN.md: no hay nueva ronda de direcciones ni cambio del sistema. Resuelve el hallazgo F-07 de la auditoría (`docs/13_auditoria_diseno.md`, issue #27).

## Audience, task, constraints
Conductor al volante o en una parada, con el teléfono en un soporte o en la mano, a pleno sol. Tarea: iniciar el recorrido, saber sin duda si **este teléfono** está transmitiendo, detener/reanudar, finalizar, y avisar un retraso o cambio de ruta a su ruta. Principio de producto 4: poco que leer, un solo gesto grande, nunca ambigua sobre si transmite. Debe conservar: watchPosition con envío cada 4 s, wake lock, estado del bus por API (`en_recorrido`, `detenido`, `fuera_de_servicio`), cierre a `inactivo` al salir de la vista sin finalizar, geometría de ruta por OSRM, aviso por tipo (info, retraso, cambio_ruta).

## Chosen pattern
Mapa de calles calmadas a sangre (mismos marcadores, trazos y controles que el Mapa del estudiante) y debajo, en móvil, un talón; desde 1024px, tarjeta de 440px a la izquierda. La «cifra» del talón es el estado de este teléfono en una palabra condensada; la franja amarilla es la antigüedad del último envío (30 s). Una sola acción verde llena según el estado; la otra, contorno de tinta. «Finalizar» pide segundo toque. «Avisar a mi ruta» se despliega en línea. Estados: vivo, detenido, buscando GPS, viejo (sello «Sin conexión» o «Sin señal»), colgado (servidor activo pero el teléfono no transmite; «Reanudar transmisión»), libre y sin bus. Se eliminan el registro de actividad, el contador de puntos GPS y el panel de tres alturas.

## Unresolved
- El envío depende de que el GPS del dispositivo emita lecturas; no se reenvía la última posición (evita pasar un dato viejo por fresco). Falta verificarlo en un teléfono real.
- Con la pantalla bloqueada el seguimiento no está garantizado (PRODUCT.md).
- Con el formulario de aviso abierto en un teléfono de 640px de alto, el estado del talón sale de la vista.
