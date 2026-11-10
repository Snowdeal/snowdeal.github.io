#!/usr/bin/env python3
"""아이콘·공유 이미지 생성 (한 번만 실행)."""
from PIL import Image, ImageDraw
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
def icon(n):
    im = Image.new("RGB", (n, n), "#0e7ccf"); d = ImageDraw.Draw(im); u = n / 100
    d.polygon([(12*u, 76*u), (40*u, 30*u), (55*u, 54*u), (66*u, 40*u), (88*u, 76*u)], fill="#ffffff")
    d.polygon([(40*u, 30*u), (33*u, 42*u), (40*u, 47*u), (47*u, 41*u)], fill="#cfe9fb")
    d.ellipse([(68*u, 16*u), (82*u, 30*u)], fill="#fff3c4")
    return im
icon(192).save(ROOT / "icon-192.png"); icon(512).save(ROOT / "icon-512.png")
og = Image.new("RGB", (1200, 630), "#dceffc"); og.paste(icon(360), (420, 135)); og.save(ROOT / "og.png")
