# Sustentación y plan de contingencia (Q06)

Issue: #44 (Q06) · Riesgo R4 del Project Charter v2 · Criterios de aceptación del charter, §10

La demostración no puede depender de la suerte: Render puede estar dormido, Neon puede estar suspendido o agotado y puede no haber internet en el salón. Este documento fija el guion con tiempos, la lista de verificación previa y qué hacer, en cuántos minutos, si algo falla.

## 1. Qué se debe demostrar

Los cuatro criterios de aceptación del charter (§10), en este orden:

1. **Despliegue funcional en la nube**, accesible por HTTPS (Cloudflare + Render + Neon).
2. **APK Android instalable** que apunta al backend desplegado.
3. **Evidencia de QA:** pruebas automatizadas, validación de RF/RNF (`14_validacion_rf_rnf.md`) y pruebas de usabilidad (`15_pruebas_usabilidad.md`).
4. **Trazabilidad:** historial de Pull Requests con CI en verde y tablero de GitHub Projects.

## 2. Equipo y dispositivos

El equipo activo es de **una persona**, que hace de presentador y de conductor. Hace falta:

| Dispositivo | Papel en la demo |
|---|---|
| Teléfono Android con el APK | Conductor (transmite la posición) y, si se quiere, estudiante. |
| Laptop conectada al proyector | Estudiante (mapa y tiempo de llegada) y administrador, en dos sesiones del navegador (una en ventana privada). |
| Segundo dispositivo (opcional) | Segundo estudiante, para mostrar que el aviso llega a otro usuario. |

## 3. Guion cronometrado (15 minutos)

| Minuto | Parte | Qué se hace | Qué se dice |
|---|---|---|---|
| 0:00 | **Problema** (1 min) | Diapositiva con el problema. | Los estudiantes esperan sin saber cuándo llega el bus; la meta es reducir esa espera. |
| 1:00 | **Arquitectura** (2 min) | Diagrama del manual técnico (§1.1). | Frontend en Cloudflare, backend monolito modular en Render, PostgreSQL en Neon, APK con Capacitor; $0. Capas, Strategy del ETA y Adapters. |
| 3:00 | **Estudiante** (3 min) | Laptop: iniciar sesión, **Inicio** (tiempo de llegada a la parada), **Mapa**, **Rutas** y horarios. | Dato «Validado hace Xs»; si se pierde la señal, el dato se anula con un sello. |
| 6:00 | **Conductor** (3 min) | Teléfono (APK): iniciar sesión, **Iniciar recorrido** (aceptar el permiso), mostrar «Transmitiendo». En la laptop, el bus se mueve. Enviar un aviso de **Retraso** y mostrar que llega como notificación. | Wake Lock, permiso de ubicación, transmisión cada ~4 s. |
| 9:00 | **Administrador** (2 min) | Aprobar una cuenta recién registrada (preparada de antemano), crear o editar un bus o una ruta. | Registro solo con `@unicesar.edu.co` y aprobación manual. |
| 11:00 | **Calidad** (2 min) | Pestaña de GitHub Actions (CI en verde), informe de validación y tablero. | 656 pruebas automatizadas y 20 e2e, accesibilidad sin violaciones, 10/15 RF y 10/15 RNF cumplen, 0 incumplen. |
| 13:00 | **Usabilidad** (1 min) | Tabla de resultados del informe de usabilidad. | Resultados frente a las metas del charter (si alguna no se alcanza, se dice y se explica). |
| 14:00 | **Cierre** (1 min) | Diapositiva de trabajo futuro. | iOS, push remoto, ETA por la red vial, segundo plano. Preguntas. |

Si el tiempo apremia, se recortan en este orden: administrador, usabilidad, arquitectura. **No se recortan** estudiante ni conductor: son la demostración.

## 4. Lista de verificación previa

### El día anterior

- [ ] **Release a `main` hecha** (Q07) y producción con las cabeceras de seguridad: `curl -I https://upc-track.onrender.com/api/health` muestra `strict-transport-security` y no `x-powered-by`.
- [ ] `JWT_SECRET` de Render rotado (pendiente de #16).
- [ ] APK instalado en el teléfono, con la versión de la última Release, y sesión **cerrada**.
- [ ] Cuentas de prueba creadas y activas con `npm run db:usuario` (en `backend/`): estudiante, conductor con **bus y ruta asignados**, administrador y una cuenta **pendiente** para aprobar en vivo. Las claves están en el gestor del equipo, no en el repositorio.
- [ ] La ruta de la demo tiene al menos 2 paradas y un horario.
- [ ] **Video de respaldo** del recorrido completo (conductor, estudiante y administrador), de 3 a 4 minutos, guardado en la laptop y en el teléfono.
- [ ] Diapositivas y diagrama de arquitectura en PDF (sin depender de internet).
- [ ] Plan B local probado una vez (sección 6, escenario D).
- [ ] Cargadores, un cable de pantalla de repuesto y un teléfono con datos móviles como punto de acceso.

### 30 minutos antes

- [ ] Llegar al salón y probar **internet**: abrir `https://upc-track.onrender.com/api/health`.
- [ ] Conectar la laptop al proyector y comprobar la resolución.
- [ ] Teléfono: modo «No molestar», brillo alto y ajuste para que no se bloquee la pantalla; batería al 100 % o cargando.

### 10 minutos antes (despertar la nube)

- [ ] **Despertar Render:** abrir `/api/health` y esperar el 200 (puede tardar hasta un minuto). Repetirlo a los 5 minutos, porque Render suspende a los 15 sin tráfico.
- [ ] **Despertar Neon:** iniciar sesión con el estudiante (consulta la base) y confirmar que carga el inicio.
- [ ] Iniciar sesión como estudiante y administrador en la laptop y dejar el mapa abierto; en el teléfono, dejar el APK en la pantalla de inicio de sesión.
- [ ] Comprobar que el conductor tiene su bus «fuera de servicio» (no «en recorrido» de una prueba anterior).

### Al empezar

- [ ] Cerrar notificaciones y aplicaciones no necesarias. Tener el video de respaldo listo en una pestaña.

## 5. Decisión rápida: ¿sigo o paso al plan B?

Regla simple: **si en 2 minutos algo crítico no funciona, se pasa al siguiente nivel de contingencia** sin discutirlo. Los niveles, de menos a más drástico:

1. Reintentar una vez (recargar, reabrir la app).
2. Usar la alternativa de la misma nube (PWA en el navegador en lugar del APK, otro dispositivo).
3. Plan B local (la laptop como backend).
4. Video de respaldo, narrado en vivo.

## 6. Contingencias por escenario

| # | Síntoma | Causa probable | Acción |
|---|---|---|---|
| **A** | La app muestra «Despertando el servidor…» y no pasa de un minuto. | Render dormido. | Seguir con las diapositivas de arquitectura mientras despierta (el aviso se quita solo). Si en 3 minutos no responde, pasar al escenario D. |
| **B** | `/api/health` responde pero el login falla con error del servidor. | Neon suspendido o con la cuota agotada. | Reintentar una vez (Neon despierta en segundos). Si persiste, escenario D: la base local no depende de Neon. |
| **C** | No hay internet en el salón. | Red de la universidad. | Conectar la laptop y el teléfono al punto de acceso del teléfono de respaldo. Si tampoco funciona, escenario D. |
| **D** | Plan B local: la nube no está disponible. | Cualquiera de las anteriores. | La laptop es el backend (ver 6.1). El APK **no sirve** en este escenario (apunta a Render): el conductor se simula con el script y todo se muestra en el navegador de la laptop. |
| **E** | El APK no abre, no inicia sesión o se cierra. | Error del dispositivo. | Usar la PWA en el navegador del teléfono (`https://upc-track.manuel0726tocora.workers.dev`) o el APK en otro teléfono. |
| **F** | El teléfono no da posición (bajo techo, sin GPS). | Señal GPS débil en el salón. | Usar el simulador de recorrido (6.2) en lugar del teléfono, o ir junto a una ventana. |
| **G** | El proyector o la laptop fallan. | Hardware. | Mostrar la demo desde el teléfono o reproducir el video de respaldo. |
| **H** | Una pantalla muestra datos raros (bus sin posición, ETA vacío). | Estado en memoria del servidor perdido tras un reinicio. | El ETA se recupera en ~20 s con el bus transmitiendo; mientras tanto, explicarlo y seguir. |

### 6.1 Plan B local (la laptop como backend)

Prerrequisitos (se verifican el día anterior): Docker Desktop y `npm run install:all` ya hechos, y `backend/.env` con la base **local** (`DB_HOST`, `DB_PORT=5433`, … y **sin** `DATABASE_URL`).

```bash
docker compose up -d     # PostgreSQL 16 en :5433 con esquema y usuarios de demostración
npm run dev              # backend :3000 y frontend :5173
```

En este modo hay usuarios de demostración (`admin`, `conductor`, `estudiante`, clave pública de `seed.sql`), que **solo existen en la base local**. Abrir `http://localhost:5173` en la laptop y usar el simulador del conductor.

Si el teléfono debe alcanzar la laptop (por ejemplo, para mostrar la PWA en el teléfono), `npm run dev:mobile` imprime las direcciones de la red local; como último recurso se puede exponer el backend con ngrok. El APK no se puede apuntar a otro servidor sin recompilarlo.

### 6.2 Simulador de conductor

Mueve el bus del conductor por las paradas de su ruta, de ida y vuelta, sin salir a la calle:

```bash
# contra el backend local (plan B o ensayos)
COND_USER=conductor COND_PASS=<clave> node scripts/dev/simular-recorrido.mjs --base http://localhost:3000

# contra la nube (exige --confirmar-produccion: el bus aparecerá en el mapa de todos)
COND_USER=<conductor-de-prueba> COND_PASS=<clave> node scripts/dev/simular-recorrido.mjs \
  --base https://upc-track.onrender.com --confirmar-produccion --velocidad 40 --pausa-parada 6
```

Opciones: `--velocidad` (km/h, 25 por defecto), `--intervalo` (segundos entre envíos, 4), `--pausa-parada` (segundos de espera en cada parada), `--vueltas` (0 = hasta Ctrl+C). **Ctrl+C deja el bus «fuera de servicio»**. Contra producción usar siempre un **bus y un conductor de prueba**, no uno real.

## 7. Ensayo general

El criterio de aceptación es: **un ensayo completo, de principio a fin, sin intervención técnica imprevista.**

| Ensayo | Fecha | Duración | ¿Sin intervención técnica? | Qué falló / qué se cambió |
|---|---|---|---|---|
| 1 | | | | |
| 2 (con las contingencias A y D simuladas) | | | | |

Condiciones: cronometrar contra el guion de la sección 3; hacerlo en la misma red o en una parecida a la del salón; con los dispositivos reales; y al menos un ensayo con la nube **dormida** al empezar (esperar 20 minutos sin tráfico) para verificar que el plan de calentamiento de la sección 4 alcanza.

Antes de este ensayo se ejecutó un **ensayo técnico** de los flujos (login, GPS de punta a punta, alertas, concurrencia, simulador y plan B) contra una réplica local: resultados en `14_validacion_rf_rnf.md`.

## 8. Preguntas probables y respuestas cortas

| Pregunta | Respuesta |
|---|---|
| ¿Por qué un monolito y no microservicios? | El dominio es muy relacional, Socket.IO necesita conexiones persistentes y un equipo de una persona no justifica orquestar servicios (manual técnico §1.1). |
| ¿Por qué Render y Neon? | Son gratuitos y cumplen el presupuesto de $0; Neon solo ofrece PostgreSQL, por eso se migró de MySQL. El costo es el arranque en frío, que la app avisa y reintenta. |
| ¿Qué pasa si Render se duerme en plena demo? | La app muestra «Despertando el servidor» y reconecta sola; se calienta 10 minutos antes y hay plan B local. |
| ¿Cómo se sabe que el dato del bus es confiable? | Se muestra «Validado hace Xs»; pasados 30 s, o sin conexión, el dato se anula con un sello en lugar de mostrarse como vigente. |
| ¿Qué patrones de diseño aplicaron? | Observer (salas de Socket.IO), Singleton, Adapter (api, socket, geolocalización), Decorator (middlewares) y Strategy (ETA). El plan completo está en el manual técnico y el estado final del plan de arquitectura. |
| ¿Cómo garantizan la calidad? | CI obligatorio en cada PR, 656 pruebas automatizadas y 20 e2e con base real, accesibilidad sin violaciones y validación de requisitos documentada. |
| ¿Qué no lograron? | Seguimiento del conductor con la pantalla bloqueada, notificaciones push remotas, iOS y publicación en tiendas; están en trabajo futuro y fuera del alcance acordado en el charter v2. |
| ¿Es seguro? | JWT y roles, contraseñas con bcrypt, `helmet`, CORS estricto, límite de intentos de login, registro solo con correo institucional y aprobación del administrador, y dependencias sin vulnerabilidades conocidas. |
