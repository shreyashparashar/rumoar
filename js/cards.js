// Product cards shared by the homepage rail and the all-bags page.
import { esc, HEART, state, PRODUCTS, formatINR } from "./common.js";

export function cardsHTML(list = PRODUCTS, { featured = new Set() } = {}) {
  return list.map((p, i) => `
    <li class="card${featured.has(i) ? " card--hero" : ""}" data-id="${p.id}" data-cat="${p.category}">
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
