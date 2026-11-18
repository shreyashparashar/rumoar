// RUMOAR intro, after the inspiration site:
// 1) on black, one small portrait shows through a 5×5 grid of square blocks
//    that switch on and off every fraction of a second while the portrait
//    keeps changing (no counter);
// 2) the RUMOAR title slams in letter by letter in red, then washes to cream;
// 3) the intro lifts away to reveal the film.
// Plays once per session, tap / key skips, reduced motion skips.

const PORTRAITS = Array.from({ length: 8 }, (_, i) => `assets/intro/p${i}.webp`);
const KEY = "rumoar.intro.v2";

export function runIntro(onDone) {
  const root = document.getElementById("intro");
  const finish = () => { root?.remove(); document.documentElement.classList.remove("is-intro"); onDone?.(); };
  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === "1"; } catch {}
  if (!root || seen || matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
  try { sessionStorage.setItem(KEY, "1"); } catch {}

  const canvas = root.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const title = root.querySelector(".intro__title");
  const GRID = 5;
  let size = 0, dpr = 1, imgs = [], timers = [], ended = false, pattern = [], img = 0;

  function fit() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    size = Math.round(Math.min(innerWidth * 0.34, innerHeight * 0.3, 260));
    canvas.style.width = canvas.style.height = `${size}px`;
    canvas.width = canvas.height = Math.round(size * dpr);
  }
  fit();

  // shapes like the reference: plus signs, checkers, partial frames
  function newPattern() {
    if (Math.random() < 0.12) return (pattern = []);                    // a blank beat now and then
    const cells = [];
    const on = (x, y) => { if (x >= 0 && y >= 0 && x < GRID && y < GRID) cells.push([x, y]); };
    const cx = 1 + Math.floor(Math.random() * 3), cy = 1 + Math.floor(Math.random() * 3);
    const kind = Math.random();
    if (kind < 0.35) { on(cx, cy); on(cx - 1, cy); on(cx + 1, cy); on(cx, cy - 1); on(cx, cy + 1); }
    else if (kind < 0.7) { for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) if ((x + y) % 2 === (cx % 2) && Math.random() < 0.85) on(x, y); }
    else { for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) if (Math.random() < 0.42) on(x, y); }
    for (let k = 0; k < 3; k++) on(Math.floor(Math.random() * GRID), Math.floor(Math.random() * GRID));
    pattern = cells;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const im = imgs[img];
    if (!im) return;
    const c = canvas.width / GRID;
    pattern.forEach(([x, y]) => ctx.drawImage(im, (x * im.naturalWidth) / GRID, (y * im.naturalHeight) / GRID, im.naturalWidth / GRID, im.naturalHeight / GRID, x * c, y * c, c + 0.5, c + 0.5));
  }

  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  function play() {
    root.classList.add("is-live");
    // phase 1: the block portrait (0 to 2.7s)
    let t = 0;
    while (t < 2700) {
      const k = t;
      at(k, () => { if (Math.random() < 0.34) img = (img + 1 + Math.floor(Math.random() * (imgs.length - 1))) % imgs.length; newPattern(); draw(); });
      t += 150 + Math.random() * 90;
    }
    // phase 2: the title slams in, red, then washes to cream
    at(2750, () => { pattern = []; draw(); root.classList.add("is-title"); });
    [...title.children].forEach((l, i) => at(2780 + i * 95, () => l.classList.add("in")));
    at(2780 + 6 * 95 + 260, () => root.classList.add("is-cream"));
    // phase 3: lift away
    at(4500, leave);
  }
  function leave() {
    if (ended) return;
    ended = true;
    timers.forEach(clearTimeout);
    root.classList.add("is-title", "is-cream", "is-leaving");
    [...title.children].forEach((l) => l.classList.add("in"));
    removeEventListener("keydown", leave); root.removeEventListener("click", leave);
    setTimeout(finish, 750);
  }
  addEventListener("keydown", leave); root.addEventListener("click", leave);
  addEventListener("resize", () => { fit(); draw(); });

  const load = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  const guard = setTimeout(leave, 6000);
  Promise.all([Promise.all(PORTRAITS.map(load)), Promise.race([document.fonts?.load("600 80px Poppins") ?? Promise.resolve(), new Promise((r) => setTimeout(r, 800))])]).then(([list]) => {
    clearTimeout(guard);
    imgs = list.filter(Boolean);
    if (ended) return;
    if (!imgs.length) return leave();
    play();
  });
}
