// One entry per image. Layers: 0 body, 1 bottom, 2 outerwear, 3 shoes, 4 accessory.
const FIG = { w: 1080, h: 1800, cam: { ro: [0, 0.9, 6.5], ta: [0, 0.865, 0], tan: 0.965 / 6.5 } };
const shot = (ro, ta, half) => {
  const d = Math.hypot(ro[0] - ta[0], ro[1] - ta[1], ro[2] - ta[2]);
  return { w: 720, h: 720, cam: { ro, ta, tan: half / d } };
};
const PRODUCT = {
  1: () => shot([0, 0.62, 5], [0, 0.535, 0], 0.56),
  2: () => shot([0, 1.3, 5], [0, 1.165, 0], 0.37),
  3: () => shot([-1.9, 0.5, 0.75], [0, 0.075, 0.045], 0.165),
  4: (s) => [shot([-0.27, 0.75, 4], [-0.313, 0.405, 0.05], 0.42), shot([-0.27, 0.8, 4], [-0.271, 0.525, 0.05], 0.27), shot([0.65, 1.0, 4], [-0.303, 0.56, 0.07], 0.23)][s],
};
const SLOT = ["body", "bottom", "outerwear", "shoes", "accessory"];

const items = [
  [1, 0, "taper-trek-pant", { graphite: ["#3b3a3c"], sand: ["#b5a58c"], navy: ["#28344e"] }],
  [1, 1, "utility-cargo", { olive: ["#5c6048"], stone: ["#a49c8e"], black: ["#2b2b2d"] }],
  [1, 2, "wide-leg-trouser", { ecru: ["#d8cfbd"], charcoal: ["#444347"], clay: ["#a5674c"] }],
  [2, 0, "down-hooded-jacket", { cobalt: ["#1450d8", "#1450d8", "#1450d8", "#0d2a6e"], violet: ["#5c2fc4", "#5c2fc4", "#5c2fc4", "#321a73"], black: ["#2a2a2e", "#2a2a2e", "#2a2a2e", "#151517"] }],
  [2, 1, "storm-shell-jacket", { prism: ["#1a5fe0", "#5b30c0", "#d3e02a", "#2c2c34"], ember: ["#d8461f", "#33343b", "#f0b429", "#1f1f24"], moss: ["#4a6b4d", "#23352c", "#d9d2b4", "#1c231f"] }],
  [2, 2, "quilted-down-hoodie", { violet: ["#6233cc", "#6233cc", "#6233cc", "#3a1f80"], cobalt: ["#1d56d6", "#1d56d6", "#1d56d6", "#112f78"], black: ["#2c2c30", "#2c2c30", "#2c2c30", "#161618"] }],
  [3, 0, "court-mid", { scarlet: ["#f1efea", "#26262a", "#d31f2f", "#f4f2ee"], black: ["#2d2d31", "#17171a", "#e9e6df", "#ecebe6"] }],
  [3, 1, "iridescent-low", { spectrum: ["#6a7f9c", "#23305a", "#57c9a0", "#2b3a66"], dusk: ["#a06a8c", "#4a2347", "#f0a35e", "#5a2f58"] }],
  [3, 2, "strap-runner", { mist: ["#c9c8c6", "#4fd0a8", "#ef6f86", "#efeeec"], mint: ["#bfe3d4", "#2f7f6b", "#f2efe6", "#f5f4f0"], coral: ["#f0b6a8", "#e0523f", "#3b3b40", "#f7f2ee"] }],
  [4, 0, "hard-shell-carry-on", { red: ["#cf1526", "#a80f1e", "#c9ccd1"], graphite: ["#3a3c41", "#26272b", "#c9ccd1"] }],
  [4, 1, "quilted-bucket-bag", { ivory: ["#e6dfd0", "#d5cbb6", "#c8b07a"], black: ["#2b2b2d", "#1c1c1e", "#c8b07a"] }],
  [4, 2, "leather-barrel-bag", { red: ["#cf1526", "#a30f1d", "#c9ccd1"], tan: ["#a8703f", "#6f4525", "#c8b07a"] }],
];

export const jobs = [
  { name: "room", src: "room", w: 2560, h: 1440, spp: 400, expo: 0.5, quality: 0.86, tile: 320 },
  { name: "figure/body", src: "figure", head: "add", defines: { LAYER: 0, STYLE: 0, PRODUCT: 0 }, ...FIG },
];
for (const [layer, style, slug, variants] of items)
  for (const [v, c] of Object.entries(variants)) {
    const colors = [0, 1, 2, 3].map((i) => c[i] ?? c[0]);
    const base = { src: "figure", colors };
    jobs.push({ name: `figure/${SLOT[layer]}/${slug}-${v}`, ...base, ...(layer === 2 && { head: "cut" }), defines: { LAYER: layer, STYLE: style, PRODUCT: 0 }, ...FIG });
    jobs.push({ name: `product/${slug}-${v}`, ...base, defines: { LAYER: layer, STYLE: style, PRODUCT: 1 }, ...PRODUCT[layer](style) });
  }
