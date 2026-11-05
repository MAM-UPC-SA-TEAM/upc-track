# Plan de Arquitectura para el Semestre

Este documento es de **planificacion**, no de desarrollo ya ejecutado. Se
presenta para la exposicion como la hoja de ruta de mejoras arquitectonicas
que el equipo propone construir durante el semestre, partiendo del proyecto
heredado de un semestre anterior.

Se organiza en los 5 niveles definidos por la materia. Cada nivel muestra:
**Estado actual** (lo que ya existe y por que es valido dejarlo), **Propuesta
de mejora** (lo que se plantea construir este semestre) y **Justificacion**
(por que vale la pena o por que se descarta una alternativa).

---

## Nivel 1 — Infraestructura, Sistemas y Despliegue (DevOps/Cloud)

### Estado actual
- Frontend: Vercel (cloud, gratuito, estable).
- Backend: ejecucion local + tunel ngrok (solo valido para demos puntuales).
- Base de datos: MySQL local o cloud manual, sin estandarizar.
- Sin CI/CD, sin Docker.

### Propuesta de mejora para este semestre

**Backend: salir de ngrok a un servicio cloud gratuito**

| Opcion | Free tier | Limitacion clave investigada | Veredicto |
|---|---|---|---|
| **Render (Web Service free)** | Si | Se "duerme" tras 15 min sin trafico; 30-60s de cold start al despertar; WebSockets no garantizados en el plan free (pueden cortarse) | Usable para exposicion con esa advertencia explicita, no para uso continuo |
| Railway | Si (con limites de uso) | Free tier mas limitado en horas/mes que antes | Alternativa secundaria |
| Fly.io | Si | Requiere mas configuracion (Dockerfile) | Opcion si se acepta usar Docker |
| ngrok (actual) | Si | URL cambia en cada reinicio, depende de que alguien tenga el PC encendido | Solo valido para demo puntual, no como plan de semestre |

**Recomendacion:** migrar el backend a **Render free tier**, documentando
explicitamente la limitacion de "sleep" tras inactividad (aceptable para un
proyecto academico con trafico esporadico, y resoluble con un ping externo
tipo cron-job.org si se quiere evitar el cold start durante la exposicion).

**Base de datos: salir del entorno local**

| Opcion | Free tier MySQL real | Estado 2026 |
|---|---|---|
| PlanetScale | **No** | Descontinuo su free tier |
| Railway MySQL | Limitado/poco confiable | No es un MySQL gestionado completo en el plan free |
| **Aiven** | **Si** | 1 GB RAM / 1 GB disco, nodo unico, siempre activo, backups diarios |
| Clever Cloud | No | Sin plan gratuito permanente |

**Recomendacion:** migrar la base de datos a **Aiven** (MySQL gestionado,
gratuito, sin necesidad de mantener el equipo local encendido). Esto tambien
implica actualizar `backend/.env.example`, que hoy menciona PlanetScale como
ejemplo y ya no aplica.

**Docker/CI-CD:** no es indispensable si se usa Render/Railway (ellos ya
gestionan el runtime), pero se puede agregar un `Dockerfile` simple para el
backend como evidencia de buenas practicas, y un workflow basico de GitHub
Actions (`npm install` + `npm run lint` + `npm run build` del frontend en
cada push) como primer paso de CI, sin necesidad de CD automatico.

**Empaquetado movil: Capacitor sobre la PWA existente**

Investigado como viable en 2026: Capacitor permite envolver el mismo
proyecto Vite/React ya existente (sin reescribirlo) en apps nativas Android
e iOS, reutilizando:
- El mismo cliente `socket.io-client` (funciona igual dentro de Capacitor).
- Geolocalizacion nativa (mas precisa que la del navegador, con soporte de
  segundo plano en Android; en iOS requiere configurar permisos y modo de
  background location en `Info.plist`).

Esto **no reemplaza la PWA actual**, la complementa: se mantiene la PWA para
acceso rapido por navegador/instalacion ligera, y se agrega Capacitor como
capa opcional para publicar en tiendas (Play Store/App Store) si el proyecto
lo requiere a futuro. Pasos previstos: `npm install @capacitor/core
@capacitor/cli`, `npx cap init`, `npx cap add android`, integrar
`@capacitor/geolocation`.

### Resumen de decision Nivel 1

| Componente | Actual | Propuesto este semestre |
|---|---|---|
| Frontend | Vercel | Se mantiene |
| Backend | Local + ngrok | Render (free tier, con advertencia de sleep) |
| Base de datos | Local/manual | Aiven (MySQL gestionado gratuito) |
| CI | No existe | GitHub Actions basico (lint + build) |
| Movil | Solo PWA | PWA + Capacitor (opcional, para tienda) |

---

## Nivel 2 — Patrones de Arquitectura de la Aplicacion (Capas)

### Estado actual
Backend organizado en `routes -> controllers -> services -> models` (MVC
extendido). Ver detalle en `docs/05_manual_tecnico.md` seccion 1.2.

### Propuesta de mejora
No se propone cambiar de MVC a Clean Architecture o Hexagonal (seguiria
siendo sobre-ingenieria para el alcance). La mejora real y de bajo riesgo es
de **consistencia interna**:

- Actualmente algunos controllers acceden directo a `pool.query` en vez de
  delegar a un `service` (ejemplo: `crearBus`, `editarBus`, `eliminarBus` en
  `backend/src/controllers/busController.js`, y `logoutController` en
  `authController.js`). Esto rompe la propia regla de capas que el proyecto
  ya define.
- Propuesta: extraer un `busService.js` que concentre esas consultas,
  dejando los controllers solo con validacion HTTP + llamada al service.
  Mismo criterio para `logoutController`.
- Esto no es un cambio de patron, es hacer cumplir el patron MVC+services
  que ya se declaro, en el 100% de los módulos.

---

## Nivel 3 — Modulos y Clases: Patrones de Diseno GoF

### Estado actual
Ya identificados y documentados en `docs/05_manual_tecnico.md` seccion 1.3:
Observer (Socket.IO), Singleton idiomatico (pool DB, instancia io/socket),
Adapter (`api.js`, `socket.js`), Decorator (middlewares).

### Propuesta de mejora
Se propone incorporar, con proposito real (no por completar la lista):

- **Strategy**: para el calculo de ETA (`frontend/src/utils/calcularETA.js`),
  permitiendo intercambiar el algoritmo (distancia lineal actual vs. una
  futura estrategia basada en OSRM/ruteo real) sin modificar quien lo
  invoca.
- **Factory** (opcional, solo si se implementa el nivel de notificaciones
  push): para crear distintos "emisores" de notificacion (socket, futura
  push notification, futuro correo) desde un punto unico de creacion.

---

## Nivel 4 — Principios de Diseno (SOLID y buenas practicas)

### Estado actual (evaluado sobre el codigo real)

| Principio | Evaluacion | Evidencia |
|---|---|---|
| **SRP** (responsabilidad unica) | Parcialmente cumplido | La mayoria de controllers hacen solo HTTP; pero `busController.js` mezcla HTTP + SQL directo en varios metodos (viola SRP) |
| **OCP** (abierto/cerrado) | No evaluado aun | No hay puntos de extension explicitos (por eso se propone Strategy en Nivel 3) |
| **LSP** (sustitucion de Liskov) | No aplica directamente | El proyecto no usa herencia de clases de dominio |
| **ISP** (segregacion de interfaces) | Cumplido de forma implicita | Los modelos exponen solo los metodos que cada entidad necesita (no hay interfaces infladas) |
| **DIP** (inversion de dependencias) | No cumplido | Los `services`/`controllers` importan `pool` directamente en vez de recibirlo inyectado; no es grave a esta escala, pero es la razon tecnica de por que no se llama "Clean Architecture" |
| **DRY** | Mejorable | La validacion de `origenPermitido`/`esOrigenLan`/`esOrigenNgrok` esta duplicada identica en `app.js` y `server.js` |
| **KISS** | Cumplido | El codigo evita abstracciones innecesarias, es directo y legible |
| **YAGNI** | Cumplido | No se agregaron patrones ni capas que no se necesitan (justo el criterio que hemos aplicado en todo este analisis) |

### Propuesta de mejora
- Refactor de SRP: mover SQL de controllers a services (mismo cambio que
  Nivel 2).
- Eliminar duplicacion DRY: extraer `esOrigenLan`/`esOrigenNgrok`/
  `origenPermitido` a un modulo compartido `backend/src/utils/cors.js`
  importado por `app.js` y `server.js`.
- DIP: no se propone inyeccion de dependencias formal (seria
  sobre-ingenieria para el alcance), pero se documenta como limitacion
  consciente en el manual tecnico.

---

## Nivel 5 — Codigo Limpio e Idioms (JavaScript)

### Estado actual
- Uso consistente de `async/await` (no hay callbacks ni mezcla con
  `.then()`).
- Nombres de funciones y variables en espanol, consistentes con el dominio
  del proyecto (aceptable y coherente en todo el codigo).
- Sin tipado estatico (JavaScript puro, no TypeScript) — no es un error,
  pero es una limitante para detectar errores en tiempo de desarrollo.
- ESLint configurado en frontend (`eslint.config.js`); backend no tiene
  linter configurado.

### Propuesta de mejora (bajo riesgo, alto valor para la exposicion)
- Agregar ESLint al backend (mismo criterio que ya existe en frontend) para
  unificar convenciones de estilo.
- Evaluar JSDoc en funciones publicas de `services`/`models` para tener
  auto-documentacion de tipos sin migrar todo el proyecto a TypeScript
  (migracion completa se considera fuera de alcance para este semestre).
- Revisar manejo de errores repetido (`console.error(...); return
  res.status(500)...`) para extraer un helper comun de respuesta de error,
  reduciendo duplicacion sin cambiar el patron de capas.

---

## Resumen ejecutivo para la exposicion

> El proyecto heredado ya cumple con una arquitectura valida y vigente:
> cliente-servidor con backend monolitico modular (Nivel 1b), organizado en
> capas MVC+services (Nivel 2), con varios patrones GoF aplicados de forma
> natural (Nivel 3). El plan de este semestre no busca reescribir esa base,
> sino **profesionalizar la infraestructura** (backend en Render, base de
> datos en Aiven, en vez de ngrok/local), **cerrar inconsistencias de capas**
> detectadas (SRP, DRY), y **evaluar Capacitor** como extension opcional
> hacia apps moviles nativas sin abandonar la PWA actual.
