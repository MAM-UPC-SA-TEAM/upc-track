# Pruebas y reporte de cobertura

Issue: #80 (Q08). Las pruebas viven en una carpeta `test/` por paquete, separada del código en `src/`.

```
backend/test/
  helpers/env.js        variables de entorno de prueba (importar antes que src/)
  unit/                 funciones puras: cors, conexion, ...
  integration/          HTTP con supertest sobre src/app.js (sin puerto ni BD real)
frontend/test/
  setup.js              jest-dom + limpieza automática de Testing Library
  utils/                espejo de src/utils
  components/           espejo de src/components
```

Convención: `<modulo>.test.js` (o `.test.jsx`), con la misma ruta relativa que el archivo probado en `src/`.

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
npm run test:watch --prefix frontend
```

## Leer el coverage report

Cada paquete genera `coverage/` (ignorado por git):

- Terminal: tabla por archivo con `% Stmts`, `% Branch`, `% Funcs`, `% Lines`.
- HTML: abrir `backend/coverage/index.html` o `frontend/coverage/index.html`; las líneas en rojo no se ejecutaron.
- `lcov.info`: para herramientas externas (Codecov, Sonar).

En CI el reporte se publica como artefacto `coverage-backend` / `coverage-frontend`.

## Escribir una prueba nueva

- Backend, unitaria: `import '../helpers/env.js'` primero si el módulo lee `config/env.js`.
- Backend, integración: `import request from 'supertest'` y `request(app).get('/api/...')`. Mockear el modelo/`pool` para no tocar la BD.
- Frontend: `render(<Componente />)` y consultar por rol/texto (`screen.getByRole`), no por clases CSS.
