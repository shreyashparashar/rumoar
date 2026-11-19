// All bags: filterable product cards, wishlist hearts.
import { $, $$, esc, state, openProduct, toggleWish, onWishChange, PRODUCTS, CATEGORIES, byId } from "./common.js";
import { cardsHTML } from "./cards.js";

let filter = "all";
const FEATURED = new Set([0]); // big tiles

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
  $("#cards").innerHTML = cardsHTML(PRODUCTS, { featured: FEATURED });
}
$("#cards").addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  if (e.target.closest(".card__heart")) toggleWish(card.dataset.id);
  else openProduct(card.dataset.id);
});
onWishChange((id) => $$(`.card[data-id="${id}"] .card__heart`).forEach((b) => b.setAttribute("aria-pressed", state.wish.has(id))));

renderFilters();
renderCards();
const deep = location.hash.match(/^#p\/([\w-]+)/);
if (deep && byId[deep[1]]) openProduct(deep[1]);
