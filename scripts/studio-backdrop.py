"""
Places a portrait subject on a clean studio backdrop, for photos taken against
busy surroundings. Non-generative: the subject's own pixels are kept (only a
gentle exposure lift); the background is separated by matting and replaced
with a soft porcelain sweep that matches the site's other portraits.

    pip install "rembg[cpu]"
    python scripts/studio-backdrop.py original.png src/assets/directors/<slug>.jpg \
        --crop 118,440,490,612 --scale 2.2 --brightness 1.1

Then run `npm run images` as usual.
"""
import argparse

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from scipy import ndimage
from rembg import new_session, remove


def studio_sweep(width: int, height: int) -> Image.Image:
    """Porcelain centre behind the head, falling off to light silver at the edges."""
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float32)
    d = np.sqrt(((xx - 0.5 * width) / (0.78 * width)) ** 2 + ((yy - 0.3 * height) / (0.95 * height)) ** 2)
    t = np.clip(d, 0, 1) ** 1.5
    inner = np.array([247, 247, 245], np.float32)
    outer = np.array([214, 216, 219], np.float32)
    img = inner * (1 - t[..., None]) + outer * t[..., None]
    img *= (1 - 0.05 * (yy / height))[..., None]  # a touch darker towards the floor
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB")


def clean_matte(alpha: Image.Image) -> Image.Image:
    """
    Remove matting leftovers: near-transparent haze, thin attachments (cables,
    grille edges) and stray islands, keeping only the subject; then feather the
    edge slightly so compression blockiness in the source does not show.
    """
    a = np.asarray(alpha, np.float32)
    a[a < 40] = 0
    solid = ndimage.binary_opening(a > 0, iterations=2)
    labels, count = ndimage.label(solid)
    if count > 1:
        sizes = ndimage.sum(solid, labels, range(1, count + 1))
        solid = labels == (1 + int(np.argmax(sizes)))
    a *= ndimage.binary_dilation(solid, iterations=1)
    return Image.fromarray(a.astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(radius=0.9))


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("input")
    p.add_argument("output")
    p.add_argument("--crop", required=True, help="x,y,width,height in source pixels")
    p.add_argument("--scale", type=float, default=1.0, help="Lanczos resize after cropping")
    p.add_argument("--brightness", type=float, default=1.0)
    p.add_argument("--model", default="isnet-general-use")
    a = p.parse_args()

    source = Image.open(a.input).convert("RGB")
    cut = remove(
        source,
        session=new_session(a.model),
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=12,
        alpha_matting_erode_size=8,
    )  # RGBA; edge colours are re-estimated, so the old background does not fringe

    x, y, w, h = (int(v) for v in a.crop.split(","))
    cut = cut.crop((x, y, x + w, y + h))
    if a.scale != 1:
        cut = cut.resize((round(w * a.scale), round(h * a.scale)), Image.LANCZOS)

    subject = ImageEnhance.Brightness(cut.convert("RGB")).enhance(a.brightness)
    alpha = clean_matte(cut.getchannel("A"))

    backdrop = studio_sweep(*subject.size)
    # Soft contact shadow so the subject sits in the space rather than on it.
    shadow = alpha.filter(ImageFilter.GaussianBlur(radius=max(6, subject.width // 45)))
    shadow = shadow.transform(shadow.size, Image.AFFINE, (1, 0, -subject.width * 0.012, 0, 1, -subject.height * 0.01))
    shade = np.asarray(shadow, np.float32)[..., None] / 255 * 0.16
    backdrop = Image.fromarray((np.asarray(backdrop, np.float32) * (1 - shade)).astype(np.uint8), "RGB")

    Image.composite(subject, backdrop, alpha).save(a.output, quality=95, subsampling=0)
    print(f"wrote {a.output} {subject.size[0]}x{subject.size[1]}")


if __name__ == "__main__":
    main()
