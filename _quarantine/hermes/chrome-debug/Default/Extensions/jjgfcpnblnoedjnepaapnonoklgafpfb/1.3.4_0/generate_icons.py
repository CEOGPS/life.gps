#!/usr/bin/env python3
"""Generates icon16.png, icon48.png, icon128.png without external deps."""
import struct, zlib, math, os

def png(width, height, pixels):
    def chunk(name, data):
        c = name + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    raw = b''
    for row in pixels:
        raw += b'\x00'
        for r, g, b, a in row:
            raw += bytes([r, g, b, a])

    return (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(raw, 9))
        + chunk(b'IEND', b'')
    )

def make_icon(size):
    s = size
    cx = cy = s / 2 - 0.5
    outer_r = s / 2 - 0.5
    pixels = []

    for y in range(s):
        row = []
        for x in range(s):
            dx, dy = x - cx, y - cy
            dist = math.hypot(dx, dy)

            # Anti-aliased outer circle edge
            aa = max(0.0, min(1.0, outer_r - dist + 0.5))
            if aa == 0:
                row.append((0, 0, 0, 0))
                continue

            # Background: deep navy
            bg = (22, 27, 58)

            # Moon crescent: a filled circle offset slightly
            m_cx = cx + outer_r * 0.08
            m_cy = cy - outer_r * 0.04
            m_r   = outer_r * 0.52

            # Shadow circle that carves the crescent
            sh_cx = cx + outer_r * 0.44
            sh_cy = cy - outer_r * 0.06
            sh_r  = outer_r * 0.43

            moon_d   = math.hypot(x - m_cx,  y - m_cy)
            shadow_d = math.hypot(x - sh_cx, y - sh_cy)

            in_moon   = moon_d   <= m_r  + 0.5
            in_shadow = shadow_d <= sh_r - 0.5

            moon_aa = max(0.0, min(1.0, m_r - moon_d + 0.5)) if in_moon else 0.0

            if in_moon and not in_shadow and moon_aa > 0:
                # Warm yellow moon
                mr, mg, mb = 255, 220, 80
                alpha_moon = moon_aa * aa
                # Blend moon over background
                t = alpha_moon
                r = int(bg[0] * (1 - t) + mr * t)
                g = int(bg[1] * (1 - t) + mg * t)
                b = int(bg[2] * (1 - t) + mb * t)
                a = int(255 * aa)
            else:
                r, g, b = bg
                a = int(255 * aa)

            row.append((r, g, b, a))
        pixels.append(row)

    return png(s, s, pixels)

os.makedirs('icons', exist_ok=True)
for size in (16, 48, 128):
    data = make_icon(size)
    path = f'icons/icon{size}.png'
    with open(path, 'wb') as f:
        f.write(data)
    print(f'Created {path} ({len(data)} bytes)')
