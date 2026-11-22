"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { gsap } from "gsap";
import { MOTION } from "@/config/motion";
import styles from "./StageCursor.module.css";

type Mode = "try" | "drag" | "none";

/** Round pointer that reads TRY ON over cards and DRAG over the stage. */
export function StageCursor({ stage }: { stage: RefObject<HTMLElement | null> }) {
  const dot = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("none");
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const el = stage.current!;
    const x = gsap.quickTo(dot.current, "x", { duration: MOTION.cursor.follow, ease: "power3.out" });
    const y = gsap.quickTo(dot.current, "y", { duration: MOTION.cursor.follow, ease: "power3.out" });
    let seen = false;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!seen) gsap.set(dot.current, { x: e.clientX, y: e.clientY });
      seen = true;
      x(e.clientX);
      y(e.clientY);
      const zone = (e.target as Element).closest<HTMLElement>("[data-cursor]")?.dataset.cursor;
      setMode((zone as Mode | undefined) ?? "drag");
    };
    const down = () => setPressed(true);
    const up = () => setPressed(false);
    const leave = () => setMode("none");
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerleave", leave);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [stage]);

  return (
    <div ref={dot} className={styles.cursor} data-mode={mode} data-pressed={pressed} aria-hidden="true">
      <span className={styles.disc}>
        <span>{mode === "try" ? "TRY ON" : "DRAG"}</span>
      </span>
    </div>
  );
}
