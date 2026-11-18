// Drop 01 page: sign-up gate, filterable product cards, wishlist hearts.
import { $, $$, esc, HEART, store, state, openSignup, openProduct, toggleWish, onWishChange, onMember, PRODUCTS, CATEGORIES, byId, formatINR } from "./common.js";

let filter = "all";
const FEATURED = new Set([0, 7]); // big tiles

function renderFilters() {
  $("#filters").innerHTML = CATEGORIES.map((c) => {
    const n = c.id === "all" ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === c.id).length;
    return `<button class="chip" role="tab" type="button" data-filter="${c.id}" aria-selected="${filter === c.id}">${esc(c.label)}<b>${n}</b></button>`;
  }).join("");
}
$("#filters").addEventListener("click", (e) => {
  const b = e.target.closest("[data-filter]");
  if (!b) return;
  filter = b.dataset.filter;
  $$(".chip").forEach((c) => c.setAttribute("aria-selected", c === b));
  $$(".card").forEach((c) => c.classList.toggle("is-hidden", filter !== "all" && c.dataset.cat !== filter));
});

function renderCards() {
  $("#cards").innerHTML = PRODUCTS.map((p, i) => `
    <li class="card${FEATURED.has(i) ? " card--hero" : ""}" data-id="${p.id}" data-cat="${p.category}">
      <button class="card__heart" type="button" aria-pressed="${state.wish.has(p.id)}" aria-label="Wishlist ${esc(p.name)}">${HEART}</button>
      <button class="card__open" type="button" aria-label="View ${esc(p.name)}">
        <span class="card__media">
          <img src="${p.images[0]}" alt="${esc(p.name)}" loading="${i < 4 ? "eager" : "lazy"}" width="1000" height="1139" />
          <img src="${p.images[1]}" alt="" loading="lazy" width="1000" height="1139" />
          <span class="card__no">${String(i + 1).padStart(2, "0")}</span>
        </span>
        <span class="card__body"><span class="card__name">${esc(p.name)}</span><span class="card__price">${formatINR(p.price)}</span></span>
        <span class="card__type">${esc(p.type)}</span>
      </button>
    </li>`).join("");
}
$("#cards").addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  if (e.target.closest(".card__heart")) toggleWish(card.dataset.id);
  else openProduct(card.dataset.id);
});
onWishChange((id) => $$(`.card[data-id="${id}"] .card__heart`).forEach((b) => b.setAttribute("aria-pressed", state.wish.has(id))));

function setLocked(locked) {
  const wrap = $("#dropWrap");
  wrap.classList.toggle("is-locked", locked);
  if (!locked) { wrap.classList.add("is-unlocking"); setTimeout(() => wrap.classList.remove("is-unlocking"), 1200); }
}
onMember(() => setLocked(false));

renderFilters();
renderCards();
setLocked(!store.member);
if (!store.member) setTimeout(openSignup, 500); // members only: ask on arrival
const deep = location.hash.match(/^#p\/([\w-]+)/);
if (deep && byId[deep[1]] && store.member) openProduct(deep[1]);
