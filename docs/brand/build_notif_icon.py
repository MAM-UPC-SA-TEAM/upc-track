"""Genera el ícono pequeño de notificación de Android (ic_stat_upctrack).

Android solo usa el canal alfa del ícono de la barra de estado: se toma la silueta
del símbolo monocromo, se recorta a su contenido y se pinta en blanco a 24 dp.

    python docs/brand/build_notif_icon.py
"""
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
ORIGEN = RAIZ / 'docs/brand/png/upctrack-symbol-mono-1024.png'
RES = RAIZ / 'frontend/android/app/src/main/res'
DENSIDADES = {'mdpi': 24, 'hdpi': 36, 'xhdpi': 48, 'xxhdpi': 72, 'xxxhdpi': 96}
ZONA = 22 / 24  # zona útil del ícono de estado: 22 dp dentro de 24 dp

silueta = Image.open(ORIGEN).convert('RGBA').getchannel('A')
silueta = silueta.crop(silueta.getbbox())

for densidad, lado in DENSIDADES.items():
    util = round(lado * ZONA)
    escala = util / max(silueta.size)
    alfa = silueta.resize((max(1, round(silueta.width * escala)), max(1, round(silueta.height * escala))), Image.LANCZOS)
    lienzo = Image.new('RGBA', (lado, lado), (255, 255, 255, 0))
    blanco = Image.new('RGBA', alfa.size, (255, 255, 255, 255))
    blanco.putalpha(alfa)
    lienzo.paste(blanco, ((lado - alfa.width) // 2, (lado - alfa.height) // 2), blanco)
    destino = RES / f'drawable-{densidad}' / 'ic_stat_upctrack.png'
    destino.parent.mkdir(parents=True, exist_ok=True)
    lienzo.save(destino, optimize=True)
    print(destino.relative_to(RAIZ), lado)
