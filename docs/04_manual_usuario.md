# Manual de Usuario — UpcTrack

## 1. Objetivo

Guiar al usuario final (estudiante, conductor y administrador) en el uso de UpcTrack, el sistema que muestra en tiempo real dónde están los buses de la UPC Seccional Aguachica y cuánto falta para que lleguen.

## 2. Perfiles

- **Estudiante:** consulta rutas, buses, horarios, el tiempo estimado de llegada y las notificaciones.
- **Conductor:** transmite la posición de su bus durante el recorrido y envía avisos a su ruta.
- **Administrador:** gestiona usuarios, buses, rutas, paradas y horarios, y aprueba las cuentas nuevas.

## 3. Cómo usar UpcTrack

UpcTrack funciona de dos formas, con las mismas pantallas:

- **App Android (APK):** se instala desde un archivo, como se explica a continuación.
- **Navegador:** se abre la dirección web que comparta el equipo y, si el navegador lo ofrece, se puede instalar como aplicación desde el aviso de instalación.

### 3.1 Instalar la app Android (APK)

La app no está en Play Store: se instala descargando el archivo APK.

1. En el teléfono, abrir la página de *Releases* del repositorio (o el enlace que comparta el equipo) y descargar `UpcTrack-X.Y.Z.apk`.
2. Abrir el archivo descargado. La primera vez, Android avisa que el navegador no tiene permiso para instalar apps: tocar **Configuración** y activar **Permitir de esta fuente** (Ajustes > Aplicaciones > Acceso especial > Instalar apps desconocidas, según el fabricante).
3. Volver y tocar **Instalar**. Si Play Protect advierte que la app es desconocida, tocar **Más detalles > Instalar de todas formas**.
4. Abrir **UpcTrack**: muestra la pantalla de inicio de sesión. Al iniciar un recorrido (conductor) o activar los avisos (estudiante), la app pide los permisos de ubicación y notificaciones.
5. Para actualizar, instalar el APK nuevo encima: se conservan la sesión y los ajustes. Si Android dice «la app no se instaló» por un conflicto de firma, desinstalar la versión anterior primero.

Requisitos: Android 6.0 o superior y conexión a internet.

### 3.2 La primera vez puede tardar

El servidor se «duerme» cuando nadie lo usa. Si al abrir la app aparece **«Despertando el servidor… puede tardar hasta un minuto la primera vez»**, basta con esperar: la app reintenta sola y no hay que hacer nada más.

## 4. Crear una cuenta e ingresar

### 4.1 Crear una cuenta (estudiantes)

1. En la pantalla de inicio de sesión, tocar **Crear cuenta**.
2. Completar nombre completo, nombre de usuario, correo, contraseña (mínimo 8 caracteres) y su confirmación. El correo debe ser institucional: **`@unicesar.edu.co`**.
3. Tocar **Crear cuenta**. La cuenta queda **pendiente de aprobación**: un administrador la activa y solo entonces se puede iniciar sesión.

Las cuentas de conductor y administrador las crea un administrador.

### 4.2 Iniciar sesión

1. Abrir la app (o la dirección web).
2. Escribir el **nombre de usuario** y la **contraseña**. Se puede activar **Mostrar contraseña** para revisarla.
3. Tocar **Entrar**. El sistema lleva a la pantalla de inicio que corresponde al rol.

Tras varios intentos fallidos seguidos el acceso se bloquea unos minutos; hay que esperar e intentar de nuevo.

## 5. Funciones por rol

### 5.1 Estudiante

- **Inicio:** elige una parada y muestra cuánto falta para que llegue el próximo bus. Junto a la cifra aparece **«Validado · hace Xs»** cuando el dato es reciente. Si la posición es vieja o se perdió la conexión, el dato aparece **anulado con un sello** («Sin señal» o «Sin conexión»): no hay que fiarse de él hasta que vuelva.
- **Mapa en tiempo real:** muestra los buses en servicio, las paradas y las rutas. Se puede buscar un bus por nombre, filtrar por ruta y abrir la lista de buses con su tiempo de llegada.
- **Rutas:** cada ruta con sus paradas y horarios.
- **Buses:** los buses en ruta y su tiempo estimado de llegada.
- **Notificaciones:** en el teléfono están en la campana de la barra superior, con un contador de las recientes; la pantalla completa muestra las que no se han leído y distingue las ya leídas.
- **Perfil y Configuración:** en **Perfil** se ven los datos de la cuenta. En **Configuración** se pueden cambiar el nombre, el correo, el nombre de usuario y la contraseña, y elegir la apariencia: **Claro**, **Oscuro** o **Automático** (sigue el modo del teléfono).
- **Avisos del bus** (cambio de estado, retraso, cambio de ruta):
  - Unos segundos después de entrar aparece el aviso «Activa los avisos para saber cuándo cambia tu bus». Al tocar **Activar**, el teléfono pide el permiso de notificaciones (en Android 13 o superior es obligatorio).
  - Con la app a la vista, el aviso sale dentro de la app (mensaje emergente y sonido). Con la app en segundo plano, llega como notificación del teléfono; al tocarla se abre la lista de notificaciones.
  - Si se descartó el aviso o se negó el permiso, se puede activar luego en Ajustes > Aplicaciones > UpcTrack > Notificaciones (en el navegador, en los permisos del sitio).
  - **Limitación:** no hay notificaciones push desde el servidor. Los avisos llegan solo con la app abierta o en segundo plano reciente; si el sistema cerró la app, se verán al volver a abrirla, en Notificaciones.

### 5.2 Conductor

**Mi recorrido**

1. Tocar **Iniciar recorrido**. La primera vez el teléfono pide el **permiso de ubicación**: hay que aceptarlo. Si se niega, el recorrido **no empieza**, el bus sigue «fuera de servicio» y la pantalla explica cómo activar el permiso en Ajustes; después se vuelve a tocar **Iniciar recorrido**.
2. Mientras transmite, la pantalla dice **«Transmitiendo»** y **«Validado · hace Xs»**. **Mantén la app abierta y el teléfono cargando**: la pantalla se mantiene encendida durante el recorrido y, si se bloquea o se cambia de app mucho tiempo, la transmisión se interrumpe.
3. **Detener** deja el bus marcado como detenido (los estudiantes lo ven así) y **Reanudar** lo vuelve a poner en marcha.
4. **Finalizar** termina el recorrido; pide un segundo toque («Toca otra vez para finalizar») para evitar apagar el bus sin querer.
5. Si la pantalla dice **«Sin transmitir»**, el servidor cree que el bus está en recorrido pero este teléfono no envía su posición (por ejemplo, tras recargar la página). Tocar **Reanudar transmisión** o **Finalizar**.

**Avisar:** envía un aviso a todos los estudiantes de la ruta. Se elige el tipo (**Info**, **Retraso** o **Cambio de ruta**), se escribe el mensaje y se envía; debajo quedan los avisos ya enviados.

### 5.3 Administrador

- **Dashboard:** accesos rápidos a la gestión.
- **Usuarios:** crear, editar y eliminar usuarios. Las cuentas que se registraron solos aparecen como pendientes con un botón **Aprobar**.
- **Buses:** crear, editar y eliminar buses y asignarles ruta y conductor.
- **Rutas:** crear, editar y eliminar rutas. Dentro de cada ruta se gestionan:
  - **Paradas:** se eligen en el mapa o buscando una dirección.
  - **Horarios** de la ruta.

Si se intenta editar o eliminar algo que ya no existe (por ejemplo, otro administrador lo borró), el sistema responde «no encontrado» en lugar de fingir que funcionó.

## 6. Flujo recomendado de operación

1. El administrador aprueba las cuentas nuevas y asigna conductor y ruta a cada bus.
2. El conductor inicia el recorrido y mantiene la app abierta.
3. Los estudiantes ven el bus en el mapa y su tiempo de llegada, y reciben los avisos.
4. El conductor finaliza el recorrido.

## 7. Solución de problemas frecuentes

- **«Despertando el servidor…»:** es normal la primera vez tras un rato sin uso; esperar hasta un minuto.
- **No puedo iniciar sesión tras registrarme:** la cuenta está pendiente; hay que pedirle a un administrador que la apruebe. Con un correo que no sea `@unicesar.edu.co` no se permite el registro.
- **No aparece mi bus en Mi recorrido:** el administrador debe asignarte el bus en Buses.
- **El recorrido no empieza y habla del permiso de ubicación:** activar el permiso en Ajustes > Aplicaciones > UpcTrack > Permisos > Ubicación (en el navegador, en los permisos del sitio, con el candado junto a la dirección) y tocar **Iniciar recorrido** otra vez.
- **GPS bloqueado en el navegador:** abrir la dirección por **HTTPS**, no por HTTP.
- **El tiempo de llegada aparece anulado («Sin señal» o «Sin conexión»):** el bus dejó de enviar su posición o el teléfono perdió internet. Revisar la conexión; si es el bus, avisar al conductor.
- **No cargan los datos:** comprobar la conexión a internet. El estado del servidor se ve en `/api/health` de la dirección del backend.
