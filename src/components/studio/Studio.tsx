"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { MOTION } from "@/config/motion";
import { findCategory, findProduct, findVariant, layerUrl, outfitLayers } from "@/lib/catalog";
import type { CameraPose, Catalog, Category, Outfit, Product, Slot } from "@/types/catalog";
import { Carousel, type CarouselHandle } from "./Carousel";
import { CategoryNav } from "./CategoryNav";
import { Figure, type FigureHandle } from "./Figure";
import { ArrowIcon } from "./icons";
import { ProductBar } from "./ProductBar";
import { StageCursor } from "./StageCursor";
import { ToolRail } from "./ToolRail";
import { useReducedMotion } from "./useReducedMotion";
import styles from "./Studio.module.css";

const FULL_LOOK: CameraPose = { body: 0.78, head: 0.11 };
const DRAG_THRESHOLD = 6;

function initialVariants(catalog: Catalog): Record<string, string> {
  const map: Record<string, string> = {};
  for (const category of catalog.categories)
    for (const product of category.products) map[product.id] = product.variants[0].id;
  for (const worn of Object.values(catalog.initialOutfit)) map[worn.productId] = worn.variantId;
  return map;
}

/** Product the carousel of a category is centred on. */
function centerOf(category: Category, outfit: Outfit): string {
  return outfit[category.id]?.productId ?? category.featuredId;
}

export function Studio({ catalog }: { catalog: Catalog }) {
  const reducedMotion = useReducedMotion();
  const stage = useRef<HTMLElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const wordmark = useRef<HTMLDivElement>(null);
  const cardsLayer = useRef<HTMLDivElement>(null);
  const figureLayer = useRef<HTMLDivElement>(null);
  const carousel = useRef<CarouselHandle>(null);
  const figure = useRef<FigureHandle>(null);

  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<Slot>(catalog.initialCategory);
  // Lags behind `active` while the old cards play their exit.
  const [shown, setShown] = useState<Slot>(catalog.initialCategory);
  // `outfit` drives the UI; `live` is the source of truth between delayed updates.
  const [outfit, setOutfit] = useState<Outfit>(catalog.initialOutfit);
  const live = useRef<Outfit>(catalog.initialOutfit);
  const [variants, setVariants] = useState(() => initialVariants(catalog));
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [fullLook, setFullLook] = useState(false);
  const visited = useRef(new Set<Slot>([catalog.initialCategory]));
  const barTimer = useRef(0);
  const switchToken = useRef(0);

  const activeCategory = findCategory(catalog, active);
  const shownCategory = findCategory(catalog, shown);
  const barProduct = findProduct(activeCategory, centerOf(activeCategory, outfit));
  const barVariant = variants[barProduct.id];
  const initialLayers = useMemo(() => outfitLayers(catalog, catalog.initialOutfit), [catalog]);

  /** Dress the model: the picture scans after `scanDelay`, the UI updates after `barDelay`. */
  const wear = useCallback(
    (next: Outfit, scanDelay: number, barDelay: number) => {
      live.current = next;
      figure.current?.scan(outfitLayers(catalog, next), scanDelay);
      window.clearTimeout(barTimer.current);
      barTimer.current = window.setTimeout(() => setOutfit(next), reducedMotion ? 0 : barDelay * 1000);
    },
    [catalog, reducedMotion],
  );

  const tryOn = useCallback(
    (slot: Slot, product: Product) => {
      const variantId = findVariant(product, variants[product.id]).id;
      const worn = live.current[slot];
      if (worn?.productId === product.id && worn.variantId === variantId) return;
      wear({ ...live.current, [slot]: { productId: product.id, variantId } }, MOTION.scan.delay, MOTION.barDelay);
    },
    [variants, wear],
  );

  const selectCategory = useCallback(
    async (id: Slot) => {
      if (id === active) return;
      const token = ++switchToken.current;
      const category = findCategory(catalog, id);
      setActive(id);
      setFullLook(false);
      // Opening a category for the first time tries on its featured product.
      if (!visited.current.has(id)) {
        visited.current.add(id);
        const product = findProduct(category, category.featuredId);
        const worn = { productId: product.id, variantId: findVariant(product, variants[product.id]).id };
        const same = live.current[id]?.productId === worn.productId && live.current[id]?.variantId === worn.variantId;
        if (!same) wear({ ...live.current, [id]: worn }, MOTION.category.scanDelay, 0);
      }
      await carousel.current?.exit();
      if (token === switchToken.current) setShown(id);
    },
    [active, catalog, variants, wear],
  );

  const step = useCallback(
    (by: number) => {
      const product = carousel.current?.step(by);
      if (product) tryOn(shown, product);
    },
    [shown, tryOn],
  );

  const selectVariant = (variantId: string) => {
    setVariants((v) => ({ ...v, [barProduct.id]: variantId }));
    wear({ ...live.current, [active]: { productId: barProduct.id, variantId } }, 0.05, 0);
  };

  const applyLook = (next: Outfit) => {
    setVariants((v) => {
      const merged = { ...v };
      for (const worn of Object.values(next)) merged[worn.productId] = worn.variantId;
      return merged;
    });
    carousel.current?.goTo(centerOf(shownCategory, next));
    wear(next, MOTION.scan.delay, MOTION.barDelay);
  };

  const shuffle = () => {
    const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
    const next: Outfit = {};
    for (const category of catalog.categories) {
      const others = category.products.filter((p) => p.id !== live.current[category.id]?.productId);
      const product = pick(others.length ? others : category.products);
      next[category.id] = { productId: product.id, variantId: pick(product.variants).id };
      visited.current.add(category.id);
    }
    applyLook(next);
  };

  const reset = () => {
    visited.current = new Set([active]);
    // Keep the open category dressed so its carousel stays centred on something worn.
    const fallback = catalog.initialOutfit[active] ?? live.current[active];
    applyLook(fallback ? { ...catalog.initialOutfit, [active]: fallback } : catalog.initialOutfit);
  };

  // Cards for the open category are the likeliest next try-on, so fetch them first.
  useEffect(() => {
    if (!ready) return;
    const urls = (category: Category) => category.products.flatMap((p) => p.variants.map((v) => v.layer));
    figure.current?.prefetch(urls(shownCategory));
    const timer = window.setTimeout(() => {
      for (const category of catalog.categories)
        figure.current?.prefetch([
          layerUrl(catalog, category.id, {
            productId: category.featuredId,
            variantId: findProduct(category, category.featuredId).variants[0].id,
          }),
        ]);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [ready, shownCategory, catalog]);

  // Decode the neighbouring cards while idle so the next scan never waits on an upload.
  useEffect(() => {
    if (!ready) return;
    const { products } = shownCategory;
    const center = products.findIndex((p) => p.id === centerOf(shownCategory, outfit));
    const timer = window.setTimeout(() => {
      const near = [1, -1].map((by) => products[(center + by + products.length) % products.length]);
      figure.current?.warm(near.map((p) => findVariant(p, variants[p.id]).layer));
    }, MOTION.scan.delay * 1000 + 1200);
    return () => window.clearTimeout(timer);
  }, [ready, shownCategory, outfit, variants]);

  useEffect(() => () => window.clearTimeout(barTimer.current), []);

  // Intro
  useEffect(() => {
    if (!ready) return;
    const tween = gsap.fromTo(
      wordmark.current,
      { autoAlpha: 0, letterSpacing: "0.14em" },
      { autoAlpha: 1, letterSpacing: "-0.03em", duration: reducedMotion ? 0 : MOTION.intro.fade * 1.4, ease: "power3.out" },
    );
    return () => void tween.kill();
  }, [ready, reducedMotion]);

  // Parallax
  useEffect(() => {
    if (reducedMotion) return;
    const { duration, backdrop: b, wordmark: w, cards: c, figure: f } = MOTION.parallax;
    const layers = ([[backdrop, b], [wordmark, w], [cardsLayer, -c], [figureLayer, -f]] as const).map(([ref, amount]) => ({
      amount,
      x: gsap.quickTo(ref.current, "x", { duration, ease: "power2.out" }),
      y: gsap.quickTo(ref.current, "y", { duration, ease: "power2.out" }),
    }));
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      for (const layer of layers) {
        layer.x(-nx * 2 * layer.amount);
        layer.y(-ny * layer.amount * 0.6);
      }
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [reducedMotion]);

  // Drag anywhere on the stage to spin the carousel.
  useEffect(() => {
    const el = stage.current!;
    let pointer: number | null = null;
    let startX = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;
    let dragging = false;
    const cardWidth = () => el.clientWidth * (el.clientWidth / el.clientHeight < 0.8 ? 0.3 : 0.17);

    const down = (e: PointerEvent) => {
      if (pointer !== null || e.button !== 0 || (e.target as Element).closest("[data-ui]")) return;
      pointer = e.pointerId;
      startX = lastX = e.clientX;
      lastT = e.timeStamp;
      velocity = 0;
      dragging = false;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      if (!dragging && Math.abs(e.clientX - startX) > DRAG_THRESHOLD) {
        dragging = true;
        el.setPointerCapture(e.pointerId);
      }
      if (!dragging) return;
      const dt = Math.max(e.timeStamp - lastT, 1);
      velocity = velocity * 0.6 + ((e.clientX - lastX) / dt) * 0.4;
      lastX = e.clientX;
      lastT = e.timeStamp;
      carousel.current?.drag((e.clientX - startX) / cardWidth());
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      pointer = null;
      if (!dragging) return;
      const held = e.timeStamp - lastT > 80;
      const product = carousel.current?.settle(held ? 0 : (velocity * 1000) / cardWidth());
      if (product) tryOn(shown, product);
      // Swallow the click that follows a drag.
      const swallow = (event: Event) => event.stopPropagation();
      el.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => el.removeEventListener("click", swallow, { capture: true }), 0);
    };
    let wheelLock = 0;
    const wheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (e.ctrlKey || Math.abs(delta) < 12 || e.timeStamp < wheelLock) return;
      wheelLock = e.timeStamp + 650;
      step(Math.sign(delta));
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: true });
    window.addEventListener("keydown", key);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", key);
    };
  }, [shown, step, tryOn]);

  return (
    <main ref={stage} className={styles.stage} data-ready={ready}>
      <h1 className="sr-only">{catalog.brand.name} virtual fitting room</h1>
      <div ref={backdrop} className={styles.backdrop}>
        <Image src={catalog.backdrop} alt="" fill preload sizes="106vw" draggable={false} />
      </div>
      <div ref={wordmark} className={styles.wordmark} aria-hidden="true">
        {catalog.brand.wordmark}
      </div>

      <div ref={cardsLayer} className={styles.layer}>
        <Carousel
          ref={carousel}
          category={shownCategory}
          centerId={centerOf(shownCategory, outfit)}
          variants={variants}
          ready={ready}
          reducedMotion={reducedMotion}
          onPick={(product) => tryOn(shown, product)}
          onHover={(product) => figure.current?.warm([findVariant(product, variants[product.id]).layer])}
        />
      </div>

      <div ref={figureLayer} className={styles.figure}>
        <Figure
          ref={figure}
          pose={fullLook ? FULL_LOOK : activeCategory.camera}
          initialLayers={initialLayers}
          label={catalog.model.alt}
          reducedMotion={reducedMotion}
          onReady={() => setReady(true)}
        />
      </div>

      <CategoryNav categories={catalog.categories} active={active} reducedMotion={reducedMotion} onSelect={selectCategory} />
      <ToolRail fullLook={fullLook} onFullLook={setFullLook} onShuffle={shuffle} onReset={reset} />
      <button type="button" className={styles.prev} aria-label="Previous product" data-ui data-cursor="none" onClick={() => step(-1)}>
        <ArrowIcon />
      </button>
      <button type="button" className={styles.next} aria-label="Next product" data-ui data-cursor="none" onClick={() => step(1)}>
        <ArrowIcon />
      </button>
      <ProductBar
        product={barProduct}
        variantId={barVariant}
        size={sizes[barProduct.id] ?? barProduct.sizes[1] ?? barProduct.sizes[0]}
        onSize={(size) => setSizes((s) => ({ ...s, [barProduct.id]: size }))}
        onVariant={selectVariant}
      />
      <StageCursor stage={stage} />
    </main>
  );
}
