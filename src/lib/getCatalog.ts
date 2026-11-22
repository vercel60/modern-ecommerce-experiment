import { catalog } from "@/data/catalog";
import type { Catalog } from "@/types/catalog";

/** Single entry point for product data. Swap the body for a fetch() to go dynamic. */
export async function getCatalog(): Promise<Catalog> {
  "use cache";
  return catalog;
}
