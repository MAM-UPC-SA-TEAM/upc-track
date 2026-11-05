# Checklist de Validacion RNF (RNF1-RNF15)

Proyecto: Monitoreo de Buses UPCSA
Fecha: ____/____/______
Responsable: __________________
Ambiente: [ ] Local  [ ] Ngrok  [ ] Produccion

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

- RNF cumplidos: ______ / 15
- RNF parciales: ______ / 15
- RNF no cumplidos: ______ / 15

Riesgos detectados:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

Plan de mejora:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________
