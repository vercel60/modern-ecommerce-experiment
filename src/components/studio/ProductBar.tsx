"use client";

import { findVariant } from "@/lib/catalog";
import type { Product } from "@/types/catalog";
import styles from "./ProductBar.module.css";

interface Props {
  product: Product;
  variantId: string | undefined;
  size: string;
  onSize: (size: string) => void;
  onVariant: (variantId: string) => void;
}

function swatch(colors: string[]): string {
  if (colors.length === 1) return colors[0];
  const step = 100 / colors.length;
  return `linear-gradient(135deg, ${colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(", ")})`;
}

export function ProductBar({ product, variantId, size, onSize, onVariant }: Props) {
  const variant = findVariant(product, variantId);
  return (
    <section className={styles.bar} aria-label="Selected product" data-ui data-cursor="none">
      <div key={product.id} className={styles.content}>
        <span className={styles.thumb}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={variant.id} src={variant.cutout} alt="" width={720} height={720} />
        </span>
        <div className={styles.text} aria-live="polite">
          <strong>{product.name}</strong>
          <span>{product.tagline}</span>
        </div>
        <div className={styles.group} role="group" aria-label="Size">
          <span className={styles.label}>Size</span>
          <div className={styles.options}>
            {product.sizes.map((s) => (
              <button key={s} type="button" className={styles.size} aria-pressed={s === size} onClick={() => onSize(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.group} role="group" aria-label="Colour">
          <span className={styles.label}>Colour</span>
          <div className={styles.options}>
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                className={styles.dot}
                style={{ background: swatch(v.swatch) }}
                aria-label={v.label}
                title={v.label}
                aria-pressed={v.id === variant.id}
                onClick={() => onVariant(v.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
