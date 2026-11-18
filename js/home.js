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

/* ───────── collage strips (doubled for a seamless loop) ───────── */
$$("[data-strip]").forEach((row) => {
  const imgs = row.dataset.strip.split(",").map((n) => `<img src="assets/collage/${n}.webp" alt="" loading="lazy" />`).join("");
  row.innerHTML = imgs + imgs;
});

/* signing up from the homepage takes you straight into the drop */
onMember(() => setTimeout(() => { location.href = "drop.html"; }, 1400));

armReveals();
runIntro(() => hero.start());
