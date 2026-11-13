# Monitoreo de Buses UPC Aguachica

[![CI](https://github.com/MAM-UPC-SA-TEAM/upc-track/actions/workflows/ci.yml/badge.svg)](https://github.com/MAM-UPC-SA-TEAM/upc-track/actions/workflows/ci.yml)

Aplicacion web para monitoreo de buses en tiempo real con:
- Backend Node.js + Express + Socket.IO
- Frontend React + Vite + Leaflet
- Base de datos PostgreSQL (Neon en producción)

## Documentacion de entrega academica

Indice principal: docs/00_indice_entrega.md

## Arquitectura de despliegue (nube gratuita)

| Capa | Servicio | URL |
|---|---|---|
| Frontend (SPA/PWA) | Cloudflare (Workers, assets estaticos) | https://upc-track.manuel0726tocora.workers.dev |
| Backend (API + Socket.IO) | Render, Web Service plan free | https://upc-track.onrender.com |
| Base de datos | Neon (PostgreSQL, plan free) | Cadena `DATABASE_URL` solo en variables de Render |

Limitaciones del plan gratuito que conviene conocer:

- **Render suspende el servicio tras 15 min sin trafico entrante** y tarda ~1 min en despertar (se midieron ~20 s). Los mensajes WebSocket entrantes cuentan como actividad. Mitigacion: issue D06 (estado «servidor despertando»).
- **Render free tiene sistema de archivos efimero** y puede reiniciarse en cualquier momento: el backend no guarda estado en disco y el socket debe reconectar solo.
- **Neon suspende el computo tras 5 min sin conexiones** y despierta en pocos segundos; la primera consulta tras la suspension es mas lenta.
- Render free ofrece 750 h/mes por workspace: no crear otro servicio free en el mismo workspace.

## Arranque local

1. Base de datos (PostgreSQL 16 en el puerto 5433, con esquema y datos demo de `database/`):
   ```
   docker compose up -d
   ```
   Sin el plugin compose: `docker run -d --name monitoreo-buses-pg -e POSTGRES_PASSWORD=<DB_PASSWORD> -e POSTGRES_DB=bd_monitoreo_buses -p 5433:5432 -v monitoreo_pg_data:/var/lib/postgresql/data -v $PWD/database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro -v $PWD/database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql:ro postgres:16-alpine`
   (`DB_PASSWORD` debe coincidir con `backend/.env`; por defecto `postgres`. El esquema y los datos solo se cargan la primera vez: para rehacerlos hay que borrar el volumen.)
2. `cp backend/.env.example backend/.env` y ajustar `DB_PORT=5433`, `DB_USER=postgres`, `DB_NAME=bd_monitoreo_buses`.
3. `npm install` en la raiz, `backend/` y `frontend/`.
4. `npm run dev` (backend en :3000, frontend en :5173).

Usuarios demo (clave `Admin123*`): `admin`, `conductor`, `estudiante`.

## Variables de entorno

### Backend (`backend/.env.example`)

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_URL` (uno o varios dominios separados por coma)

Ejemplo de `CLIENT_URL`:

`https://upc-track.manuel0726tocora.workers.dev`

### Frontend (`frontend/.env.example`)

- `VITE_API_URL` (URL publica del backend)

Ejemplo:

`VITE_API_URL=https://upc-track.onrender.com`

## Despliegue

### Backend en Render (Web Service)

Configurado manualmente como Web Service (no como Blueprint):

- Root Directory: `backend`
- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/api/health`
- Variables de entorno: `DATABASE_URL` (Neon, con `sslmode=require`), `JWT_SECRET` (valor propio, distinto al de desarrollo), `JWT_EXPIRES_IN`, `CLIENT_URL` (dominio del frontend en Cloudflare).

Los origenes de la app nativa (`https://localhost`, `capacitor://localhost`) ya estan permitidos en `backend/src/utils/cors.js`; no hace falta ponerlos en `CLIENT_URL`.

### Frontend en Cloudflare

- Root Directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Variable de build: `VITE_API_URL=https://upc-track.onrender.com` (se incrusta al compilar: si cambia, hay que volver a desplegar).
- Las rutas de React Router deben caer en `index.html` (fallback de SPA).

### Usuarios en produccion

`seed.prod.sql` no crea usuarios con clave publica. Para crear o restablecer uno:

```bash
cd backend
USUARIO_CLAVE='clave-de-12-o-mas-caracteres' npm run db:usuario -- --nombre "Administrador" --usuario admin --correo admin@unicesar.edu.co --tipo admin
```

## Checklist de sustentacion

1. `https://upc-track.onrender.com/api/health` responde `200` (la primera vez puede tardar ~1 min por el arranque en frio: abrirlo antes de empezar).
2. El frontend carga y permite login con los tres roles.
3. `CLIENT_URL` de Render contiene el dominio de Cloudflare.
4. CORS y Socket.IO aceptan el origen del frontend.
5. Flujo conductor -> GPS -> mapa estudiante validado en el dominio publico.

## App Android (Capacitor)

El frontend se empaqueta como app Android con Capacitor 7 (`frontend/android/`).

Requisitos del entorno:

- Node >= 20
- JDK 21 exacto (p. ej. Temurin 21: `winget install EclipseAdoptium.Temurin.21.JDK`). El «jbr» de Android Studio reciente es JDK 25 y Gradle 8.11 no lo soporta; Capacitor 7 no compila con JDK 22+. Para compilar por terminal: `JAVA_HOME` = el JDK 21
- Android Studio Ladybug 2024.2.1 o superior, con Android SDK Platform 35 y un emulador (AVD) o un telefono con depuracion USB
- Variable `ANDROID_HOME` apuntando al SDK (en Windows: `%LOCALAPPDATA%\Android\Sdk`)

Pasos:

1. `cd frontend && npm ci`
2. Crear `frontend/.env.native` (no se versiona) con `VITE_API_URL=https://upc-track.onrender.com`
3. `npm run cap:sync` (compila en modo nativo y copia a `android/`)
4. `npm run cap:open` (abre Android Studio, en Settings > Build Tools > Gradle poner el JDK 21) y ejecutar en el emulador con el boton Run. Por terminal: `cd android && .\gradlew.bat assembleDebug` y `adb install -r app/build/outputs/apk/debug/app-debug.apk`

`appId`: `co.edu.unicesar.upctrack` · `minSdk` 23 · `targetSdk` 35. El backend ya acepta los origenes `https://localhost` y `capacitor://localhost` (ver `backend/src/utils/cors.js`). Tras cambiar el frontend hay que volver a ejecutar `npm run cap:sync`.

## Desarrollo local

### Requisitos

- Node.js 20+
- PostgreSQL local o en Neon

### Pasos

1. Copiar variables:
   - `backend/.env.example` -> `backend/.env`
   - `frontend/.env.example` -> `frontend/.env` (opcional en local)
2. Instalar dependencias:
   - Raiz: `npm install`
   - Backend: `cd backend && npm install`
   - Frontend: `cd ../frontend && npm install`
3. Ejecutar ambos servicios desde raiz:
   - `npm run dev`

## Evidencia para Issue #25

- Configuracion de frontend cloud (SPA): ver seccion «Despliegue»
- Variables de entorno documentadas: `backend/.env.example`, `frontend/.env.example`
- Instrucciones de deploy y redespliegue para sustentacion: este README
