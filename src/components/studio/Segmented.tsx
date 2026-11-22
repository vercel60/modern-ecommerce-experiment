"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { MOTION } from "@/config/motion";
import styles from "./Segmented.module.css";

interface Props<Id extends string> {
  label: string;
  items: { id: Id; label: string; icon?: ReactNode }[];
  active: Id;
  className: string;
  reducedMotion: boolean;
  onSelect: (id: Id) => void;
}

/** Glass pill with a sliding highlight. Used for categories and for the avatar. */
export function Segmented<Id extends string>({ label, items, active, className, reducedMotion, onSelect }: Props<Id>) {
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
  }, [active, items, reducedMotion]);

  return (
    <nav ref={nav} className={`${styles.nav} ${className}`} aria-label={label} data-ui data-cursor="none">
      <span ref={pill} className={styles.pill} />
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={styles.tab}
          aria-current={item.id === active}
          onClick={() => onSelect(item.id)}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
  );
}
