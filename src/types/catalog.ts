export type Slot = "bottom" | "outerwear" | "shoes" | "accessory";

/** One colourway. Both images are required to sell and to "try on" the item. */
export interface Variant {
  id: string;
  label: string;
  /** CSS colours for the swatch dot (first one fills it, others split it). */
  swatch: string[];
  /** Transparent product cut-out shown on the carousel card. */
  cutout: string;
  /** Transparent 1080x1800 layer, pixel-aligned with the model's body image. */
  layer: string;
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  sizes: string[];
  variants: Variant[];
}

/** Where the model sits in the frame, as fractions of the stage height. */
export interface CameraPose {
  /** Head-to-toe height of the model. */
  body: number;
  /** Distance from the top of the stage to the top of the head. */
  head: number;
}

export interface Category {
  id: Slot;
  label: string;
  camera: CameraPose;
  /** Product that is tried on the first time the category is opened. */
  featuredId: string;
  products: Product[];
}

export interface WornItem {
  productId: string;
  variantId: string;
}

export type Outfit = Partial<Record<Slot, WornItem>>;

export interface Catalog {
  brand: { name: string; wordmark: string };
  /** Backdrop image behind the whole stage. */
  backdrop: string;
  model: { body: string; alt: string };
  initialCategory: Slot;
  initialOutfit: Outfit;
  categories: Category[];
}
