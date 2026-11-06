---
version: 1
slug: "frontend-src-pages-login-jsx"
primary_target: "frontend/src/pages/Login.jsx"
related_targets:
  - "frontend/src/pages/Registro.jsx"
  - "frontend/src/components/acceso/AccesoLayout.jsx"
  - "frontend/src/components/acceso/Campo.jsx"
  - "frontend/src/components/acceso/Acceso.css"
---

## Scope and mode
Pantallas de acceso: login (`/login`) y registro (`/registro`). Modo **Operate**. Extienden el mundo «El Talón» ya documentado en DESIGN.md: no hay nueva ronda de direcciones. Atienden los hallazgos F-03 (objetivos táctiles), F-04 (campos sin etiqueta), F-06 (contraste del pie) y F-17 (dos logos apilados) de `docs/13_auditoria_diseno.md` (issue #28).

## Audience, task, constraints
Es la primera pantalla de los tres roles: el estudiante que entra de pie en la parada con una mano y datos inestables, el conductor y el administrador. Tarea: entrar (o crear una cuenta de estudiante) con el menor roce posible. Debe conservar: redirección por rol (`admin` → `/admin`, `conductor` → `/conductor`, resto → `/inicio`), validaciones del registro (usuario 3–20 de `[a-zA-Z0-9._-]`, correo, contraseña ≥ 8, confirmación), el flujo con o sin token tras registrarse, y los compromisos de marca (nombre y logo UpcTrack, verde y amarillo, logo UPC visible).

## Chosen pattern
Un talón centrado: cabo con la marca y el nombre en texto vivo → perforación → formulario; el logo UPC al pie. Etiquetas reales sobre campos de 48 px; ayuda siempre visible que el error reemplaza; errores en tinta con icono (no rojo); «Mostrar contraseña» como casilla de 44 px tematizada; una sola acción verde. Se elimina la tarjeta redondeada con sombra, los círculos decorativos, la ilustración de 140 px y el icono dentro de cada campo.

## Unresolved
- Restringir el registro a correos `@unicesar.edu.co` (issue #51) no está hecho; no se afirma en pantalla.
- No hay «Olvidé mi contraseña» ni verificación de correo: no existen en el backend.
- Los campos de registro no tienen medidor de contraseña a propósito (poco que leer).
