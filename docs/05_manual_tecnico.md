# Manual Técnico — UpcTrack

Monitoreo en tiempo real de los buses de la UPC Seccional Aguachica. Este manual describe cómo está construido el sistema, cómo se ejecuta, se prueba y se despliega, y qué decisiones de diseño se tomaron. Los pasos exactos de instalación y despliegue están en el [README](../README.md); aquí se explica el porqué.

## 1. Arquitectura

La arquitectura se documenta en tres niveles, porque cada uno responde una pregunta distinta: dónde y cómo se despliega cada servicio (sistema), cómo se organiza el código dentro de cada servicio (capas) y qué patrones resuelven problemas puntuales entre clases y módulos.

### 1.1 Nivel 1 — Infraestructura, sistemas y despliegue

**(a) Topología.** Hay tres componentes desplegables de forma independiente y un cliente móvil que reutiliza el frontend:

```text
 Navegador / PWA ──┐                         ┌─► Neon PostgreSQL (free, TLS)
                   ├─ HTTPS + WebSocket ─► Render (Node + Express + Socket.IO)
 APK Android ──────┘   (Capacitor, mismo frontend)
        ▲
        └── código estático servido por Cloudflare (React + Vite)
```

| Componente | Servicio | Notas |
|---|---|---|
| Frontend (SPA/PWA) | Cloudflare (assets estáticos) | `npm run build` → `dist`; las rutas de React Router caen en `index.html`. |
| Backend (API REST + Socket.IO) | Render, Web Service plan gratuito | `npm ci` / `npm start`, health check `/api/health`. Un solo proceso. |
| Base de datos | Neon, PostgreSQL plan gratuito | Conexión por `DATABASE_URL` con TLS verificado. |
| App móvil | APK Android (Capacitor 7) | Empaqueta el frontend; se distribuye como artefacto o Release de GitHub, sin tienda. |
| Desarrollo local | Docker Compose (PostgreSQL 16) + `npm run dev` | Solo la base de datos va en contenedor. |

El costo es $0 COP (restricción del charter). Render y Neon son los dos puntos de continuidad: ver la sección 9.

**(b) Backend: monolito modular, no microservicios.** El backend es un único proceso Node.js que expone API REST y Socket.IO. La decisión es deliberada:

- El dominio es muy relacional (usuario, bus, ruta, parada, horario, ubicación se consultan con `JOIN` frecuentes); partirlo en servicios obligaría a resolver esas relaciones por red, con más latencia y complejidad y sin beneficio real.
- Socket.IO necesita conexiones persistentes; un proceso único las maneja de forma nativa, mientras que serverless o microservicios exigirían un gateway de WebSockets adicional.
- Un equipo de una persona y un semestre no justifican la complejidad operativa de orquestar varios servicios.

**(c) Integración continua.** GitHub Actions (`.github/workflows/`):

| Workflow | Qué hace |
|---|---|
| `ci.yml` | Tres jobs en cada push y PR: frontend (lint, pruebas con cobertura, build), backend (lint, pruebas con cobertura y PostgreSQL real) y e2e (Playwright). |
| `android.yml` | Compila el APK firmado; un tag `vX.Y.Z` lo adjunta a la Release de GitHub. |

Ninguna rama protegida recibe push directo y todo PR requiere CI verde (ver `CONTRIBUTING.md`). Render y Cloudflare despliegan desde el repositorio. No hay Dockerfile del backend: Render lo construye desde Node y el plan de contingencia usa `npm run dev` más el PostgreSQL de `docker-compose.yml` (decisión del issue D04).

### 1.2 Nivel 2 — Capas de la aplicación

**Backend** (`backend/src`): `routes → controllers → services → models → PostgreSQL`, con `middlewares/` (autenticación, roles, límites de peticiones), `sockets/` y `utils/` (CORS, JWT, velocidad).

- Los **controladores no ejecutan SQL**: validan la entrada HTTP, llaman al servicio o al modelo y traducen los errores de dominio (`PLACA_DUPLICADA`, `BUS_NO_ENCONTRADO`, `RUTA_NO_ENCONTRADA`, `USUARIO_NO_ENCONTRADO`, `USUARIO_YA_REGISTRADO`, …) a códigos HTTP (400, 404, 409).
- Los **servicios** concentran las reglas de escritura: `authService`, `busService`, `usuarioService`, `rutaService` y `ubicacionService`. Las operaciones de varios pasos (crear bus con su ruta, editar y reasignar) corren dentro de una transacción (`transaccion()` en `config/database.js`).
- Los **modelos** (`Bus`, `Usuario`, `Ruta`, …) agrupan el SQL de cada entidad con `pg`, sin ORM, y devuelven `rowCount` para que el servicio detecte «no existe».
- `app.js` solo define Express (es lo que importan las pruebas de integración con supertest, sin puerto ni base de datos). `server.js` crea el servidor HTTP y Socket.IO y guarda `io` en `app.set('io', io)` para que controladores y servicios emitan eventos.

**Limitación consciente (DIP).** No se adopta Clean Architecture ni Arquitectura Hexagonal: los modelos consultan PostgreSQL directamente y no existen puertos ni adaptadores de dominio. El principio de inversión de dependencias solo se aplica en las costuras que importan (los servicios reciben `io` por parámetro y se prueban con modelos simulados). Es suficiente para este alcance: no se contempla cambiar de motor de base de datos ni agregar otras formas de entrada además de HTTP y sockets. El patrón Repository no existe como capa formal; los modelos cumplen ese rol.

**Frontend** (`frontend/src`): `pages` (pantallas), `components` (UI por área: acceso, admin, conductor, inicio, mapa, listas, shared), `context` (`AuthContext`, `RecorridoContext`), `services` (adaptadores: `api`, `socket`, `geolocation`, `notificaciones`, `red`, `cicloVida`, `pantallaEncendida`), `hooks` y `utils` (ETA, formato, interpolación, plataforma, tema). `App.jsx` define las rutas con `lazy` y `RutaProtegida roles={[...]}`; hay tres roles (`estudiante`, `conductor`, `admin`) con pantalla de inicio distinta. La landing (`features/landing`) se carga aparte para no entrar al APK.

### 1.3 Nivel 3 — Patrones de diseño

- **Observer.** Socket.IO con salas por ruta (`ruta_<id_ruta>`) publica `bus:location`, `bus:estado` y `notificacion:nueva` solo a quienes están unidos a esa ruta (`backend/src/sockets/`).
- **Singleton (por módulo ES).** El pool de PostgreSQL (`config/database.js`), la instancia de Socket.IO (`server.js`) y el cliente de socket del frontend (`services/socket.js`, con `autoConnect: false`) se crean una sola vez.
- **Adapter.** El frontend oculta cada API del entorno detrás de una interfaz propia, de modo que las pantallas no distinguen web de APK:
  - `services/api.js` adapta `fetch` (token JWT, errores HTTP) a `get/post/patch/delete`.
  - `services/geolocation.js` usa `@capacitor/geolocation` en el APK y la API del navegador en la web; normaliza los errores a `{ codigo, mensaje }` y ofrece `verificarPermiso()`.
  - `services/notificaciones.js` usa notificaciones locales nativas o la `Notification API`.
  - `services/red.js` y `services/cicloVida.js` unifican el estado de red y el paso a segundo plano / botón atrás (Capacitor o `visibilitychange`).
- **Strategy.** El cálculo del ETA (`utils/calcularETA.js`) separa **cuál** bus llega antes de **cómo** se estima cada uno: una estrategia es `{ nombre, estimar(parada, bus) → { minutos, distanciaKm } }`. Hay `estrategiaLineal` (Haversine a la velocidad reciente del bus, con piso de 10 y techo de 40 km/h) y `estrategiaVelocidadFija`. Otro algoritmo es otra estrategia, sin tocar a quien llama a `calcularETA`.
- **Decorator (middleware de Express).** Cada ruta compone responsabilidades sin modificar el controlador: `loginRateLimit → authMiddleware → roleMiddleware → controlador`.
- **Fábricas simples.** `crearRegistroRateLimit(max)` y `crearOpciones(etiqueta)` (CORS) construyen configuraciones; no hay una jerarquía Factory de GoF. El caso natural para una fábrica real es un canal de notificaciones intercambiable (ver trabajo futuro).

## 2. Estructura del repositorio

```text
backend/    API REST, sockets, servicios, modelos, scripts de BD (migrate, crear usuario)
frontend/   React + Vite + Leaflet, PWA y proyecto Android (Capacitor)
database/   schema.sql, seed.sql (demo), seed.prod.sql (producción)
e2e/        pruebas de extremo a extremo (Playwright)
docs/       documentación de entrega y de diseño
scripts/    utilidades de desarrollo (auditoría móvil, humo de API y WebSockets)
```

Cada paquete tiene su propio `package-lock.json` (no hay workspaces). Node ≥ 20 (`.nvmrc`).

## 3. Backend

### 3.1 Seguridad

- **JWT** en `Authorization: Bearer`; `authMiddleware` valida el token y `roleMiddleware(...roles)` restringe por rol.
- **Contraseñas** con bcrypt. `seed.sql` crea usuarios con clave pública `Admin123*` y por eso `migrate.mjs` se niega a aplicarlo sobre `DATABASE_URL`; en producción se usa `seed.prod.sql` y `npm run db:usuario`.
- **Registro público:** solo acepta correos `@unicesar.edu.co` (validado en el servidor) y la cuenta nace inactiva hasta que un administrador la aprueba (decisión A01: la verificación de titularidad por correo queda como mejora futura).
- **Límites de peticiones** (`express-rate-limit`): login, 5 intentos fallidos por IP en 15 minutos; registro, 10 por hora. `trust proxy` = 1 por estar detrás del proxy de Render. Al ser por IP, varios usuarios detrás de un mismo NAT comparten el límite.
- **Cabeceras** con `helmet` (con `Cross-Origin-Resource-Policy: cross-origin`, porque el frontend consume la API desde otro origen).
- **CORS** (`utils/cors.js`, compartido por Express y Socket.IO): `CLIENT_URL` admite varios orígenes separados por coma; los orígenes de Capacitor (`https://localhost`, `capacitor://localhost`) están permitidos siempre; LAN y ngrok solo fuera de producción. Un origen desconocido no recibe cabeceras CORS.
- **Dependencias** sin vulnerabilidades conocidas (`npm audit --omit=dev`).

### 3.2 Flujo de tiempo real

1. El conductor transmite su posición cada ~4 s, por REST (`ubicacionController`) o por el evento `conductor:ubicacion`.
2. `services/ubicacionService.js` guarda la posición y emite `bus:location` a la sala `ruta_<id_ruta>`.
3. El mismo servicio mantiene **estado en memoria** (`posicionesRecientes`, `estadoMovimientoBus`): la velocidad reciente de cada bus para el ETA y la detección de bus detenido (3 minutos sin moverse más de 25 m) que emite `notificacion:nueva`, con 10 minutos de enfriamiento. Ese estado se pierde al reiniciar el servidor y el ETA tarda ~20 s en recuperarse.
4. Eventos: `bus:location`, `bus:estado`, `notificacion:nueva`; el cliente envía `join:ruta` / `leave:ruta` (el servidor responde `join:confirmado`) y el conductor `conductor:ubicacion` / `conductor:estado`.
5. En el cliente, `services/socket.js` recuerda las salas unidas y las vuelve a pedir en cada `connect` (las salas del servidor se pierden al reconectar). Se usa `unirseRuta` / `salirRuta`, nunca `socket.emit('join:ruta')` directo, y `olvidarRutas()` al cerrar sesión.
6. El ETA se calcula en el cliente (`utils/calcularETA.js`, `utils/estadoBus.js`).

La posición se muestra como vigente («Validado · hace Xs») mientras tenga 30 s o menos (`FRESCO_MAX_S`, la meta del charter); pasado ese tiempo, o sin conexión, la interfaz anula el dato con un sello («Sin señal» o «Sin conexión») en lugar de mostrarlo como vigente.

### 3.3 Errores

Los servicios lanzan errores de dominio cuyo `message` es un código (`BUS_NO_ENCONTRADO`). El manejo es **centralizado** (`middlewares/errorMiddleware.js`, `utils/httpError.js`): cada controlador se envuelve en `asyncHandler(handler, traducciones)`, donde `traducciones` mapea el código de dominio a `[estado HTTP, mensaje]`; lo que lanza el handler llega al `errorHandler` final de `app.js`, que responde siempre `{ error: string }`. Un `HttpError` (con atajos `notFound`, `badRequest`, …) responde con su código; un JSON mal formado, 400; un origen rechazado por CORS, 403; y cualquier otro error, un 500 genérico que **no filtra el mensaje interno** y se registra con el método y la ruta. Los controladores ya no repiten `try/catch`; la única excepción es `logout`, que a propósito responde 200 aunque falle liberar el bus.

## 4. Frontend

- Estado global en `AuthContext` y `RecorridoContext`. `RecorridoContext` sobrevive a la navegación: salir de «Mi recorrido» no apaga el GPS; solo finalizar o cerrar sesión lo cierran.
- Las llamadas HTTP pasan siempre por `services/api.js`.
- `utils/platform` (`esNativa`) distingue la web de la WebView de Capacitor.
- **Diseño:** `PRODUCT.md` (usuarios y propósito) y `DESIGN.md` (sistema visual «El Talón», tokens en `styles/tokens.css`, modo noche) son la referencia para cualquier cambio de interfaz. El usuario principal es el estudiante en la parada, con una mano y datos inestables.
- **PWA:** `vite-plugin-pwa` con service worker; el backend se llama con estrategia *Network First* y la interfaz avisa «Despertando el servidor» (`ServidorDespertando`) durante el arranque en frío de Render, reintentando sola.

## 5. App Android (Capacitor)

- `appId` `co.edu.unicesar.upctrack`, `minSdk` 23, `targetSdk` 35, Capacitor 7. Plugins: `app`, `geolocation`, `local-notifications`, `network`, `splash-screen`, `status-bar`.
- `androidScheme: "https"`: la WebView sirve la app desde `https://localhost`, origen que el backend acepta en producción.
- `VITE_API_URL` se incrusta al compilar. El build nativo (`npm run build:native`) es obligatorio para el APK: sin registro de service worker, sin banner PWA y sin landing. Tras cualquier cambio del frontend hay que ejecutar `npm run cap:sync`.
- Compilar requiere JDK 21 exacto (Capacitor 7 no compila con JDK 22+) y `ANDROID_HOME`. Detalles y firma del APK: README.
- **Conductor y pantalla bloqueada.** El seguimiento en segundo plano no está soportado: el conductor debe mantener la app abierta y el teléfono cargando. Para ello se pide un **Wake Lock** (`services/pantallaEncendida.js`), que se repite al volver de segundo plano y se libera al terminar, y la pantalla muestra el aviso «Mantén la app abierta y el teléfono cargando». Una transmisión real en segundo plano (servicio en primer plano de Android) quedó como prueba de concepto opcional (issue M05).
- **Permiso de ubicación.** `verificarPermiso()` se ejecuta antes de iniciar el recorrido: con el permiso denegado el bus sigue «fuera de servicio» y se explica cómo activarlo; si se deniega o retira durante el recorrido, se revierte.

## 6. Configuración de entorno

- **Backend** (`backend/.env`, desde `.env.example`): `DATABASE_URL` (Neon, producción) **o** `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME` (local); `DB_SSL`, `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN` y `CLIENT_URL`. `config/env.js` termina el proceso (`exit(1)`) si falta una variable requerida. El TLS se activa con `sslmode=require` en la URL o con `DB_SSL=true`.
- **Frontend:** `VITE_API_URL` (URL pública del backend). Sin ella, en desarrollo se usa el mismo origen y el proxy de Vite para `/api` y `/socket.io`. Para el APK se crea `frontend/.env.native` (no versionado).
- Nunca se versionan `.env`, `*.jks`, `*.keystore` ni `keystore.properties`.

## 7. Ejecución local

```bash
docker compose up -d      # PostgreSQL 16 en :5433 con schema.sql y seed.sql (solo carga la primera vez)
npm run install:all
npm run dev               # backend :3000 + frontend :5173
```

Otros: `npm run db:migrate [-- --seed seed.sql]` y `npm run db:usuario` (en `backend/`), `npm run lint` y `npm test` (desde la raíz).

## 8. Pruebas

Detalle en [`testing.md`](testing.md). Resumen:

- **Backend** (`node:test`): unitarias de funciones puras y servicios con modelos simulados, de integración HTTP con supertest sin base de datos, y `test/db` contra un PostgreSQL real (puerto 5434) que verifica la persistencia.
- **Frontend** (Vitest + Testing Library): utilidades, componentes, contextos, servicios y pantallas con un backend y un socket falsos.
- **Extremo a extremo** (Playwright): Chromium recorre acceso, estudiante, administrador y tiempo real (el conductor transmite y el estudiante lo ve) contra una base desechable propia (`docker-compose.e2e.yml`, puerto 5434) que nunca toca la de desarrollo ni la de la nube. Puertos propios: backend 3100, frontend 5180.
- **Calidad:** cobertura con umbral del 60 % en CI; auditoría móvil a 390 px (`scripts/dev/auditoria-movil.mjs`) y revisión de accesibilidad con axe-core (0 violaciones WCAG 2.1 A/AA en las pantallas principales).

## 9. Operación, límites y contingencia

- **Salud:** `GET /api/health`. Errores de la API y de los sockets, en la consola del servicio de Render.
- **Render (plan gratuito):** se suspende tras 15 minutos sin tráfico y tarda ~20 s a ~1 min en despertar (medido: ~17 s); el sistema de archivos es efímero, por lo que el backend no guarda estado en disco. Los mensajes WebSocket entrantes cuentan como actividad.
- **Neon (plan gratuito):** suspende el cómputo a los 5 minutos sin conexiones y despierta en segundos; hay una cuota mensual de cómputo, por lo que no se hace ping a la base de datos.
- **Plan B:** backend local con `npm run dev` y el PostgreSQL de `docker-compose.yml`, más un túnel (ngrok) solo como contingencia; volcado reproducible de la base con `schema.sql` + `seed.prod.sql`. Antes de una demostración conviene abrir `/api/health` para calentar el servicio.

## 10. Trabajo futuro

- **iOS:** `npx cap add ios` y las claves de `Info.plist` para ubicación y notificaciones (requiere macOS y fuera del alcance del charter v2).
- **Notificaciones push remotas** (FCM) para avisar con la app cerrada; hoy las notificaciones son locales y por socket.
- **ETA por la red vial** con un motor de rutas (OSRM) como una nueva `estrategia` del patrón Strategy, en lugar de la línea recta.
- **Factory de notificadores:** un canal de notificación intercambiable (socket, local, push) detrás de una fábrica.
- **Seguimiento en segundo plano** del conductor con un servicio en primer plano de Android (issue M05).
- **Verificación de titularidad** del correo institucional por código (hoy la aprobación es manual del administrador).
- **Rate limit por usuario** además de por IP.
