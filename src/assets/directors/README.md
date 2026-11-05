# Director portraits

Place the original photographs here, named exactly:

| Director | File |
| --- | --- |
| Muthusamy Sengottuvel Arun Sanjeev | `muthusamy-sengottuvel-arun-sanjeev.jpg` (or `.png`) |
| Lakshmanan Kavitha | `lakshmanan-kavitha.jpg` (or `.png`) |

Then run `npm run images`. The script writes web-ready AVIF/WebP versions to
`public/images/directors/` and updates `src/content/generated/portraits.json`.

Retouching is deliberately non-generative: crop, exposure, white balance,
edge falloff and light sharpening only. Faces, features and skin tone are
never altered. Per-portrait settings live in `scripts/portraits.config.mjs`.
