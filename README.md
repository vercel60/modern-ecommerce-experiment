# Akaar virtual fitting room

Next.js (App Router) + TypeScript, GSAP and a small WebGL2 renderer.

```bash
npm install
npm run dev
```

## Where things live

| Path | Purpose |
| --- | --- |
| `src/lib/getCatalog.ts` | The only data source. Replace its body with a `fetch()` to go dynamic |
| `src/types/catalog.ts` | Data contract an API or CMS has to return |
| `src/data/catalog.ts` | Static products, brand wordmark, camera poses |
| `src/config/motion.ts` | Every duration, easing and card pose |
| `src/lib/figure/` | Scan-effect shader and renderer |
| `src/components/studio/` | UI |

## Image contract

- **Model** `figure/body`: transparent, 1080x1800, head top at 5.2% and soles at 95% of the height.
- **Layer** (one per colourway): transparent, 1080x1800, same camera and pose as the model, containing only that garment.
  Layers stack in the order body, shoes, bottom, outerwear, accessory. Erase what the body hides (a hand over a handle, the neck in front of a hood).
- **Cut-out** (one per colourway): transparent, 720x720.

One layer per product is enough for every outfit combination.

## Placeholder images

Everything in `public/assets` is an original render made by `tools/asset-renderer`
(needs Google Chrome with a GPU):

```bash
node tools/asset-renderer/render.mjs              # all images
node tools/asset-renderer/render.mjs court-mid    # only matching names
```

The model's head is a photo cut-out, `tools/asset-renderer/head.webp` (transparent, 1080x1800, placed on
the model). Replace it and re-render `figure/body` and `figure/outerwear` to change the face.
