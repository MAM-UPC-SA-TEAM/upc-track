# Pruebas y reporte de cobertura

Issue: #80 (Q08). Las pruebas viven en una carpeta `test/` por paquete, separada del código en `src/`.

```
backend/test/
  helpers/env.js        variables de entorno de prueba (importar antes que src/)
  helpers/bd.js         conecta a la BD de prueba (local, :5434), aplica esquema + seed
  unit/                 funciones puras: cors, conexion, ...
  integration/          HTTP con supertest sobre src/app.js; modelos y pool mockeados (sin BD)
  db/                   HTTP con supertest contra PostgreSQL REAL; verifica la persistencia
frontend/test/
  setup.js              jest-dom + limpieza automática de Testing Library
  utils/                espejo de src/utils
  components/           espejo de src/components
```

Convención: `<modulo>.test.js` (o `.test.jsx`), con la misma ruta relativa que el archivo probado en `src/`.

## Pruebas end-to-end (Playwright)

Un navegador real (Chromium) recorre la aplicación completa: frontend en Vite + backend Express + PostgreSQL real.
Viven en `e2e/` (config en `playwright.config.js`).

```
e2e/
  global-setup.js        verifica que la BD es local y aplica esquema + seed
  helpers.js             iniciarSesion(page, rol), datos únicos por corrida
  tests/
    acceso.spec.js       login/registro/guardas de rol/cierre de sesión
    estudiante.spec.js   rutas con paradas y horarios, buses
    admin.spec.js        panel, alta y baja de usuarios, buses y rutas
    tiempo-real.spec.js  conductor transmite (GPS simulado) y el estudiante lo ve en vivo
```

**Aislamiento:** el e2e usa su propia base (`docker-compose.e2e.yml`, puerto 5434, sin volumen) y fuerza `DATABASE_URL`
vacío, de modo que **nunca** toca la base de desarrollo ni la de la nube, aunque `backend/.env` apunte a ella.
Puertos propios: backend 3100, frontend 5180.

```bash
npm run e2e:db:up      # levanta Postgres desechable (requiere Docker)
npm run e2e            # corre los tests; Playwright arranca backend y frontend solo
npm run e2e:ui         # modo interactivo
npm run e2e:report     # abre el reporte HTML
npm run e2e:db:down    # destruye la base
```

Primera vez: `npx playwright install chromium`. En CI el job `e2e (playwright)` usa un servicio Postgres y sube el reporte
como artefacto `playwright-report`.

## Herramientas

| Paquete  | Ejecutor / aserciones         | Extras                                   | Cobertura |
|----------|-------------------------------|------------------------------------------|-----------|
| backend  | `node:test` + `node:assert`   | `supertest` (HTTP)                       | `c8`      |
| frontend | `vitest` (jsdom)              | Testing Library (`react`, `jest-dom`)    | `@vitest/coverage-v8` |

## Comandos

```bash
npm test                       # raíz: backend + frontend
npm run test:coverage          # raíz: ambos con reporte de cobertura

npm run test:unit --prefix backend
npm run test:integration --prefix backend
npm run e2e:db:up && npm run test:db --prefix backend     # integración con BD real
npm run test:coverage:full --prefix backend               # cobertura incluyendo test/db (como el CI)
npm run test:watch --prefix frontend
```

## Leer el coverage report

Cada paquete genera `coverage/` (ignorado por git):

- **Umbral: ≥ 60 %** en sentencias, ramas, funciones y líneas, forzado en los dos paquetes (`c8 --check-coverage` y
  `coverage.thresholds` de Vitest): si baja, el comando y el CI fallan. Valores actuales: backend 83 % (servicios,
  controladores, rutas, middlewares y utilidades ≈ 100 %), frontend 73 % de sentencias.
- Terminal: tabla por archivo con `% Stmts`, `% Branch`, `% Funcs`, `% Lines`.
- HTML: abrir `backend/coverage/index.html` o `frontend/coverage/index.html`; las líneas en rojo no se ejecutaron.
- `lcov.info`: para herramientas externas (Codecov, Sonar).

En CI el reporte se publica como artefacto `coverage-backend` / `coverage-frontend`.

## Escribir una prueba nueva

- Backend, unitaria: `import '../helpers/env.js'` primero si el módulo lee `config/env.js`.
- Backend, integración: `import request from 'supertest'` y `request(app).get('/api/...')`. Mockear el modelo/`pool` para no tocar la BD.
- Frontend: `render(<Componente />)` y consultar por rol/texto (`screen.getByRole`), no por clases CSS.

## Pirámide de pruebas: qué cubre cada nivel

| Nivel | Dónde | Qué prueba | Cantidad aprox. |
|-------|-------|-----------|-----------------|
| Unitarias (base) | `backend/test/unit`, `frontend/test/{utils,components,...}` | Funciones puras, validadores, utilidades y servicios de dominio. Patrón AAA, rápidas y sin red (F.I.R.S.T.) | ~230 + 354 |
| Integración HTTP con mocks | `backend/test/integration` | Rutas, roles y validaciones de cada endpoint con modelos/`pool` simulados | incluidas arriba |
| Integración con BD real | `backend/test/db` | Endpoints reales + consulta directa a PostgreSQL tras cada escritura | 28 |
| E2E (valor agregado) | `e2e/tests` (Playwright) | Navegador real: login, paneles por rol, tiempo real conductor→estudiante | ver arriba |

**Dónde está cada criterio de la rúbrica**

- *Mocks/stubs con aislamiento de la BD:* `backend/test/unit/authService.test.js` (mockea `pool.query` con `node:test` `mock.method`
  y prueba `login`/`registrarEstudiante` sin base de datos) y `ubicacionService`.
- *Camino feliz:* login correcto, crear bus, crear horario.
- *Valores límite:* contraseña de 7 vs 8 caracteres, hora `23:59` vs `24:00` y `12:60`, velocidad con 2 vs 3 posiciones y 19 vs 20 s
  (`velocidad.test.js`), token vencido (`jwt.test.js`).
- *Errores y excepciones:* clave errónea, token basura, BD caída (500), duplicados, recursos inexistentes.
- *Códigos HTTP verificados:* 200, 201, 400, 401, 403, 404 (y 409 donde aplica). **422 no se usa**: esta API responde
  `400` a toda validación de entrada; es una decisión de contrato vigente y las pruebas la fijan así.
- *Persistencia real:* `test/db` comprueba con un `SELECT` que lo creado/editado/borrado quedó (o no) en la base, y que
  una petición rechazada (400/403) **no** dejó filas.

### Integración con BD real

`test/db` usa el Postgres desechable de `docker-compose.e2e.yml` (`npm run e2e:db:up`, puerto 5434; en el CI, un servicio
`postgres` en el job `backend`). `helpers/bd.js` se niega a conectar si el host no es local y fuerza `DATABASE_URL` vacío,
de modo que **nunca** toca Neon aunque `backend/.env` apunte allá. Cada prueba usa datos únicos (`unico()`), así que se puede
repetir sin limpiar la base. Si la BD no está levantada falla con un mensaje claro; por eso `npm test` (sin Docker) solo corre
`unit` e `integration`, y `test:db` / `test:coverage:full` incluyen la base real.

## Flujo asistido por IA y auditoría contra «tests complacientes»

El riesgo: pedirle a la IA «escribe pruebas» sobre el código existente produce aserciones que **copian lo que el código hace**,
errores incluidos. Para evitarlo, las reglas de negocio y los casos borde se dieron en el prompt (y están en los nombres de
las pruebas) **antes** de mirar la implementación:

- Una cuenta de registro público queda inactiva y no recibe token hasta que un admin la apruebe; solo dominio institucional.
- Contraseña mínima de 8 caracteres (7 falla, 8 pasa). Correo y usuario no distinguen mayúsculas (`CITEXT`).
- Solo el admin crea/edita/borra buses, horarios y usuarios; solo el conductor cambia el estado de su bus; sin token → 401, rol
  incorrecto → 403.
- Operar sobre un recurso inexistente responde 404; una petición rechazada no debe dejar nada persistido.
- Horas `HH:mm` válidas de `00:00` a `23:59`.

**Auditoría de aserciones.** Cada prueba nueva se revisó preguntando «¿esto exige lo que pide el negocio o lo que hoy hace el
código?». Resultado en `test/db`:

| Hallazgo | Regla de negocio | Comportamiento actual | Tratamiento |
|----------|------------------|-----------------------|-------------|
| `PATCH /api/buses/:id` con id inexistente | 404 | 200 (no se mira `rowCount`) | corregido; prueba de regresión |
| `DELETE /api/buses/:id` con id inexistente | 404 | 200 | corregido; prueba de regresión |
| `PATCH /api/usuarios/:id` con cuerpo incompleto | 400 | 500 (violación NOT NULL) | corregido; prueba de regresión |

Los tres se marcaron primero como `todo` de `node:test` (se ejecutan y reportan sin romper el CI, de modo que la suite no
«aprueba» un error copiando su comportamiento) y después se corrigieron: `editarBus`/`eliminarBus` miran `rowCount` y
responden 404, y `editarUsuario` valida los campos obligatorios y responde 400. Las pruebas pasaron a ser de regresión, en
`test/db` y con mocks en `test/integration`. (Además, un primer intento de
`test/db` con `delete process.env.DATABASE_URL` habría vuelto a leer Neon desde `backend/.env`; la revisión lo detectó y se
fijó a cadena vacía.)
