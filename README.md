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

## Avatars

`catalog.avatars` holds the female and male models. Every product has a `gender`, and `wardrobeFor()` in
`src/lib/catalog.ts` narrows the catalogue to one avatar: only its own products, and only categories it has
products for. Each avatar remembers its own outfit while the visitor switches back and forth.

## Image contract

- **Avatar** `figure/<gender>/body`: transparent, 1080x1800, head top at about 5% and soles at 95% of the height.
- **Layer** `figure/<gender>/<slot>/<product>-<variant>`: transparent, 1080x1800, same camera and pose as that
  avatar, containing only that garment. Layers stack in the order body, shoes, bottom, outerwear, accessory.
  Erase what the body hides (a hand over a handle, the neck in front of a hood).
- **Cut-out** `product/<product>-<variant>`: transparent, 720x720.

One layer per colourway is enough for every outfit combination. Layers do not fit the other avatar.

## Placeholder images

Everything in `public/assets` is an original render made by `tools/asset-renderer`
(needs Google Chrome with a GPU):

```bash
node tools/asset-renderer/render.mjs              # all images
node tools/asset-renderer/render.mjs court-mid    # only matching names
node tools/asset-renderer/render.mjs figure/male   # everything the male avatar wears
```
