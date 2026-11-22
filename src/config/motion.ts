/**
 * Every duration (seconds) and easing in the studio, measured from the
 * reference clip. Tune the feel here; components hold no magic numbers.
 */
export const MOTION = {
  carousel: { duration: 0.55, ease: "power3.out", perSlot: 0.12 },
  /** Delay between clicking a card and the product bar switching. */
  barDelay: 0.38,
  scan: {
    delay: 0.5,
    duration: 0.5,
    ease: "power1.in",
    /** How long the ripple lingers once the beam has left the feet. */
    settle: 0.3,
  },
  category: {
    exit: 0.16,
    exitStagger: 0.008,
    enter: 0.45,
    enterStagger: 0.035,
    camera: 0.75,
    cameraEase: "power3.inOut",
    /** Scan start after the tab is pressed. */
    scanDelay: 0.42,
  },
  /** Scan start after the avatar is switched. */
  avatar: { scanDelay: 0.12 },
  pill: { lead: 0.22, trail: 0.38, ease: "power3.out" },
  cursor: { follow: 0.22 },
  parallax: { duration: 0.9, backdrop: 10, wordmark: 16, cards: 8, figure: 4 },
  intro: { fade: 0.9, scan: 1.1 },
} as const;

/** Card poses by distance from the model. x and width are fractions of stage width. */
export interface CardPose {
  d: number;
  x: number;
  scale: number;
  opacity: number;
  rotate: number;
}

export const CARD_POSES: Record<"wide" | "narrow", CardPose[]> = {
  wide: [
    { d: 0, x: 0, scale: 0.86, opacity: 0, rotate: 0 },
    { d: 0.3, x: 0.075, scale: 0.88, opacity: 0.22, rotate: 4 },
    { d: 0.65, x: 0.15, scale: 0.94, opacity: 0.62, rotate: 8 },
    { d: 1, x: 0.226, scale: 1, opacity: 1, rotate: 12 },
    { d: 2, x: 0.348, scale: 0.69, opacity: 1, rotate: 15 },
    { d: 3, x: 0.436, scale: 0.5, opacity: 0.95, rotate: 18 },
    { d: 4, x: 0.505, scale: 0.36, opacity: 0, rotate: 22 },
  ],
  narrow: [
    { d: 0, x: 0, scale: 0.8, opacity: 0, rotate: 0 },
    { d: 0.5, x: 0.17, scale: 0.9, opacity: 0.4, rotate: 8 },
    { d: 1, x: 0.335, scale: 1, opacity: 1, rotate: 14 },
    { d: 2, x: 0.58, scale: 0.74, opacity: 0.5, rotate: 18 },
    { d: 3, x: 0.75, scale: 0.5, opacity: 0, rotate: 22 },
  ],
};

export function poseAt(poses: CardPose[], distance: number): Omit<CardPose, "d"> {
  const last = poses[poses.length - 1];
  if (distance >= last.d) return last;
  const i = poses.findIndex((p) => p.d > distance);
  const a = poses[i - 1];
  const b = poses[i];
  const t = (distance - a.d) / (b.d - a.d);
  const mix = (k: "x" | "scale" | "opacity" | "rotate") => a[k] + (b[k] - a[k]) * t;
  return { x: mix("x"), scale: mix("scale"), opacity: mix("opacity"), rotate: mix("rotate") };
}

/** Head and sole positions inside the 1080x1800 figure image. */
export const FIGURE_FRAME = { aspect: 1080 / 1800, headTop: 0.052, soles: 0.95 } as const;
