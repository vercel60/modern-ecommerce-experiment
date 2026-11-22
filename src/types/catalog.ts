export type Gender = "female" | "male";

export type Slot = "bottom" | "outerwear" | "shoes" | "accessory";

/** One colourway. Both images are required to sell and to "try on" the item. */
export interface Variant {
  id: string;
  label: string;
  /** CSS colours for the swatch dot (first one fills it, others split it). */
  swatch: string[];
  /** Transparent product cut-out shown on the carousel card. */
  cutout: string;
  /** Transparent 1080x1800 layer, pixel-aligned with the avatar's body image. */
  layer: string;
}

export interface Product {
  /** Unique across the whole catalogue. */
  id: string;
  /** Avatar this product is cut for. */
  gender: Gender;
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
  products: Product[];
}

export interface WornItem {
  productId: string;
  variantId: string;
}

export type Outfit = Partial<Record<Slot, WornItem>>;

export interface Avatar {
  id: Gender;
  label: string;
  /** Transparent 1080x1800 image of the undressed model. */
  body: string;
  alt: string;
  initialOutfit: Outfit;
  /** Product tried on the first time each category is opened. */
  featured: Partial<Record<Slot, string>>;
}

export interface Catalog {
  brand: { name: string; wordmark: string };
  /** Backdrop image behind the whole stage. */
  backdrop: string;
  initialAvatar: Gender;
  initialCategory: Slot;
  avatars: Avatar[];
  categories: Category[];
}

/** A category narrowed down to the products of one avatar. */
export interface WardrobeCategory extends Category {
  featuredId: string;
}

/** Everything one avatar can wear. */
export interface Wardrobe {
  avatar: Avatar;
  categories: WardrobeCategory[];
}
