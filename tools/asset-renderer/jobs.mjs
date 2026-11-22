// One entry per image. Layers: 0 body, 1 bottom, 2 outerwear, 3 shoes, 4 accessory.
const FIG = { w: 1080, h: 1800, cam: { ro: [0, 0.9, 6.5], ta: [0, 0.865, 0], tan: 0.965 / 6.5 } };
const shot = (ro, ta, half) => {
  const d = Math.hypot(ro[0] - ta[0], ro[1] - ta[1], ro[2] - ta[2]);
  return { w: 720, h: 720, cam: { ro, ta, tan: half / d } };
};
const CASE = shot([-0.27, 0.75, 4], [-0.313, 0.405, 0.05], 0.42);
const CASE_M = shot([-0.3, 0.75, 4], [-0.343, 0.405, 0.05], 0.42);
const PRODUCT = {
  1: () => shot([0, 0.62, 5], [0, 0.535, 0], 0.56),
  2: (s) => shot([0, 1.3, 5], [0, s === 5 ? 1.13 : s > 2 ? 1.175 : 1.165, 0], s === 5 ? 0.42 : s > 2 ? 0.375 : 0.37),
  3: () => shot([-1.9, 0.5, 0.75], [0, 0.075, 0.045], 0.165),
  4: (s) => [
    CASE,
    shot([-0.27, 0.8, 4], [-0.271, 0.525, 0.05], 0.27),
    shot([0.65, 1.0, 4], [-0.303, 0.56, 0.07], 0.23),
    shot([-0.2, 0.85, 4], [-0.298, 0.58, 0.04], 0.24),
    shot([0.65, 1.0, 4], [-0.316, 0.555, 0.07], 0.26),
    CASE_M,
  ][s],
};
const SLOT = ["body", "bottom", "outerwear", "shoes", "accessory"];
const FEMALE = 0;
const MALE = 1;

const items = [
  [FEMALE, 1, 0, "taper-trek-pant", { graphite: ["#3b3a3c"], sand: ["#b5a58c"], navy: ["#28344e"] }],
  [FEMALE, 1, 1, "utility-cargo", { olive: ["#5c6048"], stone: ["#a49c8e"], black: ["#2b2b2d"] }],
  [FEMALE, 1, 2, "wide-leg-trouser", { ecru: ["#d8cfbd"], charcoal: ["#444347"], clay: ["#a5674c"] }],
  [FEMALE, 2, 0, "down-hooded-jacket", { cobalt: ["#1450d8", "#1450d8", "#1450d8", "#0d2a6e"], violet: ["#5c2fc4", "#5c2fc4", "#5c2fc4", "#321a73"], black: ["#2a2a2e", "#2a2a2e", "#2a2a2e", "#151517"] }],
  [FEMALE, 2, 1, "storm-shell-jacket", { prism: ["#1a5fe0", "#5b30c0", "#d3e02a", "#2c2c34"], ember: ["#d8461f", "#33343b", "#f0b429", "#1f1f24"], moss: ["#4a6b4d", "#23352c", "#d9d2b4", "#1c231f"] }],
  [FEMALE, 2, 2, "quilted-down-hoodie", { violet: ["#6233cc", "#6233cc", "#6233cc", "#3a1f80"], cobalt: ["#1d56d6", "#1d56d6", "#1d56d6", "#112f78"], black: ["#2c2c30", "#2c2c30", "#2c2c30", "#161618"] }],
  [FEMALE, 3, 0, "court-mid", { scarlet: ["#f1efea", "#26262a", "#d31f2f", "#f4f2ee"], black: ["#2d2d31", "#17171a", "#e9e6df", "#ecebe6"] }],
  [FEMALE, 3, 1, "iridescent-low", { spectrum: ["#6a7f9c", "#23305a", "#57c9a0", "#2b3a66"], dusk: ["#a06a8c", "#4a2347", "#f0a35e", "#5a2f58"] }],
  [FEMALE, 3, 2, "strap-runner", { mist: ["#c9c8c6", "#4fd0a8", "#ef6f86", "#efeeec"], mint: ["#bfe3d4", "#2f7f6b", "#f2efe6", "#f5f4f0"], coral: ["#f0b6a8", "#e0523f", "#3b3b40", "#f7f2ee"] }],
  [FEMALE, 4, 0, "hard-shell-carry-on", { red: ["#cf1526", "#a80f1e", "#c9ccd1"], graphite: ["#3a3c41", "#26272b", "#c9ccd1"] }],
  [FEMALE, 4, 1, "quilted-bucket-bag", { ivory: ["#e6dfd0", "#d5cbb6", "#c8b07a"], black: ["#2b2b2d", "#1c1c1e", "#c8b07a"] }],
  [FEMALE, 4, 2, "leather-barrel-bag", { red: ["#cf1526", "#a30f1d", "#c9ccd1"], tan: ["#a8703f", "#6f4525", "#c8b07a"] }],

  [MALE, 1, 3, "straight-chino", { khaki: ["#b09a74"], ink: ["#2a3247"], stone: ["#9b968c"] }],
  [MALE, 1, 4, "tech-jogger", { black: ["#2b2c30", "#d9dadd"], slate: ["#59616d", "#e4e6e9"], olive: ["#55583f", "#dcdac9"] }],
  [MALE, 1, 5, "relaxed-denim", { indigo: ["#2e4468", "#c08a4a"], washed: ["#7f9bbd", "#d8c39a"], black: ["#333437", "#6c6c70"] }],
  [MALE, 2, 3, "colour-block-puffer", { lava: ["#26282d", "#e2571f", "#26282d", "#141518"], ocean: ["#12306b", "#2f8fd6", "#12306b", "#0b1b3d"], forest: ["#2f4a3a", "#c9b178", "#2f4a3a", "#1a2a21"] }],
  [MALE, 2, 4, "satin-bomber", { sage: ["#5d6b52", "#3d4738", "#5d6b52", "#22271f"], midnight: ["#1d2740", "#131a2b", "#1d2740", "#0b0f19"], rust: ["#9a4a28", "#5e2c18", "#9a4a28", "#34180d"] }],
  [MALE, 2, 5, "field-parka", { sand: ["#b39b70", "#6f5f43", "#b39b70", "#5a4d36"], olive: ["#5a5d43", "#3b3d2c", "#5a5d43", "#2b2d20"], black: ["#2d2e31", "#1b1c1e", "#2d2e31", "#121314"] }],
  [MALE, 3, 3, "trail-boot", { tan: ["#a8743f", "#5b3a20", "#1f1c1a", "#d9cfbd"], black: ["#2e2f32", "#1b1c1e", "#141416", "#3a3b3f"] }],
  [MALE, 3, 4, "retro-runner", { navy: ["#e9e6df", "#8a9099", "#1f3a7a", "#f2efe8"], green: ["#e9e6df", "#a39b8b", "#1f6b47", "#f2efe8"], orange: ["#3a3f48", "#23262c", "#e8692a", "#efece5"] }],
  [MALE, 3, 5, "clean-low", { white: ["#f1f0ec", "#b98a5a", "#e6e4de", "#f4f3ef"], black: ["#2b2c2f", "#8d8f94", "#e6e4de", "#f1efea"] }],
  [MALE, 4, 3, "leather-briefcase", { cognac: ["#8f5529", "#7a4520", "#c8b07a"], black: ["#2c2c2e", "#232325", "#c9ccd1"] }],
  [MALE, 4, 4, "canvas-duffel", { olive: ["#656a4c", "#4b3524", "#c8b07a"], navy: ["#2b3a57", "#5a3a22", "#c8b07a"] }],
  [MALE, 4, 5, "alloy-carry-on", { silver: ["#9da2a8", "#7d838a", "#d9dce0"], gunmetal: ["#565b63", "#3c4047", "#c9ccd1"] }],
];

const NAME = ["female", "male"];
export const jobs = [
  { name: "room", src: "room", w: 2560, h: 1440, spp: 400, expo: 0.5, quality: 0.86, tile: 320 },
  ...[FEMALE, MALE].map((SEX) => ({ name: `figure/${NAME[SEX]}/body`, src: "figure", defines: { SEX, LAYER: 0, STYLE: 0, PRODUCT: 0 }, ...FIG })),
];
for (const [SEX, layer, style, slug, variants] of items)
  for (const [v, c] of Object.entries(variants)) {
    const colors = [0, 1, 2, 3].map((i) => c[i] ?? c[0]);
    const base = { src: "figure", colors };
    jobs.push({ name: `figure/${NAME[SEX]}/${SLOT[layer]}/${slug}-${v}`, ...base, defines: { SEX, LAYER: layer, STYLE: style, PRODUCT: 0 }, ...FIG });
    jobs.push({ name: `product/${slug}-${v}`, ...base, defines: { SEX, LAYER: layer, STYLE: style, PRODUCT: 1 }, ...PRODUCT[layer](style) });
  }
