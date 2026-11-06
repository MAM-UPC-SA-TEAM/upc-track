# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

La app es una PWA (React + Vite) y se empaquetará como APK Android con Capacitor 7. El empaquetado nativo no cambia la plataforma de diseño: sigue siendo `web` en una WebView.

## Users

**Principal: el estudiante en la parada.** Comunidad de la Universidad Popular del Cesar, Seccional Aguachica (Cesar, Colombia), esperando el bus universitario. Usa el teléfono con una mano, a pleno sol y con datos móviles inestables. Mira y decide en segundos si espera o camina. Es quien más usa el mapa, el tiempo estimado de llegada (ETA) y las alertas.

**Secundarios (no son el foco del diseño inicial):**
- *Conductor:* transmite su ubicación desde su propio teléfono durante el recorrido y avisa retrasos o cambios de ruta a los estudiantes de su ruta.
- *Administrador:* gestiona usuarios, buses y rutas; uso mayormente de escritorio.

## Product Purpose

Reducir la incertidumbre de espera del transporte universitario: que el estudiante sepa dónde está su bus y cuándo llega a su parada, en tiempo real. El charter fija metas por validar (no son resultados): reducir ≥ 30 % la espera innecesaria, ≥ 50 % el tiempo de consulta de rutas, ≥ 80 % de satisfacción, y una actualización de posición visible en ≤ 30 s (objetivo técnico: 3–4 s).

## Positioning

Lo que una app genérica de transporte (Google Maps y similares) no puede copiar con verdad:
- **Es el bus de esta universidad:** rutas y paradas reales del campus de Aguachica y ETA a *tu* parada, no a una dirección cualquiera.
- **El conductor es el rastreador:** su teléfono transmite la posición (cada 4 s), sin GPS ni hardware especial.
- **Alertas del conductor a su ruta:** retrasos y cambios de ruta llegan en tiempo real, solo a los estudiantes de esa ruta.

## Operating Context

- Territorio: Aguachica, Cesar. Calor y pleno sol; conexión móvil intermitente; teléfonos Android de gama baja y media son el caso esperado (por confirmar con datos de uso).
- Idioma: español de Colombia, únicamente.
- Hoy hay 3 roles (estudiante, conductor, administrador) con sesión propia. El registro público solo crea estudiantes; se prevé restringirlo a correos `@unicesar.edu.co` (issue #51).
- Despliegue gratuito previsto: Vercel (frontend), Render free (backend, se suspende tras 15 min sin tráfico y tarda ~1 min en despertar) y Aiven free (MySQL). El diseño debe tolerar arranques en frío y reconexiones.
- Existe una **landing pública** en `/` para la XV Feria de Emprendimiento UPC (superficie de persuasión, ya diseñada y fuera del alcance de este rediseño; contenido en `docs/docmuento feria de emprendimiento.md`). La app debe tener parentesco visual con ella sin copiar su modo.
- Entrega final del semestre: 05-dic-2026. Equipo activo: una persona.

## Capabilities and Constraints

- Mapa en tiempo real con ruta, paradas y bus; ETA lineal a una parada (distancia / 25 km/h); notificaciones en tiempo real por Socket.IO; modo claro/oscuro; PWA con aviso de conexión.
- Vocabulario del dominio: bus, ruta, parada, recorrido, ETA, conductor, «en recorrido / detenido / fuera de servicio».
- Sin notificaciones push remotas (solo con la app abierta o reciente); el seguimiento con la pantalla bloqueada no está garantizado (el conductor debe mantener la app abierta y el teléfono cargando).
- Presupuesto $0 y herramientas gratuitas; solo OpenStreetMap/Leaflet para mapas.
- Decisión abierta: si habrá ETA por carretera (OSRM) o se mantiene lineal.

## Brand Commitments

Confirmado como obligatorio por el equipo (05-nov-2026):
- **Nombre y logo UpcTrack** (un bus sobre un mapa con marcador) y el lema «Tu ruta en tiempo real» (`frontend/public/brand/upc-track-logo.png`).
- **Verde y amarillo** de la marca y de la universidad.
- **Logo de la Universidad Popular del Cesar** visible en la app.

Todo lo demás (paleta exacta, tipografía, componentes, layout) puede replantearse.
La landing definió como identidad «señalética de transporte; una ruta con paraderos recorre la página» y una referencia negativa propia (oscura, neón, brutalista); esa referencia se confirmó solo para la landing.

## Evidence on Hand

- Logos y piezas de marca: `frontend/public/brand/`, `frontend/src/assets/`.
- Auditoría de diseño medida de la app actual: `docs/13_auditoria_diseno.md` (11/20, 19 hallazgos) y capturas «antes» en `docs/img/auditoria/`.
- Datos de demostración: 1 ruta («Centro - UPC»), 2 paradas y 1 bus. **No hay** fotos reales del servicio, testimonios, métricas de uso ni resultados de pruebas con usuarios; no deben inventarse. Las metas del charter son objetivos, no logros.

## Product Principles

1. **El dato fresco es el producto.** Una posición vieja que parece actual es peor que ninguna: la antigüedad del dato y el estado de la conexión se muestran siempre.
2. **Una mirada, una decisión.** La primera pantalla del estudiante responde «¿cuándo llega mi bus a mi parada?» sin abrir menús.
3. **Hecho para exterior y para una mano.** Legible a pleno sol, objetivos grandes, alcanzable con el pulgar.
4. **La pantalla del conductor es de seguridad.** Poco que leer, un solo gesto grande, nunca ambigua sobre si está transmitiendo.
5. **Propio y local.** Español colombiano, campus y rutas reales de la UPC Aguachica; no se disfraza de app global de movilidad.

## Accessibility & Inclusion

No hay un estándar formal declarado; el objetivo de trabajo es **WCAG 2.1 AA** (issue #30) con contraste pensado para luz solar, objetivos táctiles ≥ 44 px, `prefers-reduced-motion` y funcionamiento sin color como único indicador del estado del bus.
