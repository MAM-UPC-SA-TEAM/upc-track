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
