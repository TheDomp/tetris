"""Generates the PWA / iOS home-screen icons (pure standard library, no Pillow).

Design rules:
  * Full-bleed square, fully opaque. iOS applies its own rounded mask and fills any
    transparency with black; maskable PWA icons also need the full square.
  * Artwork stays inside the central ~70% (maskable safe zone is the central 80%).
  * 2x2 supersampling for smooth block edges.
"""
import zlib
import struct
import math

SS = 2  # supersampling factor per axis


def write_png(width, height, rows, filename):
    raw = bytearray()
    for row in rows:
        raw.append(0)  # filter: None
        raw.extend(row)
    comp = zlib.compress(bytes(raw), 9)

    def chunk(tag, data):
        return (struct.pack('>I', len(data)) + tag + data +
                struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))  # RGB, opaque
    png += chunk(b'IDAT', comp)
    png += chunk(b'IEND', b'')
    with open(filename, 'wb') as f:
        f.write(png)
    print(f'Generated {filename} ({width}x{height})')


# 4x4 composition, (col, row) cells, centred on the canvas
BS = 0.17          # block size (fraction of canvas)
ORIGIN = 0.5 - 2 * BS
PIECES = [
    # cells,                                   (light,           main,            dark)
    ([(2, 0), (3, 0), (2, 1), (3, 1)],         ((255, 255, 170), (255, 214, 0),   (200, 150, 0))),    # O
    ([(1, 1), (0, 2), (1, 2), (2, 2)],         ((240, 130, 255), (200, 30, 245),  (130, 0, 175))),    # T
    ([(0, 3), (1, 3), (2, 3), (3, 3)],         ((170, 255, 255), (0, 230, 255),   (0, 150, 190))),    # I
]
GAP = 0.06  # fraction of a block left as grout between blocks


def block_color(nx, ny):
    for cells, (light, main, dark) in PIECES:
        for cx, cy in cells:
            x0 = ORIGIN + cx * BS
            y0 = ORIGIN + cy * BS
            pad = BS * GAP / 2
            if x0 + pad <= nx < x0 + BS - pad and y0 + pad <= ny < y0 + BS - pad:
                ex = (nx - x0 - pad) / (BS - 2 * pad)
                ey = (ny - y0 - pad) / (BS - 2 * pad)
                if ey < 0.13 or ex < 0.13:
                    return light
                if ey > 0.87 or ex > 0.87:
                    return dark
                return main
    return None


def sample(nx, ny):
    c = block_color(nx, ny)
    if c:
        return c
    # Background: deep navy radial gradient + faint grid + soft glow behind the stack
    dx, dy = nx - 0.5, ny - 0.5
    dist = math.hypot(dx, dy)
    base = max(8, int(26 - dist * 30))
    r, g, b = base, base + 2, base + 14
    gx, gy = (nx * 8) % 1.0, (ny * 8) % 1.0
    if gx < 0.025 or gy < 0.025:
        r, g, b = r + 8, g + 10, b + 20
    glow = max(0.0, 1.0 - dist / 0.5)
    r += int(34 * glow * glow)
    g += int(16 * glow * glow)
    b += int(60 * glow * glow)
    return (min(r, 255), min(g, 255), min(b, 255))


def render(size, filename):
    rows = []
    n = SS * SS
    for y in range(size):
        row = bytearray()
        for x in range(size):
            r = g = b = 0
            for sy in range(SS):
                for sx in range(SS):
                    pr, pg, pb = sample((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size)
                    r += pr
                    g += pg
                    b += pb
            row.extend((r // n, g // n, b // n))
        rows.append(row)
    write_png(size, size, rows, filename)


if __name__ == '__main__':
    render(192, 'icon-192.png')
    render(512, 'icon-512.png')
    render(180, 'apple-touch-icon.png')
