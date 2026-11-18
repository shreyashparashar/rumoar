// RUMOAR hero reel (WebGL).
// The first ~4 seconds are a scripted opening, beat for beat after the
// reference: a dark liquid shape swirls out of black; an extreme bright
// close-up through the lens; street footage with zoom blur and a wobbling
// chrome droplet; a hard cut to a swirl-twisted frame; a fisheye bubble that
// relaxes into clean footage; a final cut with zoom blur settling. After
// that the reel keeps cutting between footage and stills, full screen.
// Everything is graded into RUMOAR's ember tones.

const probe = document.createElement("video");
const MP4_OK = !!probe.canPlayType('video/mp4; codecs="avc1.42E01E"');
export const pickVideo = (path) => (MP4_OK ? path : path.replace(/\.mp4$/, ".webm"));

const V = (n) => ({ kind: "video", src: pickVideo(`assets/video/${n}.mp4`) });
const I = (n) => ({ kind: "image", src: `assets/collage/${n}.webp` });

// opening beats: [source, duration ms, effect envelope]
const OPENING = [
  { ...I("17"), ms: 650, fx: { dark: [1, 1] } },
  { ...I("18"), ms: 800, fx: { mag: [1, 0.85], zoom: [0.9, 0.5], lift: [0.35, 0.25] } },
  { ...V("street-a"), ms: 1000, fx: { drop: [1, 1], zoom: [0.45, 0.25] } },
  { ...I("00"), ms: 550, fx: { swirl: [3.2, 1.2] } },
  { ...V("street-b"), ms: 750, fx: { fish: [1, 0], dropOut: true } },
  { ...I("26"), ms: 520, fx: { zoom: [0.9, 0] } },
];
// the reel after the opening
const REEL = [V("street-a"), I("16"), V("street-b"), I("12"), I("22"), I("17"), I("03"), I("11"), I("00")];

const VERT = `attribute vec2 p; varying vec2 v; void main(){ v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
varying vec2 v;
uniform sampler2D tex;
uniform vec2 res, texRes;
uniform float time, kb, dark, mag, zoom, drop, swirl, fish, lift, flash;

vec2 cover(vec2 uv){
  float ra = res.x / res.y, ta = texRes.x / texRes.y;
  vec2 s = ra > ta ? vec2(1.0, ta / ra) : vec2(ra / ta, 1.0);
  return ((uv - 0.5) * s) / kb + 0.5;
}
vec3 grade(vec3 c){
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  l = clamp(l + lift, 0.0, 1.0);
  vec3 a = vec3(0.04, 0.012, 0.008), b = vec3(0.48, 0.10, 0.035), m = vec3(0.93, 0.34, 0.10), h = vec3(1.0, 0.87, 0.70);
  vec3 d = l < 0.36 ? mix(a, b, l / 0.36) : l < 0.72 ? mix(b, m, (l - 0.36) / 0.36) : mix(m, h, (l - 0.72) / 0.28);
  return mix(c * vec3(1.05, 0.8, 0.66) + lift * 0.4, d, 0.72);
}
vec3 samp(vec2 uv){
  // radial zoom blur toward the centre
  vec2 c = cover(uv);
  if (zoom < 0.01) return texture2D(tex, c).rgb;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 10; i++) {
    float k = 1.0 - float(i) * zoom * 0.028;
    acc += texture2D(tex, cover((uv - 0.5) * k + 0.5)).rgb;
  }
  return acc / 10.0;
}
float field(vec2 q, float r){
  vec2 c1 = vec2(0.03 * sin(time * 2.1), 0.02 * cos(time * 1.7));
  vec2 c2 = vec2(0.10 * sin(time * 1.3 + 1.0), 0.07 * cos(time * 1.9));
  vec2 c3 = vec2(0.09 * cos(time * 1.1 + 2.0), 0.09 * sin(time * 1.5));
  return r * r / dot(q - c1, q - c1) + 0.5 * r * r / dot(q - c2, q - c2) + 0.4 * r * r / dot(q - c3, q - c3);
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main(){
  float ar = res.x / res.y;
  vec2 uv = v;
  vec2 q = (v - 0.5) * vec2(ar, 1.0);
  float r = length(q);

  // extreme magnification around a drifting focus
  vec2 focus = vec2(0.5 + 0.06 * sin(time * 0.9), 0.55 + 0.05 * cos(time * 0.7));
  uv = mix(uv, focus + (uv - focus) * 0.2, mag);

  // swirl twist that unwinds
  float ang = swirl * pow(max(0.0, 1.0 - r / 0.85), 2.0);
  vec2 d = uv - 0.5; float cs = cos(ang), sn = sin(ang);
  uv = 0.5 + vec2(cs * d.x - sn * d.y, sn * d.x + cs * d.y);

  // fisheye bubble
  vec2 fd = uv - 0.5; float fr = length(fd * vec2(ar, 1.0));
  uv = mix(uv, 0.5 + fd * (0.5 + 0.9 * fr * fr), fish);

  vec3 col = grade(samp(uv));

  // chrome droplet in the middle of the frame
  if (drop > 0.01) {
    float R = 0.27 * drop + 0.035 * sin(time * 3.0) * drop;
    float f = field(q, R);
    float inside = smoothstep(0.95, 1.08, f);
    vec2 e = vec2(0.002, 0.0);
    vec2 g = vec2(field(q + e.xy, R) - field(q - e.xy, R), field(q + e.yx, R) - field(q - e.yx, R));
    vec2 n = normalize(g + 1e-5);
    float edge = 1.0 - smoothstep(1.0, 2.2, f);
    vec2 refr = 0.5 - (v - 0.5) * 0.8 + n * 0.12 * edge;           // a glass ball flips the scene
    vec2 refl = 0.5 + n * (0.18 + 0.35 * edge) + (v - 0.5) * 0.3;
    vec3 a = grade(texture2D(tex, cover(refr)).rgb);
    vec3 b = grade(texture2D(tex, cover(refl)).rgb);
    float lb = dot(b, vec3(0.33));
    vec3 chrome = mix(a * 1.15, vec3(lb) * vec3(1.2, 1.0, 0.9), 0.55 * edge);
    chrome += vec3(1.0, 0.92, 0.84) * pow(edge, 6.0) * 0.75;         // bright chrome rim
    chrome *= 1.0 - 0.45 * smoothstep(0.35, 0.6, edge) * (1.0 - smoothstep(0.6, 0.85, edge)); // dark band
    col = mix(col, chrome, inside);
  }

  // the opening: dark liquid swirling out of black
  if (dark > 0.01) {
    float f = field(q * 0.6, 0.30);
    float rim = smoothstep(0.7, 1.0, f) * (1.0 - smoothstep(1.0, 1.9, f));
    vec3 liquid = vec3(0.02, 0.006, 0.004) + vec3(0.95, 0.42, 0.16) * rim * 0.55 + col * 0.12 * smoothstep(1.0, 2.5, f);
    col = mix(col, liquid, dark);
  }

  col *= 1.0 - fish * 0.85 * smoothstep(0.42, 0.78, fr);                // bubble edges fall to black
  float vig = smoothstep(1.25, 0.3, length((v - 0.5) * vec2(ar * 0.85, 1.0)));
  col *= mix(0.5, 1.0, vig);
  col += flash * 0.35;
  col += (hash(v * res + time) - 0.5) * 0.06;                          // grain
  gl_FragColor = vec4(col, 1.0);
}`;

export function initHero(host, { onOpeningDone, onBeat } = {}) {
  const canvas = host.querySelector("canvas");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false, powerPreference: "high-performance" });
  if (!gl) return fallback();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (err) { console.warn("[RUMOAR] hero shader failed, using fallback", err); return fallback(); }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ["res", "texRes", "time", "kb", "dark", "mag", "zoom", "drop", "swirl", "fish", "lift", "flash"].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));

  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]].forEach(([k, val]) => gl.texParameteri(gl.TEXTURE_2D, k, val));
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([11, 3, 2, 255]));

  // preload every source once
  const media = new Map();
  const load = (item) => {
    if (media.has(item.src)) return media.get(item.src);
    let el;
    if (item.kind === "video") {
      el = Object.assign(document.createElement("video"), { src: item.src, muted: true, playsInline: true, loop: true, preload: "auto" });
      el.setAttribute("muted", ""); el.setAttribute("playsinline", "");
    } else { el = new Image(); el.decoding = "async"; el.src = item.src; }
    media.set(item.src, el); return el;
  };
  [...OPENING, ...REEL].forEach(load);

  let seq = [], idx = -1, segStart = 0, current = null, started = false, visible = true, inOpening = true, imageUploaded = false;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  function next(now) {
    if (current?.el?.pause) current.el.pause();
    idx++;
    if (inOpening && idx >= OPENING.length) { inOpening = false; idx = 0; onOpeningDone?.(); }
    const list = inOpening ? OPENING : REEL;
    const item = list[idx % list.length];
    const el = load(item);
    current = { ...item, el, ms: item.ms || (item.kind === "video" ? 3600 : 2800), fx: item.fx || { zoom: [0.55, 0], fish: [0.25, 0] } };
    if (el.tagName === "VIDEO") { try { el.currentTime = 0; } catch {} el.play().catch(() => {}); }
    imageUploaded = false;
    segStart = now;
    onBeat?.(inOpening ? idx : -1);
  }

  function upload() {
    const el = current.el;
    if (el.tagName === "VIDEO") {
      if (el.readyState < 2) return;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el);
      gl.uniform2f(U.texRes, el.videoWidth || 960, el.videoHeight || 540);
    } else if (!imageUploaded && el.complete && el.naturalWidth) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el);
      gl.uniform2f(U.texRes, el.naturalWidth, el.naturalHeight);
      imageUploaded = true;
    }
  }

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.25 : 1.5);
    canvas.width = Math.round(canvas.clientWidth * dpr); canvas.height = Math.round(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  addEventListener("resize", resize); resize();

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!started || !current) return;
    if (current.el.tagName === "VIDEO") visible ? current.el.play().catch(() => {}) : current.el.pause();
  }, { threshold: 0.01 }).observe(host);

  function frame(now) {
    requestAnimationFrame(frame);
    if (!started || !visible) return;
    if (!current || now - segStart >= current.ms) next(now);
    const t = Math.min(1, (now - segStart) / current.ms);
    const fx = current.fx;
    const env = (k, def = 0) => (fx[k] ? lerp(fx[k][0], fx[k][1], ease(t)) : def);
    upload();
    gl.uniform2f(U.res, canvas.width, canvas.height);
    gl.uniform1f(U.time, now / 1000);
    gl.uniform1f(U.kb, current.kind === "image" ? 1 + 0.07 * t : 1);
    gl.uniform1f(U.dark, env("dark") * (1 - Math.max(0, t - 0.75) * 4));
    gl.uniform1f(U.mag, env("mag"));
    gl.uniform1f(U.zoom, env("zoom"));
    gl.uniform1f(U.drop, fx.drop ? env("drop") * Math.min(1, t * 5) : 0);
    gl.uniform1f(U.swirl, env("swirl"));
    gl.uniform1f(U.fish, env("fish"));
    gl.uniform1f(U.lift, env("lift"));
    gl.uniform1f(U.flash, Math.max(0, 1 - (now - segStart) / 120) * (inOpening ? 0.6 : 0.3));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  requestAnimationFrame(frame);

  function fallback() {
    host.classList.add("is-fallback");
    const vd = Object.assign(document.createElement("video"), { src: pickVideo("assets/video/street-a.mp4"), muted: true, loop: true, playsInline: true, className: "hero__fallback" });
    vd.setAttribute("muted", ""); vd.setAttribute("playsinline", "");
    host.querySelector(".hero__film").appendChild(vd);
    return { start() { vd.play().catch(() => {}); setTimeout(() => onOpeningDone?.(), 600); } };
  }

  return {
    start() {
      if (started) return;
      started = true;
      if (reduce) { inOpening = false; idx = -1; onOpeningDone?.(); }
      host.classList.add("is-on");
    },
  };
}
