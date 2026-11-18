// Homepage: pixel intro, hero reel, TV wall, collage strips.
import { $, $$, reduceMotion, Flap, PRODUCTS, armReveals, onMember } from "./common.js";
import { runIntro } from "./intro.js";
import { initHero, pickVideo } from "./hero-gl.js";
import { initWordmark } from "./wordmark.js";

/* ───────── hero ───────── */
const heroEl = $("#hero");
const badge = new Flap($("#heroBadge"), 1);
const LETTERS = "RUMOAR";
const wordmark = initWordmark($("#heroWord"));
const hero = initHero(heroEl, {
  onBeat: (i) => { if (i >= 0) badge.set(LETTERS[i % LETTERS.length]); },
  onOpeningDone: () => { heroEl.classList.add("is-open"); wordmark.start(); poster.start(); },
});

/* ───────── phone poster: a full-bleed face that keeps changing who it is ───────── */
function initPoster(host) {
  const FACES = [["f0", 0.5, 0.4, "Maverick"], ["f1", 0.45, 0.26, "Outlier"], ["f2", 0.5, 0.3, "Purist"], ["f3", 0.56, 0.26, "Operator"],
    ["f4", 0.62, 0.36, "Drifter"], ["f5", 0.55, 0.4, "Nomad"], ["f6", 0.5, 0.22, "Strategist"]];
  const canvas = host.querySelector("canvas"), ctx = canvas.getContext("2d");
  const script = $("#heroScript"), idx = $("#heroIdx"), who = $("#heroWho");
  const imgs = [];
  let W, H, dpr, cur = 0, from = -1, swapAt = 0, shown = 0, running = false, visible = true;
  const CELL = 34, SWAP = 900, HOLD = 4200;
  const phone = () => innerWidth < 700;
  function fit() { dpr = Math.min(devicePixelRatio || 1, 2); W = host.clientWidth; H = host.clientHeight; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
  function map(f, zoom) {
    const im = imgs[f]; if (!im) return null;
    const iw = im.naturalWidth, ih = im.naturalHeight, s = Math.max(W / iw, H / ih) * zoom;
    const cl = (v, a, b) => Math.min(b, Math.max(a, v));
    // faces sit a little below the masthead
    return { im, s, ox: cl(W / 2 - FACES[f][1] * iw * s, W - iw * s, 0), oy: cl(H * 0.52 - FACES[f][2] * ih * s, H - ih * s, 0) };
  }
  function draw(now) {
    requestAnimationFrame(draw);
    if (!visible || !phone()) return;
    if (now - shown > HOLD && imgs[(cur + 1) % FACES.length]) { from = cur; cur = (cur + 1) % FACES.length; swapAt = now; shown = now; label(); }
    const zoom = 1.04 + 0.05 * Math.min(1, (now - shown) / (HOLD + SWAP));
    const a = map(cur, zoom), b = from >= 0 ? map(from, 1.09) : null;
    if (!a) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const k = (now - swapAt) / SWAP;
    if (!b || k >= 1) { from = -1; ctx.drawImage(a.im, -a.ox / a.s, -a.oy / a.s, W / a.s, H / a.s, 0, 0, W, H); return; }
    // the new face arrives block by block, rippling down from the masthead
    ctx.drawImage(b.im, -b.ox / b.s, -b.oy / b.s, W / b.s, H / b.s, 0, 0, W, H);
    for (let y = 0; y < H; y += CELL) for (let x = 0; x < W; x += CELL) {
      const order = (y / H) * 0.75 + (Math.abs(x - W / 2) / W) * 0.35 + ((x * 7 + y * 13) % 17) / 17 * 0.15;
      const t = Math.min(1, Math.max(0, (k * 1.5 - order) / 0.35));
      if (t <= 0) continue;
      const e = 1 - Math.pow(1 - t, 3), sz = CELL * e, o = (CELL - sz) / 2;
      ctx.drawImage(a.im, (x + o - a.ox) / a.s, (y + o - a.oy) / a.s, sz / a.s, sz / a.s, x + o, y + o, sz + 0.5, sz + 0.5);
    }
  }
  function label() {
    script.classList.add("is-out");
    setTimeout(() => {
      script.textContent = FACES[cur][3]; who.textContent = `The ${FACES[cur][3]}`; idx.textContent = String(cur + 1).padStart(2, "0");
      script.classList.remove("is-out");
    }, 380);
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.01 }).observe(host);
  addEventListener("resize", fit);
  // tap the face to change who you are
  host.parentElement.addEventListener("click", (e) => {
    if (!phone() || e.target.closest("a, button") || now() - swapAt < SWAP) return;
    if (e.clientY < (host.getBoundingClientRect().top + 70 + innerWidth * 0.4)) return; // taps on the word paint, not swap
    shown = -1e9;
  });
  const now = () => performance.now();
  return {
    start() {
      if (running || !phone()) return; running = true;
      fit();
      FACES.forEach(([n], i) => { const im = new Image(); im.onload = () => { imgs[i] = im; if (i === 0) host.classList.add("is-live"); }; im.src = `assets/intro/${n}.webp`; });
      shown = now();
      requestAnimationFrame(draw);
    },
  };
}
const poster = initPoster($("#heroPoster"));

/* ───────── TV wall: every screen keeps changing ───────── */
(() => {
  const productImgs = PRODUCTS.map((p) => p.images[0]);
  const live = [];
  const zap = (screen, fn) => { screen.classList.add("is-zap"); setTimeout(() => { fn(); screen.classList.remove("is-zap"); }, 140); };
  $$("#tvWall .set").forEach((set) => {
    const screen = document.createElement("div"); screen.className = "screen"; set.appendChild(screen);
    const [kind, arg = ""] = set.dataset.ch.split(/:(.*)/s);
    const chyron = (txt) => { const c = document.createElement("span"); c.className = "chyron"; c.textContent = txt; screen.appendChild(c); return c; };
    let next = () => {};
    if (kind === "video") {
      const vd = Object.assign(document.createElement("video"), { src: pickVideo(arg), muted: true, loop: true, playsInline: true, preload: "metadata" });
      vd.setAttribute("muted", ""); vd.setAttribute("playsinline", "");
      screen.appendChild(vd); chyron("Live");
      live.push({ el: set, on: () => vd.play().catch(() => {}), off: () => vd.pause() });
      next = () => { vd.currentTime = (vd.currentTime + 1.7) % (vd.duration || 5); };
    } else if (kind === "word") {
      const w = document.createElement("div"); w.className = "word"; w.textContent = "RUMOAR"; screen.appendChild(w);
      const words = ["RUMOAR", "WHO ARE YOU?", "DROP 01", "OWN THE LOOK", "NOISE OFF", "FOCUS ON"];
      let k = 0; next = () => { k = (k + 1) % words.length; w.textContent = words[k]; };
      setInterval(() => !reduceMotion && zap(screen, next), 3800);
    } else if (kind === "static") {
      const c = document.createElement("canvas"); c.width = 120; c.height = 90; screen.appendChild(c);
      const g = c.getContext("2d"), img = g.createImageData(120, 90);
      const clock = chyron("No signal"); clock.dataset.clock = "";
      let on = false;
      // static, with a bouncing screensaver logo that changes colour on every wall hit
      const COLS = ["#ff8a3d", "#f6efe6", "#e5341f", "#ffd27a", "#ff5fa2"];
      let bx = 20, by = 30, vx = 0.55, vy = 0.42, col = 0;
      const draw = () => {
        if (!on) return;
        for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 120; img.data[i] = v; img.data[i + 1] = v * 0.55; img.data[i + 2] = v * 0.4; img.data[i + 3] = 255; }
        g.putImageData(img, 0, 0);
        g.font = "700 13px Poppins, sans-serif";
        const tw = g.measureText("RUMOAR").width;
        bx += vx; by += vy;
        if (bx < 2 || bx + tw > 118) { vx *= -1; col = (col + 1) % COLS.length; bx = Math.max(2, Math.min(118 - tw, bx)); }
        if (by < 14 || by > 86) { vy *= -1; col = (col + 1) % COLS.length; by = Math.max(14, Math.min(86, by)); }
        g.fillStyle = COLS[col]; g.fillText("RUMOAR", bx, by);
        requestAnimationFrame(draw);
      };
      live.push({ el: set, on: () => { if (!on && !reduceMotion) { on = true; draw(); } }, off: () => { on = false; } });
    } else {
      const list = kind === "products" ? productImgs : arg.split("|");
      const im = document.createElement("img"); im.alt = ""; im.loading = "lazy"; im.src = list[0]; screen.appendChild(im);
      const tag = chyron(kind === "products" ? PRODUCTS[0].name : "Ch. 01");
      let k = 0;
      next = () => { k = (k + 1) % list.length; im.src = list[k]; tag.textContent = kind === "products" ? PRODUCTS[k].name : `Ch. ${String(k + 1).padStart(2, "0")}`; };
      setInterval(() => !reduceMotion && zap(screen, next), kind === "products" ? 1900 : 2800 + Math.random() * 1200);
    }
    set.addEventListener("click", () => zap(screen, next));
  });
  const io = new IntersectionObserver((es) => es.forEach((e) => { const l = live.find((x) => x.el === e.target); if (l) (e.isIntersecting ? l.on() : l.off()); }), { threshold: 0.1 });
  live.forEach((l) => io.observe(l.el));
})();

/* ───────── own the look: a horizontal gallery driven by scroll ───────── */
(() => {
  const sec = $("#look"), track = $("#lookTrack"), bg = $("#lookBg"), count = $("#lookCount"), bar = $("#lookBar");
  const looks = [["16", "Golden hour"], ["17", "After dark"], ["05", "Commute"], ["12", "Statement"], ["18", "Future proof"], ["06", "Colour hit"],
    ["10", "Chrome"], ["22", "Street"], ["00", "Mirror, mirror"], ["11", "Red room"], ["30", "Denim on denim"], ["13", "Office hours"],
    ["26", "Rush hour"], ["20", "Neighbourhood"], ["19", "Off duty"], ["29", "Check mate"]];
  track.innerHTML = looks.map(([id, name], i) => `
    <figure class="look__card${i % 2 ? " look__card--low" : ""}">
      <div class="look__img"><img src="assets/collage/${id}.webp" alt="" loading="${i < 4 ? "eager" : "lazy"}" /></div>
      <figcaption><span>${String(i + 1).padStart(2, "0")}</span>${name}</figcaption>
    </figure>`).join("");
  const cards = $$(".look__card", track);
  let travel = 0, ticking = false;
  function size() {
    travel = Math.max(0, track.scrollWidth - innerWidth);
    sec.style.height = `${travel + innerHeight}px`;
    update();
  }
  function update() {
    ticking = false;
    const p = Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / Math.max(1, travel)));
    track.style.transform = `translate3d(${-p * travel}px, 0, 0)`;
    bg.style.transform = `translate3d(${-p * 35}%, -50%, 0)`;
    bar.style.transform = `scaleX(${p})`;
    const mid = innerWidth / 2;
    let best = 0, bestD = Infinity;
    cards.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid);
      const k = Math.max(0, 1 - d / (innerWidth * 0.6));
      c.style.setProperty("--k", k.toFixed(3));
      if (d < bestD) { bestD = d; best = i; }
    });
    cards.forEach((c, i) => c.classList.toggle("is-focus", i === best));
    count.textContent = `${String(best + 1).padStart(2, "0")} / ${cards.length}`;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener("resize", size);
  addEventListener("load", size);
  $$("img", track).forEach((im) => im.addEventListener("load", size, { once: true }));
  size();
})();

/* ───────── live: the sticker. Grab it, throw it, it spins and settles ───────── */
(() => {
  const el = $("#sticker"), sec = $("#onair");
  if (!el) return;
  let x = 0, y = 0, rot = -12, vx = 0, vy = 0, vr = 0, drag = null, raf = 0;
  const place = () => {
    const r = sec.getBoundingClientRect(), s = el.offsetWidth;
    x = Math.min(x, r.width - s); y = Math.min(y, r.height - s);
  };
  // starts stuck on the corner of the first screen, like a sticker on a telly
  const init = () => {
    const r = sec.getBoundingClientRect(), s = el.offsetWidth, wall = $("#tvWall").getBoundingClientRect();
    const phone = innerWidth < 700;
    x = phone ? r.width - s - 10 : wall.left - r.left + wall.width * 0.36 - s * 0.6;
    y = wall.top - r.top + (phone ? 14 : -s * 0.42);
    render();
  };
  const render = () => { el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`; };
  const step = () => {
    if (drag) return;
    const r = sec.getBoundingClientRect(), s = el.offsetWidth;
    x += vx; y += vy; rot += vr;
    if (x < 0 || x > r.width - s) { vx *= -0.6; x = Math.max(0, Math.min(r.width - s, x)); }
    if (y < 0 || y > r.height - s) { vy *= -0.6; y = Math.max(0, Math.min(r.height - s, y)); }
    vx *= 0.94; vy *= 0.94; vr *= 0.93;
    render();
    if (Math.abs(vx) + Math.abs(vy) + Math.abs(vr) > 0.05) raf = requestAnimationFrame(step);
  };
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault(); el.setPointerCapture(e.pointerId); cancelAnimationFrame(raf);
    drag = { px: e.clientX, py: e.clientY, x, y, t: performance.now() };
    el.classList.add("is-drag");
  });
  el.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const nx = drag.x + e.clientX - drag.px, ny = drag.y + e.clientY - drag.py;
    vx = (nx - x); vy = (ny - y); vr = vx * 0.6;
    x = nx; y = ny; rot += vr * 0.2; render();
  });
  const up = () => { if (!drag) return; drag = null; el.classList.remove("is-drag"); raf = requestAnimationFrame(step); };
  el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  addEventListener("resize", () => { place(); render(); });
  init();
})();

/* ───────── live: crossing keyword tapes ───────── */
$$("[data-tape]").forEach((t) => {
  const words = t.dataset.tape.split("|").map((w) => `<span>${w}</span><i>✦</i>`).join("");
  t.innerHTML = words + words + words + words;
});

/* signing up from the homepage takes you straight into the drop */
onMember(() => setTimeout(() => { location.href = "drop.html"; }, 1400));

armReveals();
runIntro(() => hero.start(), () => hero.start());
