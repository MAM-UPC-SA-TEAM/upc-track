# Plan de Pruebas (QA)

## 1. Alcance
- Pruebas unitarias (logica critica).
- Pruebas de integracion (API + BD + socket).
- Caja negra (funcional por requisito).
- Caja blanca (rutas de codigo principales).
- Pruebas de carga basica (envio de ubicaciones).

## 2. Matriz de casos (resumen)

| ID | Tipo | Caso | Resultado esperado |
|---|---|---|---|
| QA-01 | Caja negra | Login admin valido | Redirige a /admin |
| QA-02 | Caja negra | Login conductor valido | Redirige a /conductor |
| QA-03 | Integracion | GET /api/buses/mi-bus con conductor asignado | Retorna bus+ruta |
| QA-04 | Integracion | PATCH estado del bus | Actualiza estado y emite socket |
| QA-05 | Integracion | POST /api/notificaciones tipo info | Guarda y emite notificacion |
| QA-06 | Caja negra | Crear parada desde mapa en admin | Guarda lat/lng y aparece en tabla |
| QA-07 | Caja negra | Crear horario por ruta | Se lista en UI publica/admin |
| QA-08 | Caja blanca | Middleware JWT sin token | Responde 401 |
| QA-09 | Carga | 1 conductor envia ubicacion cada 3s por 5 min | Sin caidas ni errores criticos |
| QA-10 | Movil | Conductor en HTTPS envia GPS | Coordenadas actualizadas en mapa |

## 3. Pruebas de carga sugeridas
- Escenario A: 1 conductor, 1 ruta, 1 estudiante observando mapa.
- Escenario B: 3 conductores simultaneos enviando ubicacion.
- Medir: latencia de actualizacion y errores en backend.

## 4. Evidencias a anexar
- Capturas de casos aprobados.
- Logs de backend para casos de error controlado.
- Registro de defectos con estado (Abierto/Cerrado).

## 5. Criterios de salida QA
- 0 bloqueantes abiertos.
- 0 criticos abiertos.
- Flujos principales aprobados por rol.
- Mapa y notificaciones funcionando en movil HTTPS.

## 6. Evidencia automatizada (suite de pruebas)

La estrategia, la estructura de carpetas, los comandos y la auditoría de aserciones están en [`testing.md`](testing.md).

| Nivel | Paquete | Pruebas | Cómo generar el reporte |
|---|---|---|---|
| Unitarias + integración HTTP con mocks | backend (`node:test`, `supertest`) | 236 | `npm run test:coverage --prefix backend` |
| Integración con PostgreSQL real | backend (`test/db`) | 28 | `npm run e2e:db:up` y `npm run test:coverage:full --prefix backend` |
| Unitarias y de componentes | frontend (Vitest) | 354 | `npm run test:coverage --prefix frontend` |
| End-to-end | Playwright (`e2e/`) | ver `testing.md` | `npm run e2e` |

- **Cobertura:** backend 83 % y frontend 73 % (sentencias); umbral mínimo de 60 % que rompe el CI si no se cumple.
  Reporte en consola y HTML (`backend/coverage/index.html`, `frontend/coverage/index.html`); el CI lo publica como artefacto
  `coverage-backend` / `coverage-frontend`.
- **Correspondencia con la matriz de la sección 2:** QA-01/02 (login por rol) en `e2e/tests/acceso.spec.js` y `test/db`;
  QA-03/04/05 en `backend/test/integration` (`buses`, `notificaciones`); QA-06/07 en `e2e/tests/admin.spec.js` y `test/db`
  (horarios); QA-08 en `backend/test/unit/authMiddleware.test.js`. QA-09 y QA-10 siguen siendo manuales (carga y dispositivo
  real, issue M11).
- **Defectos:** la auditoría registró tres (404 en bus inexistente ×2, 400 en usuario incompleto); los tres están corregidos
  (#147).
