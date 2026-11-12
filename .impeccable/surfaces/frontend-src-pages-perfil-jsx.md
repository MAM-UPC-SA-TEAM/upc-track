---
version: 1
slug: "frontend-src-pages-perfil-jsx"
primary_target: "frontend/src/pages/Perfil.jsx"
related_targets:
  - "frontend/src/pages/Perfil.css"
  - "frontend/src/components/acceso/Campo.jsx"
---

## Scope and mode
Pantalla de perfil (`/perfil`), para los tres roles. Modo **Operate**. Extiende el mundo «El Talón» ya documentado en DESIGN.md: no hay nueva ronda de direcciones.

## Audience, task, constraints
Quien ya tiene sesión y quiere ver sus datos, corregir nombre, documento o correo, o cambiar su contraseña. Debe conservar: `PATCH /api/usuarios/perfil` (nombre, correo, documento; actualiza el usuario del contexto) y `PATCH /api/usuarios/password` (`password_actual`, `password_nueva`), y la validación de contraseña ≥ 8 con confirmación. El cierre de sesión vive en el shell (menú de la barra superior y panel lateral), no aquí.

## Chosen pattern
Un talón cuya «cifra» es el nombre, con el rol como etiqueta y los datos como filas; «Editar» abre los campos en el mismo bloque, con errores por campo. La contraseña va en un desplegable en línea (se eliminan las pestañas Información/Seguridad, que escondían la contraseña sin ahorrar nada). Un solo verde lleno («Guardar cambios»); «Actualizar contraseña» en tinta. Se eliminan el avatar duplicado, los iconos dentro de cada etiqueta, la fila «Rol en el sistema» (repetía la etiqueta) y el ojo de contraseña de 20 px.

## Unresolved
- El correo se puede editar sin verificación y el backend no restringe el dominio (#51 sigue abierto).
- No hay «cerrar sesión en otros dispositivos» ni aviso de contraseña cambiada: no existen en el backend.
