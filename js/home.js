// Homepage: pixel intro, hero reel, TV wall, collage strips.
import { $, $$, reduceMotion, Flap, PRODUCTS, armReveals, onMember } from "./common.js";
import { runIntro } from "./intro.js";
import { initHero, pickVideo } from "./hero-gl.js";

/* ───────── hero ───────── */
const heroEl = $("#hero");
const badge = new Flap($("#heroBadge"), 1);
const LETTERS = "RUMOAR";
const hero = initHero(heroEl, {
  onBeat: (i) => { if (i >= 0) badge.set(LETTERS[i % LETTERS.length]); },
  onOpeningDone: () => heroEl.classList.add("is-open"),
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
      const draw = () => {
        if (!on) return;
        for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 200; img.data[i] = v; img.data[i + 1] = v * 0.55; img.data[i + 2] = v * 0.4; img.data[i + 3] = 255; }
        g.putImageData(img, 0, 0); requestAnimationFrame(draw);
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

/* ───────── RUMOAR wordmark: hover a letter and it turns into film ───────── */
(() => {
  const letters = $$("#wm .wm__l");
  let active = null, revert, auto;
  letters.forEach((l) => {
    const v = Object.assign(document.createElement("video"), { muted: true, loop: true, playsInline: true, preload: "none", poster: `assets/letters/${l.dataset.clip}.jpg` });
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
    v.className = "wm__v";
    l.appendChild(v);
    l.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") show(l); });
    l.addEventListener("click", () => show(l));
  });
  function show(l) {
    clearTimeout(revert);
    if (active === l) return;
    if (active) { active.classList.remove("is-on"); active.querySelector("video").pause(); }
    active = l;
    const v = l.querySelector("video");
    if (!v.src) v.src = pickVideo(`assets/letters/${l.dataset.clip}.mp4`);
    v.currentTime = 0; v.play().catch(() => {});
    l.classList.add("is-on");
  }
  function clear() { if (active) { active.classList.remove("is-on"); active.querySelector("video").pause(); active = null; } }
  $("#wm").addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") revert = setTimeout(clear, 1400); });
  // touch screens have no hover: the letters take turns on their own
  if (!matchMedia("(hover: hover)").matches && !reduceMotion) {
    let k = 0;
    new IntersectionObserver(([e]) => {
      clearInterval(auto);
      if (e.isIntersecting) auto = setInterval(() => { show(letters[k % letters.length]); k++; }, 1700);
    }, { threshold: 0.3 }).observe($("#wm"));
  }
})();

/* ───────── own the look: fly through the collage as you scroll ───────── */
(() => {
  const sec = $("#look"), field = $("#lookField"), count = $("#lookCount"), bar = $("#lookBar");
  const ids = ["16", "05", "17", "06", "00", "07", "18", "08", "12", "09", "22", "10", "03", "11", "26", "13", "20", "14", "30", "19", "21", "23", "24", "25", "27", "29"];
  const GAP = 520, N = ids.length, phone0 = innerWidth < 700;
  const rnd = (s) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };
  const cards = ids.map((id, i) => {
    const el = document.createElement("figure");
    el.className = "look__card";
    el.innerHTML = `<img src="assets/collage/${id}.webp" alt="" loading="${i < 6 ? "eager" : "lazy"}" />`;
    field.appendChild(el);
    const side = i % 2 ? 1 : -1;
    return { el, x: side * ((phone0 ? 0.16 : 0.24) + rnd(i) * 0.24), y: (rnd(i + 40) - 0.5) * 0.62, z: -i * GAP - 300, r: (rnd(i + 80) - 0.5) * 10 };
  });
  let mx = 0, my = 0, ticking = false;
  addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  function update() {
    ticking = false;
    const r = sec.getBoundingClientRect(), total = sec.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
    const cam = p * (N * GAP + 300);
    const w = innerWidth, h = innerHeight, phone = w < 700;
    let nearest = 0;
    cards.forEach((c, i) => {
      const z = c.z + cam;
      const fadeIn = Math.min(1, Math.max(0, (z + 3600) / 1400));
      const fadeOut = Math.min(1, Math.max(0, (700 - z) / 400));
      const o = fadeIn * fadeOut;
      c.el.style.opacity = o.toFixed(3);
      c.el.style.visibility = o > 0.01 ? "visible" : "hidden";
      if (o > 0.01) {
        const x = c.x * w * (phone ? 1.25 : 1) - mx * 40 * (z + 3600) / 3600;
        const y = c.y * h - my * 30 * (z + 3600) / 3600;
        c.el.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotate(${c.r}deg)`;
      }
      if (z > -GAP) nearest = i;
    });
    count.textContent = String(Math.min(N, nearest + 1)).padStart(2, "0");
    bar.style.transform = `scaleX(${p})`;
    sec.classList.toggle("is-end", p > 0.92);
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener("resize", update);
  update();
})();

/* signing up from the homepage takes you straight into the drop */
onMember(() => setTimeout(() => { location.href = "drop.html"; }, 1400));

armReveals();
runIntro(() => hero.start());
