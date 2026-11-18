// RUMOAR intro. Starts where the inspiration does and goes further:
// 1) a small block portrait flickers on black, its blocks switching on and off
//    while the face keeps changing;
// 2) the grid breaks out of the centre and spreads across the whole screen,
//    faster and faster, until every block is lit and one face fills the screen;
// 3) the blocks fall away in a diagonal wave, revealing the film underneath.
// No name, no counter. Plays once per session; tap / key skips.

const PORTRAITS = Array.from({ length: 8 }, (_, i) => `assets/intro/p${i}.webp`);
const KEY = "rumoar.intro.v2";

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
  let W, H, dpr, cell, cols, rows, cx0, cy0, imgs = [], covers = [], ended = false, raf = 0, t0 = 0, left = false;
  const T = { cluster: 1500, spread: 2600, full: 3050, exit: 3800 };

  function fit() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const cluster = Math.min(W * 0.34, H * 0.3, 260);
    cell = Math.round(cluster / 5);
    cols = Math.ceil(W / cell) + 1; rows = Math.ceil(H / cell) + 1;
    // anchor the grid so the 5×5 cluster sits exactly in the middle
    cx0 = Math.round(W / 2 - cell * 2.5); cy0 = Math.round(H * 0.5 - cell * 2.5);
    covers = imgs.map((im) => coverCanvas(im));
  }
  function coverCanvas(im) {
    const c = document.createElement("canvas"); c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    const g = c.getContext("2d"), s = Math.max(c.width / im.naturalWidth, c.height / im.naturalHeight);
    g.drawImage(im, (c.width - im.naturalWidth * s) / 2, (c.height - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
    return c;
  }

  // per-cell state for the spread phase
  const rand = (a, b) => a + Math.random() * (b - a);
  let pattern = [], img = 0, nextTick = 0, seedPhase = [];
  const key = (x, y) => `${x},${y}`;

  function clusterPattern() {
    const cells = [];
    if (Math.random() < 0.1) return cells;
    const on = (x, y) => { if (x >= 0 && y >= 0 && x < 5 && y < 5) cells.push([x, y]); };
    const cx = 1 + Math.floor(Math.random() * 3), cy = 1 + Math.floor(Math.random() * 3), k = Math.random();
    if (k < 0.35) { on(cx, cy); on(cx - 1, cy); on(cx + 1, cy); on(cx, cy - 1); on(cx, cy + 1); }
    else if (k < 0.7) { for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) if ((x + y) % 2 === cx % 2 && Math.random() < 0.85) on(x, y); }
    else { for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) if (Math.random() < 0.42) on(x, y); }
    return cells;
  }

  function frame(now) {
    if (ended) return;
    raf = requestAnimationFrame(frame);
    const t = now - t0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const c = cell * dpr;
    const blit = (src, gx, gy, scale = 1, alpha = 1) => {
      const x = (cx0 + gx * cell) * dpr, y = (cy0 + gy * cell) * dpr;
      const s = c * scale, o = (c - s) / 2;
      ctx.globalAlpha = alpha;
      ctx.drawImage(src, x, y, c, c, x + o, y + o, s, s);
    };

    if (t < T.cluster) {
      if (now > nextTick) { nextTick = now + rand(140, 220); if (Math.random() < 0.34) img = (img + 1) % covers.length; pattern = clusterPattern(); }
      pattern.forEach(([x, y]) => blit(covers[img], x, y));
    } else if (t < T.full) {
      // spread: a growing radius of lit blocks, flickering faster as it grows
      const k = Math.min(1, (t - T.cluster) / (T.spread - T.cluster));
      if (now > nextTick) { nextTick = now + lerp(170, 60, k); if (Math.random() < 0.5) img = (img + 1) % covers.length; seedPhase = []; }
      const R = lerp(3, Math.hypot(cols, rows), Math.pow(k, 1.4));
      const density = lerp(0.35, 1, Math.pow(k, 2));
      for (let gy = -Math.ceil(cy0 / cell) - 1; gy < rows; gy++) {
        for (let gx = -Math.ceil(cx0 / cell) - 1; gx < cols; gx++) {
          const d = Math.hypot(gx - 2, gy - 2);
          if (d > R) continue;
          const id = key(gx, gy);
          if (seedPhase[id] === undefined) seedPhase[id] = Math.random();
          if (t < T.spread && seedPhase[id] > density) continue;
          const edge = Math.min(1, (R - d) / 2);
          blit(covers[img], gx, gy, 0.6 + 0.4 * edge);
        }
      }
    } else {
      // exit: blocks fall away in a diagonal wave
      const k = Math.min(1, (t - T.full) / (T.exit - T.full));
      if (!left) { left = true; root.classList.add("is-leaving"); line.classList.add("is-out"); onLeave?.(); }
      const span = cols + rows;
      for (let gy = -Math.ceil(cy0 / cell) - 1; gy < rows; gy++) {
        for (let gx = -Math.ceil(cx0 / cell) - 1; gx < cols; gx++) {
          const order = (gx + Math.ceil(cx0 / cell) + gy + Math.ceil(cy0 / cell)) / span;
          const local = Math.min(1, Math.max(0, (k * 1.6 - order * 0.6) / 0.4));
          if (local >= 1) continue;
          blit(covers[img], gx, gy, 1 - local, 1 - local * 0.6);
        }
      }
      if (k >= 1) return done();
    }
    ctx.globalAlpha = 1;
  }
  const lerp = (a, b, k) => a + (b - a) * k;

  function done() {
    if (ended) return; ended = true;
    cancelAnimationFrame(raf);
    removeEventListener("keydown", skip); root.removeEventListener("click", skip);
    finish();
  }
  // skipping jumps straight to the falling-blocks exit
  function skip() { if (t0 && performance.now() - t0 < T.full) t0 = performance.now() - T.full; else if (!t0) done(); }
  addEventListener("keydown", skip); root.addEventListener("click", skip);
  addEventListener("resize", () => { if (imgs.length) fit(); });

  const load = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  const guard = setTimeout(() => { if (!t0) done(); }, 6000);
  Promise.all(PORTRAITS.map(load)).then((list) => {
    clearTimeout(guard);
    if (ended) return;
    imgs = list.filter(Boolean);
    if (!imgs.length) return done();
    fit();
    root.classList.add("is-live");
    t0 = performance.now();
    raf = requestAnimationFrame(frame);
  });
}
