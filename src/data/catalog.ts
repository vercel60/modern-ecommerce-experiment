import type { Catalog, Product, Slot, Variant } from "@/types/catalog";

const APPAREL = ["XS", "S", "M", "L"];
const FOOTWEAR = ["38", "39", "40", "41"];
const ONE_SIZE = ["S", "M", "L"];

type VariantSeed = [id: string, label: string, ...swatch: string[]];

function product(
  slot: Slot,
  id: string,
  name: string,
  tagline: string,
  sizes: string[],
  seeds: VariantSeed[],
): Product {
  const variants: Variant[] = seeds.map(([variant, label, ...swatch]) => ({
    id: variant,
    label,
    swatch,
    cutout: `/assets/product/${id}-${variant}.webp`,
    layer: `/assets/figure/${slot}/${id}-${variant}.webp`,
  }));
  return { id, name, tagline, sizes, variants };
}

/**
 * Static catalogue. Replace `getCatalog` in src/lib/getCatalog.ts with an API or
 * CMS call that returns this same shape and the UI needs no changes.
 */
export const catalog: Catalog = {
  brand: { name: "AkaarIT", wordmark: "AKAAR IT" },
  backdrop: "/assets/room.webp",
  model: { body: "/assets/figure/body.webp", alt: "Model wearing the selected outfit" },
  initialCategory: "outerwear",
  initialOutfit: {
    bottom: { productId: "taper-trek-pant", variantId: "graphite" },
    outerwear: { productId: "down-hooded-jacket", variantId: "cobalt" },
    shoes: { productId: "court-mid", variantId: "black" },
  },
  categories: [
    {
      id: "bottom",
      label: "Bottoms",
      camera: { body: 0.77, head: 0.11 },
      featuredId: "taper-trek-pant",
      products: [
        product("bottom", "taper-trek-pant", "Taper Trek Pant", "Stretch, quick-dry", APPAREL, [
          ["graphite", "Graphite", "#3b3a3c"],
          ["sand", "Sand", "#b5a58c"],
          ["navy", "Navy", "#28344e"],
        ]),
        product("bottom", "utility-cargo", "Utility Cargo", "Ripstop, side pockets", APPAREL, [
          ["olive", "Olive", "#5c6048"],
          ["stone", "Stone", "#a49c8e"],
          ["black", "Black", "#2b2b2d"],
        ]),
        product("bottom", "wide-leg-trouser", "Wide Leg Trouser", "Pressed crease, fluid", APPAREL, [
          ["ecru", "Ecru", "#d8cfbd"],
          ["charcoal", "Charcoal", "#444347"],
          ["clay", "Clay", "#a5674c"],
        ]),
      ],
    },
    {
      id: "outerwear",
      label: "Outerwear",
      camera: { body: 0.86, head: 0.22 },
      featuredId: "down-hooded-jacket",
      products: [
        product("outerwear", "down-hooded-jacket", "Down Hooded Jacket", "Warm, packable", APPAREL, [
          ["cobalt", "Cobalt", "#1450d8"],
          ["violet", "Violet", "#5c2fc4"],
          ["black", "Black", "#2a2a2e"],
        ]),
        product("outerwear", "storm-shell-jacket", "Storm Shell Jacket", "Waterproof shell", APPAREL, [
          ["prism", "Prism", "#5b30c0", "#1a5fe0", "#d3e02a"],
          ["ember", "Ember", "#d8461f", "#33343b", "#f0b429"],
          ["moss", "Moss", "#4a6b4d", "#23352c", "#d9d2b4"],
        ]),
        product("outerwear", "quilted-down-hoodie", "Quilted Down Hoodie", "Lightweight down", APPAREL, [
          ["violet", "Violet", "#6233cc"],
          ["cobalt", "Cobalt", "#1d56d6"],
          ["black", "Black", "#2c2c30"],
        ]),
      ],
    },
    {
      id: "shoes",
      label: "Shoes",
      camera: { body: 0.755, head: 0.12 },
      featuredId: "strap-runner",
      products: [
        product("shoes", "court-mid", "Court Mid", "Leather, padded collar", FOOTWEAR, [
          ["scarlet", "Scarlet", "#f1efea", "#d31f2f"],
          ["black", "Black", "#2d2d31"],
        ]),
        product("shoes", "iridescent-low", "Iridescent Low", "Colour-shift leather", FOOTWEAR, [
          ["spectrum", "Spectrum", "#23305a", "#57c9a0"],
          ["dusk", "Dusk", "#a06a8c", "#f0a35e"],
        ]),
        product("shoes", "strap-runner", "Strap Runner", "Cushioned court sole", FOOTWEAR, [
          ["mist", "Mist", "#c9c8c6", "#ef6f86"],
          ["mint", "Mint", "#bfe3d4", "#2f7f6b"],
          ["coral", "Coral", "#f0b6a8", "#e0523f"],
        ]),
      ],
    },
    {
      id: "accessory",
      label: "Accessories",
      camera: { body: 0.83, head: 0.17 },
      featuredId: "hard-shell-carry-on",
      products: [
        product("accessory", "leather-barrel-bag", "Leather Barrel Bag", "Shoulder or hand carry", ONE_SIZE, [
          ["red", "Red", "#cf1526"],
          ["tan", "Tan", "#a8703f"],
        ]),
        product("accessory", "quilted-bucket-bag", "Quilted Bucket Bag", "Padded, drawstring", ONE_SIZE, [
          ["ivory", "Ivory", "#e6dfd0"],
          ["black", "Black", "#2b2b2d"],
        ]),
        product("accessory", "hard-shell-carry-on", "Hard-Shell Carry-On", "Cabin size, spinner", ONE_SIZE, [
          ["red", "Red", "#cf1526"],
          ["graphite", "Graphite", "#3a3c41"],
        ]),
      ],
    },
  ],
};
