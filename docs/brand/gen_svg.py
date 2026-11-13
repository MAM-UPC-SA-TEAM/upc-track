"""Genera los SVG maestros del simbolo UpcTrack (pin + bus de frente).
Lienzo 1024x1024. El contenido vive dentro del circulo seguro de iconos adaptativos (r ~ 330)."""
import math, os

OUT = os.path.join(os.path.dirname(__file__), 'svg')
os.makedirs(OUT, exist_ok=True)

TINTA = '#0f3d22'      # contorno (verde profundo del logo)
VERDE = '#1e6b2e'      # verde UPC
HOJA = '#5aa823'       # verde hoja del pin
AMARILLO = '#f5c400'
PAPEL = '#fbfaf4'
CRISTAL = '#2f8a4a'
S = 26                 # grosor del contorno


def pin_path(cx, cy, r, ty):
    d = ty - cy
    a = math.asin(r / d)            # angulo de la tangente
    # puntos de tangencia
    ang = math.pi / 2 - a
    lx, ly = cx - r * math.cos(ang), cy + r * math.sin(ang)
    rx, ry = cx + r * math.cos(ang), ly
    return (f'M{cx},{ty} L{lx:.1f},{ly:.1f} A{r},{r} 0 1 1 {rx:.1f},{ry:.1f} Z')


def symbol(mono=None, scale=1.0, stroke=S, simple=False):
    """Devuelve el grupo del simbolo. mono = color unico (silueta)."""
    c = (lambda col: mono) if mono else (lambda col: col)
    cx = 512
    pcx, pcy, pr, pty = 512, 318, 118, 492
    pin = pin_path(pcx, pcy, pr, pty)
    g = []
    # --- ondas de senal (amarillo) ---
    for rr, w in (() if simple else ((150, 26), (205, 26))):
        a0, a1 = math.radians(-62), math.radians(-18)
        x0, y0 = pcx + rr * math.cos(a0), pcy + rr * math.sin(a0)
        x1, y1 = pcx + rr * math.cos(a1), pcy + rr * math.sin(a1)
        g.append(f'<path d="M{x0:.1f},{y0:.1f} A{rr},{rr} 0 0 1 {x1:.1f},{y1:.1f}" fill="none" '
                 f'stroke="{c(AMARILLO)}" stroke-width="{w}" stroke-linecap="round"/>')
    # --- sombra / suelo ---
    # --- bus ---
    bx0, bx1, by0, by1 = 334, 690, 478, 790
    # retrovisores
    for x in (300, 692):
        g.append(f'<rect x="{x}" y="560" width="32" height="74" rx="14" fill="{c(HOJA)}" '
                 f'stroke="{c(TINTA)}" stroke-width="{stroke*0.7:.0f}"/>')
    # ruedas
    for x in (372, 588):
        g.append(f'<rect x="{x}" y="760" width="64" height="70" rx="16" fill="{c(TINTA)}"/>')
    # carroceria
    g.append(f'<rect x="{bx0}" y="{by0}" width="{bx1-bx0}" height="{by1-by0}" rx="56" '
             f'fill="{c(PAPEL)}" stroke="{c(TINTA)}" stroke-width="{stroke}"/>')
    if mono:
        # recortes: parabrisas y faros en negativo
        g.append(f'<rect x="376" y="560" width="272" height="118" rx="20" fill="#000" class="cut"/>')
    else:
        # franja inferior verde
        g.append(f'<path d="M{bx0+stroke/2},712 H{bx1-stroke/2} V{by1-56} '
                 f'a{56-stroke/2},{56-stroke/2} 0 0 1 -{56-stroke/2},{56-stroke/2} '
                 f'H{bx0+56} a{56-stroke/2},{56-stroke/2} 0 0 1 -{56-stroke/2},-{56-stroke/2} Z" fill="{HOJA}"/>')
        g.append(f'<line x1="{bx0}" y1="712" x2="{bx1}" y2="712" stroke="{TINTA}" stroke-width="{stroke*0.7:.0f}"/>')
        # letrero de ruta
        g.append(f'<rect x="452" y="506" width="120" height="26" rx="13" fill="{HOJA}" '
                 f'stroke="{TINTA}" stroke-width="{stroke*0.6:.0f}"/>')
        # parabrisas
        g.append(f'<rect x="376" y="556" width="272" height="122" rx="22" fill="{VERDE}" '
                 f'stroke="{TINTA}" stroke-width="{stroke}"/>')
        if not simple:
            g.append(f'<path d="M402,654 L470,580 L520,580 L452,654 Z" fill="{PAPEL}" opacity=".28"/>')
        # faros
        for x in (392, 632):
            g.append(f'<circle cx="{x}" cy="742" r="24" fill="{PAPEL}" stroke="{TINTA}" stroke-width="{stroke*0.6:.0f}"/>')
        # rejilla
        for y in (() if simple else (728, 756)):
            g.append(f'<rect x="458" y="{y}" width="108" height="12" rx="6" fill="{TINTA}"/>')
    # --- pin ---
    g.append(f'<clipPath id="pc"><path d="{pin}"/></clipPath>')
    g.append(f'<path d="{pin}" fill="{c(HOJA)}"/>')
    if not mono:
        # mitad derecha mas oscura (volumen plano, como el logo)
        g.append(f'<rect x="{pcx}" y="150" width="200" height="400" fill="{VERDE}" opacity=".55" clip-path="url(#pc)"/>')
        # punta amarilla en rombo
        g.append(f'<path d="M{pcx-62},{pcy+92} L{pcx},{pcy+40} L{pcx+62},{pcy+92} L{pcx},{pty} Z" '
                 f'fill="{AMARILLO}" clip-path="url(#pc)"/>')
        g.append(f'<path d="M{pcx},{pcy+40} L{pcx+62},{pcy+92} L{pcx},{pty} Z" fill="#d9a400" clip-path="url(#pc)"/>')
    g.append(f'<path d="{pin}" fill="none" stroke="{c(TINTA)}" stroke-width="{stroke}" stroke-linejoin="round"/>')
    g.append(f'<circle cx="{pcx}" cy="{pcy}" r="48" fill="{c(PAPEL) if not mono else "#000"}" '
             f'stroke="{c(TINTA)}" stroke-width="{stroke}" {"class=\"cut\"" if mono else ""}/>')
    body = '\n  '.join(g)
    if scale != 1.0:
        o = 512 * (1 - scale)
        body = f'<g transform="translate({o:.1f} {o:.1f}) scale({scale})">\n  {body}\n  </g>'
    return body


def svg(inner, bg=None, shape='square', road=True):
    bgx = ''
    if bg == 'square':
        bgx = f'<rect width="1024" height="1024" fill="{VERDE}"/>'
    elif bg == 'squircle':
        bgx = f'<rect x="32" y="32" width="960" height="960" rx="224" fill="{VERDE}"/>'
    elif bg == 'circle':
        bgx = f'<circle cx="512" cy="512" r="496" fill="{VERDE}"/>'
    if bg and road and bg != 'circle':
        # camino amarillo punteado al pie (franja de marca)
        bgx += (f'<path d="M190,918 C360,868 664,868 834,918" fill="none" stroke="{AMARILLO}" '
                f'stroke-width="18" stroke-dasharray="44 30" stroke-linecap="round" opacity=".9"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">\n'
            f'  {bgx}\n  {inner}\n</svg>\n')


def mono_svg(color, scale):
    # Silueta de un color: los elementos "cut" se convierten en mascara negativa
    inner = symbol(mono='#fff', scale=scale)
    inner = inner.replace('fill="#000" class="cut"', 'fill="#000"')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">\n'
            f'<mask id="m"><rect width="1024" height="1024" fill="#000"/>{inner}</mask>\n'
            f'<rect width="1024" height="1024" fill="{color}" mask="url(#m)"/>\n</svg>\n')


def pin_only():
    """Version minima para 16 px: solo el pin, grande, sobre verde."""
    cx, cy, r, ty = 512, 400, 270, 900
    p = pin_path(cx, cy, r, ty)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">'
            f'<rect x="32" y="32" width="960" height="960" rx="224" fill="{VERDE}"/>'
            f'<clipPath id="pc"><path d="{p}"/></clipPath>'
            f'<path d="{p}" fill="{HOJA}"/>'
            f'<path d="M{cx-150},{cy+210} L{cx},{cy+110} L{cx+150},{cy+210} L{cx},{ty} Z" fill="{AMARILLO}" clip-path="url(#pc)"/>'
            f'<path d="{p}" fill="none" stroke="{TINTA}" stroke-width="56" stroke-linejoin="round"/>'
            f'<circle cx="{cx}" cy="{cy}" r="110" fill="{PAPEL}" stroke="{TINTA}" stroke-width="56"/></svg>\n')


files = {
    'upctrack-icon-fullbleed.svg': svg(symbol(scale=1.0), bg='square', road=False),
    'upctrack-icon.svg': svg(symbol(scale=1.0), bg='squircle'),
    'upctrack-icon-round.svg': svg(symbol(scale=0.92), bg='circle'),
    'upctrack-symbol.svg': svg(symbol(scale=1.18)),
    'android-foreground.svg': svg(symbol(scale=0.84)),
    'android-monochrome.svg': mono_svg('#ffffff', 0.84),
    'upctrack-symbol-mono.svg': mono_svg('#14261a', 1.18),
    'favicon.svg': svg(symbol(scale=1.26, stroke=40, simple=True), bg='squircle', road=False),
    'favicon-pin.svg': pin_only(),
}
for n, s in files.items():
    open(os.path.join(OUT, n), 'w').write(s)
print('ok', list(files))
