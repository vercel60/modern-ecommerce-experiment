import { gsap } from "gsap";
import { LAYER_FRAG, QUAD_VERT, SCAN_FRAG } from "./shaders";

interface Target {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
}

interface ScanOptions {
  duration: number;
  ease: string;
  settle: number;
}

const MAX_TEXTURES = 16;
const LINE_START = 0.02;
const LINE_END = 1.02;

/**
 * Flattens an outfit (a stack of aligned transparent images) and swaps it for
 * another with the scan effect. Draws only while something is changing.
 */
export class FigureRenderer {
  private gl: WebGL2RenderingContext;
  private layerProgram: WebGLProgram;
  private scanProgram: WebGLProgram;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private from!: Target;
  private to!: Target;
  private spare!: Target;
  private textures = new Map<string, Promise<WebGLTexture>>();
  private blobs = new Map<string, Promise<Blob>>();
  private state = { line: 2, trail: 0, glow: 0 };
  private timeline: gsap.core.Timeline | null = null;
  private current: string[] = [];
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) throw new Error("WebGL2 is not available");
    this.gl = gl;
    this.layerProgram = this.program(LAYER_FRAG);
    this.scanProgram = this.program(SCAN_FRAG);
    for (const name of ["uFrom", "uTo", "uLine", "uTrail", "uGlow", "uTime"])
      this.uniforms[name] = gl.getUniformLocation(this.scanProgram, name);
    gl.bindVertexArray(gl.createVertexArray());
    this.allocate();
  }

  /** Download without decoding, so a later try-on starts instantly. */
  prefetch(urls: string[]): void {
    for (const url of urls) void this.blob(url).catch(() => undefined);
  }

  /** Decode and upload. Resolves when the outfit can be shown without a hitch. */
  async prepare(urls: string[]): Promise<void> {
    await Promise.all(urls.map((url) => this.texture(url)));
  }

  /** Show an outfit immediately. */
  async show(urls: string[]): Promise<void> {
    const textures = await Promise.all(urls.map((url) => this.texture(url)));
    if (this.disposed) return;
    this.timeline?.kill();
    this.compose(this.to, textures);
    this.current = urls;
    Object.assign(this.state, { line: 2, trail: 0, glow: 0 });
    this.draw();
  }

  /** Replace the outfit using the scan effect. */
  async scanTo(urls: string[], options: ScanOptions): Promise<void> {
    const textures = await Promise.all(urls.map((url) => this.texture(url)));
    if (this.disposed) return;

    // Freeze what is on screen (possibly mid-scan) so interruptions stay seamless.
    const { gl, state } = this;
    this.timeline?.kill();
    state.glow = 0;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.spare.fbo);
    this.paint();
    [this.from, this.spare] = [this.spare, this.from];
    this.compose(this.to, textures);
    this.current = urls;

    Object.assign(state, { line: LINE_START, trail: 1, glow: 0 });
    await new Promise<void>((resolve) => {
      const draw = () => this.draw();
      this.timeline = gsap
        .timeline({ onUpdate: draw, onComplete: resolve, onInterrupt: resolve })
        .to(state, { glow: 1, duration: 0.08, ease: "none" }, 0)
        .to(state, { line: LINE_END, duration: options.duration, ease: options.ease }, 0)
        .to(state, { glow: 0, duration: 0.14, ease: "power2.out" }, options.duration - 0.05)
        .to(state, { trail: 0, duration: options.settle, ease: "power2.out" }, options.duration - 0.04)
        .set(state, { line: 2 });
    });
  }

  resize(width: number, height: number): void {
    const w = Math.round(width);
    const h = Math.round(height);
    if (w === this.canvas.width && h === this.canvas.height) return;
    this.timeline?.progress(1);
    this.canvas.width = w;
    this.canvas.height = h;
    this.release();
    this.allocate();
    if (this.current.length) void this.show(this.current).catch(() => undefined);
  }

  dispose(): void {
    this.disposed = true;
    this.timeline?.kill();
    this.release();
    this.gl.deleteProgram(this.layerProgram);
    this.gl.deleteProgram(this.scanProgram);
  }

  private draw(): void {
    if (this.disposed) return;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.paint();
  }

  private paint(): void {
    const { gl, uniforms, state } = this;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.BLEND);
    gl.useProgram(this.scanProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.from.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.to.texture);
    gl.uniform1i(uniforms.uFrom, 0);
    gl.uniform1i(uniforms.uTo, 1);
    gl.uniform1f(uniforms.uLine, state.line);
    gl.uniform1f(uniforms.uTrail, state.trail);
    gl.uniform1f(uniforms.uGlow, state.glow);
    gl.uniform1f(uniforms.uTime, (performance.now() / 1000) % 60);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private compose(target: Target, layers: WebGLTexture[]): void {
    const { gl } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.layerProgram);
    gl.activeTexture(gl.TEXTURE0);
    for (const layer of layers) {
      gl.bindTexture(gl.TEXTURE_2D, layer);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  private blob(url: string): Promise<Blob> {
    let pending = this.blobs.get(url);
    if (!pending) {
      pending = fetch(url).then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${url}`);
        return res.blob();
      });
      pending.catch(() => this.blobs.delete(url));
      this.blobs.set(url, pending);
    }
    return pending;
  }

  private texture(url: string): Promise<WebGLTexture> {
    const cached = this.textures.get(url);
    if (cached) {
      this.textures.delete(url); // re-insert: Map order doubles as LRU order
      this.textures.set(url, cached);
      return cached;
    }
    const pending = this.upload(url);
    pending.catch(() => this.textures.delete(url));
    this.textures.set(url, pending);
    if (this.textures.size > MAX_TEXTURES) {
      const oldest = this.textures.keys().next().value as string;
      const evicted = this.textures.get(oldest);
      this.textures.delete(oldest);
      // Callers await textures and compose in the same task, so free it later.
      void evicted?.then((t) => setTimeout(() => this.gl.deleteTexture(t), 4000)).catch(() => undefined);
    }
    return pending;
  }

  private async upload(url: string): Promise<WebGLTexture> {
    const bitmap = await createImageBitmap(await this.blob(url), {
      premultiplyAlpha: "premultiply",
      resizeWidth: this.canvas.width,
      resizeHeight: this.canvas.height,
      resizeQuality: "high",
    });
    const { gl } = this;
    const texture = this.emptyTexture();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
    bitmap.close();
    return texture;
  }

  private emptyTexture(): WebGLTexture {
    const { gl } = this;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  private target(): Target {
    const { gl } = this;
    const texture = this.emptyTexture();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.canvas.width, this.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture, fbo };
  }

  private allocate(): void {
    this.from = this.target();
    this.to = this.target();
    this.spare = this.target();
  }

  private release(): void {
    for (const t of [this.from, this.to, this.spare]) {
      this.gl.deleteTexture(t.texture);
      this.gl.deleteFramebuffer(t.fbo);
    }
    for (const pending of this.textures.values())
      void pending.then((t) => this.gl.deleteTexture(t)).catch(() => undefined);
    this.textures.clear();
  }

  private program(fragment: string): WebGLProgram {
    const { gl } = this;
    const program = gl.createProgram();
    for (const [type, source] of [
      [gl.VERTEX_SHADER, QUAD_VERT],
      [gl.FRAGMENT_SHADER, fragment],
    ] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Could not create shader");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost())
        throw new Error(gl.getShaderInfoLog(shader) ?? "Shader failed to compile");
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    return program;
  }
}
