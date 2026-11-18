// RUMOAR intro.
// Image fragments flash in on a black grid as coarse pixel blocks that
// sharpen, pictures half-assemble and break apart, then the blocks gather
// into the RUMOAR wordmark made of imagery, and the whole thing dissolves
// block by block into the homepage. No counter. Plays once per session,
// skippable by click / key, skipped for reduced motion.

const TILES = Array.from({ length: 23 }, (_, i) => `assets/intro/${String(i).padStart(2, "0")}.webp`);
const KEY = "rumoar.intro.v2";

export function runIntro(onDone) {
  const root = document.getElementById("intro");
  const finish = () => { root?.remove(); document.documentElement.classList.remove("is-intro"); onDone?.(); };
  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === "1"; } catch {}
  if (!root || seen || matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
  try { sessionStorage.setItem(KEY, "1"); } catch {}

  const canvas = root.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  let W, H, dpr, cell, cols, rows;
  const layers = []; // per image: [coarse(1px per cell), mid(4px per cell), full] cover-fitted to screen

  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    cell = Math.max(8, Math.min(24, Math.round(W / 60)));
    cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);
  }
  size();

  function coverCanvas(img, w, h) {
    const c = document.createElement("canvas"); c.width = Math.max(1, w); c.height = Math.max(1, h);
    const g = c.getContext("2d");
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const iw = img.naturalWidth * s, ih = img.naturalHeight * s;
    g.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
    return c;
  }
  const buildLayers = (img) => [coverCanvas(img, cols, rows), coverCanvas(img, cols * 4, rows * 4), coverCanvas(img, Math.round(W * dpr), Math.round(H * dpr))];

  // wordmark mask on the cell grid
  function wordMask() {
    const c = document.createElement("canvas"); c.width = cols; c.height = rows;
    const g = c.getContext("2d");
    let fs = rows;
    g.font = `600 ${fs}px Poppins, "Helvetica Neue", Arial, sans-serif`;
    const target = cols * (W < 700 ? 0.9 : 0.78);
    fs = fs * target / g.measureText("RUMOAR").width;
    g.font = `600 ${fs}px Poppins, "Helvetica Neue", Arial, sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff";
    g.fillText("RUMOAR", cols / 2, rows / 2);
    const d = g.getImageData(0, 0, cols, rows).data, cells = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (d[(y * cols + x) * 4 + 3] > 110) cells.push([x, y]);
    return cells.sort(() => Math.random() - 0.5);
  }

  const rand = (a, b) => a + Math.random() * (b - a);
  const bursts = [];
  let word = null, wordImg = 0, t0 = 0, raf = 0, ended = false, exitAt = Infinity, exitOrder = null;

  function spawn(now) {
    const i = Math.floor(Math.random() * layers.length);
    const w = Math.max(2, Math.round(rand(0.06, 0.28) * cols)), h = Math.max(2, Math.round(rand(0.08, 0.32) * rows));
    const x = Math.floor(rand(0, cols - w)), y = Math.floor(rand(0, rows - h));
    bursts.push({ i, x, y, w, h, born: now, life: rand(520, 980) });
  }

  // draw a rect of cells from image layer at a sharpness stage: 0 coarse, 1 mid, 2 full
  function blit(L, stage, x, y, w, h, alpha) {
    const src = L[stage], k = stage === 0 ? 1 : stage === 1 ? 4 : (src.width / cols);
    ctx.globalAlpha = alpha;
    ctx.drawImage(src, x * k, y * k, w * k, h * k, x * cell * dpr, y * cell * dpr, w * cell * dpr, h * cell * dpr);
  }

  function frame(now) {
    if (ended) return;
    const t = now - t0;
    ctx.globalAlpha = 1; ctx.fillStyle = "#0b0302"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // phase 1: random bursts (0 to 2.1s), denser as it goes
    if (t < 2100 && Math.random() < 0.18 + t / 5200) spawn(now);
    for (let b = bursts.length - 1; b >= 0; b--) {
      const s = bursts[b], age = now - s.born, p = age / s.life;
      if (p >= 1) { bursts.splice(b, 1); continue; }
      const stage = p < 0.28 ? 0 : p < 0.55 ? 1 : 2;
      const fade = t > 2200 ? Math.max(0, 1 - (t - 2200) / 300) : 1;
      blit(layers[s.i], stage, s.x, s.y, s.w, s.h, (p > 0.82 ? (1 - p) / 0.18 : 1) * fade);
    }

    // phase 2: wordmark assembles from image blocks (1.9s to 3.0s)
    if (t > 1900) {
      const L = layers[wordImg];
      const n = Math.floor(word.length * Math.min(1, (t - 1900) / 800));
      const sharp = t < 2500 ? 0 : t < 2850 ? 1 : 2;
      const gone = exitOrder ? Math.floor(word.length * Math.min(1, (now - exitAt) / 420)) : 0;
      for (let k = gone; k < n; k++) {
        const [x, y] = exitOrder ? word[exitOrder[k]] : word[k];
        blit(L, sharp, x, y, 1, 1, 1);
        ctx.globalAlpha = 1; ctx.fillStyle = "#0b0302";
        ctx.fillRect((x + 1) * cell * dpr - dpr, y * cell * dpr, dpr, cell * dpr); // hairline grid between blocks
        ctx.fillRect(x * cell * dpr, (y + 1) * cell * dpr - dpr, cell * dpr, dpr);
      }
    }
    ctx.globalAlpha = 1;

    if (t > 3500 && !exitOrder) leave(now);
    if (exitOrder && now - exitAt > 900) return done();
    raf = requestAnimationFrame(frame);
  }

  function leave(now) {
    exitAt = now || performance.now();
    exitOrder = word.map((_, i) => i).sort(() => Math.random() - 0.5);
    root.classList.add("is-leaving");
  }
  function done() {
    if (ended) return; ended = true;
    cancelAnimationFrame(raf);
    removeEventListener("keydown", skip); root.removeEventListener("click", skip);
    finish();
  }
  const skip = () => { if (!exitOrder && word) leave(); else if (!word) done(); };
  addEventListener("keydown", skip); root.addEventListener("click", skip);

  // load images (and the font, briefly) then start; bail out if anything is slow
  const load = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  const fontWait = Promise.race([document.fonts?.load('600 40px Poppins') ?? Promise.resolve(), new Promise((r) => setTimeout(r, 900))]);
  const guard = setTimeout(() => { if (!t0) done(); }, 5000);
  Promise.all([Promise.all(TILES.map(load)), fontWait]).then(([imgs]) => {
    clearTimeout(guard);
    if (ended) return;
    imgs.filter(Boolean).forEach((im) => layers.push(buildLayers(im)));
    if (!layers.length) return done();
    word = wordMask();
    wordImg = Math.min(1, layers.length - 1); // the street close-up fills the letters
    root.classList.add("is-live");
    t0 = performance.now();
    raf = requestAnimationFrame(frame);
  });
}
