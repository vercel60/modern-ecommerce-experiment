import type { Catalog, Gender, Outfit, Product, Slot, Variant, Wardrobe, WardrobeCategory, WornItem } from "@/types/catalog";

/** Back to front. The avatar's body is always drawn first. */
export const LAYER_ORDER: readonly Slot[] = ["shoes", "bottom", "outerwear", "accessory"];

/** Filters the catalogue for one avatar. Categories with nothing to wear are left out. */
export function wardrobeFor(data: Catalog, gender: Gender): Wardrobe {
  const avatar = data.avatars.find((a) => a.id === gender);
  if (!avatar) throw new Error(`Unknown avatar "${gender}"`);
  const categories: WardrobeCategory[] = [];
  for (const category of data.categories) {
    const products = category.products.filter((p) => p.gender === gender);
    if (!products.length) continue;
    const featured = products.find((p) => p.id === avatar.featured[category.id]) ?? products[0];
    categories.push({ ...category, products, featuredId: featured.id });
  }
  return { avatar, categories };
}

export function findCategory(wardrobe: Wardrobe, id: Slot): WardrobeCategory {
  const category = wardrobe.categories.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown category "${id}" for "${wardrobe.avatar.id}"`);
  return category;
}

export function findProduct(category: WardrobeCategory, id: string): Product {
  const product = category.products.find((p) => p.id === id);
  if (!product) throw new Error(`Unknown product "${id}" in "${category.id}"`);
  return product;
}

export function findVariant(product: Product, id: string | undefined): Variant {
  return product.variants.find((v) => v.id === id) ?? product.variants[0];
}

export function layerUrl(wardrobe: Wardrobe, slot: Slot, worn: WornItem): string {
  return findVariant(findProduct(findCategory(wardrobe, slot), worn.productId), worn.variantId).layer;
}

/** Image stack that represents an outfit. */
export function outfitLayers(wardrobe: Wardrobe, outfit: Outfit): string[] {
  const layers = [wardrobe.avatar.body];
  for (const slot of LAYER_ORDER) {
    const worn = outfit[slot];
    if (worn) layers.push(layerUrl(wardrobe, slot, worn));
  }
  return layers;
}
