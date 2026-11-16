"""Genera la variante para fondo oscuro de un logo con transparencia (U33).

Aclara SOLO los tonos que no se leen sobre el papel oscuro (luminosidad HSL baja), conservando el matiz, la
saturación, la transparencia y el orden de los tonos (el cubo de la UPC usa tres verdes para su volumen).
No cambia el archivo original: escribe uno nuevo.

Uso:  python scripts/dev/variante-logo-oscuro.py <entrada.png> <salida.png>
Requiere: pip install pillow
"""
import colorsys
import sys

from PIL import Image

L_MIN_VISIBLE = 0.38   # por debajo de esta luminosidad HSL el tono se aclara
L_OBJETIVO = 0.40      # hacia dónde se acerca (los más oscuros llegan ~0.38-0.40)
FUERZA = 0.9


def aclarar(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    if l < L_MIN_VISIBLE:
        l = l + (L_OBJETIVO - l) * FUERZA
    r2, g2, b2 = colorsys.hls_to_rgb(h, l, s)
    return round(r2 * 255), round(g2 * 255), round(b2 * 255)


def main(entrada, salida):
    img = Image.open(entrada).convert("RGBA")
    px = img.load()
    ancho, alto = img.size
    for y in range(alto):
        for x in range(ancho):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            r, g, b = aclarar(r, g, b)
            px[x, y] = (r, g, b, a)
    img.save(salida, optimize=True)
    print(f"{salida}: {ancho}x{alto}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
