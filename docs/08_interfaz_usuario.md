# Interfaz de Usuario

## 1. Principios usados
- Pensada para el estudiante en la parada: una mano, datos inestables y poco tiempo. La referencia es `PRODUCT.md` (usuarios y propósito) y `DESIGN.md` (sistema visual «El Talón»: papel, bordes de 2 px, color plano y tipografía local).
- Navegación por rol: barra inferior en el móvil (3 a 5 destinos según el rol) y menú lateral en pantallas anchas.
- Responsive en desktop y móvil, con objetivos táctiles de 44 px como mínimo.
- Tema claro, oscuro o automático (sigue al teléfono), con tokens en `styles/tokens.css`.
- Un dato vencido no se muestra como vigente: se anula con un sello («Sin señal» o «Sin conexión»).

## 2. Vistas principales
- Login y registro (correo institucional, cuenta pendiente de aprobación)
- Inicio: talón con el tiempo de llegada a la parada elegida
- Mapa en tiempo real, con hoja inferior de buses
- Rutas
- Buses
- Notificaciones (campana en el móvil)
- Perfil (datos) y Configuración (edición, contraseña y apariencia)
- Conductor: Mi recorrido y Avisar
- Admin: Dashboard y gestión de usuarios, buses, rutas, paradas y horarios

## 3. Mejoras UX incorporadas
- Selector de parada en mapa + búsqueda de dirección.
- Marcadores del bus como ícono de bus, con movimiento suave; el mapa se mantiene claro en modo oscuro.
- Esqueletos de carga que repiten la forma del contenido, y estados de vacío y error en todas las listas.
- Avisos «Despertando el servidor» y de sin conexión, con reintento automático.
- Conductor: botón principal grande, estado de GPS y de transmisión a la vista, «Reanudar transmisión» y confirmación en dos toques para finalizar.
- Notificaciones por tipo (info, retraso, cambio de ruta); al conductor se le explica que debe mantener la app abierta.
- Respeto de `prefers-reduced-motion`.

## 3.1 Verificación de accesibilidad y diseño móvil
- Auditoría móvil a 390 px (`scripts/dev/auditoria-movil.mjs`) sobre 14 pantallas de los 3 roles: 0 desbordes horizontales, 0 controles menores de 24 px, un `h1` por pantalla, texto mínimo de 12 px y contraste AA en las pantallas de la app.
- axe-core (WCAG 2.1 A y AA y buenas prácticas): 0 violaciones en 13 pantallas, en claro y en oscuro.
- Pendiente de probar en dispositivo real: recorrido con TalkBack y fluidez del mapa (issue M11).
- El registro de hallazgos y su corrección está en `13_auditoria_diseno.md`.

## 4. Pruebas de usabilidad
Se ejecutan con usuarios de la UPC (issue Q03). Casos sugeridos:
- Tiempo para registrar una parada.
- Tiempo para asignar conductor y ruta.
- Lectura de notificacion en menos de 3 toques en movil.
