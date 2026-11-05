# Project Charter — Sistema de Monitoreo de Buses UPC Aguachica

## 2.2 Propuesta de Valor y Beneficios Esperados

El aplicativo web permite a los estudiantes consultar en tiempo real la ubicación y recorrido de los buses de la Universidad Popular del Cesar, Seccional Aguachica, facilitando la planificación de desplazamientos y reduciendo la incertidumbre durante la espera.

Como beneficios esperados y metas cuantificables del proyecto, se establecen:

- Reducir en al menos un 30% el tiempo de espera innecesario de los estudiantes.
- Disminuir en un 50% el tiempo requerido para consultar información de rutas y estado del bus.
- Alcanzar al menos un 80% de satisfacción de usuarios en pruebas de aceptación.
- Mantener la actualización de ubicación de buses con un intervalo máximo de 30 segundos en condiciones operativas normales.

Estas metas se soportan en una arquitectura web Fullstack con backend en Node.js + Express + Socket.IO, frontend en React + Vite + Leaflet/OpenStreetMap y persistencia en MySQL.

## 3. Objetivos del Proyecto (Metodología SMART)

### Objetivo General SMART

Desarrollar y desplegar, antes del 05 de diciembre de 2026, una plataforma web Fullstack basada en React + Vite (frontend), Node.js + Express + Socket.IO (backend) y MySQL (base de datos), que permita a estudiantes y conductores de la UPC Seccional Aguachica consultar y actualizar la ubicación de los buses en tiempo real, garantizando un tiempo de respuesta menor a 3 segundos y una actualización de posición GPS con frecuencia entre 3 y 4 segundos.

### Objetivo Específico 1 (Diseño)

Disenar y validar disenos estaticos de interfaz (pantallas clave de login, mapa, rutas y panel) asistidos por herramientas de IA, bajo enfoque de Diseno Centrado en el Usuario (UCD), y estructurar el modelo de base de datos relacional normalizado para la Semana 6.

### Objetivo Específico 2 (Backend)

Construir para la Semana 12 una API REST modular con autenticación segura basada en JWT y control de roles (Estudiante, Conductor, Administrador), integrando un servicio WebSocket para transmisión de coordenadas en tiempo real.

### Objetivo Específico 3 (Frontend)

Implementar para la Semana 14 una interfaz web responsiva en React, integrando visualización de mapas con OpenStreetMap (Leaflet), consumo de endpoints del backend y validaciones de formularios y flujos de sesión.

### Objetivo Específico 4 (Despliegue)

Desplegar la aplicación antes de la Semana 18 en un entorno de demostración en la nube (frontend en Vercel y backend publicado mediante Ngrok), y validar su funcionamiento operativo con usuarios finales de la institución.

## 3.1 Nota de Coherencia de Metas

Para evitar ambigüedad en la documentación:

- La meta de negocio define un intervalo maximo operativo de 30 segundos para la actualización visible de ubicación.
- La meta técnica del sistema establece una frecuencia objetivo de 3-4 segundos para envío/propagación de coordenadas cuando existe conectividad estable.

Ambas metas son compatibles: la segunda es más exigente y opera como objetivo técnico interno, mientras la primera funciona como umbral de servicio esperado por usuario final.

## 4. Delimitacion del Alcance (In-Scope vs Out-of-Scope)

| Modulo / Funcion | Dentro del Alcance (In-Scope) - SI se construira | Fuera del Alcance (Out-of-Scope) - NO se construira |
|---|---|---|
| Modulo 1: Autenticacion | Login con roles (Estudiante, Conductor, Administrador), cifrado de contrasenas, cierre de sesion manual y control por inactividad. | Autenticacion biometrica, reconocimiento facial o dispositivos de autenticacion especializados. |
| Modulo 2: Monitoreo y rutas | Geolocalizacion en tiempo real, visualizacion del recorrido en mapa, consulta de paraderos y tiempos estimados de llegada para rutas institucionales UPC. | Gestion de rutas de transporte publico externo a la Universidad Popular del Cesar o integraciones con redes de transporte urbano externas. |
| Modulo 3: Plataforma | Aplicacion web responsive y PWA accesible desde navegadores en computador, tablet y celular. | App nativa publicada en iOS App Store o Google Play Store durante esta fase del proyecto. |
| Modulo 4: Despliegue | Despliegue de demostracion y validacion academica con frontend en Vercel, backend local publicado por Ngrok y entornos locales de prueba. | Infraestructura multi-cloud corporativa de pago, alta disponibilidad empresarial, balanceadores dedicados o servidores de alto costo. |

### 4.1 Criterio para Capacitor y Publicacion Movil

Se reconoce que el frontend actual puede empaquetarse con Capacitor en una fase posterior. Sin embargo, para mantener el alcance realista de la etapa academica y reducir riesgos de cronograma, soporte y publicacion en tiendas, la salida oficial del proyecto se delimita a Web + PWA.

Capacitor queda registrado como mejora evolutiva (fase futura), no como compromiso de entrega de la fase actual.

### 4.2 Criterio para Despliegue en Contexto Educativo

Debido a restricciones de presupuesto y a los problemas observados en despliegues productivos complejos, el alcance de despliegue se limita a un entorno operativo de demostracion y validacion con herramientas gratuitas. Esta delimitacion es adecuada para el objetivo academico, siempre que se garantice disponibilidad durante pruebas y sustentacion.

## 5. Matriz de Interesados Clave (Stakeholders)

| Interesado (Stakeholder) | Rol en el Proyecto | Expectativa Principal de Exito | Estrategia de Comunicacion |
|---|---|---|---|
| 1. Docente de Asignatura (Ing. Edinson Mendoza) | Auditor tecnico y evaluador academico | Rigor en ingenieria, codigo modular, evidencia de pruebas y cumplimiento de entregables por corte. | Revisiones en clase, auditoria de Pull Requests en GitHub y sustentaciones parciales/finales. |
| 2. Patrocinador / Cliente (Comunidad estudiantil UPC Seccional Aguachica) | Dueno de la necesidad y validador funcional | Que la aplicacion sea intuitiva, reduzca tiempos de espera en paraderos y aporte a la movilidad dentro del campus. | Presentaciones de avance, demostraciones funcionales y validacion de disenos estaticos y funciones principales. |
| 3. Equipo de Desarrollo (Celula Scrum) | Diseno, desarrollo, integracion y QA | Construir y desplegar el software con calidad tecnica, cumpliendo arquitectura, alcance y objetivos SMART. | Reuniones de seguimiento, tablero de gestion agil, comunicacion interna del equipo y control de versiones en GitHub. |

## 6. Programacion Semestral de Sprints

### Cronograma de Trabajo y Entregables por Sprint (Sprints de 2 a 3 semanas)

| Sprint / Fase | Semanas Estimadas | Objetivo y Entregable Principal |
|---|---|---|
| Sprint 0 (Planificacion Inicial) | Semanas 1 a 3 (Agosto 2026) | Project Charter validado, levantamiento de requerimientos basado en entrevistas, repositorio GitHub configurado y tablero agil activo. |
| Sprint 1 (Diseno UI/UX y BD) | Semanas 4 a 6 (Septiembre 2026) | Disenos estaticos de login, mapa, rutas y panel administrador; diccionario de datos; modelo relacional en MySQL. |
| Sprint 2 (Backend Base) | Semanas 7 a 9 (Septiembre a Octubre 2026) | API REST y logica principal para usuarios, buses, rutas y geolocalizacion; pruebas tecnicas iniciales. |
| Sprint 3 (Integracion) | Semanas 10 a 12 (Octubre 2026) | Frontend integrado con endpoints, autenticacion JWT, validaciones de formularios/sesion y flujo de Pull Requests en GitHub. |
| Sprint 4 (Cloud y Hardening) | Semanas 13 a 15 (Noviembre 2026) | Despliegue en entorno de demostracion (frontend en Vercel y backend via Ngrok), pruebas de usabilidad y estabilizacion tecnica. |
| Sprint 5 (Cierre) | Semanas 16 a 18 (Noviembre a Diciembre 2026) | Manual tecnico y manual de usuario finalizados, validacion de atributos de calidad, sustentacion final y entrega formal institucional. |

### 6.1 Criterio de Seguimiento

Cada sprint cierra con evidencia verificable (commits, Pull Requests, actas de prueba y/o demostracion funcional) para asegurar trazabilidad academica y tecnica del avance.

## 7. Supuestos y Restricciones del Proyecto

### 7.1 Supuestos (Assumptions)

- El equipo cuenta con equipos de computo e internet para desarrollo y pruebas.
- Los servicios cloud gratuitos requeridos (Vercel/Ngrok) estaran disponibles durante el semestre.
- El cliente academico (representantes estudiantiles y docente) estara disponible para revisiones de sprint, idealmente cada 2 semanas.

### 7.2 Restricciones (Constraints)

- Tiempo: limite estricto de entrega final el 05 de diciembre de 2026.
- Presupuesto: $0 COP, con uso exclusivo de herramientas gratuitas y tecnologias de codigo abierto.
- Gobernanza: uso obligatorio de Git/GitHub para control de versiones y tablero agil activo para seguimiento.

## 8. Matriz de Riesgos Iniciales y Planes de Mitigacion

| # | Riesgo Identificado | Probabilidad / Impacto | Plan de Mitigacion y Contingencia |
|---|---|---|---|
| R1 | Curva de aprendizaje en React, Node.js, Express y Socket.IO. | Media / Media | Realizar pruebas de concepto tempranas (spikes), dividir temas por responsable y apoyar resolucion tecnica con documentacion e IA. |
| R2 | Falta de compromiso o desercion de un integrante. | Baja / Alta | Modularizar tareas atomicas en el tablero, documentar handover y redistribuir carga de trabajo de forma oportuna. |
| R3 | Nuevos requerimientos a mitad de semestre (scope creep). | Media / Alta | Mantener delimitacion In-Scope/Out-of-Scope, evaluar cambios en comite de sprint y canalizarlos al backlog para fases futuras. |
| R4 | Agotamiento de cuotas gratuitas en la nube o inestabilidad de tuneles. | Media / Media | Preparar contingencia local (backend en LAN o tunel alterno), ventana de pruebas previa a sustentacion y plan de redespliegue rapido. |

## 9. Stack Tecnologico y Herramientas Seleccionadas

| Categoria | Herramienta / Tecnologia |
|---|---|
| Control de versiones y codigo | Git y GitHub (repositorio oficial del equipo) |
| Gestion agil | Jira Software |
| Diseno UI/UX y mockups | Disenos estaticos asistidos por IA (sin prototipado interactivo obligatorio) |
| Frontend client | React + Vite + Leaflet |
| Backend y APIs REST | Node.js + Express + Socket.IO |
| Base de datos principal | MySQL |
| Infraestructura cloud (academica) | Vercel (Frontend) + Ngrok (Backend) |

## 10. Criterios de Aceptacion y Firmas de Aprobacion

El proyecto se considerara formalmente aprobado cuando se cumplan los siguientes criterios:

1. Despliegue funcional en entorno de demostracion academico en la nube, accesible via HTTPS para pruebas de usuario.
2. Evidencia de pruebas QA (manuales y/o automatizadas) con resultados satisfactorios frente a los requisitos funcionales y no funcionales priorizados.
3. Trazabilidad completa en GitHub (commits, Pull Requests revisados) y tablero agil con historias planificadas/cerradas segun alcance.
4. Cumplimiento verificable de atributos de calidad seleccionados de ISO/IEC 25010 y sustentacion satisfactoria ante docente y cliente academico.

### 10.1 Firmas de Aprobacion

Las firmas y actas de aprobacion se registraran en el formato institucional correspondiente, con validacion del docente de asignatura y visto bueno del cliente academico.

### 10.2 Aclaracion de Evidencia de Diseno

La evidencia formal de diseno en esta fase corresponde a disenos estaticos (mockups/pantallas) y no a prototipos interactivos en Figma.

Si el equipo desea reforzar la presentacion final, puede migrar esas pantallas a Figma solo como artefacto de comunicacion visual, sin cambiar el alcance ni los entregables tecnicos definidos.
