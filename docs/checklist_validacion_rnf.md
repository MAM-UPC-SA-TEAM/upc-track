# Checklist de Validacion RNF (RNF1-RNF15)

Proyecto: Monitoreo de Buses UPCSA
Fecha: 18/11/2026
Responsable: equipo de desarrollo
Ambiente: [x] Local (réplica con base desechable)  [ ] Ngrok  [x] Produccion (solo lectura: salud, latencia, CORS, Socket.IO)
Evidencia y resultados por requisito: [`14_validacion_rf_rnf.md`](14_validacion_rf_rnf.md) (los casilleros de abajo son la plantilla de la prueba manual; el resultado oficial está en ese informe).

Instruccion: ejecuta cada prueba, marca el resultado y guarda evidencia (captura, video, logs, tiempo medido).

---

## Preparacion

- [x] Backend encendido y estable
- [x] Frontend encendido
- [x] Base de datos accesible
- [x] Cuentas de prueba: admin, conductor, estudiante
- [x] Navegadores de prueba: Chrome, Edge, Firefox (y opcional Safari)
- [x] Dispositivos: movil + desktop

Evidencia: ________________________________

---

## RNF1 - Capacidad de usuarios concurrentes

Objetivo: validar que varios usuarios pueden operar sin fallas.

- [ ] Abrir al menos 10 sesiones simultaneas (mezcla de roles)
- [ ] En 3 sesiones de conductor enviar ubicacion en paralelo
- [ ] En varias sesiones de estudiante abrir mapa y notificaciones
- [ ] Confirmar que no hay caidas ni errores bloqueantes

Metricas:
- Errores 5xx: ______
- Desconexiones de socket: ______

Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple
Evidencia: ________________________________

## RNF2 - Tema visual (claro/oscuro)

- [x] Cambiar a modo oscuro
- [x] Cambiar a modo claro
- [x] Verificar persistencia tras recargar

Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple
Evidencia: ________________________________

## RNF3 - Disponibilidad 24/7

Nota: este RNF se valida operativamente con monitoreo.

- [ ] Revisar que exista estrategia de despliegue/monitoreo
- [ ] Verificar endpoint de salud operativo
- [ ] Simular reinicio de backend y comprobar recuperacion

Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple
Evidencia: ________________________________

## RNF4 - Identidad institucional (colores)

- [x] Verificar paleta institucional en login, layout y botones clave
- [x] Confirmar consistencia visual entre modulos

Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple
Evidencia: ________________________________

## RNF5 - Compatibilidad en navegadores

- [x] Probar flujo login->mapa en Chrome
- [x] Probar flujo login->mapa en Edge
- [x] Probar flujo login->mapa en Firefox
- [x] (Opcional) Safari movil

Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple
Evidencia: ________________________________

## RNF6 - Adaptabilidad (responsive)

- [x] Validar vistas clave en movil (login, mapa, rutas)
- [ ] Validar vistas clave en tablet
- [x] Validar vistas clave en desktop
- [ ] Confirmar que no hay solapamientos criticos

Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple
Evidencia: ________________________________

## RNF7 - Seguridad de contrasena (min 8)

- [x] Intentar registrar password < 8 y verificar bloqueo
- [ ] Intentar login con password < 8 y verificar validacion

Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple
Evidencia: ________________________________

## RNF8 - Cierre por inactividad

- [x] Iniciar sesion
- [ ] Esperar tiempo de inactividad configurado
- [ ] Verificar cierre automatico y retorno a login

Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple
Evidencia: ________________________________

## RNF9 - Usabilidad (simple e intuitiva)

- [x] Completar tareas basicas sin ayuda: login, ver mapa, ver rutas
- [ ] Confirmar mensajes de error claros
- [x] Confirmar navegacion consistente por rol

Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple
Evidencia: ________________________________

## RNF10 - Confiabilidad de informacion

- [x] Comparar estado de bus en conductor vs estudiante
- [x] Verificar que notificaciones coinciden con eventos reales
- [x] Verificar que ETA cambia al mover bus

Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple
Evidencia: ________________________________

## RNF11 - Bloqueo por intentos fallidos

- [ ] Ejecutar 6 intentos de login fallido seguidos
- [ ] Validar mensaje de bloqueo temporal/rate limit
- [ ] Verificar que login valido vuelve a funcionar tras ventana de bloqueo

Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple
Evidencia: ________________________________

## RNF12 - Tiempo de respuesta (<3s)

- [ ] Medir login (<3s)
- [ ] Medir carga de rutas (<3s)
- [ ] Medir carga de buses activos (<3s)

Mediciones:
- Login: ______ s
- Rutas: ______ s
- Buses activos: ______ s

Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple
Evidencia: ________________________________

## RNF13 - Portabilidad (sin instalar programas)

- [x] Acceso por navegador sin instalar software adicional
- [x] Funciones principales operativas desde URL

Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple
Evidencia: ________________________________

## RNF14 - Logo institucional

- [x] Logo visible en login
- [x] Logo visible en layout principal
- [x] Logo con buena resolucion en movil y desktop

Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple
Evidencia: ________________________________

## RNF15 - Mantenibilidad

- [x] Realizar cambio pequeno (texto/estilo/controlador)
- [x] Verificar que no rompe funcionalidades principales
- [x] Verificar separacion por capas (frontend/backend/controllers/models)

Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple
Evidencia: ________________________________

---

## Cierre de validacion RNF

- RNF cumplidos: 10 / 15 (RNF1, RNF2, RNF6, RNF7, RNF8, RNF10, RNF11, RNF13, RNF14 y RNF15)
- RNF parciales: 4 / 15 (RNF3, RNF5, RNF9 y RNF12)
- RNF pendientes de validación manual: 1 / 15 (RNF4)
- RNF no cumplidos: 0 / 15

Riesgos detectados:
1. ~~Producción sin `helmet` ni dependencias corregidas~~: resuelto con la release a `main` (PR #167), verificado en producción (`14_validacion_rf_rnf.md`, sección 5.1).
2. Planes gratuitos sin garantía 24/7: arranque en frío de Render de ~17 s (excepción documentada, riesgo R4).
3. Endpoints autenticados de la nube sin medir (producción no tiene usuarios de prueba).

Plan de mejora:
1. ~~Hacer la release a `main` y verificar las cabeceras~~: hecho. El tag `v1.0.0` y la Release con el APK quedan para el congelamiento del 01-dic (Q07).
2. Calentar el servicio antes de la sustentación y mantener el plan B local (Q06).
3. Completar la guía manual de la sección 6 de `14_validacion_rf_rnf.md` y las pruebas en dispositivo (#39) y con usuarios (#42).
