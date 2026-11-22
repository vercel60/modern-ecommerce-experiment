"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { gsap } from "gsap";
import { FIGURE_FRAME, MOTION } from "@/config/motion";
import { FigureRenderer } from "@/lib/figure/renderer";
import type { CameraPose } from "@/types/catalog";
import styles from "./Figure.module.css";

export interface FigureHandle {
  /** Scan to a new outfit after `delay` seconds (or once its images are ready). */
  scan(layers: string[], delay: number): void;
  prefetch(layers: string[]): void;
  warm(layers: string[]): void;
}

interface Props {
  ref: Ref<FigureHandle>;
  pose: CameraPose;
  initialLayers: string[];
  label: string;
  reducedMotion: boolean;
  onReady: () => void;
}

const MAX_HEIGHT = 1800;

function fit(pose: CameraPose, width: number, height: number) {
  const portrait = width / height < 0.8;
  const body = portrait ? pose.body * 0.74 : pose.body;
  const head = portrait ? pose.head * 0.6 + 0.07 : pose.head;
  const scale = body / (FIGURE_FRAME.soles - FIGURE_FRAME.headTop);
  return { scale, y: (head - FIGURE_FRAME.headTop * scale) * height };
}

export function Figure({ ref, pose, initialLayers, label, reducedMotion, onReady }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<FigureRenderer | null>(null);
  const token = useRef(0);
  const initial = useRef({ layers: initialLayers, onReady, reducedMotion });
  const poseRef = useRef(pose);
  const placed = useRef(false);
  // Plain image stack, used only when WebGL is unavailable.
  const [fallback, setFallback] = useState<string[] | null>(null);
  const failed = useRef(false);

  useEffect(() => {
    const el = canvas.current!;
    const { layers, onReady: ready, reducedMotion: reduced } = initial.current;
    let alive = true;
    const showFallback = () => {
      failed.current = true;
      setFallback(layers);
      ready();
    };
    const resolution = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const h = Math.min(Math.max(el.clientHeight * dpr, 700), MAX_HEIGHT);
      return [h * FIGURE_FRAME.aspect, h] as const;
    };

    let r: FigureRenderer;
    try {
      [el.width, el.height] = resolution().map(Math.round);
      r = new FigureRenderer(el);
    } catch {
      queueMicrotask(showFallback);
      return;
    }
    renderer.current = r;
    el.addEventListener("webglcontextlost", showFallback);

    const id = ++token.current;
    r.prepare(layers)
      .then(() => {
        if (!alive) return;
        ready();
        if (id !== token.current) return;
        if (reduced) return r.show(layers);
        return r.scanTo(layers, { ...MOTION.scan, duration: MOTION.intro.scan });
      })
      .catch(() => alive && showFallback());

    let timer = 0;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => r.resize(...resolution()), 180);
    });
    observer.observe(el);

    return () => {
      alive = false;
      observer.disconnect();
      window.clearTimeout(timer);
      el.removeEventListener("webglcontextlost", showFallback);
      r.dispose();
      renderer.current = null;
    };
  }, []);

  useEffect(() => {
    poseRef.current = pose;
    const el = frame.current!;
    const stage = el.parentElement!;
    const to = fit(pose, stage.clientWidth, stage.clientHeight);
    const instant = !placed.current || reducedMotion;
    placed.current = true;
    gsap.to(el, {
      ...to,
      duration: instant ? 0 : MOTION.category.camera,
      ease: MOTION.category.cameraEase,
      overwrite: true,
    });
  }, [pose, reducedMotion]);

  useEffect(() => {
    const el = frame.current!;
    const stage = el.parentElement!;
    const observer = new ResizeObserver(() => {
      if (!gsap.isTweening(el)) gsap.set(el, fit(poseRef.current, stage.clientWidth, stage.clientHeight));
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scan(layers, delay) {
        const id = ++token.current;
        if (failed.current) {
          setFallback(layers);
          return;
        }
        const r = renderer.current;
        if (!r) return;
        const wait = new Promise((resolve) => setTimeout(resolve, reducedMotion ? 0 : delay * 1000));
        Promise.all([r.prepare(layers), wait])
          .then(() => {
            if (id !== token.current) return;
            return reducedMotion ? r.show(layers) : r.scanTo(layers, MOTION.scan);
          })
          .catch((error) => console.error("Try-on failed", error));
      },
      prefetch: (layers) => renderer.current?.prefetch(layers),
      warm: (layers) => void renderer.current?.prepare(layers).catch(() => undefined),
    }),
    [reducedMotion],
  );

  return (
    <div ref={frame} className={styles.frame}>
      <div className={styles.shadow} />
      <canvas ref={canvas} className={styles.canvas} role="img" aria-label={label} hidden={!!fallback} />
      {fallback?.map((src) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt="" className={styles.canvas} />
      ))}
    </div>
  );
}
