# Ruta de trabajo del semestre — UpcTrack

> **Estado:** decisiones cerradas. Equipo activo: **una persona**. Aún **no** se han creado issues en GitHub.
> **Corte del análisis:** 05-nov-2026 · **Entrega final:** 05-dic-2026 (30 días) · **Congelamiento de código:** 01-dic.
> **Fuentes:** `docs/10_plan_arquitectura_semestre.md`, `docs/project_charter.md`, el código de la rama `landing/poster-feria` y la documentación oficial de Aiven, Render y Capacitor consultada el 05-nov-2026 (enlaces en §11).

## 1. Registro de decisiones

Cada ambigüedad detectada queda cerrada con una decisión, su motivo y el issue que la ejecuta. Si una decisión cambia, se edita aquí y en el issue.

| # | Tema | Decisión | Motivo | Issue |
|---|---|---|---|---|
| D-01 | Capacitor en el charter | **APK Android In-Scope** (charter v2). Play Store, App Store e iOS compilado, Out-of-Scope. | El plan lo propone, el equipo lo quiere y un APK es verificable sin cuentas de pago. | Q01, M10 |
| D-02 | Versión de Capacitor | **Capacitor 7.x**, Node 22, JDK 21, `minSdk` 23, `targetSdk` 35. | Es la versión cuyos requisitos están verificados y para la que existe plugin de ubicación en segundo plano. | M03 |
| D-03 | Estructura del repo | Landing **dentro de `frontend/`** (`features/landing`, ruta pública `/`); raíz solo orquestador. | Decisión del equipo; un solo build y un solo despliegue. | W01 |
| D-04 | GitHub Pages | **Se retira.** La landing se sirve desde Vercel en `/`. Se borra `deploy.yml` y se desactiva Pages. | Ya no hay póster/QR que preservar; evita que un workflow roto llegue a `main`. | W01 |
| D-05 | Hosting | **Vercel** (frontend, incluida la landing) + **Render free** (backend) + **Aiven free** (MySQL). ngrok solo como contingencia. | Es el plan y cumple el presupuesto de $0 del charter. | D01–D08 |
| D-06 | Continuidad de la BD | El `SELECT 1` periódico mantiene activa la BD de Aiven; el plan B es **el MySQL local de `docker-compose.yml`**, no otro proveedor. | Aiven puede apagar servicios free sin actividad. Otro proveedor añade riesgos desconocidos. | D01, D06, Q06 |
| D-07 | Arranque en frío | Ping cada 10 min (cron-job.org) del 20-nov al 05-dic; estado «despertando…» en la UI. **Un solo servicio free en el workspace de Render.** | 750 h/mes: un servicio 24/7 usa 744 h; un segundo ya no cabe. | D05, D06 |
| D-08 | WebSockets en Render | Se asumen viables pero **se verifican antes del 13-nov**. Si fallan, se evalúa Fly.io con el Dockerfile. | Render cuenta mensajes WebSocket como actividad desde feb-2026, pero hubo reportes de cierres a los 5 min. | D08, D04 |
| D-09 | Registro y cuentas | El registro público solo crea estudiantes (verificado en código). Prod **sin** cuentas demo (`Admin123*`); cuentas de prueba con claves robustas por canal privado. | Evita credenciales conocidas en una BD pública. | D02 |
| D-10 | Conductor y segundo plano | Recorrido **garantizado**: app abierta, pantalla encendida (Wake Lock), teléfono cargando. Pantalla bloqueada = **spike opcional** de 1 día. | Android limita la red de la WebView en segundo plano; el éxito del plugin no está garantizado. | U06, M05 |
| D-11 | Notificaciones | **Locales** (`@capacitor/local-notifications`) con la app abierta o reciente. **Sin push remoto (FCM).** Se declara como limitación. | FCM exige Firebase y trabajo fuera del alcance de 30 días. | M06 |
| D-12 | Token de sesión | Se mantiene `localStorage` (la WebView lo conserva). | Migrar a Preferences no aporta al charter. Pasa a backlog futuro. | — |
| D-13 | Gestión ágil | **GitHub Projects** como fuente única; el backlog de Jira queda como histórico. El charter §9 se actualiza (propuesto, sin aprobación aún). | Issues, PR y tablero en un solo lugar; la trazabilidad sale automática. | W04, Q01 |
| D-14 | Flujo de ramas | `feature/*` → `develop` → `main`. `main` = producción (Vercel y Render despliegan desde ahí). PR obligatorio con CI verde; **sin aprobaciones obligatorias**. | Con una persona no hay revisor; el CI es el requisito de fusión. | W03, W04 |
| D-15 | Herramientas | Node 22 LTS, puerto de desarrollo **5173**, backend con `node:test` + `supertest`, frontend con Vitest solo para utilidades. Sin E2E. | Coherente con el entorno actual y con la escala del proyecto. | W01, B10 |
| D-16 | Patrones de diseño | **Strategy** para el ETA y **Adapter** para geolocalización. Factory, estrategia OSRM y JSDoc masivo pasan a backlog futuro. | El plan pide patrones «con propósito real, no por completar la lista». | B07, M04 |
| D-17 | Alcance del refactor de capas | Todo controller que use `pool` pasa a servicios (más que lo dicho en el plan), empezando por buses. | La auditoría halló el mismo defecto en usuario, ruta, notificación y logout. | B01, B02 |
| D-18 | Dirección visual | La app adopta la identidad de la landing (verde UPC + amarillo de señalética) en registro **producto**: sobrio y denso. Fuentes locales. Navegación inferior en móvil. | Una sola marca; el APK no puede depender de Google Fonts. | U01–U07 |
| D-19 | Evidencia de diseño | Capturas antes/después + `docs/13_auditoria_diseno.md`. **Sin Figma**. | Charter §10.2: la evidencia formal son diseños estáticos. | U01 |
| D-20 | Cómo se miden las metas | Satisfacción ≥ 80 % = al menos 80 % puntúa 4–5/5 en la pregunta global. RNF < 3 s se mide con el servicio despierto; el primer arranque en frío (~1 min) es excepción declarada. GPS: ya envía cada 4 s. | El charter no define el método y sin él la meta no es verificable. | Q01, Q02, Q03 |
| D-21 | Nombre del producto | **UpcTrack** (`appId: co.edu.unicesar.upctrack`). Hoy conviven «BusUPCSA», «Monitoreo de Rutas — UPCSA» y «UpcTrack». | Un solo nombre en manifest, ícono, APK, README y charter. | M08, Q01 |
| D-22 | Recorte | Se trabaja todo lo `Must` del hito antes de tocar un `Should`. Si el tiempo se aprieta se corta lo `Could`, luego U05/U07 y B02/B05. **Nunca** D08, M10, M11, Q01 ni Q02. | Protege el criterio de aceptación del charter. | — |
| D-23 | Equipo y revisión | Equipo de **una persona**. Sin revisión por pares: autorrevisión con lista de verificación + revisión asistida (`/code-review`) pegada en cada PR. El charter lo declara (R2). | Es la evidencia honesta de revisión que se puede dar; no se simula un equipo. | W04, Q01 |
| D-24 | Capacidad | 41 issues, de los cuales **24 Must** son el compromiso real; los 16 `Should` y 1 `Could` son *stretch*. | 30 días para una persona. | todos |
| D-25 | Registro institucional | El registro público solo acepta correos `@unicesar.edu.co` (igualdad exacta del dominio, validada **en el servidor**). La verificación de titularidad se decide en un spike de 1 día entre: **A** código por correo vía API HTTPS, **B** inicio de sesión con Microsoft, **C** aprobación manual por el administrador (último recurso). | El dominio por sí solo no prueba titularidad. Render free bloquea el SMTP saliente desde sept-2025 y el consentimiento de Microsoft depende del tenant de la universidad. | A01 |

### Supuestos asumidos (ya no hay decisiones abiertas)
1. **Responsables:** todos los issues se asignan a la persona que ejecuta el plan; si se suma alguien, se reasigna por área.
2. **Póster/QR:** se descarta; la URL de Pages se retira sin redirección.
3. **Aprobación del docente:** no existe todavía. El charter v2 se redacta igualmente y queda marcado como *cambios propuestos, pendiente de aprobación*. Riesgo aceptado: si el docente lo rechaza, hay que revertir Capacitor/nube a la forma del v1 (el código sigue sirviendo, solo cambia el alcance declarado).

## 2. Plan de arquitectura vs. estado real del código

| Nivel | El plan dice | Estado verificado | Issue |
|---|---|---|---|
| 1 · Infra | Backend en ngrok, BD local, sin CI/CD ni Docker | Correcto, salvo que ya existe `docker-compose.yml` (solo BD). `.env.example` y README aún nombran PlanetScale/ngrok | W03, D01–D09, Q04 |
| 1 · Móvil | Capacitor y geolocalización «con segundo plano» | PWA existente (VitePWA). El plugin oficial no cubre segundo plano | M01–M11 |
| 2 · Capas | `busController` y `logout` rompen la regla | **Confirmado y mayor:** `usuarioController` (~10 consultas), `rutaController` y `notificacionController` también usan `pool` | B01, B02 |
| 3 · GoF | Strategy (ETA) y Factory opcional | `calcularETA.js` es una función con 25 km/h fijos | B07 |
| 4 · SOLID | DRY: CORS duplicado | **Confirmado** | B03 |
| 5 · Limpio | Backend sin ESLint ni errores centralizados | **Confirmado**; tampoco hay pruebas | W03, B05, B10 |

## 3. Contradicciones plan ↔ charter (se resuelven en Q01)

| Sección del charter | Dice hoy | Dirá en v2 |
|---|---|---|
| Obj. Específico 4 · Módulo 4 · §9 · Sprint 4 | Vercel + **Ngrok** | Vercel + **Render** + **Aiven**; ngrok contingencia |
| Módulo 3 · §4.1 | Capacitor **Out-of-Scope** | **APK Android In-Scope**; tiendas e iOS Out-of-Scope |
| §9 Gestión ágil | Jira Software | GitHub Projects |
| §4 Módulo 1 | Login con roles, sin restricción de correo | Registro público solo con correo institucional `@unicesar.edu.co` y verificación (requisito nuevo, R3) |
| §5 / §8 R2 | Célula Scrum; riesgo de deserción de un integrante | Equipo activo de una persona; mitigación por priorización y CI |
| §7.1 / §8 R4 | Vercel/Ngrok; estabilidad de túneles | Vercel/Render/Aiven; suspensión de Render, apagado de Aiven, GPS con pantalla bloqueada |
| §2.2 / §10 | Metas sin método de medición; sin APK | Método definido (D-20); APK instalable como criterio |

## 4. Hallazgos adicionales (y una corrección a mi diagnóstico anterior)

1. **Corrección:** el despliegue de Pages **no está roto hoy**: la landing está publicada y la última ejecución manual fue exitosa. El riesgo es que el `package.json` raíz modificado (sin commitear) llegue a `main`. Se resuelve retirando Pages en el mismo PR de reorganización (W01).
2. **`@capacitor/geolocation` no hace seguimiento en segundo plano**, y aun con un plugin de servicio en primer plano Android limita la red de la WebView tras unos 5 min, de modo que el Socket.IO podría detenerse (D-10).
3. **Peticiones relativas en la WebView:** `api.js` y `socket.js` caen a ruta relativa si `VITE_API_URL` está vacío; el CORS no incluye los orígenes de Capacitor (M01, B03).
4. **`database.js` no soporta TLS**, que Aiven exige (D02).
5. **`seed.sql` crea usuarios con clave conocida** (D-09).
6. **`Notification` del navegador no existe en la WebView de Android** y en Android 13+ requiere permiso (M06).
7. **`frontend/vite.config.js` define `server` dos veces**; la primera (puerto/`strictPort`) queda anulada (W01).
8. **El GPS del conductor ya envía cada 4 s** (`INTERVALO_ENVIO_MS = 4000`): la meta técnica del charter ya se cumple en el código; falta medirla en la nube.

## 5. Estructura objetivo del repositorio

```
upc-track/
├─ frontend/                  # React + Vite + PWA + Capacitor 7
│  ├─ src/features/landing/   # landing de la feria (ruta pública «/»)
│  ├─ src/styles/tokens.css   # tokens de diseño (U02)
│  ├─ src/services/           # api, socket, geolocation (adaptador)
│  ├─ android/                # proyecto Capacitor (M03)
│  └─ capacitor.config.ts
├─ backend/src/{routes,controllers,services,models,utils/cors.js,...}
├─ database/                  # schema.sql, seed.sql, seed.prod.sql
├─ docs/                      # 12_ruta_trabajo_semestre.md, 13_auditoria_diseno.md
├─ scripts/                   # dev/, github/
├─ .github/workflows/         # ci.yml, android.yml
└─ render.yaml  docker-compose.yml  package.json (orquestador)
```

## 6. Arquitectura de despliegue (capa gratuita)

```
 Navegador / PWA ─┐                         ┌─► Aiven MySQL (free, TLS)
                  ├─► Vercel (frontend      │      ▲ SELECT 1 mantiene activa la BD
 APK Android ─────┘     + landing «/»)      │
   (Capacitor 7)            │               │
                            ▼               │
                  Render free (API + Socket.IO) ┘
                            ▲
        ping /api/health cada 10 min (cron-job.org)

 GitHub Pages: retirado
```

## 7. Calendario e hitos

| Hito | Vence | Sprint del charter | Objetivo | Must · Should · Could |
|---|---|---|---|---|
| **1 · Base, CI y nube** | vie 13-nov | Sprint 4 | Repo ordenado, CI, Aiven + Render + Vercel, WebSockets verificados, charter v2, auditoría de diseño | 10 · 1 · 0 |
| **2 · Diseño móvil y base Capacitor** | vie 20-nov | Sprint 4 | Tokens, navegación móvil, pantalla del conductor, Capacitor con login y GPS, registro institucional | 7 · 4 · 0 |
| **3 · APK, capas y pulido** | vie 27-nov | Sprint 5 | APK firmado, pruebas en dispositivos, refactor de capas, accesibilidad, usabilidad de la PWA | 3 · 10 · 1 |
| **4 · QA, docs y entrega** | sáb 05-dic | Sprint 5 | **Congelamiento 01-dic.** QA, manuales, release v1.0.0, sustentación | 4 · 1 · 0 |

**Total: 41 issues (24 Must, 16 Should, 1 Could).** Solo los Must son el compromiso; los Should son *stretch* (D-24).
**Ruta crítica:** `D01 → D02 → D05 → D07 → D08` (nube) y `W01 → M01 → M03 → M04 → M10 → M11 → Q02 → Q07` (APK). El APK necesita un backend público estable.

## 8. Auditoría de diseño (U01 → U10)

Punto de partida medido:
- 4.447 líneas de CSS en 16 hojas; `#1e6b2e` aparece **77 veces** fijo frente a 5 variables de tema.
- Variables huérfanas de la plantilla de Vite (`--border`, `--accent`, `--text-h`, `--social-bg`, `--shadow`).
- Sidebar de escritorio con hamburguesa también en móvil; `Layout.jsx` (482 líneas) mezcla navegación, audio, notificaciones, banners PWA y toasts.
- Botones con `min-height: 36px` (el comentario del CSS pide 44 px); un solo uso de `safe-area-inset`.
- Tipografía por Google Fonts, emojis como iconos y un solo `aria-label` en `Layout.jsx`.

Secuencia: **U01** diagnóstico → **U02** tokens y fuentes → **U03** navegación y base táctil → **U06** conductor, **U05** mapa, **U07** auth/estudiante → **U09** estados, **U10** accesibilidad.

## 9. Ruta técnica de Capacitor (APK)

`M01` frontend listo (API absoluta, build nativo sin SW ni landing) → `M03` proyecto Android (Capacitor 7) → `M04` geolocalización con Adapter → `M06` notificaciones locales → `M08` identidad nativa → `M09` ciclo de vida → `M10` APK firmado y Release → `M11` pruebas en dispositivos reales. `M05` (pantalla bloqueada) es un spike opcional. Los orígenes de Capacitor en CORS se resuelven en `B03` (Hito 1).

## 10. Riesgos

| Riesgo | Mitigación |
|---|---|
| WebSockets inestables en Render free | D08 los verifica antes del 13-nov; Fly.io como alternativa (con el Dockerfile de D04) |
| Aiven apaga la BD por inactividad | `SELECT 1` periódico, procedimiento de recuperación probado, MySQL local como plan B |
| Un segundo servicio free en Render agota las 750 h | Regla D-07 |
| 30 días para una sola persona | Solo 24 Must son compromiso; Should = *stretch*; congelamiento 01-dic (D-22, D-24) |
| Sin revisión por pares ni aprobación del docente | CI obligatorio + revisión asistida por PR; charter v2 marcado como pendiente (D-23) |
| Conductor con pantalla bloqueada | Wake Lock + indicación en pantalla; spike M05 opcional |
| Entornos Android distintos entre integrantes | M03 documenta requisitos (JDK 21); M10 compila en CI |
| Registro institucional: SMTP bloqueado en Render free y consentimiento de Microsoft desconocido | Spike de 1 día en A01 con tres opciones y criterio de decisión; no difundir la URL pública antes de A01 |
| Demo con servicios dormidos | D06 y Q06 (pre-calentar, respaldo local y video) |

## 11. Fuentes consultadas (05-nov-2026)

- Aiven, [MySQL free tier](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier) y [Service pricing](https://aiven.io/docs/platform/concepts/service-pricing).
- Render, [Deploy for Free](https://render.com/docs/free) y [changelog: los mensajes WebSocket mantienen activo el servicio free](https://render.com/changelog/free-web-services-now-remain-active-while-receiving-websocket-messages).
- Capacitor, [Updating from Capacitor 6 to 7](https://capacitorjs.com/docs/updating/7-0).
- Plugins de ubicación en segundo plano: [`@capacitor-community/background-geolocation`](https://www.github.com/capacitor-community/background-geolocation) (soporte documentado hasta Capacitor 6) y [`@capgo/background-geolocation`](https://github.com/Cap-go/capacitor-background-geolocation) (declara Capacitor 7).

> El umbral exacto de inactividad de Aiven no es público: D01 lo comprueba en la consola. Los requisitos de Capacitor 8 no se pudieron confirmar en fuente oficial, por eso D-02 fija la 7.

## 12. Backlog futuro (fuera de los 30 días, sin issue)

JSDoc masivo en services/models · Estrategia de ETA con OSRM · Factory de notificadores · Token en `@capacitor/preferences` · Administración en tarjetas para móvil · Preparación y compilación de iOS · Push remoto (FCM) · Seguimiento robusto con pantalla bloqueada.

## 13. Catálogo de issues

Prioridad: **P0** Must · **P1** Should · **P2** Could. Los cuerpos completos están en `scripts/github/issues.mjs` (`node scripts/github/seed.mjs --dump`).

| ID | Hito | Prio | Áreas | Depende de | Issue |
|---|---|---|---|---|---|
| W01 | H1 | P0 | repo, frontend | — | Reorganizar el repo: landing dentro de frontend/, retirar Pages y limpiar |
| W03 | H1 | P0 | infra, backend | W01 | CI con GitHub Actions y ESLint en el backend |
| W04 | H1 | P1 | repo, docs | — | Gobernanza mínima para un solo desarrollador: flujo, CI obligatorio y tablero |
| D01 | H1 | P0 | infra | — | Spike: crear MySQL gratuito en Aiven y fijar el plan de continuidad |
| D02 | H1 | P0 | backend, infra | D01 | Backend y BD en Aiven: soporte TLS y migración de esquema/datos |
| D04 | H2 | P1 | infra, backend | — | Dockerfile del backend |
| D05 | H1 | P0 | infra, backend | D02 | Desplegar el backend en Render (free) con render.yaml |
| D06 | H2 | P1 | infra, frontend | D05 | Mitigar el arranque en frío: keep-alive y estado «servidor despertando» |
| D07 | H1 | P0 | infra, frontend | D05, W01 | Frontend en Vercel apuntando al backend de Render |
| D08 | H1 | P0 | infra, qa | D07 | Verificar WebSockets de extremo a extremo en Render free |
| D09 | H2 | P1 | backend, infra | B03 | Endurecer producción: CORS estricto, helmet y secretos |
| A01 | H2 | P0 | backend, frontend | D05 | Registro solo con correo institucional (@unicesar.edu.co) y verificación de titularidad |
| B01 | H3 | P0 | backend | — | Extraer busService: sacar SQL de busController (SRP) |
| B02 | H3 | P1 | backend | B01 | Extender la capa de servicios a usuario, ruta, notificación y logout |
| B03 | H1 | P0 | backend | — | Extraer utils/cors.js (DRY) e incluir los orígenes de la app nativa |
| B05 | H3 | P1 | backend | B02 | Manejo de errores centralizado (helper + middleware) |
| B07 | H2 | P1 | frontend | — | Patrón Strategy para el cálculo de ETA |
| B10 | H3 | P1 | backend, qa | B01 | Pruebas automáticas mínimas del backend (servicios y auth) |
| U01 | H1 | P0 | diseno, frontend | — | Auditoría de diseño móvil-first de todas las pantallas |
| U02 | H2 | P0 | diseno, frontend | U01 | Sistema de tokens de diseño, tema claro/oscuro y fuentes locales |
| U03 | H2 | P0 | diseno, frontend, movil | U01 | Navegación móvil: barra inferior por rol y base táctil |
| U05 | H3 | P1 | diseno, frontend | U03 | Mapa en tiempo real optimizado para móvil (hoja inferior) |
| U06 | H2 | P0 | diseno, frontend | U02 | Pantalla del conductor (Mi recorrido) pensada para uso en vehículo |
| U07 | H3 | P1 | diseno, frontend | U02, U03 | Login, registro y pantallas de estudiante en móvil |
| U09 | H3 | P1 | diseno, frontend | U02, D06 | Estados de interfaz: carga, vacío, error y sin conexión consistentes |
| U10 | H3 | P1 | diseno, frontend | — | Accesibilidad básica (WCAG 2.1 AA) en flujos principales |
| M01 | H2 | P0 | movil, frontend | W01, D07 | Preparar el frontend para ejecutarse dentro de Capacitor |
| M03 | H2 | P0 | movil, frontend | M01 | Inicializar Capacitor y generar el proyecto Android |
| M04 | H2 | P0 | movil, frontend | M03 | Capa de geolocalización (Adapter) con plugin nativo y permisos Android |
| M05 | H3 | P2 | movil | M04, U06 | Opcional: seguimiento del conductor con la pantalla bloqueada (spike de 1 día) |
| M06 | H3 | P1 | movil, frontend | M03 | Notificaciones nativas (local notifications) en lugar de Notification API |
| M08 | H3 | P1 | movil, diseno | M03, U02 | Identidad nativa: ícono adaptativo, splash y barra de estado |
| M09 | H3 | P1 | movil, frontend | M03 | Ciclo de vida nativo: reconexión, botón atrás y red |
| M10 | H3 | P0 | movil, infra | M03 | Compilar el APK firmado y publicarlo como artefacto/Release |
| M11 | H3 | P0 | movil, qa | M10 | Pruebas del APK en dispositivos reales |
| Q01 | H1 | P0 | docs | — | Enmendar el Project Charter (v2): nube gratuita y APK Android |
| Q02 | H4 | P0 | qa | D08, M11 | Ejecutar las checklists de RF y RNF sobre el entorno desplegado |
| Q03 | H4 | P1 | qa, docs | M10 | Pruebas de usabilidad y aceptación con usuarios de la UPC |
| Q04 | H4 | P0 | docs | Q01 | Actualizar README, manuales y documentación a la nueva arquitectura y cerrar el plan |
| Q06 | H4 | P0 | qa, docs | — | Preparar la sustentación y el plan de contingencia (R4) |
| Q07 | H4 | P0 | repo, docs | Q02, Q04 | Congelar código (01-dic) y publicar release v1.0.0 |

## 14. Cómo crear los issues (tras la revisión)

```bash
node scripts/github/seed.mjs                          # simulación, no toca GitHub
node scripts/github/seed.mjs --apply --only W01,Q01   # prueba con dos
node scripts/github/seed.mjs --apply                  # todo (idempotente por prefijo [ID])
```

Requiere `gh` autenticado con permiso de escritura sobre `MAM-UPC-SA-TEAM/upc-track`.
