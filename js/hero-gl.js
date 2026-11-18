// RUMOAR hero: street footage graded into ember tones, seen through a
// moving liquid-glass lens (refraction, chromatic edges, a hot rim).
// It opens from black: only the lens shows the film at first, then the
// lens swells and the whole frame comes up. Clips hard-cut with a pulse.
// Falls back to a CSS-graded <video> if WebGL isn't available.

// MP4 (H.264) where supported, WebM (VP9) otherwise.
const probe = document.createElement("video");
const MP4_OK = !!probe.canPlayType('video/mp4; codecs="avc1.42E01E"');
export const pickVideo = (path) => (MP4_OK ? path : path.replace(/\.mp4$/, ".webm"));
const CLIPS = ["assets/video/street-a.mp4", "assets/video/street-b.mp4"].map(pickVideo);

const VERT = `attribute vec2 p; varying vec2 v; void main(){ v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
varying vec2 v;
uniform sampler2D tex;
uniform vec2 res, texRes, mouse;
uniform float time, reveal, pulse;

vec2 cover(vec2 uv){
  float ra = res.x / res.y, ta = texRes.x / texRes.y;
  vec2 s = ra > ta ? vec2(1.0, ta / ra) : vec2(ra / ta, 1.0);
  return (uv - 0.5) * s + 0.5;
}
vec3 grade(vec3 c){
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  l = smoothstep(0.02, 0.98, l);
  vec3 a = vec3(0.045, 0.012, 0.008), b = vec3(0.50, 0.10, 0.035), m = vec3(0.93, 0.33, 0.10), h = vec3(1.0, 0.86, 0.68);
  vec3 d = l < 0.38 ? mix(a, b, l / 0.38) : l < 0.72 ? mix(b, m, (l - 0.38) / 0.34) : mix(m, h, (l - 0.72) / 0.28);
  return mix(c * vec3(1.05, 0.78, 0.62), d, 0.82);
}
float field(vec2 q){
  float ar = res.x / res.y;
  float r = mix(0.10, 0.25, smoothstep(0.0, 0.55, reveal)) * (1.0 + 0.18 * pulse);
  vec2 c1 = mouse;
  vec2 c2 = mouse + vec2(0.16 * sin(time * 0.53), 0.11 * cos(time * 0.71));
  vec2 c3 = mouse + vec2(0.13 * cos(time * 0.37 + 1.7), 0.15 * sin(time * 0.44 + 0.6));
  float f = r * r / dot(q - c1, q - c1);
  f += 0.45 * r * r / dot(q - c2, q - c2);
  f += 0.35 * r * r / dot(q - c3, q - c3);
  return f;
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main(){
  float ar = res.x / res.y;
  vec2 q = (v - 0.5) * vec2(ar, 1.0);
  float f = field(q);
  vec2 e = vec2(0.002, 0.0);
  vec2 g = vec2(field(q + e.xy) - field(q - e.xy), field(q + e.yx) - field(q - e.yx)) / (2.0 * e.x);
  float inside = smoothstep(0.95, 1.12, f);
  float edge = 1.0 - smoothstep(1.0, 2.6, f);            // 1 at the rim, 0 deep inside
  vec2 n = normalize(g + 1e-5);

  // refraction: magnify toward the lens centre, bend hard at the rim
  vec2 off = -n * (0.018 + 0.06 * edge) * inside;
  vec2 uv = cover(v);
  vec2 lc = mouse / vec2(ar, 1.0) + 0.5;                 // lens centre in screen uv
  vec2 uvL = cover(lc + (v - lc) * 0.74 + off * 0.5);    // magnified around the lens
  float ca = 0.004 + 0.014 * edge;
  vec3 lens = vec3(
    texture2D(tex, uvL + n * ca).r,
    texture2D(tex, uvL).g,
    texture2D(tex, uvL - n * ca).b);
  lens = grade(lens) * 1.12;

  vec3 base = grade(texture2D(tex, uv).rgb);
  float vign = smoothstep(1.25, 0.25, length((v - 0.5) * vec2(ar * 0.9, 1.0)));
  base *= mix(0.42, 1.0, vign) * smoothstep(0.25, 1.0, reveal);

  // glass highlights
  float rim = smoothstep(0.55, 1.0, edge) * inside;
  float spec = pow(max(dot(n, normalize(vec2(-0.6, 0.8))), 0.0), 6.0) * edge * inside;
  vec3 col = mix(base, lens, inside);
  col += vec3(1.0, 0.55, 0.22) * rim * 0.16 + vec3(1.0, 0.92, 0.82) * spec * 0.4;
  col += vec3(0.9, 0.3, 0.08) * (1.0 - inside) * smoothstep(0.6, 0.95, f) * 0.12; // glow halo
  col += (hash(v * res + time) - 0.5) * 0.055;                                      // grain
  gl_FragColor = vec4(col, 1.0);
}`;

export function initHero(host) {
  const canvas = host.querySelector("canvas");
  const videos = CLIPS.map((src) => {
    const vd = document.createElement("video");
    Object.assign(vd, { src, muted: true, playsInline: true, preload: "auto", crossOrigin: "anonymous" });
    vd.setAttribute("muted", ""); vd.setAttribute("playsinline", "");
    return vd;
  });
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let active = 0, pulse = 0, revealStart = 0, started = false, visible = true;

  const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
  if (!gl) return fallback();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (err) { console.warn("[RUMOAR] hero shader failed, using fallback", err); return fallback(); }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const u = { res: U("res"), texRes: U("texRes"), mouse: U("mouse"), time: U("time"), reveal: U("reveal"), pulse: U("pulse") };

  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 6, 4, 255]));

  // lens follows the pointer lazily; wanders on its own on touch screens
  const target = { x: 0, y: 0 }, lens = { x: 0, y: 0 };
  let pointerSeen = false;
  addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const r = canvas.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width - 0.5) * (r.width / r.height);
    target.y = (0.5 - (e.clientY - r.top) / r.height);
    pointerSeen = true;
  }, { passive: true });

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(canvas.clientWidth * dpr); canvas.height = Math.round(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  addEventListener("resize", resize); resize();

  videos.forEach((vd, i) => vd.addEventListener("ended", () => {
    if (i !== active) return;
    active = 1 - active; pulse = 1;
    const nx = videos[active]; nx.currentTime = 0; nx.play().catch(() => {});
  }));

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    const vd = videos[active];
    if (!started) return;
    visible ? vd.play().catch(() => {}) : vd.pause();
  }, { threshold: 0.01 }).observe(host);

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || !started) return;
    const t = now / 1000;
    const reveal = reduce ? 1 : Math.min(1, (now - revealStart) / 2600);
    if (!pointerSeen) { target.x = 0.22 * Math.sin(t * 0.33); target.y = 0.12 * Math.cos(t * 0.27); }
    lens.x += (target.x - lens.x) * 0.06; lens.y += (target.y - lens.y) * 0.06;
    pulse *= 0.93;
    const vd = videos[active];
    if (vd.readyState >= 2) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, vd);
      gl.uniform2f(u.texRes, vd.videoWidth || 960, vd.videoHeight || 540);
    }
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform2f(u.mouse, lens.x, lens.y);
    gl.uniform1f(u.time, t);
    gl.uniform1f(u.reveal, reveal);
    gl.uniform1f(u.pulse, pulse);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  requestAnimationFrame(frame);

  function fallback() {
    host.classList.add("is-fallback");
    const vd = videos[0]; vd.loop = true; vd.className = "stage__fallback";
    host.appendChild(vd);
    return { start() { vd.play().catch(() => {}); } };
  }

  return {
    start() {
      if (started) return;
      started = true; revealStart = performance.now();
      videos[active].play().catch(() => {});
      host.classList.add("is-on");
    },
  };
}
