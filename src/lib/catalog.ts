import type { Catalog, Category, Outfit, Product, Slot, Variant, WornItem } from "@/types/catalog";

/** Back to front. The model's body is always drawn first. */
export const LAYER_ORDER: readonly Slot[] = ["shoes", "bottom", "outerwear", "accessory"];

export function findCategory(data: Catalog, id: Slot): Category {
  const category = data.categories.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown category "${id}"`);
  return category;
}

export function findProduct(category: Category, id: string): Product {
  const product = category.products.find((p) => p.id === id);
  if (!product) throw new Error(`Unknown product "${id}" in "${category.id}"`);
  return product;
}

export function findVariant(product: Product, id: string | undefined): Variant {
  return product.variants.find((v) => v.id === id) ?? product.variants[0];
}

export function layerUrl(data: Catalog, slot: Slot, worn: WornItem): string {
  return findVariant(findProduct(findCategory(data, slot), worn.productId), worn.variantId).layer;
}

/** Image stack that represents an outfit. */
export function outfitLayers(data: Catalog, outfit: Outfit): string[] {
  const layers = [data.model.body];
  for (const slot of LAYER_ORDER) {
    const worn = outfit[slot];
    if (worn) layers.push(layerUrl(data, slot, worn));
  }
  return layers;
}
