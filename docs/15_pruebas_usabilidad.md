# Pruebas de usabilidad y aceptación (Q03)

Issue: #42 (Q03) · Metas: Project Charter v2, §2.2 y §2.2.1 · Objetivo Específico 4

Este documento es el **protocolo** de las sesiones con usuarios de la UPC: qué se mide, a quién, cómo, con qué guion y cómo se calcula el resultado. Las sesiones las ejecuta el equipo con personas reales; el análisis de los datos se automatiza con `scripts/dev/usabilidad-resultados.mjs`.

## 1. Qué se quiere demostrar

| Meta del charter | Cómo se mide aquí | Se cumple si |
|---|---|---|
| **Satisfacción ≥ 80 %** | Pregunta global de satisfacción de 1 a 5 al terminar la sesión. | Al menos el 80 % de los participantes responde **4 o 5**. |
| **Tiempo de consulta −50 %** | Cronómetro de la sesión: segundos que tarda el participante en saber cuándo llega su bus con UpcTrack, frente a su método habitual (la línea base, sección 5). | La mediana con UpcTrack es ≤ 50 % de la mediana habitual. |
| **Espera innecesaria −30 %** | Estimación del participante (sección 5). Es una medida declarada, no observada: en una semana de pruebas no se puede cronometrar la espera real en la parada. | La espera que el participante dice que habría tenido sabiendo el ETA es ≤ 70 % de la habitual. |
| Usabilidad general | Escala SUS (10 preguntas, 0 a 100). | La media es ≥ 68 (promedio de la industria). |
| Tareas completables sin ayuda | Tasa de éxito por tarea. | ≥ 80 % de éxito en cada tarea principal. |

Las metas de tiempo de respuesta (< 3 s) y de actualización de ubicación (≤ 30 s) no se miden con usuarios: ya están en `14_validacion_rf_rnf.md`.

## 2. Participantes

- **Estudiantes:** al menos 8, de distintos semestres y programas, con teléfono Android o con acceso a un navegador.
- **Conductores:** al menos 2, con un bus asignado.
- Se anota rol, dispositivo y si ya conocía la aplicación. **No se recogen nombres ni datos personales**: cada persona es un código (`E01`, `E02`, … y `C01`, `C02`, …).
- Antes de empezar se pide consentimiento verbal: se explica que se prueba la aplicación, no a la persona, que puede parar cuando quiera y que los datos son anónimos.

## 3. Calendario

| Fecha | Actividad |
|---|---|
| 23 a 27-nov | Sesiones con la PWA (en el navegador), antes del congelamiento. |
| 28 a 30-nov | Análisis, informe y corrección de lo grave. |
| 01-dic | Congelamiento del código (#45). Después solo se corrigen defectos P0. |
| Hasta 02-dic | Comprobación final del APK con 2 a 3 personas (ver #39). |

Cada sesión dura unos 15 minutos por persona.

## 4. Preparación antes de cada sesión

1. Calentar el backend: abrir `https://upc-track.onrender.com/api/health` y esperar el 200 (el primer arranque tarda hasta un minuto y falsearía los tiempos).
2. Cuentas de prueba ya creadas y **activas** (estudiantes y conductor). Se crean con `npm run db:usuario` en `backend/` y se eliminan al terminar las pruebas.
3. Para el estudiante, un bus **transmitiendo** (un conductor real o el simulador `scripts/dev/simular-recorrido.mjs`), si no el mapa estará vacío y no se puede cumplir la tarea T3.
4. Dispositivo del participante, o uno prestado, con sesión cerrada. Cronómetro (el del teléfono del observador).
5. Hoja de registro de la sección 7 y el cuestionario de la sección 6.

## 5. Guion de tareas y línea base

El observador lee la tarea, **no ayuda** y cronometra desde que el participante empieza hasta que dice «listo» o se rinde. Se anota si la completó sin ayuda (`1`/`0`) y los segundos. Si pide ayuda o se bloquea más de 90 segundos, se marca como no completada y se le muestra la solución.

### 5.1 Estudiantes

| # | Tarea (lo que se le dice) | Se completa cuando… |
|---|---|---|
| T1 | «Inicie sesión con esta cuenta.» | Ve la pantalla de inicio. |
| T2 | «Encuentre dónde está ahora el bus de la ruta Centro - UPC.» | Señala el bus en el mapa. |
| T3 | «Averigüe cuánto falta para que el bus llegue a la parada [una parada de la ruta].» | Dice el tiempo estimado que muestra la aplicación. **Esta es la tarea de la meta de −50 %.** |
| T4 | «Consulte a qué hora sale el bus de la ruta Centro - UPC.» | Dice un horario de la ruta. |
| T5 | «Abra el último aviso que mandó el conductor.» | Abre la lista de notificaciones y lee el aviso. |

### 5.2 Conductores

| # | Tarea | Se completa cuando… |
|---|---|---|
| T1 | «Inicie sesión con esta cuenta.» | Ve «Mi recorrido». |
| T2 | «Comience su recorrido.» | La pantalla dice «Transmitiendo». Se anota si el permiso de ubicación fue un problema. |
| T3 | «Avise a los estudiantes de que el bus lleva un retraso.» | El aviso de tipo Retraso queda en «Enviados». |
| T4 | «Termine su recorrido.» | Termina con los dos toques de «Finalizar». |

### 5.3 Línea base (antes de usar UpcTrack)

Antes de la sesión, a los **estudiantes** se les hacen estas dos preguntas sobre cómo lo hacen hoy:

1. «Cuando quiere saber cuándo llega su bus, ¿qué hace y cuánto se demora en saberlo?» → se cronometra o se anota la estimación en segundos (`base_consulta_seg`). Si responde «voy a la parada y espero», se anota el tiempo que tarda en conseguir cualquier información (pregunta a un compañero, llama, mira), o 600 s si no hay forma de saberlo.
2. «¿Cuánto tiempo espera normalmente en la parada antes de que pase el bus?» → minutos (`espera_habitual_min`).

Al terminar las tareas se pregunta: «Si hubiera visto el tiempo de llegada antes de salir, ¿cuánto habría esperado en la parada?» → minutos (`espera_con_app_min`).

La comparación de tiempo de consulta usa `base_consulta_seg` frente al tiempo de la tarea T3.

## 6. Cuestionarios (al terminar las tareas)

### 6.1 Satisfacción global

> «En general, ¿qué tan satisfecho está con UpcTrack?»
> 1 = Nada satisfecho · 2 = Poco · 3 = Neutral · 4 = Satisfecho · 5 = Muy satisfecho

### 6.2 Escala SUS (System Usability Scale)

Cada afirmación se responde de 1 («totalmente en desacuerdo») a 5 («totalmente de acuerdo»).

1. Creo que me gustaría usar UpcTrack con frecuencia.
2. Encontré UpcTrack innecesariamente complejo.
3. Pensé que UpcTrack era fácil de usar.
4. Creo que necesitaría ayuda de una persona con conocimientos técnicos para usar UpcTrack.
5. Encontré que las diversas funciones de UpcTrack estaban bien integradas.
6. Pensé que había demasiada inconsistencia en UpcTrack.
7. Imagino que la mayoría de las personas aprendería a usar UpcTrack muy rápidamente.
8. Encontré UpcTrack muy incómodo de usar.
9. Me sentí muy seguro usando UpcTrack.
10. Necesité aprender muchas cosas antes de poder empezar con UpcTrack.

**Cálculo (lo hace el script):** en las preguntas impares se resta 1 a la respuesta; en las pares, se resta la respuesta a 5; se suman las diez y se multiplica por 2,5. El resultado va de 0 a 100.

### 6.3 Preguntas abiertas

1. ¿Qué fue lo que más le gustó?
2. ¿Qué fue lo más confuso o lo que cambiaría?

## 7. Registro de resultados

Cada participante es **una fila** de un CSV con la plantilla [`usabilidad/plantilla-resultados.csv`](usabilidad/plantilla-resultados.csv) (copiarla a `usabilidad/resultados.csv`; al ser anónimo —solo códigos—, se versiona como evidencia). Columnas:

| Columna | Contenido |
|---|---|
| `id`, `rol` | Código (`E01`, `C01`) y `estudiante` o `conductor`. |
| `dispositivo` | Por ejemplo `android-pwa`, `android-apk`, `escritorio`. |
| `t1_ok` a `t5_ok` | `1` si completó la tarea sin ayuda, `0` si no. Los conductores solo usan `t1` a `t4`. |
| `t1_seg` a `t5_seg` | Segundos que tardó. |
| `sus1` a `sus10` | Respuestas de 1 a 5. |
| `satisfaccion` | 1 a 5. |
| `base_consulta_seg`, `espera_habitual_min`, `espera_con_app_min` | Solo estudiantes (sección 5.3). |
| `observaciones` | Texto corto, sin comas. |

Para obtener las métricas contra las metas:

```bash
node scripts/dev/usabilidad-resultados.mjs docs/usabilidad/resultados.csv
```

Devuelve el número de participantes, la tasa de éxito y la mediana de tiempo por tarea, la media SUS, el porcentaje de satisfacción 4 o 5, la reducción del tiempo de consulta y de espera, y si cada meta del charter se cumple.

## 8. Informe

Al terminar, el informe (`docs/usabilidad/informe.md`) incluye:

1. Participantes (cantidad por rol, dispositivos, fechas).
2. Tabla de métricas contra cada meta (salida del script).
3. Los problemas encontrados, ordenados por cuántas personas los sufrieron y por gravedad (bloquea la tarea / confunde / cosmético).
4. Decisiones: qué se corrige antes del congelamiento (solo lo grave y barato), qué queda como mejora futura y, **si alguna meta no se alcanza, el análisis de por qué y las acciones**. Es un criterio de aceptación del issue: no cumplir una meta es un resultado válido si queda explicado.
5. Limitaciones honestas: muestra pequeña, participantes que no son una muestra representativa, espera estimada y no observada.

## 9. Riesgos de la prueba

- **Backend dormido** durante una sesión: falsea los tiempos. Se calienta antes y se descartan las tareas afectadas.
- **Sin bus transmitiendo:** la tarea T3 no se puede hacer. Usar el simulador.
- **Conductores reales:** no se les pide transmitir en la calle por la prueba; se hace con el bus detenido en el campus o con el simulador.
- **Muestra pequeña:** con 8 estudiantes un solo participante pesa 12,5 puntos en el porcentaje de satisfacción; hay que presentar los números y las observaciones, no solo el porcentaje.
