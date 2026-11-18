# Aplicaciones y Herramientas Utilizadas

## Desarrollo
- Visual Studio Code
- Node.js 20+ (backend/frontend) y npm
- Git y GitHub (control de versiones, Pull Requests, issues y tablero de GitHub Projects como gestión ágil)
- Docker Compose (PostgreSQL local de desarrollo y base desechable de pruebas e2e)

## Frontend
- React
- Vite
- React Router
- Leaflet / React Leaflet
- Socket.IO client
- FontAwesome
- vite-plugin-pwa (PWA instalable)
- Capacitor 7 (APK Android: app, geolocation, local-notifications, network, splash-screen, status-bar)

## Backend
- Express
- Socket.IO
- JWT (jsonwebtoken)
- bcryptjs
- pg (node-postgres)
- express-rate-limit
- helmet (cabeceras de seguridad)
- cors

## Base de datos
- PostgreSQL (Neon)

## Pruebas y calidad
- Backend: `node:test` y supertest (unitarias e integración HTTP), pruebas con PostgreSQL real
- Frontend: Vitest y Testing Library
- Extremo a extremo: Playwright (Chromium)
- Cobertura: c8 (backend) y Vitest/V8 (frontend), con umbral del 60 % en CI
- ESLint (backend y frontend)
- Accesibilidad y diseño móvil: axe-core y el script `scripts/dev/auditoria-movil.mjs`
- Consumo de la API: Postman (colecciones en /postman)

## Despliegue y operación
- Cloudflare (frontend estático)
- Render, Web Service plan gratuito (backend: API y Socket.IO)
- Neon, PostgreSQL plan gratuito (base de datos, con TLS)
- GitHub Actions (CI: lint, pruebas, build, e2e; compilación del APK firmado)
- ngrok (túnel HTTPS) solo como contingencia local
