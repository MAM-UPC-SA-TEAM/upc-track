---
name: UpcTrack
description: "El Talón: el ETA a tu parada se imprime como tiquete en papel térmico y se anula con un sello cuando el dato envejece."
colors:
  papel: "#fbfaf4"
  papel-hundido: "#f1eee1"
  superficie: "#ffffff"
  tinta: "#14261a"
  tinta-suave: "#4a5b4f"
  linea-suave: "#d8d3c0"
  verde-upc: "#1e6b2e"
  amarillo-franja: "#f5c400"
  sello: "#c62828"
  papel-noche: "#101a13"
  papel-hundido-noche: "#0b130e"
  superficie-noche: "#17231b"
  tinta-noche: "#f1eedf"
  tinta-suave-noche: "#b5bdb0"
  linea-suave-noche: "#2c3b31"
  trazo-noche: "#a9b8a8"
  verde-texto-noche: "#7fd38b"
  sello-noche: "#ff8a80"
typography:
  eta:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(5.5rem, 31vw, 7.5rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.03em"
    fontFeature: "tabular-nums"
    fontVariation: "font-stretch 76%"
  headline:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
    fontVariation: "font-stretch 92%"
  title:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontVariation: "font-stretch 92%"
  label:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.5
  dato:
    fontFamily: "'Spline Sans Mono Variable', 'Spline Sans Mono', ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0em"
    fontFeature: "tabular-nums"
rounded:
  none: "0px"
  perforacion: "50%"
spacing:
  e1: "4px"
  e2: "8px"
  e3: "12px"
  e4: "16px"
  e5: "24px"
  e6: "32px"
  toque: "44px"
  barra-alto: "56px"
  nav-alto: "64px"
components:
  talon:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.none}"
    padding: "16px 16px 12px"
  talon-franja:
    backgroundColor: "{colors.amarillo-franja}"
    height: "10px"
  talon-estado-validado:
    backgroundColor: "{colors.verde-upc}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "2px 8px"
  talon-estado-vencido:
    backgroundColor: "transparent"
    textColor: "{colors.sello}"
    rounded: "{rounded.none}"
    padding: "2px 8px"
  sello:
    textColor: "{colors.sello}"
    rounded: "{rounded.none}"
    padding: "4px 10px"
  button-primary:
    backgroundColor: "{colors.verde-upc}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    height: "48px"
  aviso-conductor:
    backgroundColor: "{colors.amarillo-franja}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
  botnav-item:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta-suave}"
    height: "64px"
  botnav-item-activo:
    backgroundColor: "{colors.verde-upc}"
    textColor: "#ffffff"
    height: "64px"
  topbar:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    height: "56px"
  topbar-badge:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.papel}"
    rounded: "{rounded.none}"
    height: "20px"
  panel-desplegable:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.none}"
  chip:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  chip-activo:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.papel}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  etiqueta-vivo:
    backgroundColor: "{colors.verde-upc}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "2px 8px"
  etiqueta-viejo:
    backgroundColor: "transparent"
    textColor: "{colors.sello}"
    rounded: "{rounded.none}"
    padding: "2px 8px"
  etiqueta-mapa:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.none}"
    padding: "2px 8px"
  hoja-mapa:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.none}"
    width: "440px"
  sidebar:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.tinta-noche}"
    width: "240px"
---

# Design System: UpcTrack

Alcance honesto: este sistema esta construido y verificado en el shell de la app (barra superior, navegacion inferior, panel lateral, paneles desplegables, avisos y toasts), en la pantalla de Inicio del estudiante, en la pantalla Mapa en tiempo real, en la pantalla del conductor (Mi recorrido) y en las pantallas de acceso (login y registro). Rutas, buses, notificaciones, perfil y administracion solo heredan los tokens y el shell; **todavia no estan en este mundo** (ver "Brecha conocida" al final).

## Overview

**Creative North Star: "El Talón"**

Cada dato es un talon: el tiempo de llegada a tu parada se imprime como un tiquete sobre papel termico y se valida o se anula con un sello. La app nunca muestra una cifra vieja como si fuera actual; un dato vencido baja de tono y recibe un sello rojo encima, no se esconde. El sistema es papel, tinta verde-negra, y dos colores de marca con trabajo fijo: verde UPC para lo accionable y lo valido, amarillo para la franja de frescura y los avisos del conductor.

La densidad es baja y la jerarquia es de un solo foco: una cifra enorme y condensada, rodeada de bordes de 2px, color plano, sin sombras, sin degradados y sin rotulos pequenos encima de los titulos. Esta pensado para pleno sol, una mano y lectura de tres segundos: el contraste de la tinta sobre el papel es maximo, los objetivos tactiles miden 44px o mas, y el estado nunca depende solo del color (siempre hay texto: "Validado", "Hace 90 s", "Sin conexion").

Rechaza las tarjetas blancas redondeadas con metrica grande y acento azul. Mantiene el nombre y logo UpcTrack, el verde y amarillo de marca y el logo de la UPC (compromisos de PRODUCT.md).

**Key Characteristics:**
- Papel termico y tinta verde-negra; nunca blanco puro como fondo de pagina (el blanco es solo la hoja del talon y los paneles).
- Una sola cifra grande y condensada por pantalla; el resto es chico, firme y en mayusculas solo en la fila de datos.
- Bordes de 2px en tinta, esquinas rectas, sin sombras; la unica curva es el circulo de la muesca de la perforacion.
- Rojo solo para el sello de dato vencido o sin conexion; verde solo para lo accionable y lo valido.
- Un unico gesto animado con significado: el sello que cae sobre la cifra.

## Colors

Paleta de papel y tinta con dos colores de marca de trabajo fijo y un rojo de uso unico; el modo oscuro conserva los mismos nombres semanticos con otros valores.

### Primary
- **Verde UPC** (`verde-upc`, #1e6b2e): el unico relleno de accion y de estado valido: boton primario "Ver en el mapa", pestana activa de la navegacion, avatar, sello "Validado", trazo de la ruta en los mapas, enlaces de texto (en claro). Blanco (#ffffff) sobre el es el texto estandar.

### Secondary
- **Amarillo franja** (`amarillo-franja`, #f5c400): la franja de validez bajo la cifra (se vacia de 0 a 30 s), la losa completa del aviso del conductor, el aviso de actualizacion y el marcador de la parada elegida o propia (en reposo las paradas del Mapa son anillos de papel, no amarillas). Texto sobre el siempre en tinta (#14261a). Tambien es el color de seleccion de texto.

### Tertiary
- **Sello rojo** (`sello`, #c62828): reservado para anular. Sello sobre la cifra, estado "Hace N s" vencido y el aviso de conexion perdida. No es peligro generico: "Cerrar sesion" va en tinta.

### Neutral
- **Papel** (`papel`, #fbfaf4): fondo de pagina, barra superior y navegacion inferior.
- **Papel hundido** (`papel-hundido`, #f1eee1): fondo del mapa esquematico, pista de la barra de desplazamiento, hover de superficies.
- **Superficie** (`superficie`, #ffffff): hoja del talon y paneles desplegables.
- **Tinta** (`tinta`, #14261a): texto, bordes de 2px, foco, fondo del panel lateral, cuenta de alertas.
- **Tinta suave** (`tinta-suave`, #4a5b4f): texto secundario, pestanas inactivas.
- **Linea suave** (`linea-suave`, #d8d3c0): divisores finos de 1px y esqueletos de carga.

### Modo oscuro (`body[data-tema='oscuro']`)
Mismos nombres semanticos, otros valores: papel `papel-noche` (#101a13), hundido (#0b130e), superficie (#17231b), tinta (#f1eedf), tinta suave (#b5bdb0), linea (#2c3b31), trazo (#a9b8a8) para bordes y foco. El verde de marca no pasa contraste como texto sobre oscuro, asi que el acento de texto pasa a `verde-texto-noche` (#7fd38b); los rellenos verdes se mantienen. El sello pasa a `sello-noche` (#ff8a80).

### Named Rules
**The Rojo Es Sello Rule.** El rojo existe solo para decir "este dato ya no vale" (sello, estado vencido, sin conexion). Ninguna otra cosa (borrar, cerrar sesion, contadores, errores genericos) lo usa.

**The Un Solo Verde Lleno Rule.** El verde se llena en una accion primaria por vista, en el elemento activo de navegacion y en el estado valido. No se usa como decoracion ni como acento repartido.

**The Amarillo Con Tinta Rule.** El amarillo siempre lleva texto e icono en tinta y borde de tinta; nunca sobre papel como texto.

## Typography

**Display / UI Font:** Archivo Variable (eje de ancho; fallback `system-ui`), autoalojada con `@fontsource-variable/archivo/wdth.css`.
**Label/Mono Font:** Spline Sans Mono Variable (fallback `ui-monospace`), autoalojada, solo para datos.

**Character:** Archivo en ancho condensado da titulos y cifras compactas, firmes, de senaletica de transporte; Spline Sans Mono da el aire de impresion termica a los datos (km, segundos, horas). El cuerpo usa Archivo a 92% de ancho.

### Hierarchy
- **ETA** (800, `clamp(5.5rem, 31vw, 7.5rem)`, 0.9, ancho 76%, -0.03em, cifras tabulares): la cifra del talon. Una por pantalla. Excede deliberadamente el piso de 6rem para titulares de display (hasta 7.5rem): es el dato por el que existe la app y debe leerse a pleno sol de un vistazo.
- **Headline** (700, 1.5rem, 1.15, ancho 92%): la parada del talon (selector nativo). Tambien "Sin bus ahora" a 2.25rem/800/ancho 76% cuando no hay bus.
- **Title** (700, 1.25rem): titulo de la barra superior, titulo de paneles, texto del sello (800, ancho 76%, 0.06em, mayusculas).
- **Body** (400-700, 1rem, 1.5): texto corrido y boton primario (700). Notas a `0.875rem` en tinta suave.
- **Label** (600-700, 0.75rem-0.875rem): texto de la navegacion inferior (0.75rem) y subtextos.
- **Dato** (Spline Sans Mono, 600, 0.875rem, mayusculas, cifras tabulares): fila de datos del talon (ruta, bus, km, estado), hora del aviso, cuenta de alertas, antiguedad de notificaciones.

### Named Rules
**The Una Cifra Rule.** Una sola cifra de display por pantalla. Todo lo demas se subordina a ella en tamano, no en color.

**The Mono Solo Dato Rule.** Spline Sans Mono se usa solo para datos que cambian o se miden (km, segundos, horas, conteos). Nunca para titulos, etiquetas ni botones.

**The Cifras Fijas Rule.** Todo numero que se actualiza usa cifras tabulares para que no salte al refrescarse.

## Layout

Movil primero: columna unica con el contenido centrado y limitado a 560px, con `16px` de relleno de pagina. Escala de espacio en multiplos de 4: 4, 8, 12, 16, 24, 32 (`e1` a `e6`); el ritmo habitual es 16px entre bloques y 12 a 16px de relleno interno. Barra superior fija de 56px (mas area segura); navegacion inferior de 64px (mas area segura) con cinco destinos (Inicio, Mapa, Rutas, Alertas, Perfil), cada uno con icono y texto.

A partir de 1024px la navegacion inferior y el pie de logo desaparecen y entra un panel lateral fijo de 240px (fondo tinta, logo UPC sobre papel); el contenido pasa a 24px de relleno y la pantalla de Inicio a una cuadricula de dos columnas (hasta 1040px): el talon a la izquierda ocupando tres filas, aviso y mapa (300px de alto) a la derecha. Los avisos flotantes pasan de ancho completo sobre la navegacion a 380px abajo a la derecha. El hover solo se aplica donde existe (`hover: hover` y puntero fino).

Objetivos tactiles de 44px minimo (48px en el boton del talon y en enlaces del panel lateral). El foco visible es un anillo de 3px en trazo con 2px de separacion.

**Pantalla Mapa.** El contenido ocupa todo el alto bajo la barra: una banda de papel con borde inferior de 2px (buscador y chips de ruta) y el mapa a sangre. El buscador solo aparece con mas de 3 buses. Sin seleccion, la hoja inferior abarca todo el ancho (hasta 72% del alto, borde superior de 2px); con >=1024px es una tarjeta de 440px abajo a la izquierda con borde de 2px. El encuadre de la seleccion deja libre la hoja: mide su alto en movil y su ancho en escritorio, y deja 64px a la derecha para el zoom.

## Elevation & Depth

Sin sombras. Toda la profundidad es plana: la jerarquia sale de bordes de 2px en tinta, de rellenos planos (papel, superficie blanca, amarillo, verde) y del contraste entre ellos. Los paneles desplegables y los toasts se separan por borde, no por elevacion. El anillo interior del estado vencido es un trazo de 2px (`inset`), no una sombra de profundidad. Los degradados no existen.

### Named Rules
**The Plano Con Borde Rule.** Separar es dibujar un borde de 2px o cambiar de relleno plano; nunca una sombra ni un degradado.

## Shapes

Esquinas rectas en todo (radio 0), con borde de 2px (`--grosor`) en tinta para los contenedores principales y de 1px en linea suave para divisores internos. La unica curva del sistema son las dos muescas circulares de la perforacion del talon (24px, borde de 2px, relleno igual al fondo de pagina) sobre una linea punteada de 3px; los marcadores de mapa son circulos (ver Mapas en Componentes). El sello gira -8 grados con borde de 3px.

## Components

### Talon (ETA)
La pieza firma. Hoja blanca (superficie) con borde de 2px en tinta, esquinas rectas. Cuerpo: la parada como selector nativo con icono de ubicacion (titulo del talon, sin etiqueta encima), la cifra del ETA con su unidad "min", y una franja amarilla de 10px que es el tiempo de validez del dato: se vacia de 0 a 30 s y se "imprime" de nuevo (260ms) cuando llega un dato nuevo. Debajo, una perforacion (linea punteada con dos muescas) y una fila de datos en cuadricula de dos columnas: ruta y bus con km a la izquierda; a la derecha la etiqueta de frescura. Cierra con el boton verde y una nota de que el tiempo es por linea recta.

Estados: **vivo** (cifra en tinta, etiqueta verde "Validado · N s"); **viejo** y **sin-red** (cifra y unidad bajan a 28% de opacidad, la franja se vuelve gris de linea, cae el sello rojo "Sin senal" o "Sin conexion", la etiqueta pasa a contorno rojo "Hace N s/min"); **sin-red-vacio** (sin datos y sin red: esqueleto, sello, boton "Reintentar ahora"); **sin-buses** ("Sin bus ahora", boton "Ver rutas y horarios"); **cargando** (esqueleto, y si tarda, texto de que el servidor despierta).

### Sello
Rotulo rectangular con borde de 3px y texto en mayusculas condensadas, rojo, giro de -8 grados, fondo de superficie al 72%; cae sobre la cifra (240ms, escala de 1.35 a 1). Es el unico momento animado del sistema. Anula, no esconde.

### Buttons
- **Primario:** relleno verde UPC plano, texto blanco 700, 48px de alto, esquinas rectas, ancho completo dentro del talon con margen de 16px. Es la unica pieza verde llena de una vista.
- **Hover / Active:** el toque confirma con `scale(0.97)` en 140ms (curva `cubic-bezier(0.23, 1, 0.32, 1)`); el hover (fondo papel hundido) solo en puntero fino. Foco: anillo de 3px.
- **Secundario:** boton con borde de 2px en el color actual (banners); enlaces de texto en verde, 700, subrayados con separacion de 4px.

### Aviso del conductor
Losa amarilla completa con borde de 2px en tinta, icono, mensaje en 700 y hora relativa en mono. El mismo vestido se usa en el toast de notificaciones. No se usa un borde de color sobre fondo claro para avisar.

### Navigation
- **Barra superior:** papel, borde inferior de 2px, logo de marca (36px), titulo, y a la derecha tema, campana con cuenta (cuadro de tinta con numero de papel en mono, no rojo) y avatar verde con iniciales.
- **Navegacion inferior (<1024px):** cinco destinos estandar con icono y texto; el activo es una losa verde completa con texto blanco; inactivos en tinta suave. Borde superior de 2px.
- **Panel lateral (>=1024px):** fondo tinta, enlaces en papel calido de 48px de alto, activo en verde lleno.
- **Paneles desplegables:** superficie con borde de 2px, anclados a la barra (nunca se salen de pantalla), ancho hasta 360px; entran con escala 0.97 a 1 en 200ms.

### Banners de la app
Franja a todo el ancho: conexion perdida en rojo sello con texto blanco, actualizacion en amarillo con tinta, instalacion en tinta con papel.

### Mapas (Inicio y Mapa)
Dos bases, un mismo lenguaje compartido (marcadores, etiquetas, trazos y controles viven en un solo archivo y los usan ambas pantallas).

- **Base de Inicio:** esquematica, sin teselas ni calles, sobre papel hundido; marco de 2px en tinta; solo ruta (verde, 5px), parada y bus; sin interaccion de arrastre ni zoom; todo el mapa es un enlace al Mapa.
- **Base del Mapa:** calles reales de OpenStreetMap calmadas con CSS: gris (grayscale .85), sepia .2, saturacion .7, contraste .78, brillo 1.08 y opacidad .72 para que las calles se fundan con el papel y la ruta mande. En oscuro se invierte y se inclina hacia el verde-negro. Las etiquetas de calles de OSM se calman, no se quitan.
- **Marcadores:** bus = punto de tinta de 28px con borde de papel de 3px dentro de un area tactil de 44px. Bus sin senal (mas de 30 s o estado "sin senal") = marcador hueco de papel con anillo discontinuo de tinta, con la etiqueta "Nombre · sin senal"; se anula, no desaparece. Parada en reposo = anillo de papel de 16px con trazo de tinta de 2px (guion cuando esta inactiva), con un circulo invisible de 22px de radio que da 44px de toque. Parada elegida, o la proxima parada del bus elegido = punto amarillo de 22px con borde de tinta y su nombre en una etiqueta plana.
- **Etiquetas:** siempre papel con tinta y borde de 2px, 700, esquinas rectas, sin flecha, en cualquier tema. Con mas de 3 buses solo se rotula el elegido.
- **Rutas:** un solo trazo verde por ruta con un casing de papel debajo. Con varias rutas se distinguen por estilo de linea y no por una paleta: continua gruesa verde (6px), rayas finas de tinta (3px, 10 8), puntos verdes gruesos (6px, 2 9), puntos finos de tinta (3px, 2 9). Las rutas impares son mas finas para que, donde comparten calle, la de abajo siga viendose.
- **Controles:** zoom arriba a la derecha, dos cuadrados planos de 44px con borde de 2px y sin sombra; atribucion arriba a la izquierda sobre papel.

### Barra de rutas y chips
Banda de papel con borde inferior de 2px. Los chips miden 44px, tienen borde de 2px en tinta y esquinas rectas; el chip activo se rellena de **tinta**, no de verde, para conservar la regla de un solo verde lleno. Hacen de leyenda: solo con "Todas" cada chip muestra una muestra de su trazo. Mientras se calcula la geometria aparece un anillo giratorio pequeno. El buscador es un campo blanco de 44px con borde de 2px y foco de 3px.

### Hoja del Mapa y su talon
Superficie blanca con borde de 2px. Sin seleccion lista **Buses** y **Paradas** (la lista de paradas es tambien el camino accesible a las paradas); los encabezados de grupo son h3 reales a 1rem, 700, en tinta, no rotulos pequenos. Cada fila mide 60px o mas. Al tocar una parada muestra su talon con el ETA del bus mas cercano **de la misma ruta**; al tocar un bus, su talon con el ETA a su proxima parada. Es el mismo talon de Inicio sin marco propio (cifra algo menor, clamp(4rem, 22vw, 5.25rem), franja amarilla que se vacia en 30 s, perforacion, fila mono, sello "Sin senal"/"Sin conexion" y nota de linea recta), con titulo en 1.5rem y boton de cerrar de 44px. Estados disenados: sin buses ("Ningun bus transmite ahora": ruta y paradas se quedan), bus sin senal, sin conexion, carga inicial fallida (sello "Sin conexion" y boton "Reintentar ahora", nunca una pantalla vacia) y carga.

### Talon del conductor (Mi recorrido)
La misma hoja del Mapa (mapa de calles calmadas a sangre; talon abajo en movil, tarjeta de 440px a la izquierda desde 1024px) con otro dato: su "cifra" es el estado de **este telefono**, una palabra en 2.25rem/800/ancho 76% ("Transmitiendo", "Bus detenido", "Fuera de servicio", "Buscando GPS", "Sin transmitir"), con la franja amarilla que se vacia en 30 s desde el ultimo envio, la perforacion y una fila mono (ruta y placa; a la derecha la etiqueta "Validado · N s" o "Hace N s"). Una sola accion verde llena: "Iniciar recorrido", "Reanudar" o "Reanudar transmision"; la otra accion es contorno de tinta ("Detener", "Finalizar"). "Finalizar" pide un segundo toque ("Toca otra vez para finalizar", se desarma a los 4 s) y ese estado rellena el boton de tinta, no de rojo. Sin modal.

Estados: **vivo**, **detenido**, **buscando GPS**, **viejo** (sin conexion o mas de 30 s sin enviar: la palabra baja a 28% y cae el sello "Sin conexion" o "Sin senal"; el marcador del bus en el mapa pasa a hueco), **colgado** (el servidor dice "en recorrido" o "detenido" pero este telefono no transmite, por ejemplo tras recargar: "Sin transmitir", etiqueta roja "Hace N min" con la antiguedad que guarda el servidor, la frase de lo que ven los estudiantes, "Reanudar transmision" y "Finalizar recorrido"), **libre** y **sin bus asignado**. El estado del servidor nunca se muestra como si el telefono transmitiera.

Los errores del propio telefono (GPS bloqueado, no se pudo cambiar el estado) van en una caja de tinta con icono, no en rojo. "Avisar a mi ruta" se despliega en linea: tipo en chips de 44px (el activo en tinta), mensaje y "Enviar aviso" en tinta. Los avisos de notificacion (toast) del conductor caen **arriba**, bajo la barra, en movil, para no tapar Detener y Finalizar. No hay registro de actividad ni contador de puntos GPS. Trazo recorrido: puntos finos de tinta; sin emoji ni naranja.

### Acceso (login y registro)
Un solo marco para las dos pantallas: la hoja del talon centrada (hasta 440px) sobre papel, con el **cabo** arriba (la marca de 72px, que en oscuro lleva una placa de papel, y "UpcTrack" en texto vivo con el lema "Tu ruta en tiempo real"), la perforacion y debajo el formulario. El logo de la universidad va **al pie**, fuera del talon, sobre una placa de papel y con "Seccional Aguachica · 2026" en tinta suave; ya no se apilan dos logos antes del formulario. La marca es la de 31 KB (`upc-track-mark.png`), no la de 1,1 MB.

Cada campo tiene su etiqueta real ligada (`for`/`id`) arriba, en 700; el campo mide 48px, borde de 2px en tinta y fondo papel; la ayuda ("Minimo 8 caracteres.") esta siempre visible y se reemplaza por el error cuando lo hay; el error lleva icono y texto en 700, **no rojo**, y el campo engrosa su borde 1px hacia adentro. El primer campo con error recibe el foco. "Mostrar contrasena" es una casilla en una fila de 44px (sin boton de icono); la casilla se tematiza (borde de 2px, marcada rellena de tinta). Un error general (credenciales, servidor) va en una caja de tinta con icono y `role="alert"`. La accion es el boton verde del talon ("Entrar", "Crear cuenta"); el cambio de pantalla es un enlace de texto verde subrayado de 44px. Exito del registro: el mismo marco con "Cuenta creada" y un boton a "Ir a iniciar sesion".

### Etiqueta de estado
Pieza generica de 2px 8px en mono 600 mayusculas: valida = relleno verde con texto blanco ("Validado · N s"); vencida = contorno rojo sin relleno ("Hace N s"); neutra = contorno de tinta ("Detenido", "Fuera de servicio", "Inactiva"). Rojo solo en la vencida.

### Iconografia
Iconos de la biblioteca Font Awesome Solid como SVG, siempre acompanados de texto en la navegacion y en las acciones.

## Do's and Don'ts

### Do:
- **Do** mostrar siempre la frescura del dato junto a la cifra, y anular con sello (cifra al 28%, franja gris) cuando pase de 30 s o se pierda la red; nunca dejar una cifra vieja con aspecto de actual.
- **Do** usar tinta `#14261a` sobre papel `#fbfaf4` como par de maximo contraste y bordes de 2px en tinta.
- **Do** reservar el verde lleno para una accion primaria por vista, el elemento activo de navegacion y el estado valido.
- **Do** dar a los avisos del conductor una losa amarilla completa con tinta y borde de tinta.
- **Do** usar Spline Sans Mono con cifras tabulares solo para km, segundos, horas y conteos.
- **Do** mantener 44px de objetivo tactil minimo y `prefers-reduced-motion` respetado (el cambio de estado se conserva, el desplazamiento se quita).
- **Do** diferenciar varias rutas por estilo de linea (continua, rayas, puntos) y grosor, con los chips como leyenda; el chip activo va en tinta.
- **Do** anular un bus sin senal con marcador hueco y la palabra "sin senal" en su etiqueta; en reposo la parada es un anillo de papel y solo la elegida es amarilla.
- **Do** separar en la pantalla del conductor el estado del bus en el servidor de si este telefono transmite, y anular con sello o con etiqueta roja cuando no coinciden.
- **Do** repetir los mismos nombres semanticos (`--bg`, `--superficie`, `--texto`, `--borde`, `--trazo`, `--acento-texto`) en modo oscuro con otros valores; en oscuro el texto verde pasa a #7fd38b.

### Don't:
- **Don't** usar rojo para nada que no sea "dato vencido / sin conexion" (ni cerrar sesion, ni contadores, ni errores genericos).
- **Don't** usar sombras, degradados ni esquinas redondeadas; la unica curva es la muesca de la perforacion.
- **Don't** poner rotulos pequenos encima de los titulos ni etiquetas de seccion decorativas; el titulo es el contenido (la parada).
- **Don't** repetir la cifra grande en mas de un lugar por pantalla ni usar Spline Sans Mono para titulos o botones.
- **Don't** distinguir rutas con una paleta de colores ni rellenar de verde el chip activo.
- **Don't** poner etiquetas del mapa sobre fondo del tema: siempre papel con tinta.
- **Don't** volver a la tarjeta blanca redondeada con metrica grande y acento azul.
- **Don't** usar el verde como acento decorativo ni el amarillo como color de texto sobre papel.

## Brecha conocida (no canonizada como hecha)

- **Estan en el mundo: shell, Inicio, Mapa en tiempo real, pantalla del conductor y acceso (login y registro).** Rutas, buses, notificaciones, perfil y administracion heredan tokens y shell pero conservan sus composiciones anteriores; estan pendientes. No se debe leer este documento como que esas pantallas cumplen estas reglas.
- El panel de administracion no tiene decision de diseno aun; las reglas de arriba son los invariantes que debera heredar, no su diseno.
- **Conductor:** el envio de la posicion depende de que el GPS del telefono emita lecturas (se envia como maximo cada 4 s); si el navegador solo emite al moverse, un bus parado puede verse "Sin senal" aunque transmita. No se reenvia la ultima posicion para no pasar un dato viejo por fresco. El seguimiento con la pantalla bloqueada sigue sin estar garantizado (PRODUCT.md).
- **El ETA es una estimacion en linea recta** (distancia / 25 km/h), no por carretera; se dice en pantalla en Inicio y en la hoja del Mapa. Decision abierta en PRODUCT.md (OSRM).
- **El mapa con teselas conserva las etiquetas de calles de OSM:** estan calmadas con filtro CSS, no eliminadas.
- **Las teselas de OSM suman peso de red con datos inestables.** Inicio se mantiene esquematico, sin teselas.
- **Tableta y "Todas" con varias rutas se verificaron solo con una segunda ruta temporal en la base de desarrollo;** los datos de demostracion tienen una sola ruta.
- **Seguir a un solo bus (centrar y acompanar) queda fuera de alcance.**
- Pendientes del brief de Inicio: umbrales de frescura (hoy 30 s validado, hasta 120 s con sello), escala del sello en modo oscuro, y favoritos de parada guardados solo en el dispositivo.
