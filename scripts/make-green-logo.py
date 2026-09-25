"""Erzeugt die grün gefüllte Logo-Variante aus der weiß/transparenten Vorlage.

Die Vorlagen sind rein weiß auf transparent: Über der grünen Fläche wirkt das
richtig, über einem Foto zeigen die Innenflächen des G und die Buchstaben im
Balken aber das Foto. Diese Variante füllt genau diese EINGESCHLOSSENEN
Flächen mit dem Markengrün — die äußere Transparenz bleibt, sonst bekäme das
Logo einen grünen Kasten.

Aussen und innen werden über eine Flutfüllung vom Bildrand unterschieden:
Was vom Rand aus erreichbar ist, ist aussen.
"""
from collections import deque
from PIL import Image
import sys

GREEN = (37, 118, 57, 255)   # BACKGROUND_SECONDARY / #257639
ALPHA_THRESHOLD = 32


def fill_enclosed(path_in, path_out):
    im = Image.open(path_in).convert("RGBA")
    w, h = im.size
    px = im.load()

    outside = bytearray(w * h)
    queue = deque()

    def consider(x, y):
        if 0 <= x < w and 0 <= y < h and not outside[y * w + x] and px[x, y][3] < ALPHA_THRESHOLD:
            outside[y * w + x] = 1
            queue.append((x, y))

    for x in range(w):
        consider(x, 0)
        consider(x, h - 1)
    for y in range(h):
        consider(0, y)
        consider(w - 1, y)

    while queue:
        x, y = queue.popleft()
        consider(x + 1, y)
        consider(x - 1, y)
        consider(x, y + 1)
        consider(x, y - 1)

    filled = 0
    for y in range(h):
        row = y * w
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < ALPHA_THRESHOLD and not outside[row + x]:
                px[x, y] = GREEN
                filled += 1
            elif a < 255 and not outside[row + x]:
                # Weiche Kante über Grün statt über dem Hintergrund mischen.
                f = a / 255
                px[x, y] = (
                    round(r * f + GREEN[0] * (1 - f)),
                    round(g * f + GREEN[1] * (1 - f)),
                    round(b * f + GREEN[2] * (1 - f)),
                    255,
                )
                filled += 1

    im.save(path_out)
    return filled, w * h


if __name__ == "__main__":
    for name in ("Logo-einzeilig", "Logo-zweizeilig"):
        src = f"resources/images/logos/{name}_blanko.png"
        dst = f"resources/images/logos/{name}_gruen.png"
        filled, total = fill_enclosed(src, dst)
        print(f"{dst}: {filled} von {total} Pixeln gefüllt ({filled * 100 // total} %)")
