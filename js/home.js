// Homepage: entry button, intro, hero, bags, look gallery, waitlist.
import { $, $$, Flap, PRODUCTS, armReveals, onMember, store, state, openSignup, openDrawer, openProduct, toggleWish, onWishChange } from "./common.js";
import { cardsHTML } from "./cards.js";
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

/* ───────── phone poster: a full-bleed face that keeps changing ───────── */
function initPoster(host) {
  const FACES = [["f0", 0.5, 0.4, "Maverick"], ["f1", 0.45, 0.26, "Outlier"], ["f2", 0.5, 0.3, "Purist"], ["f3", 0.56, 0.26, "Operator"],
    ["f4", 0.62, 0.36, "Drifter"], ["f5", 0.55, 0.4, "Nomad"], ["f6", 0.5, 0.22, "Strategist"]];
  const canvas = host.querySelector("canvas"), ctx = canvas.getContext("2d");
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
    if (now - shown > HOLD && imgs[(cur + 1) % FACES.length]) { from = cur; cur = (cur + 1) % FACES.length; swapAt = now; shown = now; }
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

/* ───────── live: crossing keyword tapes ───────── */
$$("[data-tape]").forEach((t) => {
  const words = t.dataset.tape.split("|").map((w) => `<span>${w}</span><i>✦</i>`).join("");
  t.innerHTML = words + words + words + words;
});

/* ───────── the bags, right after the hero ───────── */
(() => {
  const rail = $("#bagsRail");
  rail.innerHTML = cardsHTML(PRODUCTS);
  rail.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    if (e.target.closest(".card__heart")) toggleWish(card.dataset.id);
    else openProduct(card.dataset.id);
  });
  onWishChange((id) => $$(`.card[data-id="${id}"] .card__heart`, rail).forEach((b) => b.setAttribute("aria-pressed", state.wish.has(id))));
})();

/* ───────── waitlist: one clear action everywhere ───────── */
function joinUI() {
  const m = store.member;
  $$("[data-join]").forEach((b) => {
    b.innerHTML = m ? `Your wishlist <span aria-hidden="true">→</span>` : `Join the waitlist <span aria-hidden="true">→</span>`;
  });
  if (m) {
    const first = m.name.split(" ")[0];
    $("#heroNote").textContent = `You’re on the list, ${first}. We’ll tell you first.`;
    $("#closerTitle").textContent = "You’re on the list.";
    $("#closerSub").textContent = "We’ll tell you the moment the bags go live. Until then, heart the ones you want.";
  }
}
document.addEventListener("click", (e) => { if (e.target.closest("[data-join]")) (store.member ? openDrawer() : openSignup()); });
onMember(joinUI);
joinUI();

armReveals();
/* ───────── the gate: one button on black. It turns the sound on and starts everything ───────── */
(() => {
  const gate = $("#gate"), btn = $("#gateBtn");
  // warm up the first faces while the button waits
  ["f0", "f1", "f2"].forEach((n) => { const im = new Image(); im.src = `assets/intro/${n}.webp`; });
  let gone = false;
  const go = () => {
    if (gone) return; gone = true;
    document.dispatchEvent(new CustomEvent("rumoar:sound-on"));
    gate.classList.add("is-go");
    setTimeout(() => {
      document.documentElement.classList.remove("is-gate");
      runIntro(() => hero.start(), () => hero.start());
    }, 650);
    setTimeout(() => gate.remove(), 1500);
  };
  btn.addEventListener("click", go);
  // arriving from the Bags link on another page: skip the button and land on the bags
  if (location.hash === "#bags") {
    try { sessionStorage.setItem("rumoar.intro.v3", "1"); } catch {}
    gone = true; gate.remove();
    document.documentElement.classList.remove("is-gate", "is-intro");
    document.dispatchEvent(new CustomEvent("rumoar:sound-on"));
    runIntro(() => hero.start(), () => hero.start());
    requestAnimationFrame(() => $("#bags").scrollIntoView({ block: "start" }));
  }
  addEventListener("keydown", (e) => { if (!gone && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); go(); } });
})();
