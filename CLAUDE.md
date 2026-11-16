# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

UpcTrack: monitoreo en tiempo real de los buses de la UPC Seccional Aguachica. Monorepo sin workspaces (cada paquete tiene su propio `package-lock.json`): `backend/` (Express + Socket.IO + PostgreSQL, ESM), `frontend/` (React 19 + Vite + Leaflet, PWA y app Android con Capacitor 7), `database/` (SQL), `e2e/` (Playwright). Código, commits, PR y docs están en español. Node >= 20 (`.nvmrc`).

## Comandos

Desde la raíz (instalar: `npm run install:all`):

```bash
docker compose up -d          # Postgres 16 en :5433 con database/schema.sql + seed.sql (solo carga la primera vez)
npm run dev                   # backend :3000 + frontend :5173
npm run lint                  # frontend + backend
npm test                      # backend (node:test) + frontend (vitest)
npm run build                 # build del frontend
npm run e2e:db:up && npm run e2e   # Playwright; BD desechable en :5434, backend :3100, frontend :5180
```

Una sola prueba:

```bash
cd backend  && node --test test/unit/cors.test.js          # o --test-name-pattern="..."
cd frontend && npx vitest run test/utils/calcularETA.test.js
cd e2e      # desde la raíz: npx playwright test e2e/tests/acceso.spec.js
```

Otros: `npm run db:migrate [-- --seed seed.sql]` y `npm run db:usuario` (en `backend/`); `npm run cap:sync` (en `frontend/`) tras cualquier cambio de frontend para la app nativa.

CI (`.github/workflows/ci.yml`) corre lint + cobertura + build en frontend, lint + cobertura en backend, y e2e. Las pruebas viven en `test/` de cada paquete, espejando la ruta de `src/` (`<modulo>.test.js`); ver `docs/testing.md`.

## Entorno

- `backend/.env` desde `.env.example`. Se usa `DATABASE_URL` (Neon, producción) **o** `DB_HOST/PORT/USER/PASSWORD/NAME` (local); `config/env.js` hace `process.exit(1)` si falta una variable requerida. `CLIENT_URL` admite varios orígenes separados por coma; los orígenes de Capacitor ya están permitidos en `utils/cors.js`.
- `seed.sql` crea usuarios con clave pública `Admin123*` y `migrate.mjs` se niega a aplicarlo sobre `DATABASE_URL`. Para producción: `seed.prod.sql` + `npm run db:usuario`.
- `VITE_API_URL` se incrusta al compilar el frontend. Para Android crear `frontend/.env.native` (no versionado). Compilar el APK requiere JDK 21 exacto y `ANDROID_HOME` (en esta máquina: `ANDROID_HOME="$LOCALAPPDATA/Android/Sdk" ./gradlew assembleDebug` en `frontend/android`).
- Producción en planes gratis: Render (se suspende a los 15 min, ~1 min de arranque en frío, disco efímero → el backend no guarda estado en disco), Neon, Cloudflare. De ahí el componente `ServidorDespertando` y la reconexión automática del socket.

## Arquitectura

**Backend** (`backend/src`): capas `routes → controllers → models` (SQL con `pg`, sin ORM), más `services/` para lógica con estado/efectos. `server.js` crea el HTTP + `Socket.IO` y guarda `io` en `app.set('io', io)` para que controladores y servicios emitan; `app.js` solo define Express (lo que importan los tests de integración con supertest, sin puerto ni BD real).

**Flujo de tiempo real (cruza backend y frontend):**
1. El conductor transmite GPS cada ~4 s (REST `ubicacionController` → `services/ubicacionService.js`, o evento `conductor:ubicacion` en `sockets/busSocket.js`).
2. `ubicacionService` guarda la posición y emite `bus:location` a la sala `ruta_<id_ruta>`; solo los clientes unidos a esa ruta lo reciben.
3. El servicio también mantiene **estado en memoria** (`posicionesRecientes`, `estadoMovimientoBus`): velocidad reciente para el ETA y detección de bus detenido → emite `notificacion:nueva` a la sala. Se pierde al reiniciar el servidor (el ETA tarda ~20 s en recuperarse).
4. En el cliente, `frontend/src/services/socket.js` es un singleton `autoConnect: false` que recuerda las salas unidas y las vuelve a pedir en cada `connect` (las salas del servidor se pierden al reconectar). Usar `unirseRuta/salirRuta`, no `socket.emit('join:ruta')` directo; `olvidarRutas()` al cerrar sesión.
5. El ETA se calcula en el cliente (`frontend/src/utils/calcularETA.js`, `estadoBus.js`).

**Frontend** (`frontend/src`): `App.jsx` define las rutas con `lazy` + `RutaProtegida roles={[...]}`; tres roles (`estudiante`, `conductor`, `admin`) con inicio distinto (`InicioPorRol`). Estado global en `context/AuthContext` y `RecorridoContext`. `utils/platform` (`esNativa`) distingue web de WebView Capacitor; la landing (`features/landing`) carga aparte para no entrar al APK. Las llamadas HTTP pasan por `services/api.js`.

**Diseño:** `PRODUCT.md` (usuarios, propósito) y `DESIGN.md` (sistema visual «El Talón», tokens en `styles/tokens.css`, modo noche) son la referencia para cualquier cambio de UI; el usuario principal es el estudiante en la parada, con una mano y datos inestables.

## Flujo de trabajo (CONTRIBUTING.md)

- `main` = producción, `develop` = integración. Nunca push directo a ninguna: rama `feature/<id>-<tema>` desde `develop` actualizado, un issue por PR, PR con base `develop`.
- Fusionar **de inmediato** con `gh pr merge N --merge --delete-branch` en cuanto el CI esté verde; no dejar PR abiertos ni apilar ramas. Luego `git switch develop && git pull --ff-only && git fetch --prune && git branch -d <rama>`.
- El check «Workers Builds: upc-track» (Cloudflare) falla en todos los PR: es conocido y no bloquea.
- `Closes #N` no cierra el issue al fusionar en `develop`; los issues se cierran a mano.
- Commits y descripciones de PR en español.
