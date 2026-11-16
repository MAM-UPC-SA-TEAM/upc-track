# Manual de Usuario

## 1. Objetivo
Guiar al usuario final (estudiante, conductor y administrador) en el uso del sistema.

## 2. Perfiles
- Estudiante: consulta rutas, buses y notificaciones.
- Conductor: reporta recorrido, estado y avisos.
- Administrador: gestiona usuarios, buses, rutas, paradas y horarios.

## 3. Instalar la app Android (APK)
La app no esta en Play Store: se instala descargando el archivo APK.
1. En el telefono, abrir la pagina de *Releases* del repositorio (o el enlace que comparta el equipo) y descargar `UpcTrack-X.Y.Z.apk`.
2. Abrir el archivo descargado. La primera vez, Android avisa que el navegador no tiene permiso para instalar apps: tocar **Configuracion** y activar **Permitir de esta fuente** (Ajustes > Aplicaciones > Acceso especial > Instalar apps desconocidas, segun el fabricante).
3. Volver y tocar **Instalar**. Si Play Protect advierte que la app es desconocida, tocar **Mas detalles > Instalar de todas formas**.
4. Abrir **UpcTrack**: muestra la pantalla de inicio de sesion. Al iniciar un recorrido (conductor) o activar los avisos (estudiante), la app pide los permisos de ubicacion y notificaciones.
5. Para actualizar, instalar el APK nuevo encima: se conservan la sesion y los ajustes. Si Android dice «la app no se instalo» por un conflicto de firma, desinstalar la version anterior primero.

Requisitos: Android 6.0 o superior y conexion a internet.

## 4. Ingreso al sistema
1. Abrir la app UpcTrack (o la URL del frontend en el navegador).
2. Ir a Login.
3. Ingresar correo y contrasena.
4. El sistema redirige segun rol.

## 5. Funciones por rol

### 4.1 Estudiante
- Ver mapa en tiempo real.
- Ver rutas y horarios.
- Ver notificaciones del dia.
- Recibir avisos del bus (cambio de estado, retraso, cambio de ruta):
  - Unos segundos despues de entrar aparece el aviso «Activa los avisos para saber cuando cambia tu bus». Al tocar **Activar**, el telefono pide el permiso de notificaciones (en Android 13 o superior es obligatorio).
  - Con la app a la vista, el aviso sale dentro de la app (mensaje emergente y sonido). Con la app en segundo plano, llega como notificacion del telefono; al tocarla se abre la lista de notificaciones.
  - Si se descarto el aviso o se nego el permiso, se puede activar luego en Ajustes > Aplicaciones > UpcTrack > Notificaciones (en el navegador, en los permisos del sitio).
  - **Limitacion:** no hay notificaciones push desde el servidor. Los avisos llegan solo con la app abierta o en segundo plano reciente; si el sistema cerro la app, se veran al volver a abrirla, en la seccion Notificaciones.

### 4.2 Conductor
- Iniciar recorrido.
- Detener/Reanudar.
- Finalizar recorrido.
- Enviar aviso rapido con tipo:
  - Informacion
  - Retraso
  - Cambio de ruta

### 4.3 Administrador
- Gestionar usuarios (crear/editar/eliminar).
- Gestionar buses (ruta y conductor asignados).
- Gestionar rutas.
- Gestionar paradas:
  - seleccion en mapa
  - busqueda de direccion
- Gestionar horarios por ruta.

## 6. Flujo recomendado de operacion
1. Admin asigna conductor y ruta al bus.
2. Conductor inicia recorrido.
3. Estudiantes observan estado en mapa y notificaciones.
4. Conductor finaliza recorrido.

## 7. Solucion de problemas frecuentes
- No aparece mi bus en conductor: validar asignacion de conductor en Gestion de buses.
- GPS bloqueado: abrir en HTTPS (ngrok/Vercel), no en HTTP movil.
- No cargan datos: validar backend activo y endpoint /api/health.
