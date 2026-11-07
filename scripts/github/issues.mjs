// scripts/github/issues.mjs
// Catálogo único de labels, hitos e issues de la ruta de trabajo del semestre.
// Fuente de verdad para: seed.mjs (crea en GitHub) y docs/12_ruta_trabajo_semestre.md.
// Convención: los IDs (W01, D05, ...) van en el título como "[W01] ..." y se
// reescriben a "#N" en el cuerpo al crear los issues.

export const LABELS = [
  // Prioridad (MoSCoW)
  { name: 'prio:P0-must',   color: 'b60205', description: 'Must: bloquea la entrega del 05-dic' },
  { name: 'prio:P1-should', color: 'fbca04', description: 'Should: importante, con alternativa' },
  { name: 'prio:P2-could',  color: '0e8a16', description: 'Could: se recorta primero si falta tiempo' },
  // Área
  { name: 'area:repo',      color: '5319e7', description: 'Estructura del repositorio, gobernanza' },
  { name: 'area:infra',     color: '1d76db', description: 'Despliegue, nube, CI/CD' },
  { name: 'area:backend',   color: '0052cc', description: 'API Node/Express/Socket.IO' },
  { name: 'area:frontend',  color: '006b75', description: 'React/Vite' },
  { name: 'area:diseno',    color: 'f9a8d4', description: 'UI/UX, auditoría visual, accesibilidad' },
  { name: 'area:movil',     color: 'c2e0c6', description: 'Capacitor / Android' },
  { name: 'area:qa',        color: 'bfd4f2', description: 'Pruebas y validación' },
  { name: 'area:docs',      color: '0075ca', description: 'Documentación y entregables' },
  // Trazabilidad con el plan de arquitectura y el charter
  { name: 'nivel-1', color: 'ededed', description: 'Plan de arquitectura · Nivel 1 Infraestructura' },
  { name: 'nivel-2', color: 'ededed', description: 'Plan de arquitectura · Nivel 2 Capas' },
  { name: 'nivel-3', color: 'ededed', description: 'Plan de arquitectura · Nivel 3 Patrones GoF' },
  { name: 'nivel-4', color: 'ededed', description: 'Plan de arquitectura · Nivel 4 SOLID' },
  { name: 'nivel-5', color: 'ededed', description: 'Plan de arquitectura · Nivel 5 Código limpio' },
  { name: 'charter', color: 'd4c5f9', description: 'Afecta o cumple el Project Charter' },
]

export const MILESTONES = [
  { n: 1, title: 'Hito 1 · Base, CI y nube',      due: '2026-11-13', description: 'Sprint 4. Repo ordenado, CI, backend en Render, BD PostgreSQL en Neon, frontend en Cloudflare, charter v2.' },
  { n: 2, title: 'Hito 2 · Diseño móvil y base Capacitor', due: '2026-11-20', description: 'Sprint 4. Tokens, navegación móvil, pantalla del conductor, Capacitor con login y GPS.' },
  { n: 3, title: 'Hito 3 · APK, capas y pulido',   due: '2026-11-27', description: 'Sprint 5. APK firmado, pruebas en dispositivo, refactor de capas, accesibilidad y stretch.' },
  { n: 4, title: 'Hito 4 · QA, docs y entrega',   due: '2026-12-05', description: 'Sprint 5. Congelamiento 01-dic. QA, usabilidad, manuales, release v1.0.0, sustentación.' },
]

export const ISSUES = [
  // ───────────────────────── Repo y gobernanza ─────────────────────────
  {
    id: 'W01', hito: 1, prio: 'P0', area: ['repo', 'frontend'],
    titulo: 'Reorganizar el repo: landing dentro de frontend/, retirar Pages y limpiar',
    contexto: 'La fusión dejó en la raíz la landing (`src/`, `index.html`, `vite.config.js` con `base: /upc-track/`, `public/brand`) y, en el working tree, el `package.json` raíz quedó con el del monorepo (sin `build`, `vite` ni `react`; sin commitear). Decisión: la landing vive dentro de `frontend/` y se sirve desde Cloudflare en `/`. GitHub Pages se retira: no hay URL impresa que preservar.',
    tareas: [
      'Mover `src/features/feria`, `src/content/feria.js` y los estilos propios de la landing a `frontend/src/features/landing/`; `public/brand/*` a `frontend/public/brand/`.',
      'Añadir `@fontsource-variable/archivo` y `@fontsource-variable/instrument-sans` a `frontend/package.json` (versiones del commit b777e29).',
      'Exponer la landing como ruta pública `/` en `App.jsx` con CTA a `/login` (hoy `/` redirige a `/login`).',
      'Borrar de la raíz `index.html`, `vite.config.js` y `src/`; la raíz queda como orquestador (`name`, `private`, scripts `dev`/`build`/`lint`, `concurrently`).',
      '**Retirar Pages:** borrar `.github/workflows/deploy.yml` en el mismo PR y desactivar Pages (`gh api -X DELETE repos/MAM-UPC-SA-TEAM/upc-track/pages`).',
      'Mover `test-socket.html` y `backend/check_users.mjs` a `scripts/dev/` (o eliminarlos).',
      'Unificar el bloque `server` duplicado de `frontend/vite.config.js` y fijar el puerto **5173**; alinear `engines`, `.nvmrc` y CI en **Node 22 LTS**.',
      'Decidir qué se versiona (`.agents/`, `.claude/`, `skills-lock.json`, `frontend/.claude/launch.json`) y completar `.gitignore`.',
    ],
    aceptacion: [
      '`npm ci && npm run build` desde la raíz construye el frontend con la landing.',
      '`/` muestra la landing; `/login` y el resto de rutas funcionan.',
      'No quedan archivos de landing en la raíz ni workflows rotos; `git status` limpio tras un clon nuevo.',
      'La landing queda aislada para omitirla en el build nativo (ver M01).',
    ],
    refs: 'Charter §4 (Módulo 3) · Plan Nivel 1 y 5',
  },
  {
    id: 'W03', hito: 1, prio: 'P0', area: ['infra', 'backend'], nivel: 1, deps: ['W01'],
    titulo: 'CI con GitHub Actions y ESLint en el backend',
    contexto: 'No existe CI para la app y el backend no tiene linter ni script `lint` (el frontend sí tiene ESLint). Con un solo desarrollador, el CI es la única revisión automática: debe ser el requisito para fusionar.',
    tareas: [
      'Backend: ESLint 9+ con flat config (`@eslint/js`, `globals` de Node), script `npm run lint` y corrección de hallazgos (variables sin uso, `await import` dinámicos).',
      'Workflow `ci.yml` en `pull_request` a `main`/`develop`: Node 22, `npm ci`, `lint` y `build` en `frontend/`, `lint` en `backend/`; caché de npm y `concurrency`.',
      'Badge de estado en el README.',
    ],
    aceptacion: [
      '`npm run lint --prefix backend` termina con 0 errores.',
      'Un PR con error de lint o build falla el check; en caliente tarda < 5 min.',
    ],
    refs: 'Plan Nivel 1 y Nivel 5',
  },
  {
    id: 'W04', hito: 1, prio: 'P1', area: ['repo', 'docs'], charter: true,
    titulo: 'Gobernanza mínima para un solo desarrollador: flujo, CI obligatorio y tablero',
    contexto: 'El charter pide PRs revisados y tablero ágil. Con una sola persona no existe revisión por pares ni se pueden exigir aprobaciones. Decisión: el CI verde es el requisito de fusión y la revisión queda documentada con una lista de verificación propia más una revisión asistida (`/code-review`) pegada como comentario del PR.',
    tareas: [
      'Plantilla `.github/pull_request_template.md` (qué cambia, `Closes #N`, evidencia de prueba, lista de autorrevisión).',
      'Proteger `main`: PR obligatorio y check de CI requerido, **sin** aprobaciones obligatorias; flujo `feature/* → develop → main`.',
      'Tablero en GitHub Projects con una columna por hito, todos los issues vinculados; marcar claramente los «Should» como *stretch*.',
    ],
    aceptacion: [
      'No se puede hacer push directo a `main` y todo PR requiere CI verde.',
      'Cada PR del semestre enlaza su issue y deja evidencia de revisión.',
    ],
    refs: 'Charter §5, §7.2, §10 criterio 3',
  },

  // ───────────────────────── Infraestructura y despliegue ─────────────────────────
  {
    id: 'D01', hito: 1, prio: 'P0', area: ['infra'], nivel: 1, charter: true,
    titulo: 'Spike: crear la base PostgreSQL gratuita en Neon y fijar el plan de continuidad',
    contexto: 'Por recomendación del profesor (07-nov-2026) la BD pasa de Aiven MySQL a **Neon (PostgreSQL)**. Según la documentación de Neon (consultada el 07-nov-2026) el plan Free no cobra excedentes, suspende el cómputo a los 5 min sin conexiones (no se puede desactivar en Free) y despierta en pocos segundos; los límites publicados son 100 CU-horas de cómputo al mes y 1 GB de almacenamiento por proyecto (otras páginas de Neon aún muestran 0,5 GB: confirmar en la consola). Con el almacenamiento lleno las escrituras fallan. **Un ping constante impediría la suspensión y gastaría las CU-horas**, así que no se mantiene la BD despierta a propósito (ver D06). Plan B que no depende de otro proveedor: el PostgreSQL local de `docker-compose.yml` (D10).',
    tareas: [
      'Crear el proyecto en Neon (región más cercana a la de Render), anotar host, base, usuario y rol, y copiar la cadena de conexión con `sslmode=require`.',
      'Registrar en el issue, con fecha, los límites que muestre la consola (almacenamiento, CU-horas, si pide tarjeta) y comprobar que no se activa facturación.',
      'Probar la conexión desde local y, cuando exista, desde Render (D05).',
      'Medir cuánto tarda la primera consulta tras la suspensión para documentarlo en el plan de contingencia (Q06).',
      'Dejar un volcado reproducible (`schema.sql` + `seed.prod.sql`) para recrear la BD en minutos.',
    ],
    aceptacion: [
      'Proyecto accesible y credenciales guardadas en un gestor del equipo (no en el repo).',
      'El issue documenta límites verificados con fecha y el procedimiento de recuperación.',
    ],
    refs: 'Plan Nivel 1 · Charter §4.2, R4',
  },
  {
    id: 'D02', hito: 1, prio: 'P0', area: ['backend', 'infra'], nivel: 1, deps: ['D01', 'D10'],
    titulo: 'Backend y BD en Neon: TLS, migración de esquema y datos',
    contexto: 'Neon exige TLS. Además `seed.sql` crea usuarios con clave conocida (`Admin123*`), inaceptable en una BD pública. El registro público solo crea estudiantes, así que ningún rol privilegiado se autogenera. Depende de D10 (el backend ya habla PostgreSQL).',
    tareas: [
      'Soportar `DATABASE_URL` (o `DB_*` + `DB_SSL`) en `env.js` y pasar `ssl: { rejectUnauthorized: true }` al pool de `pg` cuando aplique; sin TLS contra el PostgreSQL de Docker.',
      'Actualizar `backend/.env.example` (quitar PlanetScale/MySQL, documentar las variables nuevas).',
      'Aplicar el esquema PostgreSQL en Neon de forma reproducible (`scripts/db/migrate.mjs` o documento).',
      'Crear `seed.prod.sql` con rutas, paradas y buses reales **sin** contraseñas conocidas; cuentas de prueba (admin, conductor, estudiante) con claves robustas.',
    ],
    aceptacion: [
      'El backend arranca contra Neon con TLS verificado y contra Docker sin cambiar el `.env` local.',
      'La BD de Neon tiene esquema y datos reales; no existe ningún usuario con clave de demo.',
    ],
    refs: 'Plan Nivel 1 · Charter §8 R4',
  },
  {
    id: 'D10', hito: 1, prio: 'P0', area: ['backend', 'infra'], nivel: 1, charter: true,
    titulo: 'Migrar el backend de MySQL a PostgreSQL (driver pg)',
    contexto: 'Neon solo ofrece PostgreSQL y el backend usa `mysql2` con SQL escrito a mano (~60 consultas en controladores, servicios y modelos), `database/schema.sql`, `database/seed.sql` y un `docker-compose.yml` con MySQL. Hay que cambiar el driver, los marcadores `?` por `$1…`, `insertId`/`affectedRows` por `RETURNING`/`rowCount`, `AUTO_INCREMENT` por identidad, `ENUM` y funciones de fecha propias de MySQL, y los backticks. Es la tarea con más riesgo del cambio de infraestructura: se hace primero y con pruebas.',
    tareas: [
      'Inventariar las consultas y construcciones propias de MySQL (`grep` de `?`, backticks, `insertId`, `NOW()`, `INTERVAL`, `ENUM`, `ON DUPLICATE KEY`) y registrarlas en el issue.',
      'Reemplazar `mysql2` por `pg` en `database.js` (pool, `connectDB`) conservando la misma forma de uso para los llamadores (helper `query` que devuelve filas).',
      'Adaptar controladores, servicios y modelos; cuidar los tipos (`DECIMAL`/`BIGINT` llegan como texto desde `pg`) y las zonas horarias de `ubicacion_bus`.',
      'Traducir `schema.sql` y `seed.sql` a PostgreSQL y cambiar `docker-compose.yml` a una imagen `postgres` (puerto de desarrollo documentado).',
      'Probar cada ruta de la API contra el PostgreSQL local, incluidas las de Socket.IO que escriben ubicaciones.',
    ],
    aceptacion: [
      '`mysql2` ya no está en `package.json` y `npm run lint` y `npm test` pasan.',
      'Login de los tres roles, CRUD de rutas/paradas/buses y envío de ubicación funcionan contra PostgreSQL local.',
    ],
    refs: 'Cambio de infraestructura del 07-nov-2026 (D-05, D-06)',
  },
  {
    id: 'D04', hito: 2, prio: 'P1', area: ['infra', 'backend'], nivel: 1,
    titulo: 'Dockerfile del backend',
    contexto: 'El plan sugiere un Dockerfile simple como evidencia de buenas prácticas. Hoy solo existe `docker-compose.yml` para la BD (el plan indica «sin Docker», lo que ya no es del todo cierto).',
    tareas: [
      'Crear `backend/Dockerfile` (node:22-alpine, `npm ci --omit=dev`, usuario no root, `CMD node src/server.js`) y `.dockerignore`.',
      'Añadir el servicio `api` opcional a `docker-compose.yml` (perfil `full`) para levantar BD + API con un comando.',
    ],
    aceptacion: [
      '`docker build` y `docker run` arrancan el backend con las variables de entorno.',
      'La imagen no incluye `.env` ni `node_modules` del host.',
    ],
    refs: 'Plan Nivel 1',
  },
  {
    id: 'D05', hito: 1, prio: 'P0', area: ['infra', 'backend'], nivel: 1, charter: true, deps: ['D02'],
    titulo: 'Desplegar el backend en Render (free) con render.yaml',
    contexto: 'Sustituye a ngrok. Condiciones de Render free (documentación consultada el 05-nov-2026): se suspende tras 15 min sin tráfico entrante, despierta en ~1 min, tiene 750 h/mes por workspace (un servicio 24/7 consume 744 h, por lo que **no debe haber otro servicio free en el mismo workspace**), sistema de archivos efímero y puede reiniciarse en cualquier momento. Desde el 24-feb-2026 los mensajes WebSocket entrantes cuentan como actividad.',
    tareas: [
      'Crear `render.yaml` (Web Service, `rootDir: backend`, build `npm ci`, start `npm start`, `healthCheckPath: /api/health`).',
      'Configurar variables: `DATABASE_URL` (Neon), `JWT_SECRET` nuevo, `JWT_EXPIRES_IN`, `CLIENT_URL` (dominio de Cloudflare + orígenes Capacitor).',
      'Elegir región cercana a Colombia y a la región de Neon para minimizar latencia. Render pide tarjeta al crear la cuenta: es un requisito previo.',
      'Documentar la limitación de suspensión en README y manual técnico.',
      'Verificar que el backend no guarda estado en disco ni depende de memoria entre reinicios (el socket debe reconectar solo).',
    ],
    aceptacion: [
      '`https://<servicio>.onrender.com/api/health` responde 200 con la BD de Neon.',
      'Login de los tres roles funciona contra el backend desplegado.',
    ],
    refs: 'Plan Nivel 1 · Charter Obj. Específico 4, §9',
  },
  {
    id: 'D06', hito: 2, prio: 'P1', area: ['infra', 'frontend'], nivel: 1, deps: ['D05'],
    titulo: 'Mitigar el arranque en frío: keep-alive y estado «servidor despertando»',
    contexto: 'Render free se suspende a los 15 min y tarda ~1 min en despertar; Neon free suspende el cómputo a los 5 min (despierta en segundos), pero un ping constante a la BD gastaría las 100 CU-horas mensuales, así que el keep-alive despierta solo a Render. Mientras el conductor transmite (cada 4 s) el servicio permanece activo; el riesgo es el tiempo sin nadie conectado.',
    tareas: [
      'Mantener `/api/health` ligero (sin consultar la BD) y devolver versión/commit; añadir `/api/health/db` con `SELECT 1` solo para comprobaciones manuales.',
      'Configurar un ping externo (cron-job.org) cada 10 min entre el 20-nov y el 05-dic y documentar cómo pausarlo.',
      'En el frontend: si la primera petición tarda o falla, mostrar «Despertando el servidor…» con reintento automático (en lugar de error).',
      'Asegurar reconexión de Socket.IO con backoff tras el despertar.',
    ],
    aceptacion: [
      'Con el servicio dormido, la app muestra el estado de espera y entra sola al despertar, sin recargar.',
      'Durante el horario de pruebas el servicio no se suspende.',
    ],
    refs: 'Plan Nivel 1 · Charter RNF respuesta < 3 s (excepción documentada)',
  },
  {
    id: 'D07', hito: 1, prio: 'P0', area: ['infra', 'frontend'], nivel: 1, charter: true, deps: ['D05', 'W01'],
    titulo: 'Frontend en Cloudflare apuntando al backend de Render',
    contexto: 'Por recomendación del profesor (07-nov-2026) el frontend pasa de Vercel a **Cloudflare** (Pages, plan gratuito: hasta 500 compilaciones al mes según la documentación consultada). Hay que conectar el repo, apuntarlo a Render y asegurar el fallback SPA con la landing en `/`.',
    tareas: [
      'Crear el proyecto en Cloudflare Pages desde GitHub (directorio raíz `frontend`, build `npm run build`, salida `dist`) con `VITE_API_URL=<render>`.',
      'Configurar el fallback SPA (`frontend/public/_redirects` con `/* /index.html 200`, a verificar) con la landing en `/` y rutas profundas (`/mapa`, `/admin/rutas`); retirar `vercel.json`.',
      'Añadir el dominio de Cloudflare (producción y previews si aplica) a `CLIENT_URL` del backend.',
    ],
    aceptacion: [
      'La URL pública de Cloudflare carga la landing, permite login y muestra el mapa contra Render/Neon.',
      'Recargar en una ruta profunda no da 404.',
    ],
    refs: 'Plan Nivel 1 · Charter §4 Módulo 4',
  },
  {
    id: 'D08', hito: 1, prio: 'P0', area: ['infra', 'qa'], nivel: 1, deps: ['D07'],
    titulo: 'Verificar WebSockets de extremo a extremo en Render free',
    contexto: 'El plan marca los WebSockets en el plan free como «no garantizados». Render cambió su política en feb-2026, pero hay reportes anteriores de cierres a los 5 min. No se asume: se comprueba con el flujo real conductor → servidor → estudiante.',
    tareas: [
      'Con dos dispositivos: conductor emite posición y estudiante la ve en el mapa; medir latencia de propagación (meta 3–4 s, tope 30 s).',
      'Probar 30 min continuos, cambio de red wifi/datos y reconexión tras suspensión.',
      'Comprobar el transporte usado (websocket vs polling) y, si es necesario, forzar `transports: [polling, websocket]` en cliente y servidor.',
      'Registrar resultados en `docs/07_pruebas_qa.md`; si falla, activar el plan B (otra plataforma) y abrir issue.',
    ],
    aceptacion: [
      'Evidencia (tabla de mediciones o video) de que la posición llega en ≤ 4 s en condiciones normales.',
      'Decisión documentada: Render se mantiene o se cambia.',
    ],
    refs: 'Plan Nivel 1 · Charter Obj. General (GPS 3–4 s), §3.1',
  },
  {
    id: 'D09', hito: 2, prio: 'P1', area: ['backend', 'infra'], nivel: 1, deps: ['B03'],
    titulo: 'Endurecer producción: CORS estricto, helmet y secretos',
    contexto: 'En producción no deben aceptarse orígenes LAN ni ngrok; hoy esa lógica está duplicada y condicionada solo por `NODE_ENV`.',
    tareas: [
      'En producción permitir únicamente `CLIENT_URL` + orígenes Capacitor; LAN/ngrok solo en desarrollo.',
      'Añadir `helmet` y revisar `express-rate-limit` en `/api/auth`.',
      'Rotar `JWT_SECRET`, confirmar que `.env` nunca se versiona y que `check_users.mjs` no contiene credenciales.',
    ],
    aceptacion: [
      'Una petición con `Origin` desconocido recibe error CORS en producción.',
      'Auditoría rápida de secretos sin hallazgos (`git log -p | grep` de patrones comunes).',
    ],
    refs: 'Plan Nivel 4 (DRY) · Charter §8',
  },

  // ───────────────────────── Autenticación ─────────────────────────
  {
    id: 'A01', hito: 2, prio: 'P0', area: ['backend', 'frontend'], charter: true, deps: ['D05'],
    titulo: 'Registro solo con correo institucional (@unicesar.edu.co) y verificación de titularidad',
    contexto: 'Requisito nuevo: la cuenta de estudiante solo puede crearse con un correo institucional del dominio `unicesar.edu.co` (cuentas de Microsoft 365 de la universidad). Hoy `POST /api/auth/registro` acepta cualquier correo (el frontend solo comprueba el formato), crea la cuenta activa al instante y devuelve el token sin comprobar que quien se registra controla ese buzón; además el endpoint no tiene límite de intentos (solo `/login` lo tiene). **Validar el dominio es trivial pero no prueba titularidad:** cualquiera puede escribir el correo de otra persona. El método de verificación queda por decidir en el spike de este issue. Restricciones ya comprobadas: Render free **bloquea el SMTP saliente** (puertos 25, 465 y 587) desde sept-2025, así que el correo debe enviarse por API HTTPS; y el inicio de sesión con Microsoft depende de la política de consentimiento del tenant de la universidad, que desconocemos (puede exigir aprobación del administrador para apps sin editor verificado). Hasta que este issue esté hecho, el registro del despliegue público acepta cualquier correo: no difundir la URL.',
    tareas: [
      '**Spike (1 día, límite estricto).** Opción A, código por correo con API HTTPS: enviar un código de prueba a un buzón real `@unicesar.edu.co` desde el proveedor candidato (Gmail API con la cuenta del equipo, Brevo u otro con plan gratuito vigente) y anotar si llega a Recibidos, a Correo no deseado o es rechazado por Microsoft 365; anotar los límites del plan gratuito con fecha.',
      '**Spike.** Opción B, iniciar sesión con Microsoft (OIDC): registrar una app en Entra ID (multi-tenant), intentar entrar con una cuenta `@unicesar.edu.co` y anotar si pide aprobación del administrador; estimar el esfuerzo del flujo nativo (callback en el backend, `@capacitor/browser` y esquema de URL).',
      '**Spike.** Opción C, sin envío de correo: dominio permitido + cuenta inactiva hasta que un administrador la apruebe en Gestión de usuarios (ya existe el campo `activo`). No prueba titularidad: solo si A y B no son viables.',
      'Registrar la decisión (método, motivo y fecha) en este issue y en `docs/12_ruta_trabajo_semestre.md`. Criterio por defecto: A si el correo llega a Recibidos; B si el consentimiento funciona sin aprobación del administrador y el flujo nativo cuesta ≤ 2 días; C como último recurso.',
      'Backend: validar el dominio **en el servidor** (nunca solo en el cliente): normalizar (`trim`, minúsculas), tomar el dominio tras la **última** `@` y compararlo por igualdad exacta con la variable `DOMINIOS_CORREO_PERMITIDOS` (por defecto `unicesar.edu.co`). Debe rechazar `x@unicesar.edu.co.evil.com`, `x@evilunicesar.edu.co`, `x@sub.unicesar.edu.co` (salvo que se liste) y caracteres Unicode engañosos.',
      'Backend: `registroController` deja de devolver el token mientras el correo no esté verificado (métodos A y B): la cuenta nace sin acceso hasta completar la verificación.',
      'Backend: límite de intentos en `/api/auth/registro` y en la verificación/reenvío de códigos (hoy solo `/login` tiene `loginRateLimit`), para que el envío de correo no sirva de vector de abuso.',
      'Si se elige A: guardar solo el **hash** del código, con expiración de 10–15 min, máximo 5 intentos y un solo uso; endpoints de verificación y reenvío; la clave del proveedor va en variable de entorno, nunca en el repo.',
      'Frontend (`Registro.jsx`): placeholder `usuario@unicesar.edu.co`, validación del dominio con mensaje claro («Usa tu correo institucional @unicesar.edu.co»), pantalla «Revisa tu correo» con campo de código y reenvío con espera; debe funcionar en la PWA y en el APK.',
      'Alcance: la restricción aplica al **registro público** (estudiantes). Conductores y administradores los crea un administrador y pueden usar otro correo; confirmar este punto (el seed usa `@upc.edu.co`, que no pasaría el filtro, y no cambia).',
      'Pruebas con `node:test` de la validación de dominio (incluidos los casos de suplantación) y del flujo de verificación; actualizar `docs/04_manual_usuario.md` y `backend/.env.example`.',
    ],
    aceptacion: [
      'Un correo fuera de `unicesar.edu.co` es rechazado por el servidor con un mensaje claro aunque se salte el formulario (probado con `curl`).',
      'No se puede iniciar sesión ni obtener token con un correo institucional sin verificar (métodos A y B).',
      'Los casos de suplantación de dominio están cubiertos por pruebas automáticas.',
      'El flujo completo funciona en Render + Neon y en el APK con un buzón `@unicesar.edu.co` real.',
      'El charter v2 recoge el requisito (ver Q01).',
    ],
    refs: 'Charter §4 Módulo 1 (requisito nuevo a mitad de semestre, ver R3) · Plan Nivel 1',
  },

  // ───────────────────────── Backend: capas, patrones y código limpio ─────────────────────────
  {
    id: 'B01', hito: 3, prio: 'P0', area: ['backend'], nivel: 2,
    titulo: 'Extraer busService: sacar SQL de busController (SRP)',
    contexto: '`crearBus`, `editarBus` y `eliminarBus` ejecutan SQL directo con `await import(...).pool.query` dentro del controller, rompiendo la regla routes → controllers → services → models.',
    tareas: [
      'Crear `backend/src/services/busService.js` con `crear`, `editar` (incluye reasignación de `bus_ruta`) y `eliminar`; usar transacción para editar+reasignar.',
      'Reducir el controller a validación HTTP + llamada al servicio + mapeo de errores.',
      'Eliminar los `await import` dinámicos del pool.',
    ],
    aceptacion: [
      '`grep -n pool backend/src/controllers/busController.js` no devuelve resultados.',
      'Los endpoints POST/PATCH/DELETE `/api/buses` responden igual que antes (colección de Postman).',
    ],
    refs: 'Plan Nivel 2 y 4 (SRP)',
  },
  {
    id: 'B02', hito: 3, prio: 'P1', area: ['backend'], nivel: 2, deps: ['B01'],
    titulo: 'Extender la capa de servicios a usuario, ruta, notificación y logout',
    contexto: 'La auditoría del código muestra que el problema es mayor que el descrito en el plan: `usuarioController` tiene ~10 consultas directas, y `rutaController`, `notificacionController` y `logoutController` también usan `pool`.',
    tareas: [
      'Crear `usuarioService`, `rutaService` y mover consultas de `notificacionController` al modelo/servicio.',
      'Mover el reseteo de bus en `logoutController` a `busService`/`authService`.',
      'Reflejar el alcance real (más que el plan original) en el manual técnico.',
    ],
    aceptacion: [
      '`grep -rn "pool" backend/src/controllers` no devuelve resultados.',
      'La colección de Postman pasa sin cambios.',
    ],
    refs: 'Plan Nivel 2 y 4 · alcance ampliado respecto al plan',
  },
  {
    id: 'B03', hito: 1, prio: 'P0', area: ['backend'], nivel: 4,
    titulo: 'Extraer utils/cors.js (DRY) e incluir los orígenes de la app nativa',
    contexto: '`esOrigenLan`, `esOrigenNgrok` y `origenPermitido` están copiadas idénticas en `app.js` y `server.js`. Además, la WebView de Android sirve la app desde `https://localhost` (iOS: `capacitor://localhost`), orígenes que hoy solo pasarían por la regla «LAN en desarrollo», no en producción.',
    tareas: [
      'Crear `backend/src/utils/cors.js` exportando `origenPermitido` y un `corsOptions` reutilizable.',
      'Importarlo desde `app.js` y `server.js` (Express y Socket.IO).',
      'Permitir explícitamente `https://localhost`, `capacitor://localhost` y `http://localhost` en todos los entornos.',
      'Documentar el valor final de `CLIENT_URL` (Cloudflare + orígenes nativos) en `.env.example`.',
    ],
    aceptacion: [
      'Las tres funciones existen en un único archivo.',
      'CORS y Socket.IO mantienen su comportamiento actual (Postman/manual).',
      'Login y WebSocket funcionan desde el APK contra el backend desplegado (se confirma en M11).',
    ],
    refs: 'Plan Nivel 4 (DRY) y Nivel 1 (Capacitor)',
  },
  {
    id: 'B05', hito: 3, prio: 'P1', area: ['backend'], nivel: 5, deps: ['B02'],
    titulo: 'Manejo de errores centralizado (helper + middleware)',
    contexto: 'El patrón `console.error(...); return res.status(500).json({ error })` se repite en cada handler.',
    tareas: [
      'Crear `utils/httpError.js` (errores con status) y un `errorHandler` final en `app.js`.',
      'Envolver handlers async (`asyncHandler`) y migrar controllers sin cambiar los códigos de respuesta.',
    ],
    aceptacion: [
      'Se elimina el bloque try/catch repetido en los controllers migrados.',
      'Las respuestas de error conservan forma `{ error: string }`.',
    ],
    refs: 'Plan Nivel 5',
  },
  {
    id: 'B07', hito: 2, prio: 'P1', area: ['frontend'], nivel: 3,
    titulo: 'Patrón Strategy para el cálculo de ETA',
    contexto: '`frontend/src/utils/calcularETA.js` mezcla la selección del bus y el algoritmo (Haversine a 25 km/h fijos). No hay punto de extensión (OCP).',
    tareas: [
      'Definir una interfaz de estrategia `{ nombre, estimar(parada, bus) }` y mover el cálculo actual a `LinealStrategy`.',
      '`calcularETA(parada, buses, estrategia = lineal)` recibe la estrategia por parámetro.',
      'Pruebas unitarias del cálculo (Vitest) con casos de distancia cero, sin buses y bus detenido.',
    ],
    aceptacion: [
      'Cambiar de estrategia no requiere editar a quien invoca `calcularETA`.',
      'Resultados idénticos a los actuales con la estrategia lineal.',
    ],
    refs: 'Plan Nivel 3 (Strategy) y Nivel 4 (OCP)',
  },
  {
    id: 'B10', hito: 3, prio: 'P1', area: ['backend', 'qa'], nivel: 5, charter: true, deps: ['B01'],
    titulo: 'Pruebas automáticas mínimas del backend (servicios y auth)',
    contexto: 'El charter exige evidencia de pruebas QA y no hay ninguna prueba automatizada. Tras extraer servicios (B01) se pueden probar sin HTTP.',
    tareas: [
      'Usar `node:test` + `supertest` en el backend (sin transpilación); Vitest queda solo para utilidades del frontend como el ETA.',
      'Cubrir: login (3 roles, clave errónea, bloqueo), CRUD de buses, cambio de estado + notificación.',
      'Ejecutar en CI contra MySQL de servicio (GitHub Actions `services: mysql`).',
    ],
    aceptacion: [
      '≥ 15 pruebas pasan en CI.',
      'El reporte queda enlazado en `docs/07_pruebas_qa.md`.',
    ],
    refs: 'Charter §10 criterio 2',
  },

  // ───────────────────────── Diseño y UX móvil ─────────────────────────
  {
    id: 'U01', hito: 1, prio: 'P0', area: ['diseno', 'frontend'], charter: true,
    titulo: 'Auditoría de diseño móvil-first de todas las pantallas',
    contexto: 'Punto de partida medido: 4.447 líneas de CSS en 16 hojas; `#1e6b2e` repetido 77 veces como valor fijo frente a 5 variables de tema; variables huérfanas de la plantilla de Vite (`--border`, `--accent`, `--text-h`, `--social-bg`, `--shadow`); navegación tipo sidebar de escritorio con hamburguesa; `min-height: 36px` en botones (el propio comentario habla de 44 px); solo un uso de `safe-area-inset`; tipografía desde Google Fonts (no disponible sin red en APK); emojis como iconos (`🚌`, `🚧`); un solo `aria-label` en `Layout.jsx` (botones de icono con `title`).',
    tareas: [
      'Recorrer las 3 experiencias (estudiante, conductor, admin) a 360, 390 y 768 px, modo claro/oscuro, y capturar evidencia.',
      'Evaluar jerarquía, tipografía, color/contraste, espaciado, táctil, estados vacíos/error/carga/offline, movimiento y accesibilidad.',
      'Entregar `docs/13_auditoria_diseno.md` con hallazgos por severidad (P0–P3), pantalla, captura y propuesta de arreglo.',
      'Convertir los hallazgos P0/P1 en tareas dentro de U02–U10 (ajustar alcance de esos issues).',
    ],
    aceptacion: [
      'Documento de auditoría revisado por el equipo.',
      'Cada hallazgo P0/P1 está enlazado a un issue.',
      'Las capturas «antes» quedan como evidencia de diseño del charter.',
    ],
    refs: 'Charter Obj. Específico 1 y §10.2',
  },
  {
    id: 'U02', hito: 2, prio: 'P0', area: ['diseno', 'frontend'], deps: ['U01'],
    titulo: 'Sistema de tokens de diseño, tema claro/oscuro y fuentes locales',
    contexto: 'Los colores, radios y sombras están repartidos y duplicados entre hojas; el tema se aplica con `body[data-tema]`. Decisión de dirección visual: la app adopta la identidad de la landing (verde UPC + amarillo de señalética de transporte) en registro **producto** —sobrio, denso en información, sin los efectos de la landing—. Las fuentes deben ir empaquetadas: `index.html` carga Inter desde Google Fonts y el APK sin red cambiaría de tipografía.',
    tareas: [
      'Crear `frontend/src/styles/tokens.css` con colores (marca verde/amarillo UPC, semánticos, superficies), espaciado, radios, sombras, tipografía y z-index.',
      'Reemplazar los valores fijos y las variables huérfanas; limpiar `App.css` heredado de la plantilla.',
      'Respetar `prefers-color-scheme` como valor inicial del tema y mantener la preferencia guardada.',
      'Alinear la paleta con la de la landing para una identidad única.',
      'Reemplazar el `<link>` de Google Fonts por `@fontsource-variable` (familia elegida) y limpiar la regla de caché de Google Fonts del service worker.',
      'Sustituir los emojis restantes (`🚌`, `🚧`) por iconos coherentes (Font Awesome ya es local).',
    ],
    aceptacion: [
      'No quedan colores hexadecimales fijos en hojas de páginas (solo en `tokens.css`).',
      'Contraste mínimo AA en ambos temas para texto y controles.',
    ],
    refs: 'Auditoría U01',
  },
  {
    id: 'U03', hito: 2, prio: 'P0', area: ['diseno', 'frontend', 'movil'], deps: ['U01'],
    titulo: 'Navegación móvil: barra inferior por rol y base táctil',
    contexto: '`Layout.jsx` usa sidebar con overlay + hamburguesa, patrón de escritorio (482 líneas con audio, notificaciones, banners y toasts). En móvil la navegación debe estar al alcance del pulgar, y la app debe comportarse como nativa dentro de Capacitor (hoy solo `GestionRutas` usa `env(safe-area-inset-bottom)`).',
    tareas: [
      'Barra inferior (3–5 destinos por rol) en < 1024 px; sidebar solo en pantallas anchas; cabecera compacta con tema y configuración movidos al perfil.',
      'Extraer de `Layout.jsx` los banners PWA y los toasts a componentes propios; avatar como `<button>`; cerrar menús con `Escape`/clic fuera.',
      '`env(safe-area-inset-*)` en cabecera, barra inferior, toasts y hojas; `100dvh` en layouts de pantalla completa.',
      'Objetivos táctiles ≥ 44×44 px, `touch-action: manipulation`, sin resaltado táctil, `overscroll-behavior` sobre el mapa, `:hover` solo bajo `@media (hover: hover)`; quitar el `!important` de los inputs de 16 px.',
    ],
    aceptacion: [
      'Se llega a cualquier sección principal con una mano en 360 px sin regresiones de rutas por rol.',
      'Sin contenido bajo el notch/barra de gestos; Lighthouse móvil sin fallos de «tap targets».',
    ],
    refs: 'Auditoría U01',
  },
  {
    id: 'U05', hito: 3, prio: 'P1', area: ['diseno', 'frontend'], deps: ['U03'],
    titulo: 'Mapa en tiempo real optimizado para móvil (hoja inferior)',
    contexto: '`MapaTiempoReal.css` (575 líneas) es la pantalla central del producto y la más usada por estudiantes en la parada.',
    tareas: [
      'Mapa a pantalla completa con hoja inferior arrastrable (buses, ETA, filtros) y controles al alcance del pulgar.',
      'Marcadores legibles al sol (contraste, tamaño), centrado en «mi ubicación» y en el bus seguido.',
      'Estados: sin buses en servicio, sin GPS, sin conexión, cargando.',
    ],
    aceptacion: [
      'ETA del bus más cercano visible sin abrir menús.',
      'Fluidez ≥ 50 fps al arrastrar la hoja en un Android de gama baja.',
    ],
    refs: 'Auditoría U01',
  },
  {
    id: 'U06', hito: 2, prio: 'P0', area: ['diseno', 'frontend'], deps: ['U02'],
    titulo: 'Pantalla del conductor (Mi recorrido) pensada para uso en vehículo',
    contexto: '`MiRecorrido.css` es la hoja más larga (626 líneas). El conductor usa el teléfono en marcha: poca lectura, controles grandes, estado del GPS siempre visible.',
    tareas: [
      'Botón principal grande «Iniciar/Detener recorrido», estado de GPS/conexión/precisión en cabecera fija.',
      'Reducir texto y bloques; registro de eventos plegable.',
      'Mantener la pantalla encendida durante el recorrido con la **Wake Lock API** (disponible en la WebView de Android); si falla en pruebas, usar un plugin keep-awake compatible con Capacitor 7.',
      'Indicar en pantalla «Mantén la app abierta y el teléfono cargando» mientras el recorrido está activo.',
    ],
    aceptacion: [
      'Iniciar y detener el recorrido requiere un solo toque grande.',
      'Estado de GPS comprensible sin leer texto.',
    ],
    refs: 'Auditoría U01 · Charter Módulo 2',
  },
  {
    id: 'U07', hito: 3, prio: 'P1', area: ['diseno', 'frontend'], deps: ['U02', 'U03'],
    titulo: 'Login, registro y pantallas de estudiante en móvil',
    contexto: 'Login/Registro y Dashboard, Rutas, Buses, Notificaciones, Perfil son las pantallas de primer contacto.',
    tareas: [
      'Formularios con `autocomplete`, `inputmode`, `enterkeyhint`, mensajes de error junto al campo y teclado que no tapa el botón principal.',
      'Mostrar/ocultar contraseña; sin bloqueo por zoom.',
      'Dashboard/Rutas/Buses/Notificaciones/Perfil con tarjetas, jerarquía clara y estados vacíos útiles.',
    ],
    aceptacion: [
      'Login completable en < 20 s en móvil sin zoom ni scroll horizontal.',
      'Sin desbordes horizontales en 320 px.',
    ],
    refs: 'Auditoría U01',
  },
  {
    id: 'U09', hito: 3, prio: 'P1', area: ['diseno', 'frontend'], deps: ['U02', 'D06'],
    titulo: 'Estados de interfaz: carga, vacío, error y sin conexión consistentes',
    contexto: 'Hoy cada página resuelve sus estados a su manera y `App.jsx` conserva un `Placeholder` «🚧 En construcción».',
    tareas: [
      'Componentes `Skeleton`, `EmptyState`, `ErrorState` y `OfflineBanner` reutilizables.',
      'Aplicarlos en mapa, rutas, buses, notificaciones y paneles.',
      'Quitar el `Placeholder` y los emojis; pruebas con `prefers-reduced-motion`.',
    ],
    aceptacion: [
      'Ninguna pantalla queda en blanco ante error de red.',
      'Mismo patrón visual de estados en todas las pantallas.',
    ],
    refs: 'Auditoría U01',
  },
  {
    id: 'U10', hito: 3, prio: 'P1', area: ['diseno', 'frontend'], charter: true,
    titulo: 'Accesibilidad básica (WCAG 2.1 AA) en flujos principales',
    contexto: 'Hallazgos iniciales: botones solo con icono y `title` (sin `aria-label`), avatar como `div` clicable, sin gestión de foco en paneles, sin `role="status"` en toasts.',
    tareas: [
      'Etiquetas accesibles, orden de foco, `aria-live` en toasts/notificaciones, roles de diálogo.',
      'Contraste AA en ambos temas; no depender solo del color para el estado del bus.',
      'Verificar con Lighthouse/axe y TalkBack en Android.',
    ],
    aceptacion: [
      'Lighthouse Accesibilidad ≥ 90 en login, mapa y mi recorrido.',
      'Recorrido completo del login al mapa con TalkBack.',
    ],
    refs: 'Charter §10 criterio 4 (ISO/IEC 25010: usabilidad)',
  },

  // ───────────────────────── Capacitor (APK Android) ─────────────────────────
  {
    id: 'M01', hito: 2, prio: 'P0', area: ['movil', 'frontend'], nivel: 1, charter: true, deps: ['W01', 'D07'],
    titulo: 'Preparar el frontend para ejecutarse dentro de Capacitor',
    contexto: '`api.js` y `socket.js` usan `VITE_API_URL` y, si está vacío, rutas relativas: dentro de la WebView (`https://localhost`) las peticiones relativas no llegan al backend. Además el service worker de VitePWA no aplica en nativo.',
    tareas: [
      'Hacer obligatoria una `VITE_API_URL` absoluta en el build nativo (fallar el build si falta).',
      'Crear modo `vite build --mode native`: sin registro de SW, sin banner de instalación PWA, sin landing (arranca en `/login`).',
      'Detectar plataforma con `Capacitor.isNativePlatform()` en un módulo `platform.js`.',
      'Verificar `BrowserRouter` y el fallback de rutas dentro de la WebView.',
    ],
    aceptacion: [
      'El build nativo apunta al backend de Render y el login funciona en un emulador.',
      'La versión web/PWA no cambia su comportamiento.',
    ],
    refs: 'Plan Nivel 1 (Capacitor) · Charter §4.1 (enmienda Q01)',
  },
  {
    id: 'M03', hito: 2, prio: 'P0', area: ['movil', 'frontend'], nivel: 1, charter: true, deps: ['M01'],
    titulo: 'Inicializar Capacitor y generar el proyecto Android',
    contexto: 'Siguiendo el plan: `@capacitor/core`, `@capacitor/cli`, `cap init`, `cap add android`. **Decisión: Capacitor 7.x.** Requiere Node ≥ 20, JDK 21, Android Studio Ladybug 2024.2.1 o superior, `minSdk` 23 y `targetSdk` 35 (documentación oficial de migración a 7). No se salta a una versión mayor sin verificar sus requisitos y la compatibilidad de los plugins de ubicación.',
    tareas: [
      'Instalar Capacitor 7 en `frontend/`, crear `capacitor.config.ts` (`appId: co.edu.unicesar.upctrack`, `appName: UpcTrack`, `webDir: dist`, `androidScheme: https`).',
      'Versionar `android/` ignorando artefactos de build; scripts `build:native`, `cap:sync`, `cap:open`.',
      'Documentar requisitos del entorno (JDK, Android Studio, SDK) según la versión de Capacitor elegida.',
    ],
    aceptacion: [
      '`npm run build:native && npx cap sync android` y la app abre en el emulador.',
      'Un compañero reproduce el proceso solo con el README.',
    ],
    refs: 'Plan Nivel 1 (pasos previstos)',
  },
  {
    id: 'M04', hito: 2, prio: 'P0', area: ['movil', 'frontend'], nivel: 3, deps: ['M03'],
    titulo: 'Capa de geolocalización (Adapter) con plugin nativo y permisos Android',
    contexto: '`MiRecorrido.jsx` y `GestionRutas.jsx` llaman a `navigator.geolocation` directamente.',
    tareas: [
      'Crear `services/geolocation.js` con `watchPosition/getCurrentPosition/clearWatch` que usa `@capacitor/geolocation` en nativo y la API web en navegador.',
      'Declarar `ACCESS_FINE_LOCATION` y `ACCESS_COARSE_LOCATION` y manejar permiso denegado con mensajes claros.',
      'Mantener el intervalo de envío de 4 s (`INTERVALO_ENVIO_MS`), que ya cumple la meta técnica de 3–4 s del charter.',
      'Migrar ambas pantallas al adaptador.',
    ],
    aceptacion: [
      'El conductor transmite su posición desde el APK y el estudiante la ve en el mapa.',
      'Con el permiso denegado la app explica cómo activarlo.',
    ],
    refs: 'Plan Nivel 1 (`@capacitor/geolocation`) · Patrón Adapter',
  },
  {
    id: 'M05', hito: 3, prio: 'P2', area: ['movil'], deps: ['M04', 'U06'],
    titulo: 'Opcional: seguimiento del conductor con la pantalla bloqueada (spike de 1 día)',
    contexto: 'Decisión de alcance: el recorrido **garantizado** es con la app en primer plano, pantalla encendida (Wake Lock, U06) y el teléfono cargando. El seguimiento con pantalla bloqueada es opcional porque es frágil: `@capacitor/geolocation` no cubre segundo plano; `@capacitor-community/background-geolocation` documenta soporte solo hasta Capacitor 6; `@capgo/background-geolocation` declara soporte para Capacitor 7 (con un ajuste de bridge en Android); y aun con GPS en servicio en primer plano, Android limita las peticiones de red de la WebView tras ~5 min en segundo plano, por lo que el Socket.IO podría detenerse igual.',
    tareas: [
      'Spike con límite de 1 día: probar `@capgo/background-geolocation` en Capacitor 7 con permisos `ACCESS_BACKGROUND_LOCATION` y servicio en primer plano.',
      'Medir si la posición llega al estudiante tras 15 min con la pantalla bloqueada; si el socket se detiene, evaluar envío por HTTP nativo.',
      'Si no funciona dentro del límite, cerrar el issue documentando la limitación.',
    ],
    aceptacion: [
      'Resultado del spike (funciona / no funciona) documentado en el manual técnico.',
      'El manual de usuario del conductor indica mantener la app abierta y el teléfono cargando.',
    ],
    refs: 'Plan Nivel 1 (corrige la afirmación sobre segundo plano)',
  },
  {
    id: 'M06', hito: 3, prio: 'P1', area: ['movil', 'frontend'], deps: ['M03'],
    titulo: 'Notificaciones nativas (local notifications) en lugar de Notification API',
    contexto: '`Layout.jsx` usa `new Notification(...)`, que no está disponible en la WebView de Android; en Android 13+ además requiere el permiso `POST_NOTIFICATIONS`.',
    tareas: [
      'Integrar `@capacitor/local-notifications` y solicitar el permiso en un momento oportuno (no al montar).',
      'Mostrar la notificación al llegar `notificacion:nueva` por socket con la app abierta o en segundo plano reciente.',
      'Decisión: sin push remoto (FCM) en este semestre. La app avisa mientras está abierta o en segundo plano reciente, y el manual lo declara como limitación.',
    ],
    aceptacion: [
      'Al cambiar el estado de un bus, el estudiante recibe la notificación en el APK.',
    ],
    refs: 'Plan Nivel 3 (Factory, opcional)',
  },
  {
    id: 'M08', hito: 3, prio: 'P1', area: ['movil', 'diseno'], deps: ['M03', 'U02'],
    titulo: 'Identidad nativa: ícono adaptativo, splash y barra de estado',
    contexto: 'Hay íconos PWA (`pwa-*.png`, maskable) pero no recursos nativos.',
    tareas: [
      'Generar íconos y splash con `@capacitor/assets` a partir del logo UpcTrack.',
      'Configurar `@capacitor/status-bar` y `@capacitor/splash-screen` coherentes con el tema.',
      'Unificar el nombre de la app (hoy «BusUPCSA», «Monitoreo de Rutas — UPCSA» y «UpcTrack» conviven).',
    ],
    aceptacion: ['La app instalada muestra ícono y nombre correctos y sin parpadeo blanco al iniciar.'],
    refs: 'Auditoría U01',
  },
  {
    id: 'M09', hito: 3, prio: 'P1', area: ['movil', 'frontend'], deps: ['M03'],
    titulo: 'Ciclo de vida nativo: reconexión, botón atrás y red',
    contexto: 'Al volver de segundo plano el socket puede quedar muerto; el botón atrás de Android debe respetar la navegación.',
    tareas: [
      'Con `@capacitor/app`: reconectar socket y refrescar datos en `appStateChange`; manejar `backButton` (salir solo desde la raíz).',
      'Con `@capacitor/network`: sustituir `online/offline` del navegador por el estado nativo.',
    ],
    aceptacion: ['Tras 5 min en segundo plano la app recupera datos sin intervención.'],
    refs: 'Plan Nivel 1',
  },
  {
    id: 'M10', hito: 3, prio: 'P0', area: ['movil', 'infra'], nivel: 1, charter: true, deps: ['M03'],
    titulo: 'Compilar el APK firmado y publicarlo como artefacto/Release',
    contexto: 'Entregable comprometido (charter v2). La publicación en Play Store sigue fuera de alcance: se distribuye por descarga directa.',
    tareas: [
      'Generar keystore del equipo (guardada fuera del repo) y configurar la firma de release en Gradle mediante variables.',
      'Workflow `android.yml` (manual/tag) que compile el APK y lo adjunte como artefacto y a la Release.',
      'Instrucciones de instalación (habilitar orígenes desconocidos) para el manual de usuario.',
    ],
    aceptacion: [
      'Un APK firmado se instala en un dispositivo ajeno al equipo y abre el login.',
      'El keystore no está en el repositorio.',
    ],
    refs: 'Charter §4.1 (v2) · Plan Nivel 1',
  },
  {
    id: 'M11', hito: 3, prio: 'P0', area: ['movil', 'qa'], charter: true, deps: ['M10'],
    titulo: 'Pruebas del APK en dispositivos reales',
    contexto: 'Los emuladores no reflejan GPS, batería ni ahorro de energía.',
    tareas: [
      'Matriz mínima: 3 dispositivos (gama baja/media, Android 10–14) × (estudiante, conductor).',
      'Casos: instalación, login, permisos, mapa, ETA, recorrido de 20 min, bloqueo de pantalla, cambio wifi/datos, notificaciones.',
      'Registrar resultados y video en `docs/07_pruebas_qa.md`.',
    ],
    aceptacion: [
      'Matriz completa con resultado por celda y defectos como issues.',
      'Cero defectos P0 abiertos al congelar el código.',
    ],
    refs: 'Charter §10 criterio 2',
  },

  // ───────────────────────── QA, documentación y entrega ─────────────────────────
  {
    id: 'Q01', hito: 1, prio: 'P0', area: ['docs'], charter: true,
    titulo: 'Enmendar el Project Charter (v2): nube gratuita y APK Android',
    contexto: 'El charter vigente contradice las decisiones tomadas: Obj. Específico 4 y Módulo 4 fijan Vercel + Ngrok (v1); §4.1 deja Capacitor fuera de alcance; §7.1, §8 (R4), §9 y el cronograma (Sprint 4) también mencionan Ngrok. Como el charter es la entrega final, debe reflejar lo que realmente se construye.',
    tareas: [
      'Crear versión 2 con tabla de control de cambios (fecha, motivo, secciones).',
      'Obj. Específico 4 / Módulo 4 / §9: Cloudflare + Render + Neon (PostgreSQL); ngrok queda como contingencia local. §9: la gestión ágil pasa de Jira a GitHub Projects (fuente única de verdad).',
      'Módulo 3 / §4.1: Capacitor pasa a In-Scope como **APK Android instalable**; tiendas (Play/App Store) e iOS compilado siguen Out-of-Scope.',
      'Actualizar §6 (Sprint 4/5), §7.1 (servicios Render/Neon), §8 (R4: suspensión de Render, suspensión de Neon a los 5 min; nuevo riesgo: GPS con pantalla bloqueada en el APK) y §10 (criterio: APK instalable).',
      'Definir en §2.2 cómo se mide cada meta: «satisfacción ≥ 80 %» = al menos 80 % de los participantes puntúan 4 o 5 sobre 5 en la pregunta global; los tiempos se miden con el cronómetro de la sesión (Q03); el RNF de respuesta < 3 s se mide con el servicio despierto y el primer arranque en frío (~1 min) se declara excepción.',
      'Marcar el documento como «v2 — cambios propuestos, pendiente de aprobación del docente» y listar en el control de cambios qué se desvía del v1.',
      'Módulo 1 (Autenticación): añadir el registro restringido a correo institucional `@unicesar.edu.co` con verificación de titularidad como requisito nuevo a mitad de semestre, tratado según el riesgo R3 (A01).',
      'Reflejar en §8 R2 que el equipo activo hoy es de una persona y cómo se mitiga (recorte por prioridades, CI obligatorio).',
    ],
    aceptacion: [
      'Ninguna sección del charter contradice el plan de arquitectura ni el código.',
      'El control de cambios deja constancia de que la aprobación del docente está pendiente.',
    ],
    refs: 'Charter completo · Plan Nivel 1',
  },
  {
    id: 'Q02', hito: 4, prio: 'P0', area: ['qa'], charter: true, deps: ['D08', 'M11'],
    titulo: 'Ejecutar las checklists de RF y RNF sobre el entorno desplegado',
    contexto: 'Existen `docs/checklist_validacion_rf.md` y `checklist_validacion_rnf.md`, que deben validarse contra la nube real, no solo en local.',
    tareas: [
      'Ejecutar cada ítem en Cloudflare+Render+Neon y en el APK; adjuntar evidencia.',
      'Medir RNF críticos: tiempo de respuesta < 3 s (anotando la excepción del primer arranque en frío) y propagación GPS 3–4 s.',
      'Abrir issue por cada incumplimiento y decidir corrección o excepción documentada.',
    ],
    aceptacion: [
      '100 % de RF Must validados; RNF con evidencia o excepción justificada.',
    ],
    refs: 'Charter §10 criterio 2',
  },
  {
    id: 'Q03', hito: 4, prio: 'P1', area: ['qa', 'docs'], charter: true, deps: ['M10'],
    titulo: 'Pruebas de usabilidad y aceptación con usuarios de la UPC',
    contexto: 'El charter fija metas: ≥ 80 % de satisfacción, −50 % tiempo de consulta, y validación con usuarios finales (Obj. Específico 4).',
    tareas: [
      'Guion de tareas (ver bus más cercano, ETA a una parada, iniciar recorrido como conductor), encuesta SUS y la pregunta global de satisfacción 1–5 definida en Q01.',
      'Sesiones con ≥ 8 estudiantes y ≥ 2 conductores. Calendario: PWA entre el 23 y el 27-nov (antes del congelamiento) y comprobación final del APK hasta el 02-dic; tras el 01-dic solo se corrigen defectos P0.',
      'Informe con resultados frente a las metas del charter.',
    ],
    aceptacion: ['Informe con métricas; si no se alcanza la meta, análisis y acciones.'],
    refs: 'Charter §2.2, Obj. Específico 4',
  },
  {
    id: 'Q04', hito: 4, prio: 'P0', area: ['docs'], charter: true, deps: ['Q01'],
    titulo: 'Actualizar README, manuales y documentación a la nueva arquitectura y cerrar el plan',
    contexto: 'README y docs siguen describiendo ngrok, PlanetScale y «sin Docker».',
    tareas: [
      'README: nueva arquitectura, arranque local, despliegue Render/Neon/Cloudflare y APK; quitar ngrok/PlanetScale como camino principal.',
      '`05_manual_tecnico.md`: capas tras B01/B02, patrones (Strategy, Adapter, Factory), limitación consciente de DIP, background GPS y notas de Capacitor.',
      '`06_documentacion_bd.md`, `09_aplicaciones_herramientas.md`, `08_interfaz_usuario.md` y `04_manual_usuario.md` (instalación del APK).',
      'Regenerar `Manual_Tecnico_*.docx` y `Manual_Usuario_*.docx` y actualizar `01_bitacora_desarrollo.md` y `00_indice_entrega.md`.',
      'Cerrar `10_plan_arquitectura_semestre.md`: columna «Estado final» por propuesta (hecho / parcial / descartado) con enlace a issue o PR, incluyendo lo que cambió respecto al plan (alcance de B02, spike de M05, opcionales al backlog futuro).',
      'Añadir en el manual técnico una sección «Trabajo futuro»: iOS (`cap add ios`, claves de `Info.plist`), push remoto (FCM), estrategia de ETA con OSRM y Factory de notificadores.',
    ],
    aceptacion: ['Un tercero levanta el proyecto y despliega siguiendo solo la documentación.'],
    refs: 'Charter Sprint 5 (manuales)',
  },
  {
    id: 'Q06', hito: 4, prio: 'P0', area: ['qa', 'docs'], charter: true,
    titulo: 'Preparar la sustentación y el plan de contingencia (R4)',
    contexto: 'Render puede estar dormido, Neon puede estar suspendido o no haber red en el salón. La demostración no puede depender de la suerte.',
    tareas: [
      'Guion de demo con tiempos y roles (estudiante, conductor, admin).',
      'Checklist previa: despertar Render 10 min antes, APK instalado, usuarios de prueba, respaldo en video.',
      'Contingencia: backend local en LAN + `docker compose` y ngrok como último recurso; ensayo cronometrado.',
    ],
    aceptacion: ['Ensayo general completo sin intervención técnica imprevista.'],
    refs: 'Charter §8 R4, §10',
  },
  {
    id: 'Q07', hito: 4, prio: 'P0', area: ['repo', 'docs'], charter: true, deps: ['Q02', 'Q04'],
    titulo: 'Congelar código (01-dic) y publicar release v1.0.0',
    contexto: 'Cierra el semestre con trazabilidad: tag, notas y artefactos descargables.',
    tareas: [
      'Congelar `develop` el 01-dic; solo se aceptan correcciones P0.',
      'Merge a `main`, tag `v1.0.0` y Release con APK, enlace a despliegue y notas de cambios.',
      'Verificar que todos los issues cerrados tienen PR enlazado y que el tablero está al día.',
    ],
    aceptacion: [
      'Release publicada con APK descargable y enlaces de producción funcionando.',
      'Evidencia de trazabilidad completa (charter §10 criterio 3).',
    ],
    refs: 'Charter §10',
  },
]
