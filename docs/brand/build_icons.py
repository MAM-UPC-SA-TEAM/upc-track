import os, subprocess, io
from PIL import Image

K = os.path.dirname(os.path.abspath(__file__))
SV = os.path.join(K, 'svg')
O = os.path.join(K, 'out')


def render(svg, w, h=None):
    h = h or w
    png = subprocess.run(['rsvg-convert', '-w', str(w), '-h', str(h), os.path.join(SV, svg)],
                         capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(png)).convert('RGBA')


def save(img, rel, opaque=None):
    p = os.path.join(O, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    if opaque:
        bg = Image.new('RGBA', img.size, opaque)
        bg.alpha_composite(img)
        img = bg.convert('RGB')
    img.save(p, optimize=True)

# ---------- WEB (frontend/public) ----------
W = 'frontend/public/'
save(render('upctrack-icon.svg', 64), W + 'pwa-64x64.png')
save(render('upctrack-icon.svg', 192), W + 'pwa-192x192.png')
save(render('upctrack-icon.svg', 512), W + 'pwa-512x512.png')
save(render('upctrack-icon-fullbleed.svg', 512), W + 'maskable-icon-512x512.png')
save(render('upctrack-icon-fullbleed.svg', 180), W + 'apple-touch-icon-180x180.png', opaque='#1e6b2e')
# favicon.ico multi-tamano: 16 = solo pin, 32/48 = pin + bus
ico = [render('favicon-pin.svg', 16), render('favicon.svg', 32), render('favicon.svg', 48)]
os.makedirs(O + '/' + W, exist_ok=True)
ico[2].save(os.path.join(O, W + 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:2])
for src, dst in (('favicon.svg', 'favicon.svg'), ('upctrack-icon-fullbleed.svg', 'icon-maskable.svg')):
    os.makedirs(os.path.join(O, W), exist_ok=True)
    open(os.path.join(O, W + dst), 'w').write(open(os.path.join(SV, src)).read())
# simbolo para splash web / login
save(render('upctrack-symbol.svg', 288), W + 'brand/upctrack-symbol.png')

# ---------- BRAND (frontend/public/brand/icono) ----------
for f in os.listdir(SV):
    open(os.path.join(O, W + 'brand/' + f), 'w').write(open(os.path.join(SV, f)).read()) if False else None
os.makedirs(os.path.join(O, 'brand-kit/svg'), exist_ok=True)
for f in os.listdir(SV):
    open(os.path.join(O, 'brand-kit/svg', f), 'w').write(open(os.path.join(SV, f)).read())
save(render('upctrack-icon.svg', 1024), 'brand-kit/png/upctrack-icon-1024.png')
save(render('upctrack-icon-fullbleed.svg', 512), 'brand-kit/png/play-store-icon-512.png', opaque='#1e6b2e')
save(render('upctrack-symbol.svg', 1024), 'brand-kit/png/upctrack-symbol-1024.png')
save(render('upctrack-symbol-mono.svg', 1024), 'brand-kit/png/upctrack-symbol-mono-1024.png')

# ---------- ANDROID (res) ----------
A = 'frontend/android/app/src/main/res/'
dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for d, m in dens.items():
    L = int(48 * m); F = int(108 * m)
    save(render('upctrack-icon.svg', L), f'{A}mipmap-{d}/ic_launcher.png')
    save(render('upctrack-icon-round.svg', L), f'{A}mipmap-{d}/ic_launcher_round.png')
    save(render('android-foreground.svg', F), f'{A}mipmap-{d}/ic_launcher_foreground.png')
    save(render('android-monochrome.svg', F), f'{A}mipmap-{d}/ic_launcher_monochrome.png')

# splash: papel + simbolo centrado
PAPEL = '#fbfaf4'
splash = {
    'drawable': (480, 320),
    'drawable-land-mdpi': (480, 320), 'drawable-land-hdpi': (800, 480), 'drawable-land-xhdpi': (1280, 720),
    'drawable-land-xxhdpi': (1600, 960), 'drawable-land-xxxhdpi': (1920, 1280),
    'drawable-port-mdpi': (320, 480), 'drawable-port-hdpi': (480, 800), 'drawable-port-xhdpi': (720, 1280),
    'drawable-port-xxhdpi': (960, 1600), 'drawable-port-xxxhdpi': (1280, 1920),
}
for d, (w, h) in splash.items():
    s = int(min(w, h) * 0.42)
    img = Image.new('RGBA', (w, h), PAPEL)
    sym = render('upctrack-symbol.svg', s)
    img.alpha_composite(sym, ((w - s) // 2, (h - s) // 2))
    save(img, f'{A}{d}/splash.png', opaque=PAPEL)

os.makedirs(os.path.join(O, A + 'mipmap-anydpi-v26'), exist_ok=True)
xml = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>
'''
for n in ('ic_launcher.xml', 'ic_launcher_round.xml'):
    open(os.path.join(O, A + 'mipmap-anydpi-v26', n), 'w').write(xml)
os.makedirs(os.path.join(O, A + 'values'), exist_ok=True)
open(os.path.join(O, A + 'values/ic_launcher_background.xml'), 'w').write(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1E6B2E</color>\n</resources>\n')
print('listo')
