import { PRODUCTS, CATEGORIES, byId, formatINR } from "./products.js";
import { createStore } from "./store.js";
import { initRings, PERSONAS } from "./rings.js";
import { runIntro } from "./intro.js";
import { initHero, pickVideo } from "./hero-gl.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const store = createStore();
const state = {
  wish: new Set(store.wishlist.filter((id) => byId[id])),
  filter: "all",
  pendingProduct: null, // product the visitor tried to open before signing up
};

const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.6 0 5.8 3.6 4.5 7.1-1.8 4.8-9.3 9.4-9.3 9.4z"/></svg>';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? "";

/* ───────── split-flap board (airport style) ───────── */
const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
class Flap {
  constructor(el, length) {
    this.el = el; this.len = length; this.cur = " ".repeat(length); this.timers = [];
    el.textContent = "";
    this.cells = Array.from({ length }, () => {
      const c = document.createElement("span");
      c.className = "flap__c"; c.setAttribute("aria-hidden", "true"); c.textContent = " ";
      el.appendChild(c); return c;
    });
  }
  show(i, ch) {
    const c = this.cells[i];
    c.textContent = ch === " " ? " " : ch;
    c.classList.toggle("is-blank", ch === " ");
    if (reduceMotion) return;
    c.classList.remove("flip"); void c.offsetWidth; c.classList.add("flip");
  }
  set(text) {
    const t = String(text).toUpperCase().slice(0, this.len).padEnd(this.len, " ");
    this.el.setAttribute("aria-label", t.trim());
    this.timers.forEach(clearTimeout); this.timers = [];
    [...t].forEach((target, i) => {
      if (target === this.cur[i] && this.cells[i].textContent === (target === " " ? " " : target)) return;
      if (reduceMotion) return this.show(i, target);
      const steps = 3 + Math.floor(Math.random() * 6);
      let n = 0;
      const tick = () => {
        this.show(i, n < steps ? FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)] : target);
        if (n++ < steps) this.timers.push(setTimeout(tick, 52));
      };
      this.timers.push(setTimeout(tick, i * 32));
    });
    this.cur = t;
  }
}

/* ───────── nav ───────── */
const nav = $("#nav");
const darkZones = [...document.querySelectorAll("[data-dark]")];
const onScroll = () => {
  nav.classList.toggle("is-solid", scrollY > innerHeight * 0.75);
  const y = nav.offsetHeight / 2;
  nav.classList.toggle("is-dark", darkZones.some((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }));
};
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// "HI, RUDRA" ↔ "HI, BATMAN", flipping like a departures board, forever.
let navTimer = null;
function renderNavName() {
  const m = store.member;
  const btn = $("#navMember");
  clearInterval(navTimer);
  if (!m) { btn.textContent = "Join the list"; btn.removeAttribute("aria-label"); return; }
  const first = m.name.split(" ")[0].slice(0, 14);
  const hero = (m.favCharacter || "").slice(0, 14);
  const words = [first, hero || first];
  const len = Math.max(...words.map((w) => w.length));
  btn.textContent = "Hi, ";
  btn.setAttribute("aria-label", `Signed in as ${m.name}. Open wishlist`);
  const holder = document.createElement("span");
  holder.className = "flap flap--bare";
  btn.appendChild(holder);
  const flap = new Flap(holder, len);
  let k = 0;
  flap.set(words[0]);
  if (words[0] !== words[1]) navTimer = setInterval(() => { k = 1 - k; flap.set(words[k]); }, 3400);
}

function renderMember() {
  const m = store.member;
  renderNavName();
  $("#heroCta").innerHTML = m ? 'Enter the collection <span aria-hidden="true">→</span>' : 'Enter the world <span aria-hidden="true">→</span>';
  $("#closerCta").innerHTML = m ? 'View your wishlist <span aria-hidden="true">→</span>' : 'Join the list <span aria-hidden="true">→</span>';
  $("#collection").classList.toggle("is-locked", !m);
  $("#gate").setAttribute("aria-hidden", m ? "true" : "false");
}

function renderCount() {
  const n = state.wish.size;
  $("#wishCount").textContent = n;
  $("#navWish").classList.toggle("has-items", n > 0);
  $("#navWish").setAttribute("aria-label", `Open wishlist (${n} item${n === 1 ? "" : "s"})`);
}

$("#navMember").addEventListener("click", () => (store.member ? openDrawer() : openSignup()));
$("#navWish").addEventListener("click", () => (store.member ? openDrawer() : openSignup()));
$("#heroCta").addEventListener("click", () => (store.member ? $("#collection").scrollIntoView() : openSignup()));
$("#closerCta").addEventListener("click", () => (store.member ? openDrawer() : openSignup()));
document.addEventListener("click", (e) => { if (e.target.closest("[data-open-signup]")) openSignup(); });

/* ───────── live clock (IST) ───────── */
(() => {
  const el = $("#clock");
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const tick = () => { el.textContent = `IST ${fmt.format(new Date())}`; };
  tick(); setInterval(tick, 1000);
})();

/* ───────── 01 stage: liquid-lens film, shrinks into a card on scroll ───────── */
const stageEl = $("#stage");
const hero = initHero(stageEl);
(() => {
  const frame = $("#stageFrame");
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  let ticking = false;
  function update() {
    ticking = false;
    const vw = innerWidth, vh = stageEl.querySelector(".stage__pin").clientHeight;
    const total = stageEl.offsetHeight - vh;
    const raw = Math.min(1, Math.max(0, -stageEl.getBoundingClientRect().top / Math.max(1, total)));
    const e = ease(Math.min(1, Math.max(0, (raw - 0.08) / 0.62)));
    const phone = vw < 700;
    const cw = Math.min(phone ? vw * 0.74 : vw * 0.42, 760);
    const hc = Math.min(cw * (phone ? 1.05 : 0.56), vh * 0.44);
    const cy = vh * (phone ? 0.0 : 0.07);
    const s = cw / vw;
    const inset = Math.max(0, (vh - hc / s) / 2);
    const scale = 1 - (1 - s) * e;
    frame.style.transform = `translateY(${cy * e}px) scale(${scale})`;
    frame.style.clipPath = `inset(${inset * e}px 0px ${inset * e}px 0px round ${(14 / scale) * e}px)`;
    stageEl.style.setProperty("--p", e.toFixed(4));
    stageEl.style.setProperty("--cw", `${cw}px`);
    stageEl.style.setProperty("--hc", `${hc}px`);
    stageEl.style.setProperty("--cy", `${cy}px`);
    stageEl.classList.toggle("is-settled", e > 0.85);
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener("resize", update);
  update();
})();

/* ───────── who are you today: personality rings ───────── */
(() => {
  const flap = new Flap($("#ringFlap"), Math.max(...PERSONAS.map((p) => p.length)));
  flap.set("RUMOAR");
  initRings($("#rumoar-rings"), { onLook: (name) => flap.set(name) });
})();

/* ───────── ethos: manifesto lights up word by word as you scroll ───────── */
(() => {
  const el = $("#manifesto");
  const wrap = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
          else { const s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.appendChild(s); }
        });
        n.replaceWith(frag);
      } else wrap(n);
    });
  };
  wrap(el);
  const words = $$(".w", el);
  if (reduceMotion) { words.forEach((w) => w.classList.add("on")); return; }
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = el.getBoundingClientRect(), vh = innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.82 - r.top) / (r.height + vh * 0.3)));
    const lit = Math.round(p * words.length);
    words.forEach((w, k) => w.classList.toggle("on", k < lit));
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();

/* ───────── ethos: rule images keep cycling ───────── */
(() => {
  $$(".rule__img").forEach((fig, k) => {
    const list = fig.dataset.cycle.split("|");
    fig.innerHTML = list.map((src, j) => `<img src="${src}" alt="" loading="lazy" class="${j === 0 ? "is-on" : ""}" />`).join("");
    if (reduceMotion) return;
    const ims = $$("img", fig);
    let on = 0;
    setTimeout(() => setInterval(() => { ims[on].classList.remove("is-on"); on = (on + 1) % ims.length; ims[on].classList.add("is-on"); }, 3000), k * 900);
  });
})();

/* ───────── ethos: numbers count up once ───────── */
(() => {
  const els = $$("[data-count]");
  if (reduceMotion || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const end = Number(e.target.dataset.count), t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 1400);
      e.target.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    e.target.textContent = "0";
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
})();

/* ───────── 03 on air: the TV wall, every screen keeps changing ───────── */
(() => {
  const sets = $$("#tvWall .set");
  const productImgs = PRODUCTS.map((p) => p.images[0]);
  const live = [];
  sets.forEach((set) => {
    const screen = document.createElement("div");
    screen.className = "screen";
    set.appendChild(screen);
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
      const words = ["RUMOAR", "WHO ARE YOU?", "DROP 01", "RUMOAR", "NOISE OFF", "FOCUS ON"];
      let k = 0; next = () => { k = (k + 1) % words.length; w.textContent = words[k]; };
      setInterval(() => !reduceMotion && zap(screen, next), 3800);
    } else if (kind === "static") {
      const c = document.createElement("canvas"); c.width = 160; c.height = 120; screen.appendChild(c);
      const g = c.getContext("2d"), img = g.createImageData(160, 120);
      const clock = chyron("No signal");
      let on = false;
      const draw = () => {
        if (!on) return;
        for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 200; img.data[i] = v; img.data[i + 1] = v * 0.55; img.data[i + 2] = v * 0.4; img.data[i + 3] = 255; }
        g.putImageData(img, 0, 0); requestAnimationFrame(draw);
      };
      const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      setInterval(() => { clock.textContent = `On air · IST ${fmt.format(new Date())}`; }, 1000);
      live.push({ el: set, on: () => { if (!on && !reduceMotion) { on = true; draw(); } }, off: () => { on = false; } });
    } else {
      const list = kind === "products" ? productImgs : arg.split("|");
      const im = document.createElement("img"); im.alt = ""; im.loading = "lazy"; im.src = list[0]; screen.appendChild(im);
      const tag = chyron(kind === "products" ? PRODUCTS[0].name : "Ch. 01");
      let k = 0;
      next = () => {
        k = (k + 1) % list.length; im.src = list[k];
        tag.textContent = kind === "products" ? PRODUCTS[k].name : `Ch. ${String(k + 1).padStart(2, "0")}`;
      };
      setInterval(() => !reduceMotion && zap(screen, next), kind === "products" ? 1900 : 3100 + Math.random() * 1200);
    }
    set.addEventListener("click", () => zap(screen, next));
  });
  function zap(screen, fn) {
    screen.classList.add("is-zap");
    setTimeout(() => { fn(); screen.classList.remove("is-zap"); }, 140);
  }
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    const l = live.find((x) => x.el === e.target);
    if (l) (e.isIntersecting ? l.on() : l.off());
  }), { threshold: 0.1 });
  live.forEach((l) => io.observe(l.el));
})();

/* ───────── collection ───────── */
function renderFilters() {
  $("#filters").innerHTML = CATEGORIES.map((c) => {
    const n = c.id === "all" ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === c.id).length;
    return `<button class="chip" role="tab" type="button" data-filter="${c.id}" aria-selected="${state.filter === c.id}">${esc(c.label)}<sup>${n}</sup></button>`;
  }).join("");
}
$("#filters").addEventListener("click", (e) => {
  const b = e.target.closest("[data-filter]");
  if (!b) return;
  state.filter = b.dataset.filter;
  $$(".chip").forEach((c) => c.setAttribute("aria-selected", c === b));
  $$(".row").forEach((c) => c.classList.toggle("is-hidden", state.filter !== "all" && c.dataset.cat !== state.filter));
  const n = $$(".row:not(.is-hidden)").length;
  $("#colCount").textContent = `${n} object${n === 1 ? "" : "s"}`;
});

function renderGrid() {
  $("#grid").innerHTML = PRODUCTS.map((p, i) => `
    <li class="row" data-id="${p.id}" data-cat="${p.category}">
      <button class="row__open" type="button" aria-label="View ${esc(p.name)}">
        <span class="row__n">${String(i + 1).padStart(2, "0")}</span>
        <span class="row__thumb"><img src="${p.images[0]}" alt="" loading="lazy" width="1000" height="1139" /></span>
        <span class="row__name">${esc(p.name)}</span>
        <span class="row__meta">${esc(p.type)} · ${esc(p.colour)}</span>
        <span class="row__price">${formatINR(p.price)}</span>
      </button>
      <button class="row__heart" type="button" aria-pressed="${state.wish.has(p.id)}" aria-label="Wishlist ${esc(p.name)}">${HEART}</button>
    </li>`).join("");
}
$("#grid").addEventListener("click", (e) => {
  const row = e.target.closest(".row");
  if (!row) return;
  if (e.target.closest(".row__heart")) toggleWish(row.dataset.id);
  else openProduct(row.dataset.id);
});

// floating preview that follows the cursor over the index (desktop)
(() => {
  const pv = $("#preview"), [a, b] = $$("img", pv);
  if (!matchMedia("(hover: hover)").matches) return;
  let x = 0, y = 0, px = 0, py = 0, on = false, current = null, sideTimer;
  const loop = () => {
    px += (x - px) * 0.16; py += (y - py) * 0.16;
    pv.style.transform = `translate(${px - 120}px, ${py - 137}px) scale(${on ? 1 : 0.85}) rotate(${(x - px) * 0.04}deg)`;
    if (on || Math.abs(x - px) > 0.5) requestAnimationFrame(loop);
  };
  $("#grid").addEventListener("pointermove", (e) => {
    x = e.clientX + 150; y = e.clientY;
    const row = e.target.closest(".row");
    if (!row || $("#collection").classList.contains("is-locked")) return hide();
    if (row.dataset.id !== current) {
      const p = byId[row.dataset.id];
      current = p.id; a.src = p.images[0]; b.src = p.images[1];
      pv.classList.remove("is-side"); clearTimeout(sideTimer);
      sideTimer = setTimeout(() => pv.classList.add("is-side"), 900);
    }
    if (!on) { on = true; px = x; py = y; pv.classList.add("is-on"); requestAnimationFrame(loop); }
  });
  const hide = () => { on = false; current = null; pv.classList.remove("is-on"); clearTimeout(sideTimer); };
  $("#grid").addEventListener("pointerleave", hide);
})();

/* ───────── wishlist ───────── */
let saveChain = Promise.resolve();
function toggleWish(id, force) {
  if (!store.member) { state.pendingProduct = id; return openSignup(); }
  const on = force ?? !state.wish.has(id);
  on ? state.wish.add(id) : state.wish.delete(id);
  syncWishUI(id);
  const p = byId[id];
  toast(on ? `<b>${esc(p.name)}</b> is on your wishlist. You’ll hear first.` : `Removed ${esc(p.name)}.`);
  if (on) { const b = $("#navWish"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }
  const list = [...state.wish];
  saveChain = saveChain.then(() => store.saveWishlist(list)).catch((err) => {
    console.error("[RUMOAR] wishlist save failed", err);
    toast("Couldn’t sync your wishlist. It’s saved on this device.");
  });
}
function syncWishUI(id) {
  $$(`.row[data-id="${id}"] .row__heart`).forEach((b) => b.setAttribute("aria-pressed", state.wish.has(id)));
  if (currentProduct === id) renderWishButton(id);
  renderCount();
  if (!$("#drawer").hidden) renderDrawer();
}

/* ───────── modal plumbing ───────── */
let lastFocus = null;
function openLayer(el) {
  lastFocus = document.activeElement;
  el.hidden = false;
  document.body.classList.add("is-modal");
  requestAnimationFrame(() => (el.querySelector("[autofocus], input, .modal__x, button") || el).focus({ preventScroll: true }));
}
function closeLayer(el) {
  if (!el || el.hidden) return;
  el.hidden = true;
  if (!$$(".modal, .drawer").some((m) => !m.hidden)) document.body.classList.remove("is-modal");
  if (el.id === "product" && location.hash.startsWith("#p/")) history.replaceState(null, "", location.pathname + location.search);
  lastFocus?.focus?.({ preventScroll: true });
}
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) closeLayer(e.target.closest(".modal, .drawer"));
});
document.addEventListener("keydown", (e) => {
  const open = $$(".modal, .drawer").filter((m) => !m.hidden).pop();
  if (!open) return;
  if (e.key === "Escape") closeLayer(open);
  if (e.key === "Tab") { // simple focus trap
    const f = $$('button, [href], input, [tabindex]:not([tabindex="-1"])', open).filter((x) => !x.disabled && x.offsetParent);
    if (!f.length) return;
    const [a, z] = [f[0], f[f.length - 1]];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }
  if (open.id === "product" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) slide(e.key === "ArrowRight" ? 1 : -1);
});

/* ───────── sign-up ───────── */
const form = $("#signupForm");
function openSignup() { $("#signupError").textContent = ""; openLayer($("#signup")); }

const rules = {
  name: (v) => (v.trim().length >= 2 ? "" : "Tell us your name."),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "That email doesn’t look right."),
  phone: (v) => { const d = v.replace(/\D/g, ""); return d.length === 10 || (d.length >= 11 && d.length <= 13 && v.trim().startsWith("+")) ? "" : "Enter a 10-digit mobile number."; },
  age: (v) => { const n = Number(v); return Number.isInteger(n) && n >= 13 && n <= 100 ? "" : "13 to 100."; },
  favCharacter: (v) => (v.trim().length >= 1 ? "" : "Everyone has one. Who’s yours?"),
};
let triedSubmit = false;
function validate(name) {
  const input = form.elements[name];
  const msg = rules[name](input.value);
  const field = input.closest(".field");
  field.classList.toggle("is-bad", !!msg);
  field.querySelector(".field__err").textContent = msg;
  input.setAttribute("aria-invalid", msg ? "true" : "false");
  return !msg;
}
form.addEventListener("input", (e) => { if (triedSubmit && rules[e.target.name]) validate(e.target.name); });

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  triedSubmit = true;
  const bad = Object.keys(rules).filter((k) => !validate(k));
  if (bad.length) return form.elements[bad[0]].focus();

  const raw = Object.fromEntries(new FormData(form));
  const digits = raw.phone.replace(/\D/g, "");
  const data = {
    name: raw.name.trim().replace(/\s+/g, " "),
    email: raw.email.trim().toLowerCase(),
    phone: raw.phone.trim().startsWith("+") ? "+" + digits : "+91" + digits,
    age: Number(raw.age),
    favCharacter: raw.favCharacter.trim(),
  };
  const btn = $("#signupSubmit");
  btn.disabled = true; btn.firstChild.textContent = "Entering… ";
  try {
    await store.signUp(data);
    closeLayer($("#signup"));
    unlock();
    toast(`Welcome in, <b>${esc(data.name.split(" ")[0])}</b>. Today you’re ${esc(data.favCharacter)}.`);
    if (state.pendingProduct) {
      const id = state.pendingProduct; state.pendingProduct = null;
      setTimeout(() => openProduct(id), 650);
    } else {
      setTimeout(() => $("#collection").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }), 250);
    }
  } catch (err) {
    console.error("[RUMOAR] sign-up failed", err);
    // Visitors see a polite line; the small code underneath tells you what to fix in Firebase.
    const code = String(err?.code || err?.message || "unknown").replace(/^(auth|firestore)\//, "").replace(/\.+$/, "");
    const HINTS = {
      "admin-restricted-operation": "Anonymous sign-in is turned off (Firebase → Authentication → Sign-in method).",
      "operation-not-allowed": "Anonymous sign-in is turned off (Firebase → Authentication → Sign-in method).",
      "configuration-not-found": "Authentication isn't set up yet (Firebase → Authentication → Get started).",
      "unauthorized-domain": "This website's address isn't in Authentication → Settings → Authorized domains.",
      "api-key-not-valid.-please-pass-a-valid-api-key":"apiKey in firebase-config.js is wrong.",
      "invalid-api-key": "apiKey in firebase-config.js is wrong.",
      "permission-denied": "Firestore rules are blocking this. Re-paste firestore.rules and Publish.",
      "not-found": "Firestore database isn't created yet (Firebase → Firestore Database).",
      "failed-precondition": "Firestore database isn't created yet (Firebase → Firestore Database).",
      "network-request-failed": "Network problem. Check the connection and try again.",
    };
    const hint = HINTS[code] || "";
    $("#signupError").innerHTML = `Something went wrong on our side. Please try again in a moment.<br/><small style="color:#8c8a85">Error code: ${esc(code)}${hint ? ". " + esc(hint) : ""}</small>`;
  } finally {
    btn.disabled = false; btn.firstChild.textContent = "Enter RUMOAR ";
  }
});

function unlock() {
  renderMember();
  const col = $("#collection");
  col.classList.add("is-unlocking");
  setTimeout(() => col.classList.remove("is-unlocking"), 1200);
}

/* ───────── product detail ───────── */
let currentProduct = null;
function openProduct(id) {
  const p = byId[id];
  if (!p) return;
  if (!store.member) { state.pendingProduct = id; return openSignup(); }
  currentProduct = id;
  $("#pMeta").textContent = `${catLabel(p.category)} · ${p.colour}`;
  $("#pName").textContent = p.name;
  $("#pTag").textContent = p.tagline;
  $("#pPrice").textContent = formatINR(p.price);
  $("#pDesc").textContent = p.description;
  $("#pDetails").innerHTML = p.details.map((d) => `<li>${esc(d)}</li>`).join("");
  const views = ["front", "side"];
  $("#pdTrack").innerHTML = p.images.map((src, i) => `<img src="${src}" alt="${esc(p.name)}, ${views[i]} view" width="1000" height="1139" />`).join("");
  $("#pdDots").innerHTML = p.images.map((_, i) => `<button type="button" aria-label="Show ${views[i]} view" data-dot="${i}" aria-current="${i === 0}"></button>`).join("");
  $("#pdTrack").scrollLeft = 0;
  renderWishButton(id);
  if (location.hash !== `#p/${id}`) history.replaceState(null, "", `#p/${id}`);
  const layer = $("#product");
  if (layer.hidden) openLayer(layer);
  $(".pd", layer).scrollTop = 0;
}
function renderWishButton(id) {
  const on = state.wish.has(id);
  const b = $("#pWish");
  b.classList.toggle("is-on", on);
  b.setAttribute("aria-pressed", on);
  b.innerHTML = on ? "On your wishlist ✓" : `Add to wishlist <span aria-hidden="true">♡</span>`;
}
$("#pWish").addEventListener("click", () => currentProduct && toggleWish(currentProduct));

const track = $("#pdTrack");
function slide(dir) { track.scrollBy({ left: dir * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" }); }
$$("[data-slide]").forEach((b) => b.addEventListener("click", () => slide(Number(b.dataset.slide))));
$("#pdDots").addEventListener("click", (e) => {
  const d = e.target.closest("[data-dot]");
  if (d) track.scrollTo({ left: Number(d.dataset.dot) * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
});
track.addEventListener("scroll", () => {
  const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
  $$("#pdDots button").forEach((b, j) => b.setAttribute("aria-current", i === j));
}, { passive: true });

/* ───────── drawer ───────── */
function openDrawer() { renderDrawer(); openLayer($("#drawer")); }
function renderDrawer() {
  const items = [...state.wish].map((id) => byId[id]).filter(Boolean);
  $("#drawerList").innerHTML = items.length
    ? items.map((p) => `
      <li class="drawer__item">
        <img src="${p.images[0]}" alt="" width="76" height="87" loading="lazy" />
        <button class="drawer__open" type="button" data-view="${p.id}"><strong>${esc(p.name)}</strong><span>${esc(p.colour)} · ${formatINR(p.price)}</span></button>
        <button class="drawer__rm" type="button" data-rm="${p.id}" aria-label="Remove ${esc(p.name)}">Remove</button>
      </li>`).join("")
    : `<li class="drawer__empty"><span>Nothing here yet.<br/>Pick the one you are today.</span><button class="btn btn--ink" type="button" data-goto-col>Browse the collection</button></li>`;
  const m = store.member;
  $("#drawerFoot").innerHTML = items.length && m
    ? `<span>We’ll write to <b>${esc(m.email)}</b> the moment Drop 01 opens. Wishlisted pieces are first in line.</span>`
    : "";
}
$("#drawerList").addEventListener("click", (e) => {
  const rm = e.target.closest("[data-rm]");
  const view = e.target.closest("[data-view]");
  if (rm) toggleWish(rm.dataset.rm, false);
  if (view) { closeLayer($("#drawer")); openProduct(view.dataset.view); }
  if (e.target.closest("[data-goto-col]")) { closeLayer($("#drawer")); $("#collection").scrollIntoView(); }
});

/* ───────── toast ───────── */
let toastTimer;
function toast(html) {
  const t = $("#toast");
  t.innerHTML = html;
  t.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-on"), 3400);
}

/* ───────── reveals (enhancement, never a gate) ───────── */
(() => {
  const els = $$(".rv");
  if (reduceMotion || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  els.forEach((el) => { el.classList.add("armed"); io.observe(el); });
  setTimeout(() => els.forEach((el) => el.classList.add("in")), 4000); // failsafe
})();

/* ───────── boot ───────── */
renderFilters();
renderGrid();
renderMember();
renderCount();
if (store.mode === "demo") $("#demoPill").hidden = false;
runIntro(() => hero.start());
const deep = location.hash.match(/^#p\/([\w-]+)/);
if (deep && byId[deep[1]]) openProduct(deep[1]);
