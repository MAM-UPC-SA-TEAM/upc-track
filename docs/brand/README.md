# UpcTrack

Brand kit de UpcTrack, la app de monitoreo en tiempo real del bus universitario de la Universidad Popular del Cesar, seccional Aguachica. Reúne el logo, el símbolo de app, los colores, la tipografía y las reglas para producir íconos web (PWA) y de la APK Android. Se basa en el logo oficial (`upc-track-logo.png`) y en el sistema visual de la plataforma, "El Talón" (DESIGN.md del repo).

## La marca en una frase

**Tu ruta en tiempo real.** El bus de esta universidad, en tu parada, con un dato que nunca miente sobre su frescura.

## Logo y símbolo

- **Logo completo** (`Logos/upc-track-logo.png`): mapa, pin, bus y el wordmark "UPCTrack" con el lema "Tu ruta en tiempo real". Se usa en piezas grandes: presentaciones, la feria, redes, la pantalla de acceso. No usarlo por debajo de 160 px de ancho: el lema y el bus pierden lectura.
- **Símbolo** (`Logos/upctrack-symbol.svg`): la síntesis del logo para tamaños pequeños. Conserva sus tres ideas: el **pin** verde con punta en rombo amarillo (dónde), el **bus de frente** (qué) y las **ondas de señal** amarillas (en vivo). Dibujado plano, sin degradados, con contorno `verde-profundo`.
- **Símbolo monocromo** (`Logos/upctrack-symbol-mono.svg`): una sola tinta, con el parabrisas y el ojo del pin calados. Para sellos, grabados, impresión a una tinta y el ícono temático de Android 13+.

Área de respeto: alrededor del símbolo, como mínimo el diámetro del ojo del pin. Nunca rotarlo, recolorearlo fuera de la paleta ni ponerlo sobre fotos sin una placa de `papel` o `verde-upc`.

## Íconos de app

Todos salen del mismo SVG maestro; los scripts `docs/brand/gen_svg.py` y `build_icons.py` del repo los regeneran.

| Uso | Archivo | Forma |
| --- | --- | --- |
| PWA "any" 64/192/512 | `pwa-*.png` | Cuadrado redondeado (`icono` 22%) en `verde-upc`, camino amarillo punteado al pie |
| PWA maskable / Apple touch | `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png` | Sangrado completo, símbolo dentro del círculo seguro del 80% |
| Favicon | `favicon.svg`, `favicon.ico` (16/32/48) | Contornos más gruesos; a 16 px solo el pin |
| Android adaptativo | `ic_launcher_foreground.png` + fondo `#1E6B2E` | Símbolo dentro de la zona segura de 66 dp |
| Android temático (13+) | `ic_launcher_monochrome.png` | Silueta blanca |
| Android legacy | `ic_launcher.png`, `ic_launcher_round.png` | Cuadrado redondeado y círculo |
| Splash Android | `splash.png` | Fondo `papel` con el símbolo al centro |

El fondo del ícono es siempre `verde-upc`: es el color de lo accionable en la app y el que la gente asocia a la UPC. El amarillo nunca es fondo de ícono, solo acento.

## Color

Papel y tinta verde-negra, con dos colores de marca de trabajo fijo:

- `verde-upc` (#1e6b2e): lo accionable y lo válido. Botón primario, pestaña activa, sello "Validado", fondo del ícono.
- `amarillo-franja` (#f5c400): frescura y avisos. La franja bajo la cifra del ETA, el aviso del conductor, la punta del pin. Texto encima siempre en `tinta`.
- `sello` (#c62828): solo para anular un dato vencido o sin conexión. No es "peligro" genérico.
- `verde-hoja` y `verde-profundo` vienen del logo y viven solo en la marca y los íconos; la interfaz no los usa.

En modo oscuro se mantienen los nombres semánticos; el verde de texto sube a #7fd38b para pasar contraste.

## Tipografía

- **Archivo** (variable, ancho condensado 76–92%): todo el texto. La cifra del ETA va a 800, condensada y con números tabulares.
- **Spline Sans Mono**: datos (placas, horas, "Hace 90 s").

## Formas

La UI es de esquinas rectas, bordes de 2px en `tinta` y cero sombras; la única curva es la muesca circular de la perforación del talón (`perforacion`). El ícono de app es la excepción: lleva el radio `icono` porque vive en la pantalla de inicio del teléfono, junto a otros íconos redondeados.

## Voz

Español de Colombia, directo y corto, pensado para leerse en tres segundos a pleno sol: "Llega en 4 min", "Hace 90 s", "Sin conexión". Nunca una cifra vieja presentada como actual.

## Nombre

La marca se escribe **UpcTrack** en texto corrido y "UPCTrack" solo dentro del wordmark del logo. Los nombres heredados "BusUPCSA" y "Monitoreo de Rutas — UPCSA" del manifiesto web deberían pasar a UpcTrack.
