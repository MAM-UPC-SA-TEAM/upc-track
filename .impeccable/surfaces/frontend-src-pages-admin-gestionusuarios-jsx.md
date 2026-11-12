---
version: 1
slug: "frontend-src-pages-admin-gestionusuarios-jsx"
primary_target: "frontend/src/pages/admin/GestionUsuarios.jsx"
related_targets:
  - "frontend/src/pages/admin/GestionBuses.jsx"
  - "frontend/src/pages/admin/GestionRutas.jsx"
  - "frontend/src/pages/admin/PanelAdmin.jsx"
  - "frontend/src/components/admin/TablaAdmin.jsx"
  - "frontend/src/components/admin/DialogoForm.jsx"
  - "frontend/src/components/admin/ConfirmarEliminar.jsx"
  - "frontend/src/components/admin/FormParada.jsx"
  - "frontend/src/components/admin/Admin.css"
---

## Scope and mode
Administración: panel (`/admin`), usuarios, buses y rutas con sus paradas y horarios. Modo **Operate**. Extiende el mundo «El Talón» ya documentado en DESIGN.md: no hay nueva ronda de direcciones. Atiende F-02 (tablas que recortan Estado y Acciones en móvil), F-03 y F-05 (objetivos y botones sin nombre) de `docs/13_auditoria_diseno.md`.

## Audience, task, constraints
El administrador, sobre todo en escritorio y a veces en el teléfono. Tarea: crear, editar y eliminar cuentas, buses, rutas, paradas y horarios sin equivocarse. Debe conservar: los endpoints de `/api/usuarios`, `/api/buses`, `/api/rutas`, `/api/paradas` y `/api/horarios`, los campos de cada formulario, la asignación de ruta y conductor al bus (solo conductores activos), el orden de paradas y la búsqueda de direcciones.

## Chosen pattern
Tabla real desde 1024 px y tarjeta-talón por fila por debajo (dos vistas de los mismos datos, una sola visible). Formularios y confirmación de borrado en `<dialog>` nativo: foco atrapado, Esc, foco devuelto; los botones de envío no se deshabilitan (`aria-disabled`) para no perder el foco. Errores por campo y del servidor dentro del diálogo; fin de `alert()` y `confirm()`. Una sola acción verde por vista; «Eliminar» en tinta, no rojo. Un fallo de carga ya no se disfraza de lista vacía. Se corrigen: la búsqueda de direcciones consultaba «Oruro, Bolivia» (ahora Aguachica, Cesar, Colombia), el bus nuevo nacía «En servicio» (ahora «Fuera de servicio»), el mapa de la parada se recentraba en cada tecla y la ruta elegida no se refrescaba ni se cerraba al editarla o borrarla.

## Unresolved
- Sin búsqueda, filtros ni paginación en las listas (no los había); con muchos registros habrá que añadirlos.
- Eliminar no explica qué pasa con lo relacionado (paradas, horarios, buses): el mensaje solo dice que no se puede deshacer.
- El usuario no está obligado a tener `nombre_usuario` al crearlo; lo decide el backend.
- El administrador podría eliminarse a sí mismo; la restricción, si existe, es del backend.
