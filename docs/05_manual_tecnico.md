# Manual Tecnico

## 1. Arquitectura

La arquitectura del proyecto se documenta en tres niveles independientes,
porque cada uno responde una pregunta distinta y se justifica con criterios
distintos: donde y como se despliegan los servicios (nivel de sistema), como
se organiza el codigo dentro de cada servicio (nivel de capas), y que
patrones puntuales resuelven problemas de creacion/conexion entre clases
(nivel de modulos y clases).

### 1.1 Nivel 1 — Infraestructura, sistemas y despliegue (DevOps/Cloud)

Este nivel responde dos preguntas que suelen confundirse y que se separan
explicitamente aqui:

**(a) Topologia del sistema — cuantos componentes desplegables hay:**

```text
┌─────────────────┐   HTTP / WS   ┌──────────────────┐   SQL   ┌───────────┐
│   Frontend        │ ────────────► │   Backend          │ ───────► │   MySQL     │
│   React + Vite     │               │   Node + Express   │           │             │
│   (Vercel)          │               │   + Socket.IO       │           │             │
└─────────────────┘               └──────────────────┘           └───────────┘
   Componente A                      Componente B                  Componente C
```

El sistema **ya es una arquitectura desacoplada de 3 componentes**
desplegados de forma independiente (frontend, backend, base de datos). Esto
es valido y estandar sin importar si el backend es monolito o
microservicios: son ejes de decision distintos.

**(b) Arquitectura interna del componente Backend — monolito vs
microservicios:**

El componente Backend (un unico proceso Node.js que expone API REST y
Socket.IO) es un **monolito modular**. No esta partido en servicios
independientes (auth-service, bus-service, etc.). Esta decision es
deliberada, no una limitacion:

- El dominio tiene alta cohesion relacional (usuario, bus, ruta, parada,
  horario, ubicacion se consultan con JOINs frecuentes); partirlo en
  microservicios obligaria a resolver esas relaciones via red, con mas
  latencia y complejidad, sin beneficio real.
- Socket.IO requiere conexiones persistentes; un monolito las maneja de
  forma nativa y simple, mientras que microservicios/serverless requieren
  infraestructura adicional (gateway de WebSockets) para lograrlo.
- El equipo y el tiempo de desarrollo (un semestre) no justifican la
  complejidad operativa de microservicios (orquestacion, descubrimiento de
  servicios, monitoreo distribuido).
- Serverless (funciones) no se adopta por la misma razon de sockets
  persistentes: es una mala opcion para WebSockets de larga duracion.

**Despliegue concreto de cada componente:**

- Frontend: Vercel (build `npm run build`, salida `dist`, rewrite SPA en
  `frontend/vercel.json`). PWA instalable via `vite-plugin-pwa`.
- Backend: para la sustentacion se ejecuta local y se publica con tunel
  ngrok (ver seccion 7); preparado para migrar a Render/Railway sin cambios
  de codigo, solo reconfigurando variables de entorno (`CLIENT_URL`,
  `VITE_API_URL`, `DB_HOST`, etc.).
- Base de datos: MySQL mediante pool de conexiones (`mysql2/promise`),
  local o en un servicio cloud compatible (PlanetScale, Railway MySQL,
  Aiven).
- No se usa Docker ni Kubernetes: no se justifican para un unico servicio
  backend sin necesidad de orquestar multiples instancias.
- No hay pipeline de CI/CD en esta entrega; es una mejora futura natural
  (ver seccion 10).

### 1.2 Nivel 2 — Patrones de arquitectura de la aplicacion (capas)

Define como se organiza el codigo **dentro de cada componente/servicio**
(en este proyecto, dentro del Backend y dentro del Frontend).

- El backend sigue una organizacion por capas de tipo **MVC extendido con
  capa de services** (routes -> controllers -> services -> models ->
  MySQL). Ver secciones 2 y 3 para el detalle de cada capa.
- No se adopta Clean Architecture ni Arquitectura Hexagonal: los modelos
  consultan MySQL directamente y no existen puertos/adaptadores de dominio.
  Es una decision valida para este alcance porque el proyecto no requiere
  independencia de la base de datos ni multiples implementaciones de
  persistencia (no se contempla cambiar de motor de base de datos ni
  agregar otras formas de entrada ademas de HTTP/sockets).
- El patron **Repository** no esta implementado como capa formal separada;
  los `models` (p. ej. `Usuario.js`) cumplen un rol equivalente al agrupar
  el acceso a datos de cada entidad.
- El frontend sigue una organizacion por capas equivalente: `pages`
  (vistas), `context` (estado global de autenticacion), `services`
  (adaptadores de API/socket) y `components/shared` (UI reutilizable y
  proteccion de rutas).

### 1.3 Nivel 3 — Modulos y clases: Patrones de diseno GoF

Resuelven problemas puntuales de creacion, conexion y desacoplamiento entre
clases dentro de un modulo. No son excluyentes entre si: conviven varios
patrones distintos, cada uno en su propio modulo, porque cada uno resuelve
un problema de diseno diferente.

- **Observer**: Socket.IO con rooms por ruta (`ruta_{id_ruta}`) implementa
  publicacion/suscripcion para difundir `bus:location`, `bus:estado` y
  `notificacion:nueva` en tiempo real (`backend/src/sockets/busSocket.js`).
- **Singleton (idiomatico por modulo ES)**: el pool de MySQL exportado desde
  `backend/src/config/database.js`, la instancia de Socket.IO creada en
  `backend/src/server.js`, y el cliente de socket en
  `frontend/src/services/socket.js` se instancian una sola vez y se
  reutilizan en toda la aplicacion.
- **Adapter**: `frontend/src/services/api.js` adapta `fetch` a una interfaz
  simple (`get/post/patch/delete`) que oculta headers, token JWT y manejo de
  errores HTTP; `frontend/src/services/socket.js` adapta el cliente de
  Socket.IO a las necesidades de autenticacion de la app.
- **Decorator (via middleware de Express)**: cada ruta compone
  responsabilidades adicionales sin modificar el controlador
  (`loginRateLimit` -> `authMiddleware` -> `roleMiddleware` -> controller).
- **Factory y Strategy**: no estan implementados actualmente. Se identifican
  como extensiones futuras (por ejemplo, Strategy para distintos metodos de
  calculo de ETA, o Factory para distintos canales de notificacion), a
  incorporar solo si la rubrica de la materia exige evidencia de codigo de
  estos patrones.

## 2. Estructura general
- backend/: API, sockets, modelos, controladores.
- frontend/: UI, rutas, contexto de autenticacion, servicios API/socket.
- docs/: documentacion de entrega.

## 3. Backend

### 3.1 Seguridad
- JWT en Authorization Bearer.
- authMiddleware y roleMiddleware por endpoint.

### 3.2 CORS
- Origenes permitidos por CLIENT_URL.
- Soporte LAN/ngrok en entorno desarrollo.

### 3.3 Sockets
- Namespace por defecto con rooms por ruta: ruta_{id_ruta}.
- Eventos principales:
  - bus:location
  - bus:estado
  - notificacion:nueva

## 4. Frontend
- Servicio API centralizado en src/services/api.js.
- Socket client en src/services/socket.js.
- Rutas protegidas por rol con RutaProtegida.

## 5. Configuracion de entorno

### Backend
Ver backend/.env.example.

### Frontend
- VITE_API_URL opcional.
- Sin VITE_API_URL usa mismo origen y proxy de Vite para /api y /socket.io.

## 6. Ejecucion local
1. npm install (raiz, backend y frontend).
2. npm run dev (raiz) o correr backend/frontend por separado.

## 7. Despliegue de sustentacion sin tarjeta
- Frontend: Vercel o Vite local con ngrok.
- Backend: local.
- Opcion 1 tunel ngrok: publicar frontend y usar proxy a backend local.

## 8. Logs y monitoreo
- Health: GET /api/health.
- Consola backend para errores API/sockets.

## 9. Buenas practicas
- Validar inputs en controllers.
- Manejo de errores consistente.
- Separacion por capas (routes/controllers/models/services).

## 10. Mejoras futuras de arquitectura
- CI/CD con GitHub Actions: instalar dependencias, lint, build de frontend y
  pruebas en cada push/PR; despliegue automatico a Vercel y al backend cloud.
- Migrar backend de ejecucion local+ngrok a un servicio cloud (Render o
  Railway) para eliminar la dependencia del tunel durante demos.
- Evaluar Dockerfile para backend si se requiere paridad de entornos entre
  desarrollo y despliegue.
- Incorporar patrones GoF Factory y Strategy solo si la rubrica de la
  materia exige evidencia explicita de estos (ver seccion 1.4).
