(() => {
  const cv = document.createElement("canvas");
  const gl = cv.getContext("webgl2", { alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
  gl.getExtension("EXT_color_buffer_float"); gl.getExtension("EXT_float_blend");
  const VS = "#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0,1);}";
  const RESOLVE = `#version 300 es
precision highp float; uniform sampler2D t; uniform float n; uniform float expo; out vec4 o;
vec3 tm(vec3 x){ x*=expo; return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
void main(){ vec4 c=texelFetch(t,ivec2(gl_FragCoord.xy),0)/n; float a=clamp(c.a,0.,1.); if(a<.002){o=vec4(0);return;} vec3 k=pow(tm(c.rgb/a),vec3(1./2.2)); o=vec4(k*a,a);} `;
  const cache = {};
  const program = (fs) => {
    if (cache[fs]) return cache[fs];
    const p = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    }
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return (cache[fs] = p);
  };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  // "add": replace the rendered head with the photo head. "cut": punch its shape out of a garment.
  const withHead = async (source, mode) => {
    const photo = await createImageBitmap(await (await fetch(HEAD)).blob());
    const { width: w, height: h } = source;
    const c = Object.assign(document.createElement("canvas"), { width: w, height: h });
    const x = c.getContext("2d");
    x.drawImage(source, 0, 0);
    if (mode === "cut") x.globalCompositeOperation = "destination-out";
    else {
      x.clearRect(0, 0, w, Math.round(h * 0.139));
      // shade the neck under the jaw: only the shadow of an off-canvas copy lands on existing pixels
      x.globalCompositeOperation = "source-atop";
      for (const [dx, dy, blur, a] of [[0, 0.022, 0.026, 0.5], [0, 0.008, 0.008, 0.4]]) {
        x.shadowColor = `rgba(58, 26, 14, ${a})`;
        x.shadowBlur = blur * w;
        x.shadowOffsetX = w * (dx + 2);
        x.shadowOffsetY = h * dy;
        x.drawImage(photo, -w * 2, 0, w, h);
      }
      x.shadowColor = "transparent";
      x.globalCompositeOperation = "source-over";
    }
    x.drawImage(photo, 0, 0, w, h);
    return c;
  };
  window.renderJob = async ({ src, defines = {}, w, h, spp, cam, colors = [], head, expo = 0.78, quality = 0.9, tile = 256 }) => {
    cv.width = w; cv.height = h;
    const fs = "#version 300 es\n" + Object.entries(defines).map(([k, v]) => `#define ${k} ${v}\n`).join("") + SRC[src];
    const p = program(fs), r = program(RESOLVE);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(p); const u = (n) => gl.getUniformLocation(p, n);
    gl.uniform2f(u("uRes"), w, h);
    if (cam) { gl.uniform3fv(u("uRo"), cam.ro); gl.uniform3fv(u("uTa"), cam.ta); gl.uniform1f(u("uTan"), cam.tan); }
    colors.forEach((c, i) => gl.uniform3fv(u("uC" + i), hex(c)));
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.enable(gl.SCISSOR_TEST);
    const px = new Float32Array(4);
    for (let i = 0; i < spp; i++) {
      gl.uniform1f(u("uSeed"), i + 1);
      for (let y = 0; y < h; y += tile) for (let x = 0; x < w; x += tile) {
        gl.scissor(x, y, tile, tile); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.flush();
      }
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, px);
      await new Promise((z) => setTimeout(z, 0));
    }
    gl.disable(gl.BLEND); gl.disable(gl.SCISSOR_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, w, h); gl.useProgram(r);
    gl.uniform1f(gl.getUniformLocation(r, "n"), spp); gl.uniform1f(gl.getUniformLocation(r, "expo"), expo);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    let image = cv;
    if (head) image = await withHead(cv, head);
    const blob = await new Promise((z) => image.toBlob(z, "image/webp", quality));
    gl.deleteTexture(tex); gl.deleteFramebuffer(fb);
    const b = new Uint8Array(await blob.arrayBuffer()); let s = "";
    for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode(...b.subarray(i, i + 8192));
    return btoa(s);
  };
})();
