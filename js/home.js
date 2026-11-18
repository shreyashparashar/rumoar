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
  onOpeningDone: () => { heroEl.classList.add("is-open"); wordmark.start(); },
});

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

/* ───────── live: pop-art wall. Same face, eight moods, palettes keep rolling ───────── */
(() => {
  const grid = $("#popGrid");
  if (!grid) return;
  const PALETTES = [
    ["#e5341f", "#ffd9b8"], ["#0b0302", "#ff8a3d"], ["#ff5fa2", "#fff0b3"], ["#1d3bff", "#ffc9a8"],
    ["#3a0a6b", "#ff8a3d"], ["#b0170c", "#ffd27a"], ["#0f7a5c", "#ffe7d6"], ["#7a1cff", "#ffb1c8"],
    ["#0b0302", "#f6efe6"], ["#0f2a6b", "#ffe0a0"],
  ];
  const MOODS = ["Monday", "Late night", "Date night", "Weekend", "Off duty", "Big meeting", "Gallery", "Afterparty"];
  grid.innerHTML = MOODS.map((m, i) => `
    <figure class="pop__tile" style="--a:${PALETTES[i][0]};--b:${PALETTES[i][1]}">
      <div class="pop__art"><img src="assets/pop/face.webp" alt="" loading="lazy" /><img class="pop__real" src="assets/pop/face-color.webp" alt="" loading="lazy" /></div>
      <figcaption><span>${String(i + 1).padStart(2, "0")}</span>${m}</figcaption>
    </figure>`).join("");
  const tiles = $$(".pop__tile", grid);
  tiles.forEach((t) => t.addEventListener("click", () => t.classList.toggle("is-real")));
  if (reduceMotion) return;
  let shift = 0;
  setInterval(() => {
    shift++;
    tiles.forEach((t, i) => setTimeout(() => {
      const p = PALETTES[(i + shift) % PALETTES.length];
      t.style.setProperty("--a", p[0]); t.style.setProperty("--b", p[1]);
    }, i * 90));
  }, 1600);
})();

/* signing up from the homepage takes you straight into the drop */
onMember(() => setTimeout(() => { location.href = "drop.html"; }, 1400));

armReveals();
runIntro(() => hero.start(), () => hero.start());
