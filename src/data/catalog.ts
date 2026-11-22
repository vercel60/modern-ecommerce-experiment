import type { Catalog, Gender, Product, Slot, Variant } from "@/types/catalog";

const APPAREL = ["XS", "S", "M", "L"];
const FOOTWEAR = ["38", "39", "40", "41"];
const ONE_SIZE = ["S", "M", "L"];
const APPAREL_M = ["S", "M", "L", "XL"];
const WAIST = ["30", "32", "34", "36"];
const FOOTWEAR_M = ["41", "42", "43", "44"];

type VariantSeed = [id: string, label: string, ...swatch: string[]];

function product(
  gender: Gender,
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
    layer: `/assets/figure/${gender}/${slot}/${id}-${variant}.webp`,
  }));
  return { id, gender, name, tagline, sizes, variants };
}

/**
 * Static catalogue. Replace `getCatalog` in src/lib/getCatalog.ts with an API or
 * CMS call that returns this same shape and the UI needs no changes.
 */
export const catalog: Catalog = {
  brand: { name: "AkaarIT", wordmark: "AKAAR IT" },
  backdrop: "/assets/room.webp",
  initialAvatar: "female",
  initialCategory: "outerwear",
  avatars: [
    {
      id: "female",
      label: "Female",
      body: "/assets/figure/female/body.webp",
      alt: "Female model wearing the selected outfit",
      initialOutfit: {
        bottom: { productId: "taper-trek-pant", variantId: "graphite" },
        outerwear: { productId: "down-hooded-jacket", variantId: "cobalt" },
        shoes: { productId: "court-mid", variantId: "black" },
      },
      featured: {
        bottom: "taper-trek-pant",
        outerwear: "down-hooded-jacket",
        shoes: "strap-runner",
        accessory: "hard-shell-carry-on",
      },
    },
    {
      id: "male",
      label: "Male",
      body: "/assets/figure/male/body.webp",
      alt: "Male model wearing the selected outfit",
      initialOutfit: {
        bottom: { productId: "straight-chino", variantId: "khaki" },
        outerwear: { productId: "colour-block-puffer", variantId: "lava" },
        shoes: { productId: "clean-low", variantId: "white" },
      },
      featured: {
        bottom: "straight-chino",
        outerwear: "colour-block-puffer",
        shoes: "trail-boot",
        accessory: "leather-briefcase",
      },
    },
  ],
  categories: [
    {
      id: "bottom",
      label: "Bottoms",
      camera: { body: 0.77, head: 0.11 },
      products: [
        product("female", "bottom", "taper-trek-pant", "Taper Trek Pant", "Stretch, quick-dry", APPAREL, [
          ["graphite", "Graphite", "#3b3a3c"],
          ["sand", "Sand", "#b5a58c"],
          ["navy", "Navy", "#28344e"],
        ]),
        product("female", "bottom", "utility-cargo", "Utility Cargo", "Ripstop, side pockets", APPAREL, [
          ["olive", "Olive", "#5c6048"],
          ["stone", "Stone", "#a49c8e"],
          ["black", "Black", "#2b2b2d"],
        ]),
        product("female", "bottom", "wide-leg-trouser", "Wide Leg Trouser", "Pressed crease, fluid", APPAREL, [
          ["ecru", "Ecru", "#d8cfbd"],
          ["charcoal", "Charcoal", "#444347"],
          ["clay", "Clay", "#a5674c"],
        ]),
        product("male", "bottom", "straight-chino", "Straight Chino", "Cotton twill, pressed", WAIST, [
          ["khaki", "Khaki", "#b09a74"],
          ["ink", "Ink", "#2a3247"],
          ["stone", "Stone", "#9b968c"],
        ]),
        product("male", "bottom", "tech-jogger", "Tech Jogger", "Ribbed cuff, drawcord", APPAREL_M, [
          ["black", "Black", "#2b2c30"],
          ["slate", "Slate", "#59616d"],
          ["olive", "Olive", "#55583f"],
        ]),
        product("male", "bottom", "relaxed-denim", "Relaxed Denim", "Turned cuff, mid wash", WAIST, [
          ["indigo", "Indigo", "#2e4468"],
          ["washed", "Washed", "#7f9bbd"],
          ["black", "Black", "#333437"],
        ]),
      ],
    },
    {
      id: "outerwear",
      label: "Outerwear",
      camera: { body: 0.86, head: 0.22 },
      products: [
        product("female", "outerwear", "down-hooded-jacket", "Down Hooded Jacket", "Warm, packable", APPAREL, [
          ["cobalt", "Cobalt", "#1450d8"],
          ["violet", "Violet", "#5c2fc4"],
          ["black", "Black", "#2a2a2e"],
        ]),
        product("female", "outerwear", "storm-shell-jacket", "Storm Shell Jacket", "Waterproof shell", APPAREL, [
          ["prism", "Prism", "#5b30c0", "#1a5fe0", "#d3e02a"],
          ["ember", "Ember", "#d8461f", "#33343b", "#f0b429"],
          ["moss", "Moss", "#4a6b4d", "#23352c", "#d9d2b4"],
        ]),
        product("female", "outerwear", "quilted-down-hoodie", "Quilted Down Hoodie", "Lightweight down", APPAREL, [
          ["violet", "Violet", "#6233cc"],
          ["cobalt", "Cobalt", "#1d56d6"],
          ["black", "Black", "#2c2c30"],
        ]),
        product("male", "outerwear", "colour-block-puffer", "Colour Block Puffer", "Boxy, stand collar", APPAREL_M, [
          ["lava", "Lava", "#e2571f", "#26282d"],
          ["ocean", "Ocean", "#2f8fd6", "#12306b"],
          ["forest", "Forest", "#c9b178", "#2f4a3a"],
        ]),
        product("male", "outerwear", "satin-bomber", "Satin Bomber", "Ribbed hem and cuffs", APPAREL_M, [
          ["sage", "Sage", "#5d6b52"],
          ["midnight", "Midnight", "#1d2740"],
          ["rust", "Rust", "#9a4a28"],
        ]),
        product("male", "outerwear", "field-parka", "Field Parka", "Waxed cotton, four pockets", APPAREL_M, [
          ["sand", "Sand", "#b39b70"],
          ["olive", "Olive", "#5a5d43"],
          ["black", "Black", "#2d2e31"],
        ]),
      ],
    },
    {
      id: "shoes",
      label: "Shoes",
      camera: { body: 0.755, head: 0.12 },
      products: [
        product("female", "shoes", "court-mid", "Court Mid", "Leather, padded collar", FOOTWEAR, [
          ["scarlet", "Scarlet", "#f1efea", "#d31f2f"],
          ["black", "Black", "#2d2d31"],
        ]),
        product("female", "shoes", "iridescent-low", "Iridescent Low", "Colour-shift leather", FOOTWEAR, [
          ["spectrum", "Spectrum", "#23305a", "#57c9a0"],
          ["dusk", "Dusk", "#a06a8c", "#f0a35e"],
        ]),
        product("female", "shoes", "strap-runner", "Strap Runner", "Cushioned court sole", FOOTWEAR, [
          ["mist", "Mist", "#c9c8c6", "#ef6f86"],
          ["mint", "Mint", "#bfe3d4", "#2f7f6b"],
          ["coral", "Coral", "#f0b6a8", "#e0523f"],
        ]),
        product("male", "shoes", "trail-boot", "Trail Boot", "Lugged sole, padded ankle", FOOTWEAR_M, [
          ["tan", "Tan", "#a8743f", "#5b3a20"],
          ["black", "Black", "#2e2f32"],
        ]),
        product("male", "shoes", "retro-runner", "Retro Runner", "Mesh and suede", FOOTWEAR_M, [
          ["navy", "Navy", "#e9e6df", "#1f3a7a"],
          ["green", "Green", "#e9e6df", "#1f6b47"],
          ["orange", "Orange", "#3a3f48", "#e8692a"],
        ]),
        product("male", "shoes", "clean-low", "Clean Low", "Minimal leather", FOOTWEAR_M, [
          ["white", "White", "#f1f0ec", "#b98a5a"],
          ["black", "Black", "#2b2c2f"],
        ]),
      ],
    },
    {
      id: "accessory",
      label: "Accessories",
      camera: { body: 0.83, head: 0.17 },
      products: [
        product("female", "accessory", "leather-barrel-bag", "Leather Barrel Bag", "Shoulder or hand carry", ONE_SIZE, [
          ["red", "Red", "#cf1526"],
          ["tan", "Tan", "#a8703f"],
        ]),
        product("female", "accessory", "quilted-bucket-bag", "Quilted Bucket Bag", "Padded, drawstring", ONE_SIZE, [
          ["ivory", "Ivory", "#e6dfd0"],
          ["black", "Black", "#2b2b2d"],
        ]),
        product("female", "accessory", "hard-shell-carry-on", "Hard-Shell Carry-On", "Cabin size, spinner", ONE_SIZE, [
          ["red", "Red", "#cf1526"],
          ["graphite", "Graphite", "#3a3c41"],
        ]),
        product("male", "accessory", "leather-briefcase", "Leather Briefcase", "Full grain, twin buckle", ONE_SIZE, [
          ["cognac", "Cognac", "#8f5529"],
          ["black", "Black", "#2c2c2e"],
        ]),
        product("male", "accessory", "canvas-duffel", "Canvas Duffel", "Weekender, leather trim", ONE_SIZE, [
          ["olive", "Olive", "#656a4c", "#4b3524"],
          ["navy", "Navy", "#2b3a57", "#5a3a22"],
        ]),
        product("male", "accessory", "alloy-carry-on", "Alloy Carry-On", "Ribbed shell, spinner", ONE_SIZE, [
          ["silver", "Silver", "#b4b9be"],
          ["gunmetal", "Gunmetal", "#565b63"],
        ]),
      ],
    },
  ],
};
