# Monitoreo de Buses UPC Aguachica

Aplicacion web para monitoreo de buses en tiempo real con:
- Backend Node.js + Express + Socket.IO
- Frontend React + Vite + Leaflet
- Base de datos MySQL (compatible con PlanetScale)

## Documentacion de entrega academica

Indice principal: docs/00_indice_entrega.md

## Arquitectura para sustentacion (sin tarjeta)

- Frontend: Vercel (publico y estable)
- Backend: local en tu PC + tunel ngrok (publico durante la demo)
- Base de datos: la misma que ya usas para pruebas (local o cloud MySQL)

Esta arquitectura es suficiente para presentar y que tus companeras accedan por URL publica el dia de la sustentacion.

## Arranque local

1. Base de datos (MySQL en el puerto 3307, con esquema y datos demo de `database/`):
   ```
   docker compose up -d
   ```
   Sin el plugin compose: `docker run -d --name monitoreo-buses-db -e MYSQL_ROOT_PASSWORD=<DB_PASSWORD> -e MYSQL_DATABASE=bd_monitoreo_buses -p 3307:3306 -v monitoreo_db_data:/var/lib/mysql -v $PWD/database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro -v $PWD/database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql:ro mysql:8.0`
   (`DB_PASSWORD` debe coincidir con `backend/.env`; por defecto `root`.)
2. `cp backend/.env.example backend/.env` y ajustar `DB_PORT=3307`, `DB_USER=root`, `DB_NAME=bd_monitoreo_buses`.
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

`http://localhost:5173,https://monitoreo-buses.vercel.app`

### Frontend (`frontend/.env.example`)

- `VITE_API_URL` (URL publica del backend)

Ejemplo:

`VITE_API_URL=https://tu-subdominio.ngrok-free.app`

## Deploy del frontend en Vercel

1. Importar el repositorio en Vercel.
2. Configurar Root Directory: `frontend`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Crear variable de entorno en Vercel:
   - `VITE_API_URL` (dejarla temporalmente con un placeholder)
6. Deploy inicial.

El archivo `frontend/vercel.json` ya incluye rewrite de SPA para rutas de React Router.

## Publicar backend con ngrok (sin tarjeta)

1. Iniciar backend local en `3000`:
   - `cd backend`
   - `npm run dev`
2. En otra terminal, abrir tunel:
   - `ngrok http 3000`
3. Copiar la URL publica HTTPS de ngrok, por ejemplo:
   - `https://abc123.ngrok-free.app`
4. Probar salud:
   - `https://abc123.ngrok-free.app/api/health`
5. En Vercel, actualizar `VITE_API_URL` con esa URL.
6. Redeploy del frontend.

## Checklist de sustentacion

1. Backend responde `200` en `/api/health`.
2. Frontend carga y permite login con URL publica.
3. `CLIENT_URL` del backend contiene el dominio de Vercel.
4. CORS y Socket.IO aceptan origen del frontend.
5. Flujo conductor -> GPS -> mapa estudiante validado en dominio publico.

## Redespliegue rapido el dia de la demo

1. Si cambia la URL de ngrok, actualizar `VITE_API_URL` en Vercel y redeploy.
2. Antes de cada prueba, validar local:
   - `npm run dev` (raiz)
   - `npm run build --prefix frontend`
3. Tener abierta una terminal fija para backend y otra para ngrok.
4. No cerrar ngrok durante la sustentacion.
5. Llevar una URL de respaldo (nuevo tunel ngrok listo para cambiar rapido).

## Desarrollo local

### Requisitos

- Node.js 20+
- MySQL local o cloud

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

- Configuracion de frontend cloud (SPA): `frontend/vercel.json`
- Variables de entorno documentadas: `backend/.env.example`, `frontend/.env.example`
- Instrucciones de deploy y redespliegue para sustentacion: este README
