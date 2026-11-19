# Project Charter — Sistema de Monitoreo de Buses UPC Aguachica

> **Versión 2 — cambios propuestos, pendiente de aprobación del docente.**
> La versión 1 (05-nov-2026) queda en el historial de git (`git log -- docs/project_charter.md`). Hasta que el docente apruebe, los cambios de este documento son una propuesta del equipo.

## Control de cambios

| Versión | Fecha | Motivo | Secciones |
|---|---|---|---|
| v1 | 05-nov-2026 | Versión original del charter. | Todas |
| v2 | 18-nov-2026 | Alinear el charter con lo que realmente se construye: nube gratuita (Cloudflare + Render + Neon), PostgreSQL, APK Android con Capacitor, registro institucional y gestión ágil en GitHub Projects. **Aprobación del docente: pendiente.** | 2.2, 3, 4, 4.1, 4.2, 6, 7.1, 8, 9, 10 |

**Desviaciones de v2 respecto de v1** (todas pendientes de aprobación):

| # | Qué cambia | v1 | v2 | Por qué |
|---|---|---|---|---|
| 1 | Hosting | Vercel (frontend) + Ngrok (backend local) | Cloudflare (frontend) + Render free (backend) + Neon free (PostgreSQL); ngrok solo como contingencia local | Recomendación del docente (07-nov-2026); un backend 24/7 y estable en lugar de un túnel al equipo del desarrollador. Sigue costando $0. |
| 2 | Base de datos | MySQL | PostgreSQL 16 (contenedor local en desarrollo, Neon en producción) | Neon solo ofrece PostgreSQL; mantener dos motores duplicaría trabajo y pruebas. |
| 3 | Plataforma móvil | Capacitor fuera de alcance (solo Web + PWA) | **APK Android instalable** con Capacitor, dentro del alcance; tiendas (Play/App Store) e iOS compilado siguen fuera | La app nativa permite avisos y reconexión que el navegador no garantiza; el APK se distribuye como artefacto de GitHub, sin tienda. |
| 4 | Gestión ágil | Jira Software | GitHub Projects (fuente única de verdad, junto con los issues) | Un solo desarrollador: el tablero junto al código evita duplicar el seguimiento. |
| 5 | Autenticación | Login con roles, sin restricción de correo | Registro público solo con correo institucional `@unicesar.edu.co`; la cuenta nace inactiva y un administrador la aprueba | Requisito nuevo a mitad de semestre, tratado según el riesgo R3 (issue #51). |
| 6 | Equipo | Célula Scrum de varios integrantes | Equipo activo de **una persona** | Ver riesgo R2. |
| 7 | Metas medibles | Sin método de medición | Método definido en 2.2 | Que cada meta se pueda verificar en las pruebas de aceptación (Q03). |

## 2.2 Propuesta de Valor y Beneficios Esperados

El aplicativo web y móvil (PWA y APK Android) permite a los estudiantes consultar en tiempo real la ubicación y recorrido de los buses de la Universidad Popular del Cesar, Seccional Aguachica, facilitando la planificación de desplazamientos y reduciendo la incertidumbre durante la espera.

Como beneficios esperados y metas cuantificables del proyecto, se establecen:

- Reducir en al menos un 30% el tiempo de espera innecesario de los estudiantes.
- Disminuir en un 50% el tiempo requerido para consultar información de rutas y estado del bus.
- Alcanzar al menos un 80% de satisfacción de usuarios en pruebas de aceptación.
- Mantener la actualización de ubicación de buses con un intervalo máximo de 30 segundos en condiciones operativas normales.

Estas metas se soportan en una arquitectura Fullstack con backend en Node.js + Express + Socket.IO, frontend en React + Vite + Leaflet/OpenStreetMap, persistencia en PostgreSQL y empaquetado Android con Capacitor.

### 2.2.1 Cómo se mide cada meta (nuevo en v2)

| Meta | Cómo se mide |
|---|---|
| Satisfacción ≥ 80 % | Al menos el 80 % de los participantes de las pruebas de aceptación puntúan 4 o 5 sobre 5 en la pregunta de satisfacción global. |
| Tiempo de espera −30 % y tiempo de consulta −50 % | Se toman con el cronómetro de la sesión de pruebas con usuarios (Q03): tiempo para saber cuándo llega el bus y para consultar ruta y estado, con la aplicación y sin ella. |
| Respuesta menor a 3 s (RNF) | Se mide con el servicio despierto. El primer arranque en frío de Render (~1 minuto tras 15 minutos de inactividad) se declara excepción conocida y la aplicación lo avisa al usuario («Despertando el servidor»). |
| Actualización de ubicación ≤ 30 s | Diferencia entre la hora de la última posición y la hora actual, con el conductor transmitiendo y conectividad normal. |

## 3. Objetivos del Proyecto (Metodología SMART)

### Objetivo General SMART

Desarrollar y desplegar, antes del 05 de diciembre de 2026, una plataforma Fullstack basada en React + Vite (frontend), Node.js + Express + Socket.IO (backend) y PostgreSQL (base de datos), disponible como aplicación web/PWA y como APK Android, que permita a estudiantes y conductores de la UPC Seccional Aguachica consultar y actualizar la ubicación de los buses en tiempo real, garantizando un tiempo de respuesta menor a 3 segundos y una actualización de posición GPS con frecuencia entre 3 y 4 segundos.

### Objetivo Específico 1 (Diseño)

Disenar y validar disenos estaticos de interfaz (pantallas clave de login, mapa, rutas y panel) asistidos por herramientas de IA, bajo enfoque de Diseno Centrado en el Usuario (UCD), y estructurar el modelo de base de datos relacional normalizado para la Semana 6.

### Objetivo Específico 2 (Backend)

Construir para la Semana 12 una API REST modular con autenticación segura basada en JWT y control de roles (Estudiante, Conductor, Administrador), integrando un servicio WebSocket para transmisión de coordenadas en tiempo real.

### Objetivo Específico 3 (Frontend)

Implementar para la Semana 14 una interfaz web responsiva en React, integrando visualización de mapas con OpenStreetMap (Leaflet), consumo de endpoints del backend y validaciones de formularios y flujos de sesión.

### Objetivo Específico 4 (Despliegue)

Desplegar la aplicación antes de la Semana 18 en un entorno de demostración en la nube con servicios gratuitos (frontend en Cloudflare, backend en Render y base de datos PostgreSQL en Neon), generar un APK Android instalable que apunte a ese backend, y validar su funcionamiento operativo con usuarios finales de la institución. Ngrok queda solo como contingencia local.

## 3.1 Nota de Coherencia de Metas

Para evitar ambigüedad en la documentación:

- La meta de negocio define un intervalo maximo operativo de 30 segundos para la actualización visible de ubicación.
- La meta técnica del sistema establece una frecuencia objetivo de 3-4 segundos para envío/propagación de coordenadas cuando existe conectividad estable.

Ambas metas son compatibles: la segunda es más exigente y opera como objetivo técnico interno, mientras la primera funciona como umbral de servicio esperado por usuario final.

## 4. Delimitacion del Alcance (In-Scope vs Out-of-Scope)

| Modulo / Funcion | Dentro del Alcance (In-Scope) - SI se construira | Fuera del Alcance (Out-of-Scope) - NO se construira |
|---|---|---|
| Modulo 1: Autenticacion | Login con roles (Estudiante, Conductor, Administrador), cifrado de contrasenas, cierre de sesion manual y control por inactividad. **(v2)** Registro público restringido a correo institucional `@unicesar.edu.co`, con la cuenta pendiente hasta que un administrador la apruebe. | Autenticacion biometrica, reconocimiento facial o dispositivos de autenticacion especializados. Verificación de titularidad por código al correo o inicio de sesión con Microsoft (se decidió la aprobación manual por el administrador). |
| Modulo 2: Monitoreo y rutas | Geolocalizacion en tiempo real, visualizacion del recorrido en mapa, consulta de paraderos y tiempos estimados de llegada para rutas institucionales UPC. | Gestion de rutas de transporte publico externo a la Universidad Popular del Cesar o integraciones con redes de transporte urbano externas. |
| Modulo 3: Plataforma | Aplicacion web responsive y PWA accesible desde navegadores en computador, tablet y celular. **(v2)** APK Android instalable generado con Capacitor y distribuido como artefacto de GitHub. | Publicación en Google Play Store o Apple App Store, y app compilada para iOS, durante esta fase del proyecto. |
| Modulo 4: Despliegue | **(v2)** Despliegue de demostracion y validacion academica con frontend en Cloudflare, backend en Render (plan gratuito), PostgreSQL en Neon (plan gratuito) y entornos locales de prueba con Docker. Ngrok solo como contingencia. | Infraestructura multi-cloud corporativa de pago, alta disponibilidad empresarial, balanceadores dedicados o servidores de alto costo. |

### 4.1 Criterio para Capacitor y Publicacion Movil

**(v2)** Capacitor pasa a estar dentro del alcance como **APK Android instalable**. Para mantener el alcance realista y reducir riesgos de cronograma y soporte, quedan fuera la publicación en tiendas (Google Play y App Store) y la compilación para iOS.

El seguimiento del conductor con la pantalla bloqueada se evalúa solo como una prueba de concepto opcional; el compromiso de entrega es que el conductor mantenga la aplicación abierta durante el recorrido.

### 4.2 Criterio para Despliegue en Contexto Educativo

Debido a restricciones de presupuesto y a los problemas observados en despliegues productivos complejos, el alcance de despliegue se limita a un entorno operativo de demostracion y validacion con herramientas gratuitas. Esta delimitacion es adecuada para el objetivo academico, siempre que se garantice disponibilidad durante pruebas y sustentacion.

## 5. Matriz de Interesados Clave (Stakeholders)

| Interesado (Stakeholder) | Rol en el Proyecto | Expectativa Principal de Exito | Estrategia de Comunicacion |
|---|---|---|---|
| 1. Docente de Asignatura (Ing. Edinson Mendoza) | Auditor tecnico y evaluador academico | Rigor en ingenieria, codigo modular, evidencia de pruebas y cumplimiento de entregables por corte. | Revisiones en clase, auditoria de Pull Requests en GitHub y sustentaciones parciales/finales. |
| 2. Patrocinador / Cliente (Comunidad estudiantil UPC Seccional Aguachica) | Dueno de la necesidad y validador funcional | Que la aplicacion sea intuitiva, reduzca tiempos de espera en paraderos y aporte a la movilidad dentro del campus. | Presentaciones de avance, demostraciones funcionales y validacion de disenos estaticos y funciones principales. |
| 3. Equipo de Desarrollo | Diseno, desarrollo, integracion y QA | Construir y desplegar el software con calidad tecnica, cumpliendo arquitectura, alcance y objetivos SMART. | Seguimiento en el tablero de GitHub Projects, issues y Pull Requests, y control de versiones en GitHub. |

## 6. Programacion Semestral de Sprints

### Cronograma de Trabajo y Entregables por Sprint (Sprints de 2 a 3 semanas)

| Sprint / Fase | Semanas Estimadas | Objetivo y Entregable Principal |
|---|---|---|
| Sprint 0 (Planificacion Inicial) | Semanas 1 a 3 (Agosto 2026) | Project Charter validado, levantamiento de requerimientos basado en entrevistas, repositorio GitHub configurado y tablero agil activo. |
| Sprint 1 (Diseno UI/UX y BD) | Semanas 4 a 6 (Septiembre 2026) | Disenos estaticos de login, mapa, rutas y panel administrador; diccionario de datos; modelo relacional. |
| Sprint 2 (Backend Base) | Semanas 7 a 9 (Septiembre a Octubre 2026) | API REST y logica principal para usuarios, buses, rutas y geolocalizacion; pruebas tecnicas iniciales. |
| Sprint 3 (Integracion) | Semanas 10 a 12 (Octubre 2026) | Frontend integrado con endpoints, autenticacion JWT, validaciones de formularios/sesion y flujo de Pull Requests en GitHub. |
| Sprint 4 (Cloud, APK y Hardening) | Semanas 13 a 15 (Noviembre 2026) | **(v2)** Despliegue en la nube gratuita (frontend en Cloudflare, backend en Render, base de datos en Neon), migración a PostgreSQL, APK Android instalable, pruebas de usabilidad y estabilizacion tecnica. |
| Sprint 5 (Cierre) | Semanas 16 a 18 (Noviembre a Diciembre 2026) | **(v2)** Congelamiento del código el 1 de diciembre y release v1.0.0; manual tecnico y manual de usuario finalizados, checklists de requisitos ejecutadas sobre el entorno desplegado, sustentación final con plan de contingencia y entrega formal institucional. |

### 6.1 Criterio de Seguimiento

Cada sprint cierra con evidencia verificable (commits, Pull Requests, actas de prueba y/o demostracion funcional) para asegurar trazabilidad academica y tecnica del avance.

## 7. Supuestos y Restricciones del Proyecto

### 7.1 Supuestos (Assumptions)

- El equipo cuenta con equipos de computo e internet para desarrollo y pruebas.
- **(v2)** Los servicios cloud gratuitos requeridos (Cloudflare, Render y Neon) estaran disponibles durante el semestre y sus planes gratuitos no cambiarán de forma que impida la demostración. Render exige una tarjeta al crear la cuenta, pero no cobra en el plan gratuito.
- El cliente academico (representantes estudiantiles y docente) estara disponible para revisiones de sprint, idealmente cada 2 semanas.

### 7.2 Restricciones (Constraints)

- Tiempo: limite estricto de entrega final el 05 de diciembre de 2026.
- Presupuesto: $0 COP, con uso exclusivo de herramientas gratuitas y tecnologias de codigo abierto.
- Gobernanza: uso obligatorio de Git/GitHub para control de versiones y tablero agil activo (GitHub Projects) para seguimiento. Ninguna rama protegida recibe push directo y todo Pull Request requiere la integración continua en verde.

## 8. Matriz de Riesgos Iniciales y Planes de Mitigacion

| # | Riesgo Identificado | Probabilidad / Impacto | Plan de Mitigacion y Contingencia |
|---|---|---|---|
| R1 | Curva de aprendizaje en React, Node.js, Express y Socket.IO. | Media / Media | Realizar pruebas de concepto tempranas (spikes), dividir temas por responsable y apoyar resolucion tecnica con documentacion e IA. |
| R2 | **(v2)** Falta de compromiso o desercion de un integrante. **El equipo activo hoy es de una persona**, por lo que cualquier imprevisto afecta todo el cronograma. | Media / Alta | Recortar por prioridades (Must antes que Should y Could), integración continua obligatoria con pruebas automáticas para no depender de revisión por pares, documentación al día en el repositorio y tablero de GitHub Projects con el alcance marcado. |
| R3 | Nuevos requerimientos a mitad de semestre (scope creep). | Media / Alta | Mantener delimitacion In-Scope/Out-of-Scope, evaluar cada cambio contra el cronograma y canalizar lo que no cabe al backlog para fases futuras. Caso ya tratado: el registro con correo institucional (issue #51), aceptado por ser requisito de acceso. |
| R4 | **(v2)** Suspensión o agotamiento de los servicios gratuitos de la nube. Render suspende el backend tras 15 minutos de inactividad (arranque en frío de ~1 minuto) y Neon suspende el cómputo a los 5 minutos y tiene una cuota mensual. | Media / Media | La aplicación muestra «Despertando el servidor» y reconecta el socket sola; no se hace ping a la base de datos para no gastar la cuota; ventana de pruebas y calentamiento del servicio antes de la sustentación; volcado reproducible de la base de datos (`schema.sql` + `seed.prod.sql`); plan B local con PostgreSQL en Docker y ngrok como túnel. |
| R5 | **(v2, nuevo)** El seguimiento GPS del conductor se interrumpe con la pantalla bloqueada en el APK. | Media / Media | El conductor mantiene la aplicación abierta y el teléfono cargando durante el recorrido (la pantalla se mantiene encendida); la transmisión en segundo plano se evalúa solo como prueba de concepto opcional. |

## 9. Stack Tecnologico y Herramientas Seleccionadas

| Categoria | Herramienta / Tecnologia |
|---|---|
| Control de versiones y codigo | Git y GitHub (repositorio oficial del equipo) |
| Gestion agil | **(v2)** GitHub Projects e issues (fuente única de verdad; antes Jira Software) |
| Diseno UI/UX y mockups | Disenos estaticos asistidos por IA (sin prototipado interactivo obligatorio) |
| Frontend client | React + Vite + Leaflet |
| Aplicación móvil | **(v2)** Capacitor 7 (APK Android) |
| Backend y APIs REST | Node.js + Express + Socket.IO |
| Base de datos principal | **(v2)** PostgreSQL 16 (antes MySQL) |
| Infraestructura cloud (academica) | **(v2)** Cloudflare (frontend) + Render free (backend) + Neon free (base de datos); ngrok solo como contingencia local |
| Integración continua | **(v2)** GitHub Actions: lint, pruebas con cobertura, build y pruebas de extremo a extremo |

## 10. Criterios de Aceptacion y Firmas de Aprobacion

El proyecto se considerara formalmente aprobado cuando se cumplan los siguientes criterios:

1. Despliegue funcional en entorno de demostracion academico en la nube, accesible via HTTPS para pruebas de usuario.
2. **(v2)** APK Android instalable que apunta al backend desplegado, probado en dispositivos reales.
3. Evidencia de pruebas QA (manuales y/o automatizadas) con resultados satisfactorios frente a los requisitos funcionales y no funcionales priorizados.
4. Trazabilidad completa en GitHub (commits, Pull Requests con la integración continua en verde) y tablero agil con historias planificadas/cerradas segun alcance.
5. Cumplimiento verificable de atributos de calidad seleccionados de ISO/IEC 25010 y sustentacion satisfactoria ante docente y cliente academico.

### 10.1 Firmas de Aprobacion

Las firmas y actas de aprobacion se registraran en el formato institucional correspondiente, con validacion del docente de asignatura y visto bueno del cliente academico.

**Aprobación de la versión 2 por el docente: pendiente.**

### 10.2 Aclaracion de Evidencia de Diseno

La evidencia formal de diseno en esta fase corresponde a disenos estaticos (mockups/pantallas) y no a prototipos interactivos en Figma.

Si el equipo desea reforzar la presentacion final, puede migrar esas pantallas a Figma solo como artefacto de comunicacion visual, sin cambiar el alcance ni los entregables tecnicos definidos.
