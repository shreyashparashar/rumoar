// Shared by every page: nav, sign-up, wishlist, product view, drawer, toast.
// The modals are injected here so both pages stay in sync.

import { PRODUCTS, CATEGORIES, byId, formatINR } from "./products.js";
import { createStore } from "./store.js";

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.6 0 5.8 3.6 4.5 7.1-1.8 4.8-9.3 9.4-9.3 9.4z"/></svg>';
const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? "";

export const store = createStore();
export const state = { wish: new Set(store.wishlist.filter((id) => byId[id])), pendingProduct: null };
const wishListeners = [], memberListeners = [];
export const onWishChange = (fn) => wishListeners.push(fn);
export const onMember = (fn) => memberListeners.push(fn);

/* ───────── markup shared by all pages ───────── */
const page = document.body.dataset.page || "home";
document.body.insertAdjacentHTML("afterbegin", `
  <header class="nav" id="nav">
    <nav class="nav__links" aria-label="Main">
      <a href="./"${page === "home" ? ' aria-current="page"' : ""}>Home</a>
      <a href="./#bags" data-bags>Bags</a>
      <a href="https://www.instagram.com/rumoarr/" target="_blank" rel="noopener">Instagram</a>
    </nav>
    <a class="nav__logo" href="./" aria-label="RUMOAR home">RUMOAR</a>
    <div class="nav__actions">
      <a class="nav__bags" href="./#bags" data-bags>Bags</a>
      <button class="nav__sound" id="navSound" type="button" aria-pressed="false" aria-label="Sound on" title="Sound"><i></i><i></i><i></i><i></i></button>
      <button class="nav__member" id="navMember" type="button">Join<span class="nav__wl"> waitlist</span></button>
      <button class="nav__wish" id="navWish" type="button" aria-label="Open wishlist">${HEART}<span class="nav__count" id="wishCount">0</span></button>
    </div>
  </header>`);
document.body.insertAdjacentHTML("beforeend", `
  <div class="modal" id="signup" role="dialog" aria-modal="true" aria-labelledby="signupTitle" hidden>
    <div class="modal__scrim" data-close></div>
    <div class="modal__panel signup">
      <button class="modal__x" type="button" data-close aria-label="Close">×</button>
      <div class="signup__side" aria-hidden="true">
        <img src="assets/collage/16.webp" alt="" />
        <span class="signup__mark">RUMOAR</span>
        <span class="signup__tag">Who are you today?</span>
      </div>
      <form class="signup__form" id="signupForm" novalidate>
        <span class="label">Launching soon</span>
        <h2 id="signupTitle" class="head">Join the waitlist.</h2>
        <p class="muted">Be the first to know when RUMOAR launches. Heart the bags you want and we’ll tell you the moment they go live.</p>
        <label class="field"><span>Full name</span><input name="name" autocomplete="name" required maxlength="80" placeholder="Your name" /><small class="field__err"></small></label>
        <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" inputmode="email" required maxlength="120" placeholder="you@email.com" /><small class="field__err"></small></label>
        <div class="field-row">
          <label class="field"><span>Phone</span><div class="field__phone"><em>+91</em><input name="phone" type="tel" autocomplete="tel-national" inputmode="tel" required maxlength="16" placeholder="98765 43210" /></div><small class="field__err"></small></label>
          <label class="field"><span>Age</span><input name="age" type="number" inputmode="numeric" min="13" max="100" required placeholder="25" /><small class="field__err"></small></label>
        </div>
        <label class="field"><span>Favourite superhero or animated character</span><input name="favCharacter" required maxlength="80" placeholder="The one you’d be for a day" /><small class="field__err"></small></label>
        <button class="btn btn--ink btn--block" type="submit" id="signupSubmit">Join the waitlist <span aria-hidden="true">→</span></button>
        <p class="fine">We’ll only write to you about RUMOAR launches. No spam, ever.</p>
        <p class="signup__error" id="signupError" role="alert"></p>
      </form>
    </div>
  </div>

  <div class="modal" id="product" role="dialog" aria-modal="true" aria-labelledby="pName" hidden>
    <div class="modal__scrim" data-close></div>
    <div class="modal__panel pd">
      <button class="modal__x" type="button" data-close aria-label="Close">×</button>
      <div class="pd__gallery">
        <div class="pd__track" id="pdTrack"></div>
        <div class="pd__dots" id="pdDots"></div>
        <button class="pd__arrow pd__arrow--l" type="button" data-slide="-1" aria-label="Previous image">←</button>
        <button class="pd__arrow pd__arrow--r" type="button" data-slide="1" aria-label="Next image">→</button>
      </div>
      <div class="pd__info">
        <span class="label" id="pMeta"></span>
        <h2 id="pName" class="head"></h2>
        <p class="pd__tag" id="pTag"></p>
        <p class="pd__price"><span id="pPrice"></span><span class="label">Launch price</span></p>
        <p class="pd__desc" id="pDesc"></p>
        <ul class="pd__details" id="pDetails"></ul>
        <button class="btn btn--flame btn--block" id="pWish" type="button"></button>
        <p class="fine">Not on sale yet. Join the waitlist and you’ll hear first when it launches.</p>
      </div>
    </div>
  </div>

  <div class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawerTitle" hidden>
    <div class="modal__scrim" data-close></div>
    <aside class="drawer__panel">
      <div class="drawer__head"><h2 id="drawerTitle" class="head">Your wishlist</h2><button class="modal__x modal__x--static" type="button" data-close aria-label="Close">×</button></div>
      <ul class="drawer__list" id="drawerList"></ul>
      <div class="drawer__foot" id="drawerFoot"></div>
    </aside>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <div class="demo-pill" id="demoPill" hidden>Demo mode · Firebase not connected</div>`);

/* ───────── split-flap board ───────── */
const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export class Flap {
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
function navTone() {
  nav.classList.toggle("is-solid", scrollY > 40 || page !== "home");
  const y = nav.offsetHeight / 2;
  nav.classList.toggle("is-dark", $$("[data-dark]").some((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }));
}
addEventListener("scroll", navTone, { passive: true });
navTone();

let navTimer = null;
function renderNavName() {
  const m = store.member, btn = $("#navMember");
  clearInterval(navTimer);
  if (!m) { btn.innerHTML = 'Join<span class="nav__wl"> waitlist</span>'; btn.removeAttribute("aria-label"); btn.classList.remove("is-member"); return; }
  btn.classList.add("is-member");
  const first = m.name.split(" ")[0].slice(0, 12);
  const hero = (m.favCharacter || "").slice(0, 12);
  const words = [first, hero || first];
  btn.textContent = "Hi, ";
  btn.setAttribute("aria-label", `Signed in as ${m.name}. Open wishlist`);
  const holder = document.createElement("span"); holder.className = "flap flap--bare"; btn.appendChild(holder);
  const flap = new Flap(holder, Math.max(...words.map((w) => w.length)));
  let k = 0; flap.set(words[0]);
  if (words[0] !== words[1]) navTimer = setInterval(() => { k = 1 - k; flap.set(words[k]); }, 3400);
}
function renderCount() {
  const n = state.wish.size;
  $("#wishCount").textContent = n;
  $("#navWish").classList.toggle("has-items", n > 0);
  $("#navWish").setAttribute("aria-label", `Open wishlist (${n} item${n === 1 ? "" : "s"})`);
}
$("#navMember").addEventListener("click", () => (store.member ? openDrawer() : openSignup()));
$("#navWish").addEventListener("click", () => (store.member ? openDrawer() : openSignup()));
document.addEventListener("click", (e) => { if (e.target.closest("[data-open-signup]")) openSignup(); });

/* ───────── wishlist ───────── */
let saveChain = Promise.resolve();
export function toggleWish(id, force) {
  if (!store.member) { state.pendingProduct = id; return openSignup(); }
  const on = force ?? !state.wish.has(id);
  on ? state.wish.add(id) : state.wish.delete(id);
  const p = byId[id];
  toast(on ? `<b>${esc(p.name)}</b> is on your wishlist. You’ll hear first.` : `Removed ${esc(p.name)}.`);
  if (on) { const b = $("#navWish"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }
  if (currentProduct === id) renderWishButton(id);
  renderCount();
  if (!$("#drawer").hidden) renderDrawer();
  wishListeners.forEach((fn) => fn(id, on));
  const list = [...state.wish];
  saveChain = saveChain.then(() => store.saveWishlist(list)).catch((err) => {
    console.error("[RUMOAR] wishlist save failed", err);
    toast("Couldn’t sync your wishlist. It’s saved on this device.");
  });
}

/* ───────── modal plumbing ───────── */
let lastFocus = null;
function openLayer(el) {
  lastFocus = document.activeElement;
  el.hidden = false;
  document.body.classList.add("is-modal");
  // keyboards get the first field; touch screens don't get a keyboard thrown at them
  const target = matchMedia("(hover: hover)").matches ? el.querySelector("input") || el.querySelector(".modal__x") : el.querySelector(".modal__panel, .drawer__panel");
  if (target && !target.matches("input, button")) target.setAttribute("tabindex", "-1");
  requestAnimationFrame(() => target?.focus({ preventScroll: true }));
}
function closeLayer(el) {
  if (!el || el.hidden) return;
  el.hidden = true;
  if (!$$(".modal, .drawer").some((m) => !m.hidden)) document.body.classList.remove("is-modal");
  if (el.id === "product" && location.hash.startsWith("#p/")) history.replaceState(null, "", location.pathname + location.search);
  lastFocus?.focus?.({ preventScroll: true });
}
document.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeLayer(e.target.closest(".modal, .drawer")); });
document.addEventListener("keydown", (e) => {
  const open = $$(".modal, .drawer").filter((m) => !m.hidden).pop();
  if (!open) return;
  if (e.key === "Escape") closeLayer(open);
  if (e.key === "Tab") {
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
export function openSignup() { $("#signupError").textContent = ""; openLayer($("#signup")); }
const rules = {
  name: (v) => (v.trim().length >= 2 ? "" : "Tell us your name."),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "That email doesn’t look right."),
  phone: (v) => { const d = v.replace(/\D/g, ""); return d.length === 10 || (d.length >= 11 && d.length <= 13 && v.trim().startsWith("+")) ? "" : "Enter a 10-digit mobile number."; },
  age: (v) => { const n = Number(v); return Number.isInteger(n) && n >= 13 && n <= 100 ? "" : "13 to 100."; },
  favCharacter: (v) => (v.trim().length >= 1 ? "" : "Everyone has one. Who’s yours?"),
};
let triedSubmit = false;
function validate(name) {
  const input = form.elements[name], msg = rules[name](input.value), field = input.closest(".field");
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
    renderNavName();
    toast(`You’re on the list, <b>${esc(data.name.split(" ")[0])}</b>. We’ll tell you first.`);
    memberListeners.forEach((fn) => fn(store.member));
    if (state.pendingProduct) {
      const id = state.pendingProduct; state.pendingProduct = null;
      setTimeout(() => openProduct(id), 650);
    }
  } catch (err) {
    console.error("[RUMOAR] sign-up failed", err);
    const code = String(err?.code || err?.message || "unknown").replace(/^(auth|firestore)\//, "").replace(/\.+$/, "");
    const HINTS = {
      "admin-restricted-operation": "Anonymous sign-in is turned off (Firebase → Authentication → Sign-in method).",
      "operation-not-allowed": "Anonymous sign-in is turned off (Firebase → Authentication → Sign-in method).",
      "configuration-not-found": "Authentication isn't set up yet (Firebase → Authentication → Get started).",
      "unauthorized-domain": "This website's address isn't in Authentication → Settings → Authorized domains.",
      "api-key-not-valid.-please-pass-a-valid-api-key": "apiKey in firebase-config.js is wrong.",
      "invalid-api-key": "apiKey in firebase-config.js is wrong.",
      "permission-denied": "Firestore rules are blocking this. Re-paste firestore.rules and Publish.",
      "not-found": "Firestore database isn't created yet (Firebase → Firestore Database).",
      "failed-precondition": "Firestore database isn't created yet (Firebase → Firestore Database).",
      "network-request-failed": "Network problem. Check the connection and try again.",
    };
    const hint = HINTS[code] || "";
    $("#signupError").innerHTML = `Something went wrong on our side. Please try again in a moment.<br/><small>Error code: ${esc(code)}${hint ? ". " + esc(hint) : ""}</small>`;
  } finally {
    btn.disabled = false; btn.firstChild.textContent = "Enter RUMOAR ";
  }
});

/* ───────── product detail ───────── */
let currentProduct = null;
export function openProduct(id) {
  const p = byId[id];
  if (!p) return;
  currentProduct = id;
  $("#pMeta").textContent = `${catLabel(p.category)} · ${p.colour}`;
  $("#pName").textContent = p.name;
  $("#pTag").textContent = p.tagline;
  $("#pPrice").textContent = formatINR(p.price);
  $("#pDesc").textContent = p.description;
  $("#pDetails").innerHTML = p.details.map((d) => `<li>${esc(d)}</li>`).join("");
  const views = ["front", "side"];
  $("#pdTrack").innerHTML = p.images.map((src, i) => `<img src="${src}" alt="${esc(p.name)}, ${views[i]} view" width="1200" height="1600" />`).join("");
  $("#pdDots").innerHTML = p.images.map((_, i) => `<button type="button" aria-label="Show ${views[i]} view" data-dot="${i}" aria-current="${i === 0}"></button>`).join("");
  $("#pdTrack").scrollLeft = 0;
  renderWishButton(id);
  if (location.hash !== `#p/${id}`) history.replaceState(null, "", `#p/${id}`);
  const layer = $("#product");
  if (layer.hidden) openLayer(layer);
  $(".pd", layer).scrollTop = 0;
}
function renderWishButton(id) {
  const on = state.wish.has(id), b = $("#pWish");
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
export function openDrawer() { renderDrawer(); openLayer($("#drawer")); }
function renderDrawer() {
  const items = [...state.wish].map((id) => byId[id]).filter(Boolean);
  $("#drawerList").innerHTML = items.length
    ? items.map((p) => `
      <li class="drawer__item">
        <img src="${p.images[0]}" alt="" width="76" height="101" loading="lazy" />
        <button class="drawer__open" type="button" data-view="${p.id}"><strong>${esc(p.name)}</strong><span>${esc(p.colour)} · ${formatINR(p.price)}</span></button>
        <button class="drawer__rm" type="button" data-rm="${p.id}" aria-label="Remove ${esc(p.name)}">Remove</button>
      </li>`).join("")
    : `<li class="drawer__empty"><span>Nothing here yet.<br/>Pick the one you are today.</span><a class="btn btn--ink" href="./#bags">See the bags</a></li>`;
  const m = store.member;
  $("#drawerFoot").innerHTML = items.length && m ? `<span>We’ll write to <b>${esc(m.email)}</b> the moment we launch.</span>` : "";
}
$("#drawerList").addEventListener("click", (e) => {
  const rm = e.target.closest("[data-rm]"), view = e.target.closest("[data-view]");
  if (rm) toggleWish(rm.dataset.rm, false);
  if (view) {
    closeLayer($("#drawer"));
    if (page === "drop") openProduct(view.dataset.view);
    else location.href = `drop.html#p/${view.dataset.view}`;
  }
});

/* ───────── toast ───────── */
let toastTimer;
export function toast(html) {
  const t = $("#toast");
  t.innerHTML = html; t.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-on"), 3400);
}

/* ───────── live IST clock for any [data-clock] ───────── */
const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const tickClocks = () => $$("[data-clock]").forEach((el) => { el.textContent = `IST ${fmt.format(new Date())}`; });
tickClocks(); setInterval(tickClocks, 1000);

/* ───────── reveals (enhancement only) ───────── */
export function armReveals() {
  const els = $$(".rv:not(.armed)");
  if (reduceMotion || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  els.forEach((el) => { el.classList.add("armed"); io.observe(el); });
  setTimeout(() => els.forEach((el) => el.classList.add("in")), 4000);
}

/* ───────── soundtrack: on by default, the nav toggle only turns it off ───────── */
(() => {
  const btn = $("#navSound");
  const KEY = "rumoar.sound.v2";
  const audio = Object.assign(new Audio("assets/audio/soundtrack.mp3"), { loop: true, preload: "auto", volume: 0 });
  let wantOn = true;
  try { wantOn = localStorage.getItem(KEY) !== "off"; } catch {}
  try { const t = Number(sessionStorage.getItem("rumoar.sound.t")); if (t) audio.currentTime = t; } catch {}
  let fade;
  const ramp = (to, ms, done) => {
    clearInterval(fade);
    const from = audio.volume, t0 = performance.now();
    fade = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      audio.volume = from + (to - from) * k;
      if (k >= 1) { clearInterval(fade); done?.(); }
    }, 30);
  };
  const ui = (on) => { btn.setAttribute("aria-pressed", on); btn.setAttribute("aria-label", on ? "Turn sound off" : "Turn sound on"); btn.classList.toggle("is-on", on); };
  const start = () => { if (!audio.paused) return Promise.resolve(true); return audio.play().then(() => { ramp(0.2, 2200); return true; }).catch(() => false); };
  const stop = () => ramp(0, 400, () => audio.pause());
  ui(wantOn);
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    wantOn = !wantOn;
    try { localStorage.setItem(KEY, wantOn ? "on" : "off"); } catch {}
    ui(wantOn);
    wantOn ? start() : stop();
  });
  // play straight away; if the browser holds sound back until the visitor
  // touches the page, the very first tap, click or key press starts it
  const EVENTS = ["pointerdown", "pointerup", "click", "touchstart", "touchend", "keydown", "mousedown"];
  const kick = (e) => {
    if (e.target.closest?.("#navSound")) return;
    if (!wantOn) return;
    start().then((ok) => { if (ok) EVENTS.forEach((t) => removeEventListener(t, kick, true)); });
  };
  // on the homepage the entry button starts the music, so it lands exactly on that tap
  const gated = !!document.getElementById("gate");
  if (wantOn && !gated) start().then((ok) => { if (!ok) EVENTS.forEach((t) => addEventListener(t, kick, { capture: true, passive: true })); });
  // the entry button on the homepage always means "with sound"
  document.addEventListener("rumoar:sound-on", () => {
    wantOn = true;
    try { localStorage.setItem(KEY, "on"); } catch {}
    ui(true);
    start().then((ok) => { if (!ok) EVENTS.forEach((t) => addEventListener(t, kick, { capture: true, passive: true })); });
  });
  addEventListener("pagehide", () => { try { sessionStorage.setItem("rumoar.sound.t", String(audio.currentTime)); } catch {} });
  document.addEventListener("visibilitychange", () => { if (document.hidden) audio.pause(); else if (wantOn) audio.play().catch(() => {}); });
})();

/* ───────── Bags: glide to the section on the homepage, or jump there from anywhere else ───────── */
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-bags], a[href='./#bags']");
  const sec = document.getElementById("bags");
  if (!a || !sec) return;
  e.preventDefault();
  sec.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", "#bags");
});

/* ───────── boot ───────── */
renderNavName();
renderCount();
if (store.mode === "demo") $("#demoPill").hidden = false;
export { PRODUCTS, CATEGORIES, byId, formatINR };

/* ───────── cursor that tells you what each thing does (mouse only) ───────── */
(() => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches || reduceMotion) return;
  const LABELS = [[".hero__word.is-hot", "Play"], [".look__card", "View"], [".card", "View"]];
  const cur = document.createElement("div"); cur.className = "cursor"; cur.setAttribute("aria-hidden", "true"); cur.innerHTML = "<span></span>";
  document.body.appendChild(cur);
  const label = cur.firstChild;
  let x = -100, y = -100, cx = x, cy = y, target = null;
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    x = e.clientX; y = e.clientY; target = e.target;
    cur.classList.add("is-on");
  }, { passive: true });
  document.addEventListener("pointerleave", () => cur.classList.remove("is-on"));
  addEventListener("scroll", () => { target = document.elementFromPoint(x, y); }, { passive: true });
  const tick = () => {
    cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
    cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    const hit = target && LABELS.find(([s]) => target.closest?.(s));
    cur.classList.toggle("is-label", !!hit);
    if (hit && label.textContent !== hit[1]) label.textContent = hit[1];
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

/* ───────── live favicon: the pixel bag shimmers and its blocks pop, like the intro ───────── */
(() => {
  const link = document.querySelector('link[rel="icon"]');
  if (!link || reduceMotion) return;
  link.type = "image/png";
  const G = ["..HHH..", ".H...H.", "BBBBBBB", "BBBBBBB", "BFFFFFB", "BBBKBBB", "BBBBBBB"];
  const BODY = ["#ff9a4a", "#ff8a3d", "#f4702a", "#e8561c", "#d4431a", "#c2380f", "#a92c0e"];
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d");
  const cell = 6.4, gap = 1.1, off = (64 - (7 * cell + 6 * gap)) / 2;
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); g.fill(); };
  let t0 = performance.now();
  function frame() {
    const t = (performance.now() - t0) / 1000;
    g.clearRect(0, 0, 64, 64);
    g.fillStyle = "#0b0302"; rr(0, 0, 64, 64, 15);
    G.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === ".") return;
      // a diagonal wave runs through the bag every 2.6s
      const w = Math.max(0, Math.sin((t * 2.4 - (x + y) * 0.45) % (Math.PI * 2.6)));
      const s = cell * (1 - 0.32 * w * w);
      const o = (cell - s) / 2;
      g.fillStyle = ch === "H" || ch === "F" ? "#f6efe6" : ch === "K" ? "#0b0302" : BODY[Math.min(6, ((x + y) >> 1) + (y > 3 ? 1 : 0))];
      if (w > 0.6 && ch === "B") g.fillStyle = "#ffd2a8";
      rr(off + x * (cell + gap) + o, off + y * (cell + gap) + o, s, s, 1.2);
    }));
    link.href = c.toDataURL("image/png");
  }
  setInterval(frame, 120);
  frame();
  // a little nudge in the tab bar when you wander off
  const title = document.title;
  document.addEventListener("visibilitychange", () => { document.title = document.hidden ? "Come back. The bags miss you." : title; });
})();
