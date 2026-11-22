"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { MOTION } from "@/config/motion";
import { findCategory, findProduct, findVariant, layerUrl, outfitLayers, wardrobeFor } from "@/lib/catalog";
import type { CameraPose, Catalog, Gender, Outfit, Product, Slot, WardrobeCategory } from "@/types/catalog";
import { Carousel, type CarouselHandle } from "./Carousel";
import { Figure, type FigureHandle } from "./Figure";
import { ArrowIcon, FemaleIcon, MaleIcon } from "./icons";
import { ProductBar } from "./ProductBar";
import { Segmented } from "./Segmented";
import { StageCursor } from "./StageCursor";
import { ToolRail } from "./ToolRail";
import { useReducedMotion } from "./useReducedMotion";
import styles from "./Studio.module.css";

const FULL_LOOK: CameraPose = { body: 0.78, head: 0.11 };
const DRAG_THRESHOLD = 6;

const AVATAR_ICON = { female: <FemaleIcon />, male: <MaleIcon /> } satisfies Record<Gender, unknown>;

function initialVariants(catalog: Catalog): Record<string, string> {
  const map: Record<string, string> = {};
  for (const category of catalog.categories)
    for (const product of category.products) map[product.id] = product.variants[0].id;
  for (const avatar of catalog.avatars)
    for (const worn of Object.values(avatar.initialOutfit)) map[worn.productId] = worn.variantId;
  return map;
}

function perAvatar<T>(catalog: Catalog, make: (id: Gender) => T): Record<Gender, T> {
  return Object.fromEntries(catalog.avatars.map((a) => [a.id, make(a.id)])) as Record<Gender, T>;
}

const initialOutfits = (catalog: Catalog) =>
  perAvatar(catalog, (id) => catalog.avatars.find((a) => a.id === id)!.initialOutfit);

/** Product the carousel of a category is centred on. */
function centerOf(category: WardrobeCategory, outfit: Outfit): string {
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

  const wardrobes = useMemo(() => perAvatar(catalog, (id) => wardrobeFor(catalog, id)), [catalog]);
  const [ready, setReady] = useState(false);
  const [avatar, setAvatar] = useState<Gender>(catalog.initialAvatar);
  const [active, setActive] = useState<Slot>(catalog.initialCategory);
  // Lags behind `avatar` and `active` while the old cards play their exit.
  const [shown, setShown] = useState({ avatar: catalog.initialAvatar, slot: catalog.initialCategory });
  // Each avatar keeps its own outfit. `outfits` drives the UI; `live` is the source of truth between delayed updates.
  const [outfits, setOutfits] = useState(() => initialOutfits(catalog));
  const live = useRef(outfits);
  const [variants, setVariants] = useState(() => initialVariants(catalog));
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [fullLook, setFullLook] = useState(false);
  const visited = useRef(perAvatar(catalog, () => new Set<Slot>([catalog.initialCategory])));
  const barTimer = useRef(0);
  const switchToken = useRef(0);

  const wardrobe = wardrobes[avatar];
  const outfit = outfits[avatar];
  const avatarItems = useMemo(
    () => catalog.avatars.map(({ id, label }) => ({ id, label, icon: AVATAR_ICON[id] })),
    [catalog],
  );
  const activeCategory = findCategory(wardrobe, active);
  const shownCategory = findCategory(wardrobes[shown.avatar], shown.slot);
  const shownOutfit = outfits[shown.avatar];
  const barProduct = findProduct(activeCategory, centerOf(activeCategory, outfit));
  const barVariant = variants[barProduct.id];
  const initialLayers = useMemo(() => {
    const first = wardrobes[catalog.initialAvatar];
    return outfitLayers(first, first.avatar.initialOutfit);
  }, [catalog, wardrobes]);

  /** Dress an avatar: the picture scans after `scanDelay`, the UI updates after `barDelay`. */
  const wear = useCallback(
    (who: Gender, next: Outfit, scanDelay: number, barDelay: number) => {
      live.current = { ...live.current, [who]: next };
      figure.current?.scan(outfitLayers(wardrobes[who], next), scanDelay);
      window.clearTimeout(barTimer.current);
      if (reducedMotion || barDelay === 0) setOutfits(live.current);
      else barTimer.current = window.setTimeout(() => setOutfits(live.current), barDelay * 1000);
    },
    [wardrobes, reducedMotion],
  );

  const tryOn = useCallback(
    (product: Product, slot: Slot) => {
      const who = product.gender;
      if (who !== avatar) return; // a card of the previous avatar, still playing its exit
      const variantId = findVariant(product, variants[product.id]).id;
      const worn = live.current[who][slot];
      if (worn?.productId === product.id && worn.variantId === variantId) return;
      wear(who, { ...live.current[who], [slot]: { productId: product.id, variantId } }, MOTION.scan.delay, MOTION.barDelay);
    },
    [avatar, variants, wear],
  );

  /** Opening a category for the first time tries on its featured product. */
  const enter = useCallback(
    (who: Gender, slot: Slot): Outfit => {
      const current = live.current[who];
      if (visited.current[who].has(slot)) return current;
      visited.current[who].add(slot);
      const category = findCategory(wardrobes[who], slot);
      const product = findProduct(category, category.featuredId);
      const worn = { productId: product.id, variantId: findVariant(product, variants[product.id]).id };
      const same = current[slot]?.productId === worn.productId && current[slot]?.variantId === worn.variantId;
      return same ? current : { ...current, [slot]: worn };
    },
    [variants, wardrobes],
  );

  const showCards = useCallback(async (next: { avatar: Gender; slot: Slot }) => {
    const token = ++switchToken.current;
    await carousel.current?.exit();
    if (token === switchToken.current) setShown(next);
  }, []);

  const selectCategory = useCallback(
    (id: Slot) => {
      if (id === active) return;
      setActive(id);
      setFullLook(false);
      const next = enter(avatar, id);
      if (next !== live.current[avatar]) wear(avatar, next, MOTION.category.scanDelay, 0);
      void showCards({ avatar, slot: id });
    },
    [active, avatar, enter, showCards, wear],
  );

  /** Swap the whole model. Every category now lists that avatar's own products. */
  const selectAvatar = useCallback(
    (id: Gender) => {
      if (id === avatar) return;
      const slot = wardrobes[id].categories.some((c) => c.id === active) ? active : wardrobes[id].categories[0].id;
      setAvatar(id);
      setActive(slot);
      wear(id, enter(id, slot), MOTION.avatar.scanDelay, 0);
      void showCards({ avatar: id, slot });
    },
    [active, avatar, enter, showCards, wardrobes, wear],
  );

  const step = useCallback(
    (by: number) => {
      const product = carousel.current?.step(by);
      if (product) tryOn(product, shown.slot);
    },
    [shown, tryOn],
  );

  const selectVariant = (variantId: string) => {
    setVariants((v) => ({ ...v, [barProduct.id]: variantId }));
    wear(avatar, { ...live.current[avatar], [active]: { productId: barProduct.id, variantId } }, 0.05, 0);
  };

  const applyLook = (next: Outfit) => {
    setVariants((v) => {
      const merged = { ...v };
      for (const worn of Object.values(next)) merged[worn.productId] = worn.variantId;
      return merged;
    });
    carousel.current?.goTo(centerOf(shownCategory, next));
    wear(avatar, next, MOTION.scan.delay, MOTION.barDelay);
  };

  const shuffle = () => {
    const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
    const next: Outfit = {};
    for (const category of wardrobe.categories) {
      const others = category.products.filter((p) => p.id !== live.current[avatar][category.id]?.productId);
      const product = pick(others.length ? others : category.products);
      next[category.id] = { productId: product.id, variantId: pick(product.variants).id };
      visited.current[avatar].add(category.id);
    }
    applyLook(next);
  };

  const reset = () => {
    const { initialOutfit } = wardrobe.avatar;
    visited.current[avatar] = new Set([active]);
    // Keep the open category dressed so its carousel stays centred on something worn.
    const fallback = initialOutfit[active] ?? live.current[avatar][active];
    applyLook(fallback ? { ...initialOutfit, [active]: fallback } : initialOutfit);
  };

  // Cards for the open category are the likeliest next try-on, so fetch them first.
  useEffect(() => {
    if (!ready) return;
    const urls = (category: WardrobeCategory) => category.products.flatMap((p) => p.variants.map((v) => v.layer));
    figure.current?.prefetch(urls(shownCategory));
    const timer = window.setTimeout(() => {
      for (const category of wardrobe.categories)
        figure.current?.prefetch([
          layerUrl(wardrobe, category.id, {
            productId: category.featuredId,
            variantId: findProduct(category, category.featuredId).variants[0].id,
          }),
        ]);
      // So switching avatar starts scanning at once.
      for (const other of Object.values(wardrobes))
        if (other !== wardrobe) figure.current?.prefetch(outfitLayers(other, live.current[other.avatar.id]));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [ready, shownCategory, wardrobe, wardrobes]);

  // Decode the neighbouring cards while idle so the next scan never waits on an upload.
  useEffect(() => {
    if (!ready) return;
    const { products } = shownCategory;
    const center = products.findIndex((p) => p.id === centerOf(shownCategory, shownOutfit));
    const timer = window.setTimeout(() => {
      const near = [1, -1].map((by) => products[(center + by + products.length) % products.length]);
      figure.current?.warm(near.map((p) => findVariant(p, variants[p.id]).layer));
    }, MOTION.scan.delay * 1000 + 1200);
    return () => window.clearTimeout(timer);
  }, [ready, shownCategory, shownOutfit, variants]);

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
      if (product) tryOn(product, shown.slot);
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
          centerId={centerOf(shownCategory, shownOutfit)}
          variants={variants}
          ready={ready}
          reducedMotion={reducedMotion}
          onPick={(product) => tryOn(product, shown.slot)}
          onHover={(product) => figure.current?.warm([findVariant(product, variants[product.id]).layer])}
        />
      </div>

      <div ref={figureLayer} className={styles.figure}>
        <Figure
          ref={figure}
          pose={fullLook ? FULL_LOOK : activeCategory.camera}
          initialLayers={initialLayers}
          label={wardrobe.avatar.alt}
          reducedMotion={reducedMotion}
          onReady={() => setReady(true)}
        />
      </div>

      <Segmented
        label="Categories"
        items={wardrobe.categories}
        active={active}
        className={styles.categories}
        reducedMotion={reducedMotion}
        onSelect={selectCategory}
      />
      <Segmented
        label="Avatar"
        items={avatarItems}
        active={avatar}
        className={styles.avatars}
        reducedMotion={reducedMotion}
        onSelect={selectAvatar}
      />
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
