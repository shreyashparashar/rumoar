// RUMOAR intro, about six seconds, no name and no counter.
// 1) A 5×5 block portrait breathes in the middle of the screen. Blocks ease on
//    and off, and every new face ripples outward from the centre block.
// 2) The mosaic spreads across the whole screen as each new face rolls in as a wave.
// 3) The seams close up and the last frame turns into one full-colour HD image,
//    slowly pushing in.
// 4) The blocks fall away in a diagonal wave and the film underneath takes over.
// Captions follow the faces: The Maverick, The Outlier ... Who are you today?
// Plays once per session; a tap or key press jumps to the exit.

const FACES = [
  { src: "assets/intro/f0.webp", fx: 0.5, fy: 0.4, cap: "The Maverick." },
  { src: "assets/intro/f1.webp", fx: 0.45, fy: 0.26, cap: "The Outlier." },
  { src: "assets/intro/f2.webp", fx: 0.5, fy: 0.3, cap: "The Purist." },
  { src: "assets/intro/f3.webp", fx: 0.56, fy: 0.26, cap: "The Operator." },
  { src: "assets/intro/f4.webp", fx: 0.62, fy: 0.36, cap: "The Drifter." },
  { src: "assets/intro/f5.webp", fx: 0.55, fy: 0.4, cap: "The Nomad." },
  { src: "assets/intro/f6.webp", fx: 0.5, fy: 0.22, cap: "The Strategist." },
  { src: "assets/intro/f7.webp", fx: 0.62, fy: 0.35, cap: "Who are you today?" },
];
const KEY = "rumoar.intro.v3";
// face index → when its wave leaves the centre (ms)
const WAVES = [300, 820, 1340, 1860, 2520, 3120, 3700, 4300];
const T = { spreadFrom: 2300, spreadTo: 3900, seamFrom: 3900, seamTo: 4700, exit: 5350, end: 6500 };

const ease = (k) => 1 - Math.pow(1 - k, 3);
const easeIO = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function runIntro(onDone, onLeave) {
  const root = document.getElementById("intro");
  const finish = () => { root?.remove(); document.documentElement.classList.remove("is-intro"); onDone?.(); };
  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === "1"; } catch {}
  if (!root || seen || matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
  try { sessionStorage.setItem(KEY, "1"); } catch {}

  const canvas = root.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const line = root.querySelector(".intro__line");
  const imgs = FACES.map(() => null);
  let W, H, dpr, cell, gx0, gy0, nx, ny, cx0, cy0, maxD, cells = [], ended = false, raf = 0, t0 = 0, left = false, capIdx = -1;

  function fit() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    cell = Math.round(Math.min(W * 0.34, H * 0.3, 270) / 5);
    // the 5×5 cluster sits dead centre; the rest of the grid extends from it
    cx0 = Math.round(W / 2 - cell * 2.5); cy0 = Math.round(H / 2 - cell * 2.5);
    gx0 = -Math.ceil(cx0 / cell); gy0 = -Math.ceil(cy0 / cell);
    nx = Math.ceil((W - cx0) / cell) - gx0; ny = Math.ceil((H - cy0) / cell) - gy0;
    maxD = 0;
    cells = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const gx = gx0 + i, gy = gy0 + j, d = Math.hypot(gx - 2, gy - 2);
      maxD = Math.max(maxD, d);
      cells.push({ gx, gy, d, s: 0, seed: Math.random(), face: 0, swapAt: -1e9, inCluster: gx >= 0 && gy >= 0 && gx < 5 && gy < 5 });
    }
  }

  // cover-crop maths per face, around its focal point, with an optional push-in
  function mapFor(f, zoom) {
    const im = imgs[f]; if (!im) return null;
    const iw = im.naturalWidth, ih = im.naturalHeight, s = Math.max(W / iw, H / ih) * zoom;
    const ox = clamp(W / 2 - FACES[f].fx * iw * s, W - iw * s, 0);
    const oy = clamp(H / 2 - FACES[f].fy * ih * s, H - ih * s, 0);
    return { im, s, ox, oy };
  }

  // which face a cell shows at time t: the latest wave that has reached it
  function faceAt(c, t) {
    let f = 0;
    for (let k = 0; k < WAVES.length; k++) {
      const speed = t < T.spreadFrom ? 90 : 42; // ms per block of distance
      if (t >= WAVES[k] + c.d * speed && imgs[k]) f = k;
    }
    return f;
  }

  let pattern = new Set(), nextPattern = 0;
  function newPattern() {
    pattern = new Set();
    const k = Math.random();
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
      const d = Math.hypot(x - 2, y - 2);
      const on = k < 0.4 ? d < 1.6 + Math.random() * 1.4 : k < 0.75 ? (x + y) % 2 === 0 || d < 1 : Math.random() < 0.62;
      if (on) pattern.add(`${x},${y}`);
    }
  }

  function setCaption(i) {
    if (i === capIdx) return;
    capIdx = i;
    line.classList.add("is-swap");
    setTimeout(() => { line.textContent = FACES[i].cap; line.classList.remove("is-swap"); }, 160);
  }

  function frame(now) {
    if (ended) return;
    raf = requestAnimationFrame(frame);
    const t = now - t0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    if (t < T.spreadFrom && now > nextPattern) { newPattern(); nextPattern = now + 260; }
    const spread = easeIO(clamp((t - T.spreadFrom) / (T.spreadTo - T.spreadFrom)));
    const R = 3.2 + (maxD + 2 - 3.2) * spread;
    const density = 0.45 + 0.55 * spread;
    const seam = 1 - ease(clamp((t - T.seamFrom) / (T.seamTo - T.seamFrom)));
    const gap = Math.max(0, 2 * seam);
    const zoom = 1 + 0.06 * ease(clamp((t - T.seamFrom) / (T.end - T.seamFrom)));
    const exitK = clamp((t - T.exit) / (T.end - T.exit));
    if (exitK > 0 && !left) { left = true; root.classList.add("is-leaving"); line.classList.add("is-out"); onLeave?.(); }

    const maps = FACES.map((_, f) => mapFor(f, zoom));
    let centreFace = 0;
    for (const c of cells) {
      // where this block should be: on or off, and how big
      let target;
      if (t < T.spreadFrom) target = c.inCluster && pattern.has(`${c.gx},${c.gy}`) ? 1 : 0;
      else if (t < T.spreadTo) target = c.d < R && (c.seed < density || c.d < R - 4) ? 1 : 0;
      else target = 1;
      c.s += (target - c.s) * (t < T.spreadFrom ? 0.3 : 0.22);
      if (t >= T.spreadTo) c.s = Math.max(c.s, ease(clamp((t - T.spreadTo) / 300)));

      const f = faceAt(c, t);
      if (f !== c.face) { c.face = f; c.swapAt = t; }
      if (c.gx === 2 && c.gy === 2) centreFace = f;
      // a little dip when a new face rolls through this block
      const sk = clamp((t - c.swapAt) / 220);
      let scale = c.s * (1 - 0.28 * Math.sin(Math.PI * sk) * (sk < 1 ? 1 : 0));
      let alpha = 1;
      if (exitK > 0) {
        const order = ((c.gx - gx0) + (c.gy - gy0)) / (nx + ny);
        const local = clamp((exitK * 1.7 - order * 0.7) / 0.45);
        scale *= 1 - ease(local); alpha = 1 - local * 0.5;
      }
      if (scale < 0.02) continue;
      const m = maps[c.face]; if (!m) continue;
      const x = cx0 + c.gx * cell, y = cy0 + c.gy * cell;
      const size = cell * scale - gap, o = (cell - size) / 2;
      ctx.globalAlpha = alpha;
      ctx.drawImage(m.im, (x + o - m.ox) / m.s, (y + o - m.oy) / m.s, size / m.s, size / m.s, x + o, y + o, size, size);
    }
    ctx.globalAlpha = 1;
    setCaption(centreFace);
    if (exitK >= 1) done();
  }

  function done() {
    if (ended) return; ended = true;
    cancelAnimationFrame(raf);
    removeEventListener("keydown", skip); root.removeEventListener("click", skip);
    finish();
  }
  function skip() {
    if (!t0) return done();
    const t = performance.now() - t0;
    if (t < T.exit) t0 = performance.now() - T.exit;
  }
  addEventListener("keydown", skip); root.addEventListener("click", skip);
  addEventListener("resize", () => { if (t0) fit(); });

  const load = (i) => new Promise((res) => {
    const im = new Image(); im.decoding = "async";
    im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => { imgs[i] = im; res(); }); };
    im.onerror = () => res();
    im.src = FACES[i].src;
  });
  const guard = setTimeout(() => { if (!t0) done(); }, 7000);
  // start as soon as the first few faces are in; the rest keep loading behind
  const rest = FACES.map((_, i) => i).slice(3);
  Promise.all([0, 1, 2].map(load)).then(() => {
    clearTimeout(guard);
    if (ended) return;
    if (!imgs[0]) return done();
    rest.forEach(load);
    fit();
    line.textContent = FACES[0].cap; capIdx = 0;
    root.classList.add("is-live");
    t0 = performance.now();
    raf = requestAnimationFrame(frame);
  });
}
