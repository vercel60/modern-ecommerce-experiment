export const QUAD_VERT = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = vec2(p.x, 1.0 - p.y);          // v grows downward, like the images
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/** Draws one transparent layer (premultiplied). Render targets are stored upright. */
export const LAYER_FRAG = `#version 300 es
precision mediump float;
in vec2 vUv;
uniform sampler2D uTex;
out vec4 o;
void main() { o = texture(uTex, vec2(vUv.x, vUv.y)); }`;

/** Scan-line reveal: beam, ripple trail, vertical smear and glow. */
export const SCAN_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform float uLine;   // beam position, 0 head .. 1 feet
uniform float uTrail;  // ripple strength
uniform float uGlow;   // beam strength
uniform float uTime;
out vec4 o;

vec4 src(sampler2D t, vec2 uv) {
  vec2 inside = step(vec2(0.0), uv) * step(uv, vec2(1.0));
  return texture(t, vec2(uv.x, 1.0 - uv.y)) * inside.x * inside.y;
}

vec4 smear(sampler2D t, vec2 uv, float amount) {
  vec4 c = vec4(0.0);
  for (int i = 0; i < 7; i++) c += src(t, uv + vec2(0.0, (float(i) / 6.0 - 0.5) * amount));
  return c / 7.0;
}

void main() {
  float d = vUv.y - uLine;                                  // > 0: not scanned yet
  float above = step(d, 0.0);
  float near = exp(-abs(d) * 34.0) * uGlow;

  // fabric ripple that chases the beam and dies out
  float trail = above * smoothstep(0.36, 0.0, -d) * uTrail;
  float bands = sin(vUv.y * 430.0 - uTime * 9.0);
  vec2 wobble = vec2(sin(vUv.y * 96.0 + uTime * 26.0) * 0.0055, bands * 0.0048) * trail;

  vec2 ca = vec2(0.0022 * trail + 0.004 * near, 0.0);
  vec4 to = smear(uTo, vUv + wobble, 0.05 * near);
  to.r = smear(uTo, vUv + wobble + ca, 0.05 * near).r;
  to.b = smear(uTo, vUv + wobble - ca, 0.05 * near).b;
  to.rgb *= 1.0 - 0.42 * trail * smoothstep(0.05, 0.9, bands);
  to.rgb = mix(to.rgb, vec3(to.a), 0.10 * trail * smoothstep(0.2, 1.0, -bands));

  // the old garment is pulled toward the beam just before it is replaced
  vec4 from = smear(uFrom, vUv - vec2(0.0, 0.018 * exp(-max(d, 0.0) * 46.0) * uGlow), 0.03 * near);

  vec4 c = mix(to, from, smoothstep(-0.010, 0.010, d));
  c.rgb = mix(c.rgb, vec3(c.a), 0.46 * exp(-abs(d) * 22.0) * uGlow);

  float span = exp(-pow(abs(vUv.x - 0.5) / 0.235, 4.0));
  float core = exp(-pow(d / 0.0017, 2.0));
  float halo = exp(-pow(d / 0.011, 2.0)) * 0.34 + exp(-pow((d + 0.02) / 0.032, 2.0)) * 0.13;
  float flicker = 0.86 + 0.14 * sin(vUv.x * 70.0 + uTime * 40.0);
  float beam = (core * 0.95 + halo * (0.35 + 0.65 * c.a)) * span * flicker * uGlow;
  c.rgb += vec3(0.97, 0.98, 1.0) * beam;
  c.a = max(c.a, min(beam, 1.0));
  o = vec4(min(c.rgb, vec3(1.0)), min(c.a, 1.0));
}`;
