import { PRODUCTS, CATEGORIES, byId, formatINR } from "./products.js";
import { createStore } from "./store.js";

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

/* ───────── nav ───────── */
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("is-solid", scrollY > innerHeight * 0.75);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

function renderMember() {
  const m = store.member;
  const btn = $("#navMember");
  btn.textContent = m ? `Hi, ${m.name.split(" ")[0]}` : "Join the list";
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

/* ───────── "Who are you today?" rotator ───────── */
(() => {
  const order = ["maverick", "provocateur", "chameleon", "outlier", "heir", "diplomat", "purist", "vanguard"];
  const card = $("#whoCard"), A = $("#whoImgA"), B = $("#whoImgB");
  let i = 0, front = A, back = B, timer;
  const set = (p, img) => { img.src = p.images[0]; img.alt = `${p.name} — ${p.type}`; };
  const first = byId[order[0]];
  set(first, A); B.classList.add("is-out");
  $("#whoName").textContent = first.name; $("#whoLine").textContent = first.tagline;

  function next() {
    i = (i + 1) % order.length;
    const p = byId[order[i]];
    set(p, back);
    card.classList.add("is-swapping");
    const go = () => {
      back.classList.remove("is-out"); front.classList.add("is-out");
      [front, back] = [back, front];
      setTimeout(() => {
        $("#whoName").textContent = p.name; $("#whoLine").textContent = p.tagline;
        card.classList.remove("is-swapping");
      }, 300);
    };
    back.decode ? back.decode().then(go, go) : go();
  }
  const start = () => { if (!reduceMotion) timer = setInterval(next, 3200); };
  const stop = () => clearInterval(timer);
  // only rotate while visible
  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.2 }).observe(card);
  card.addEventListener("click", () => openProduct(order[i]));
})();

/* ───────── marquee ───────── */
(() => {
  const names = PRODUCTS.map((p) => p.name.toUpperCase());
  const run = names.map((n) => `${esc(n)}<i>●</i>`).join("");
  $("#marquee").innerHTML = `<span>${run}</span><span>${run}</span>`;
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
  $$(".card").forEach((c) => c.classList.toggle("is-hidden", state.filter !== "all" && c.dataset.cat !== state.filter));
});

function renderGrid() {
  $("#grid").innerHTML = PRODUCTS.map((p, i) => `
    <li class="card" data-id="${p.id}" data-cat="${p.category}">
      <button class="card__heart" type="button" aria-pressed="${state.wish.has(p.id)}" aria-label="Wishlist ${esc(p.name)}">${HEART}</button>
      <button class="card__open" type="button" aria-label="View ${esc(p.name)}">
        <div class="card__media">
          <img src="${p.images[0]}" alt="${esc(p.name)}, front" loading="lazy" width="1000" height="1139" />
          <img src="${p.images[1]}" alt="" loading="lazy" width="1000" height="1139" />
          <span class="card__num">(${String(i + 1).padStart(2, "0")})</span>
        </div>
        <div class="card__body">
          <span class="card__name">${esc(p.name)}</span>
          <span class="card__meta">${esc(p.type)} · ${esc(p.colour)}</span>
          <span class="card__price">${formatINR(p.price)}</span>
        </div>
      </button>
    </li>`).join("");
}
$("#grid").addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  if (e.target.closest(".card__heart")) toggleWish(card.dataset.id);
  else openProduct(card.dataset.id);
});

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
    toast("Couldn’t sync your wishlist — it’s saved on this device.");
  });
}
function syncWishUI(id) {
  $$(`.card[data-id="${id}"] .card__heart`).forEach((b) => b.setAttribute("aria-pressed", state.wish.has(id)));
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
    $("#signupError").textContent = "Something went wrong on our side. Please try again in a moment.";
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
const deep = location.hash.match(/^#p\/([\w-]+)/);
if (deep && byId[deep[1]]) openProduct(deep[1]);
