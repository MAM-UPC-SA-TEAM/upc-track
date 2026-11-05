# Checklist de Validacion RF (RF1-RF15)

Proyecto: Monitoreo de Buses UPCSA
Fecha: ____/____/______
Responsable de prueba: __________________

Instruccion: marca cada item cuando este validado y registra evidencia (captura, URL, rol, hora, resultado).

## Preparacion

- [x] Backend encendido (API y Socket.IO)
- [x] Frontend encendido
- [x] Datos base creados: al menos 2 rutas, 2 buses, 1 conductor, paradas y horarios
- [x] Sesiones disponibles: estudiante, conductor, admin

---

## RF1 - Login

- [x] Ingresar con credenciales validas (estudiante)
- [x] Ingresar con credenciales validas (conductor)
- [x] Ingresar con credenciales validas (admin)
- [x] Probar credenciales invalidas y verificar mensaje

Evidencia: ________________________________
Resultado: [x] Cumple  [ ] Parcial  [ ] No cumple

## RF2 - Cierre de sesion

- [x] Cerrar sesion manual desde menu
- [ ] Verificar redireccion al login
- [ ] Dejar sesion inactiva y validar cierre automatico por inactividad

Evidencia: ________________________________
Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple

## RF3 - Ubicacion en tiempo real

- [x] Iniciar recorrido en conductor
- [x] Ver en estudiante el marcador de bus actualizandose en el mapa

Evidencia: ________________________________
Resultado: [x] Cumple  [ ] Parcial  [ ] No cumple

## RF4 - Notificaciones (cambio de ruta/retraso)

- [x] Enviar notificacion manual desde conductor (tipo retraso)
- [x] Enviar notificacion manual desde conductor (tipo cambio_ruta)
- [x] Ver notificacion en estudiante (panel y vista de notificaciones)
- [ ] Verificar notificacion automatica por retraso detectado

Evidencia: ________________________________
Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple

## RF5 - Ver rutas

- [x] Entrar a modulo de rutas
- [x] Ver listado de rutas activas/suspendidas
- [x] Abrir ruta en mapa desde boton correspondiente

Evidencia: ________________________________
Resultado: [x] Cumple  [ ] Parcial  [ ] No cumple

## RF6 - Administracion del sistema

- [x] Admin crea/edita/elimina ruta
- [x] Admin crea/edita/elimina bus
- [ ] Cambios se reflejan en vistas operativas

Evidencia: ________________________________
Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple

## RF7 - Gestion de usuarios

- [x] Admin visualiza listado de usuarios
- [x] Admin crea/edita usuario y rol
- [x] Verificar restriccion de acceso por rol en rutas protegidas

Evidencia: ________________________________
Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple

## RF8 - Actualizacion de ubicacion

- [x] Conductor en recorrido envia ubicacion periodicamente
- [x] Estudiante ve cambios recurrentes de posicion
- [ ] Verificar comportamiento estable ante perdida/recuperacion de red

Evidencia: ________________________________
Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple

## RF9 - Recorrido en mapa

- [x] Visualizar recorrido de una ruta especifica
- [x] En modo "Todas" visualizar varias rutas simultaneamente
- [x] Verificar que cruces o finales cercanos no impidan distinguir rutas

Evidencia: ________________________________
Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple

## RF10 - Paraderos

- [x] Ver paraderos de la ruta en mapa
- [x] Ver diferencia visual entre parada activa/inactiva

Evidencia: ________________________________
Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple

## RF11 - Tiempo estimado de llegada

- [x] Seleccionar parada en mapa
- [x] Ver bus mas cercano, distancia y tiempo estimado de llegada
- [x] Validar actualizacion del tiempo cuando cambia posicion del bus

Evidencia: ________________________________
Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple

## RF12 - Registro de estudiante / estado bus

- [x] Crear cuenta de estudiante desde formulario de registro
- [x] Iniciar sesion con la cuenta recien creada
- [x] Ver estado del bus (en_recorrido, detenido, fuera_de_servicio)

Evidencia: ________________________________
Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple

## RF13 - Identificar bus

- [x] Ver identificador del bus (nombre/numero)
- [x] Confirmar que no hay ambiguedad entre buses distintos

Evidencia: ________________________________
Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple

## RF14 - Informacion del bus

- [x] Seleccionar bus en el mapa
- [x] Ver datos basicos: nombre, placa, ruta, conductor, estado

Evidencia: ________________________________
Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple

## RF15 - Buses disponibles

- [x] Entrar al modulo de buses disponibles
- [x] Ver lista con estado de cada bus
- [x] Cambiar estado desde conductor y verificar reflejo en tiempo real

Evidencia: ________________________________
Resultado: [ ] Cumple  [ ] Parcial  [ ] No cumple

---

## Cierre de validacion

- RF cumplidos: ______ / 15
- RF parciales: ______ / 15
- RF no cumplidos: ______ / 15

Observaciones finales:

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________
