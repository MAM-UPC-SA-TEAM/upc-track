# Registro de cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Los números son issues (`#N`) o Pull Requests de `MAM-UPC-SA-TEAM/upc-track`.

## [1.0.0] — en preparación (congelamiento del código: 01-dic-2026)

Primera versión entregable de UpcTrack: monitoreo en tiempo real de los buses de la UPC Seccional Aguachica en la nube gratuita (Cloudflare + Render + Neon) y como app Android.

### Añadido
- **App Android (APK)** con Capacitor 7: proyecto Android, identidad nativa (íconos, splash, barra de estado), geolocalización nativa con adaptador, notificaciones locales, ciclo de vida (reanudar, botón atrás, red) y APK firmado publicado por GitHub Actions (#32, #33, #35 a #38, PR #70 a #79).
- **Despliegue en la nube**: backend en Render, PostgreSQL en Neon con TLS, frontend en Cloudflare; aviso «Despertando el servidor» con reintento y reconexión automática del socket (#9 a #15, PR #64, #67 a #69).
- **Registro con correo institucional** `@unicesar.edu.co` y aprobación del administrador (A01, PR #143 a #145).
- **Conductor:** pantalla encendida durante el recorrido (Wake Lock) y aviso para mantener la app abierta (PR #155); verificación del permiso de ubicación antes de iniciar (PR #159); «Avisar» a la ruta (PR #127).
- **ETA según la velocidad reciente del bus** (PR #134) con **patrón Strategy** intercambiable (PR #157).
- **Rediseño móvil «El Talón»**: Inicio más corto, Perfil y Configuración separados, nombre de usuario editable, modo claro/oscuro/automático, esqueletos de carga, transiciones y pulido de interacción (PR #115 a #140).
- **Splash de arranque animado** (web y APK): un bus recorre la línea de ruta hasta la parada; una vez por arranque, 1,1 s, cede al aviso «Despertando el servidor» y respeta `prefers-reduced-motion` (U35, #148).
- **Simulador de conductor** (`scripts/dev/simular-recorrido.mjs`) y **calculadora de resultados de usabilidad** (`scripts/dev/usabilidad-resultados.mjs`) (PR #163, #164).

### Cambiado
- **Backend migrado de MySQL a PostgreSQL** (`pg`) (#61).
- Capas del backend: `busService`, `usuarioService` y `rutaService`; los controladores ya no ejecutan SQL y las operaciones de varios pasos son transaccionales (B01 y B02, PR #150, #151).
- **Manejo de errores centralizado**: `HttpError`, `asyncHandler` y `errorHandler` en lugar de 34 bloques `try/catch` repetidos (B05, PR #165).
- Frontend en Cloudflare en lugar de Vercel; ngrok pasa a contingencia local.
- Project Charter v2 con control de cambios, pendiente de aprobación del docente (PR #154).

### Corregido
- Editar o eliminar buses, rutas, usuarios y horarios inexistentes respondía 200; ahora 404 (PR #147, #153).
- El conductor sin permiso de ubicación quedaba «en recorrido» sin transmitir (PR #159).
- Un origen rechazado por CORS respondía 500 (ahora 403) y un JSON mal formado devolvía una página HTML (ahora 400 en JSON) (PR #165).
- El avatar de la barra superior no incluía sus iniciales en el nombre accesible (WCAG 2.5.3) (PR #158).
- Varios ajustes de interfaz: el recorrido sobrevive a la navegación, «Ver bus» abre la ruta correcta, el mapa no se oscurece con el tema oscuro, el indicador «Validado» no se reinicia sin dato nuevo, controles de zoom que tapaban el menú, entre otros (PR #115 a #133).

### Seguridad
- `helmet` y dependencias sin vulnerabilidades conocidas (`npm audit fix`: 5 vulnerabilidades, una crítica, a 0) (PR #156).
- CORS estricto en producción y orígenes de Capacitor permitidos; límite de intentos de login y de registro; secretos fuera del repositorio (auditado, sin hallazgos).

### Pruebas y calidad
- Pirámide de pruebas: unitarias e integración HTTP del backend, pruebas con PostgreSQL real, pruebas del frontend, 20 e2e con Playwright y cobertura con umbral del 60 % en CI (Q08, PR #81 a #94, #146).
- Auditoría móvil a 390 y 768 px y axe-core: 0 violaciones WCAG 2.1 A/AA en las pantallas principales.
- Validación de requisitos sobre una réplica local y la nube: 10 de 15 RF y 10 de 15 RNF cumplen y ninguno incumple; el resto exige validación manual (`docs/14_validacion_rf_rnf.md`).

### Documentación
- Manual técnico y de usuario, documentación de BD, interfaz, herramientas, bitácora e índice de entrega al día (Q04, PR #160, #161).
- Estado final del plan de arquitectura, protocolo de pruebas de usabilidad y guion de sustentación con plan de contingencia (PR #160, #163, #164).

### Limitaciones conocidas
- Los planes gratuitos no garantizan disponibilidad 24/7: Render suspende el backend a los 15 minutos (arranque en frío de ~17 s) y Neon a los 5.
- El seguimiento del conductor con la pantalla bloqueada no está soportado: debe mantener la app abierta (spike opcional #34).
- Sin notificaciones push remotas, sin iOS y sin publicación en tiendas (fuera del alcance del charter v2).
- Pendiente de validar en dispositivo real (#39) y con usuarios (#42).
