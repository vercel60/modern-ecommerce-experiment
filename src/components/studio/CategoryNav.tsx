"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { MOTION } from "@/config/motion";
import type { Category, Slot } from "@/types/catalog";
import styles from "./CategoryNav.module.css";

interface Props {
  categories: Category[];
  active: Slot;
  reducedMotion: boolean;
  onSelect: (id: Slot) => void;
}

export function CategoryNav({ categories, active, reducedMotion, onSelect }: Props) {
  const nav = useRef<HTMLElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const edges = useRef<{ left: number; right: number } | null>(null);

  useEffect(() => {
    const el = nav.current!;
    const place = (animate: boolean) => {
      const tab = el.querySelector<HTMLElement>('[aria-current="true"]');
      if (!tab) return;
      const left = tab.offsetLeft;
      const right = el.clientWidth - left - tab.offsetWidth;
      const forward = edges.current ? left > edges.current.left : true;
      edges.current = { left, right };
      const { lead, trail, ease } = MOTION.pill;
      const time = (leading: boolean) => (animate && !reducedMotion ? (leading ? lead : trail) : 0);
      // The leading edge arrives first, so the pill stretches as it travels.
      gsap.to(pill.current, { left, duration: time(!forward), ease, overwrite: "auto" });
      gsap.to(pill.current, { right, duration: time(forward), ease, overwrite: "auto" });
      gsap.set(pill.current, { autoAlpha: 1 });
    };
    place(edges.current !== null);
    const observer = new ResizeObserver(() => place(false));
    observer.observe(el);
    return () => observer.disconnect();
  }, [active, reducedMotion]);

  return (
    <nav ref={nav} className={styles.nav} aria-label="Categories" data-ui data-cursor="none">
      <span ref={pill} className={styles.pill} />
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          className={styles.tab}
          aria-current={c.id === active}
          onClick={() => onSelect(c.id)}
        >
          {c.label}
        </button>
      ))}
    </nav>
  );
}
