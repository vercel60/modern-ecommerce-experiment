"use client";

import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, type Ref } from "react";
import { gsap } from "gsap";
import { CARD_POSES, MOTION, poseAt } from "@/config/motion";
import { findVariant } from "@/lib/catalog";
import type { Category, Product } from "@/types/catalog";
import styles from "./Carousel.module.css";

const MIN_SLOTS = 9;

export interface CarouselHandle {
  /** Move by whole cards; returns the product that ends up on the model. */
  step(by: number): Product;
  /** Bring a product to the centre by the shortest way round. */
  goTo(productId: string): void;
  /** Free dragging, measured in cards. */
  drag(delta: number): void;
  /** Snap after a drag; returns the product that ends up on the model. */
  settle(velocity: number): Product;
  /** Play the exit animation. */
  exit(): Promise<void>;
}

interface Props {
  ref: Ref<CarouselHandle>;
  category: Category;
  centerId: string;
  variants: Record<string, string>;
  ready: boolean;
  reducedMotion: boolean;
  onPick: (product: Product) => void;
  onHover: (product: Product) => void;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

export function Carousel({ ref, category, centerId, variants, ready, reducedMotion, onPick, onHover }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const inners = useRef<(HTMLSpanElement | null)[]>([]);
  const motion = useRef({ pos: 0 });
  const dragFrom = useRef<number | null>(null);

  const { products } = category;
  const slots = useMemo(() => {
    const copies = Math.ceil(MIN_SLOTS / products.length);
    return Array.from({ length: copies * products.length }, (_, i) => products[i % products.length]);
  }, [products]);

  const distance = useCallback(
    (i: number) => {
      const n = slots.length;
      return mod(i - motion.current.pos + n / 2, n) - n / 2;
    },
    [slots.length],
  );

  const layout = useCallback(() => {
    const el = root.current;
    if (!el) return;
    const width = el.clientWidth;
    const poses = CARD_POSES[width / el.clientHeight < 0.8 ? "narrow" : "wide"];
    for (let i = 0; i < slots.length; i++) {
      const card = cards.current[i];
      if (!card) continue;
      const d = distance(i);
      const abs = Math.abs(d);
      const side = Math.sign(d);
      const pose = poseAt(poses, abs);
      card.style.transform = `translate3d(${side * pose.x * width}px,0,0) rotateY(${-side * pose.rotate}deg) scale(${pose.scale})`;
      card.style.opacity = String(pose.opacity);
      card.style.zIndex = String(20 - Math.round(abs * 2));
      const hit = abs > 0.5 && pose.opacity > 0.3;
      card.style.pointerEvents = hit ? "auto" : "none";
      card.tabIndex = hit ? 0 : -1;
      card.dataset.side = side < 0 ? "left" : "right";
    }
  }, [distance, slots.length]);

  const animateTo = useCallback(
    (target: number) => {
      const { duration, perSlot, ease } = MOTION.carousel;
      const span = Math.abs(target - motion.current.pos);
      gsap.to(motion.current, {
        pos: target,
        duration: reducedMotion ? 0 : duration + Math.max(span - 1, 0) * perSlot,
        ease,
        overwrite: true,
        onUpdate: layout,
        onComplete: layout,
      });
      return products[mod(Math.round(target), products.length)];
    },
    [layout, products, reducedMotion],
  );

  // New category: jump to its worn product, then let the cards fade in from the centre out.
  const centerRef = useRef(centerId);
  useLayoutEffect(() => {
    centerRef.current = centerId;
  }, [centerId]);
  useLayoutEffect(() => {
    gsap.killTweensOf(motion.current);
    motion.current.pos = Math.max(products.findIndex((p) => p.id === centerRef.current), 0);
    layout();
    if (!ready) return;
    const targets = inners.current.slice(0, slots.length).filter((el) => el !== null);
    const tween = gsap.fromTo(
      targets,
      { autoAlpha: 0, filter: "blur(10px)", y: 14 },
      {
        autoAlpha: 1,
        filter: "blur(0px)",
        y: 0,
        duration: reducedMotion ? 0 : MOTION.category.enter,
        delay: (i) => (reducedMotion ? 0 : Math.abs(distance(i)) * MOTION.category.enterStagger),
        ease: "power2.out",
        clearProps: "filter,transform",
      },
    );
    return () => void tween.kill();
  }, [products, slots.length, ready, reducedMotion, layout, distance]);

  useEffect(() => {
    const observer = new ResizeObserver(layout);
    observer.observe(root.current!);
    const state = motion.current;
    return () => {
      observer.disconnect();
      gsap.killTweensOf(state);
    };
  }, [layout]);

  useImperativeHandle(
    ref,
    () => ({
      step: (by) => animateTo(Math.round(motion.current.pos) + by),
      goTo(productId) {
        const n = products.length;
        const here = Math.round(motion.current.pos);
        const raw = mod(products.findIndex((p) => p.id === productId) - here, n);
        animateTo(here + (raw > n / 2 ? raw - n : raw));
      },
      drag(delta) {
        gsap.killTweensOf(motion.current);
        dragFrom.current ??= motion.current.pos;
        motion.current.pos = dragFrom.current - delta;
        layout();
      },
      settle(velocity) {
        const start = dragFrom.current ?? motion.current.pos;
        dragFrom.current = null;
        let target = Math.round(motion.current.pos - velocity * 0.18);
        target = Math.min(Math.max(target, Math.round(start) - 3), Math.round(start) + 3);
        return animateTo(target);
      },
      exit: () =>
        new Promise((resolve) => {
          const targets = inners.current.slice(0, slots.length).filter((el) => el !== null);
          if (reducedMotion) return resolve();
          gsap.to(targets, {
            autoAlpha: 0,
            filter: "blur(8px)",
            y: -8,
            duration: MOTION.category.exit,
            delay: (i) => Math.abs(distance(i)) * MOTION.category.exitStagger,
            ease: "power1.in",
            overwrite: true,
            onComplete: resolve,
            onInterrupt: resolve,
          });
        }),
    }),
    [animateTo, distance, layout, products, reducedMotion, slots.length],
  );

  return (
    <div ref={root} className={styles.row}>
      {slots.map((product, i) => {
        const variant = findVariant(product, variants[product.id]);
        return (
          <button
            key={`${category.id}-${i}`}
            ref={(el) => {
              cards.current[i] = el;
            }}
            type="button"
            className={styles.card}
            data-cursor="try"
            aria-label={`Try on ${product.name}`}
            onPointerEnter={() => onHover(product)}
            onClick={() => {
              animateTo(Math.round(motion.current.pos) + Math.round(distance(i)));
              onPick(product);
            }}
          >
            <span
              ref={(el) => {
                inners.current[i] = el;
              }}
              className={styles.inner}
            >
              <span className={styles.glass} />
              {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP, moved every frame */}
              <img className={styles.cutout} src={variant.cutout} alt="" draggable={false} width={720} height={720} />
              <span className={styles.name}>{product.name}</span>
              <span className={styles.tagline}>{product.tagline}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
