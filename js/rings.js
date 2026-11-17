// RUMOAR personality rings.
// Ported from the Wix embed: three rotating rings (heads, torsos with bags,
// legs) lock together into six personalities, with a text ring around them.
// Changes for this site: Poppins instead of Unbounded, transparent canvas so
// the section colour shows through, the persona at the top glows orange, the
// sprite is served from /assets, and it reports each new look so the page
// can flip the "Right now" board.

/* ================= SETTINGS (safe to edit) ================= */
const SPRITE_URL = "assets/rings-sprite.webp";
const MODE = "match";              // "match" = each stop shows one complete model | "mix" = random combos
const HOLD_MS = 2600;              // how long a look stays still
const SPIN_MS = [1700, 1950, 2200];// spin time: heads, torsos, legs
const DELAY_MS = [0, 90, 180];     // slight stagger so the rings feel mechanical
const DIRECTION = [1, -1, 1];      // 1 = clockwise, -1 = counter-clockwise
const EXTRA_TURNS = 1;             // full turns added to every spin
const RING_LINES = true;
const LINE_COLOR = "#ece8e1";
export const PERSONAS = ["The Weekender", "The Commuter", "The Explorer", "The Wanderer", "The Minimalist", "The Strategist"];
const TAGLINES = ["Rumoar is multiple personalities", "Engage every one of them", "Which one are you today?",
                  "Rumoar is multiple personalities", "Engage every one of them", "One bag for every you"];
const NAME_COLOR = "#141414", ACTIVE_COLOR = "#e8561c", LINE_TEXT_COLOR = "#8c8a85";
const FONT = 'Poppins, "Helvetica Neue", Arial, sans-serif';
/* =========================================================== */

const META = {"px": 64, "w": 1600, "h": 922, "pieces": [{"i": 0, "r": 0, "x": 1258, "y": 411, "w": 187, "h": 172, "dx": -1.4609, "t": 2.6562}, {"i": 1, "r": 0, "x": 203, "y": 746, "w": 156, "h": 169, "dx": -1.1016, "t": 2.6094}, {"i": 2, "r": 0, "x": 6, "y": 746, "w": 191, "h": 170, "dx": -1.4609, "t": 2.625}, {"i": 3, "r": 0, "x": 365, "y": 746, "w": 159, "h": 163, "dx": -1.5469, "t": 2.5156}, {"i": 4, "r": 0, "x": 530, "y": 746, "w": 146, "h": 163, "dx": -1.0234, "t": 2.5156}, {"i": 5, "r": 0, "x": 1048, "y": 411, "w": 204, "h": 179, "dx": -1.5703, "t": 2.7656}, {"i": 0, "r": 1, "x": 913, "y": 6, "w": 357, "h": 368, "dx": -3.0234, "t": 0.0}, {"i": 1, "r": 1, "x": 6, "y": 6, "w": 283, "h": 399, "dx": -2.0703, "t": 0.0}, {"i": 2, "r": 1, "x": 348, "y": 411, "w": 309, "h": 328, "dx": -2.4141, "t": 0.0}, {"i": 3, "r": 1, "x": 674, "y": 6, "w": 233, "h": 386, "dx": -2.2031, "t": 0.0}, {"i": 4, "r": 1, "x": 1276, "y": 6, "w": 209, "h": 329, "dx": -1.5703, "t": 0.0}, {"i": 5, "r": 1, "x": 6, "y": 411, "w": 336, "h": 329, "dx": -2.6328, "t": 0.0}, {"i": 0, "r": 2, "x": 1230, "y": 746, "w": 249, "h": 100, "dx": -1.3516, "t": -5.7188}, {"i": 1, "r": 2, "x": 663, "y": 411, "w": 187, "h": 261, "dx": -1.2891, "t": -6.2031}, {"i": 2, "r": 2, "x": 981, "y": 746, "w": 243, "h": 141, "dx": -1.4453, "t": -5.0938}, {"i": 3, "r": 2, "x": 295, "y": 6, "w": 373, "h": 388, "dx": -3.1562, "t": -6.0}, {"i": 4, "r": 2, "x": 856, "y": 411, "w": 186, "h": 187, "dx": -1.3516, "t": -5.1094}, {"i": 5, "r": 2, "x": 682, "y": 746, "w": 293, "h": 147, "dx": -1.9609, "t": -5.1094}]};

export function initRings(root, { onLook } = {}) {
  if (!root) return;
  const COUNT = 6, STEP = Math.PI * 2 / COUNT, TAU = Math.PI * 2;
  const canvas = root.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const rings = [[], [], []];
  META.pieces.forEach((p) => { rings[p.r][p.i] = p; });
  const PX = META.px;

  let deepest = 0, tallestHead = 0;
  rings[2].forEach((p) => { deepest = Math.max(deepest, -p.t + p.h / PX); });
  rings[0].forEach((p) => { tallestHead = Math.max(tallestHead, p.t); });
  const R_NECK = deepest + 0.35;
  const R_OUT = R_NECK + tallestHead + 0.25;
  let waistAvg = 0; rings[2].forEach((p) => { waistAvg += -p.t; }); waistAvg /= COUNT;
  const R_TEXT = R_OUT + 0.5;
  const FRAME_W = 2 * (R_OUT + 1.7), FRAME_H = R_OUT + 1.7;

  let angle = [0, 0, 0], anim = null, current = [0, 0, 0];
  let holdUntil = 0, visible = true, ready = false, opening = true;
  const sprite = new Image();

  const norm = (a) => { a %= TAU; return a < 0 ? a + TAU : a; };
  const angleFor = (i) => norm(-i * STEP);
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function startSpin(targets, now) {
    const from = angle.slice(), to = [];
    for (let k = 0; k < 3; k++) {
      const goal = angleFor(targets[k]), d = DIRECTION[k];
      const dist = d > 0 ? norm(goal - from[k]) : norm(from[k] - goal);
      to[k] = from[k] + d * (dist + EXTRA_TURNS * TAU);
    }
    anim = { from, to, start: now, targets };
    onLook?.(PERSONAS[targets[1]], targets[1]); // flip the board while the rings spin
  }

  function nextTargets() {
    if (opening && MODE !== "mix") { opening = false; return [0, 0, 0]; }
    if (MODE === "mix") {
      return [0, 1, 2].map((k) => { let r; do { r = Math.floor(Math.random() * COUNT); } while (r === current[k]); return r; });
    }
    const n = (current[0] + 1) % COUNT;
    return [n, n, n];
  }

  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2.5);
    W = root.clientWidth; H = root.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!ready) return;
    const u = Math.min(W / FRAME_W, H / FRAME_H) * dpr;
    const cx = canvas.width / 2;
    const cy = (canvas.height + FRAME_H * u) / 2;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, canvas.width, cy); ctx.clip();
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    if (RING_LINES) {
      ctx.strokeStyle = LINE_COLOR; ctx.lineWidth = Math.max(1, dpr);
      [R_OUT, R_NECK, R_NECK - waistAvg].forEach((r) => { ctx.beginPath(); ctx.arc(cx, cy, r * u, Math.PI, 0); ctx.stroke(); });
    }
    drawTextRing(u, cx, cy);
    for (let k = 2; k >= 0; k--) {
      for (let i = 0; i < COUNT; i++) {
        const p = rings[k][i];
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(cx, cy);
        ctx.rotate(angle[k] + i * STEP);
        ctx.drawImage(sprite, p.x, p.y, p.w, p.h, p.dx * u, -(R_NECK + p.t) * u, (p.w / PX) * u, (p.h / PX) * u);
      }
    }
    ctx.restore();
  }

  function arcWidth(text, size, weight, track) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    let w = 0; for (let i = 0; i < text.length; i++) w += ctx.measureText(text[i]).width + track;
    return w - track;
  }
  function drawArc(text, centre, radius, size, weight, color, track) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    let a = centre - arcWidth(text, size, weight, track) / 2 / radius;
    for (let i = 0; i < text.length; i++) {
      const cw = ctx.measureText(text[i]).width;
      a += cw / 2 / radius;
      ctx.save(); ctx.rotate(a); ctx.fillText(text[i], 0, -radius); ctx.restore();
      a += (cw / 2 + track) / radius;
    }
  }
  function drawTextRing(u, cx, cy) {
    const r = R_TEXT * u, nameSize = 0.6 * u, lineSize = 0.4 * u, gap = 0.08;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(cx, cy); ctx.rotate(angle[0]);
    const nameAng = PERSONAS.map((n) => arcWidth(n.toUpperCase(), nameSize, 600, nameSize * 0.12) / r);
    for (let i = 0; i < COUNT; i++) {
      // the name sitting closest to the top glows orange
      const off = Math.abs(((norm(angle[0] + i * STEP) + Math.PI) % TAU) - Math.PI);
      const col = off < STEP * 0.32 ? ACTIVE_COLOR : NAME_COLOR;
      drawArc(PERSONAS[i].toUpperCase(), i * STEP, r, nameSize, 600, col, nameSize * 0.12);
      const room = STEP - nameAng[i] / 2 - nameAng[(i + 1) % COUNT] / 2 - 2 * gap;
      let size = lineSize;
      const w = arcWidth(TAGLINES[i], size, 400, size * 0.04) / r;
      if (w > room) size *= room / w;
      drawArc(TAGLINES[i], i * STEP + STEP / 2 + (nameAng[i] - nameAng[(i + 1) % COUNT]) / 4, r, size, 400, LINE_TEXT_COLOR, size * 0.04);
    }
  }

  function frame(now) {
    if (ready && visible) {
      if (anim) {
        let done = true;
        for (let k = 0; k < 3; k++) {
          let t = (now - anim.start - DELAY_MS[k]) / SPIN_MS[k];
          t = Math.max(0, Math.min(1, t));
          if (t < 1) done = false;
          angle[k] = anim.from[k] + (anim.to[k] - anim.from[k]) * ease(t);
        }
        if (done) {
          for (let j = 0; j < 3; j++) { current[j] = anim.targets[j]; angle[j] = angleFor(current[j]); }
          anim = null; holdUntil = now + HOLD_MS;
        }
      } else if (now >= holdUntil) {
        const targets = nextTargets();
        if (reduce) {
          current = targets.slice();
          for (let m = 0; m < 3; m++) angle[m] = angleFor(current[m]);
          holdUntil = now + HOLD_MS + 1500;
          onLook?.(PERSONAS[current[1]], current[1]);
        } else startSpin(targets, now);
      }
      draw();
    }
    requestAnimationFrame(frame);
  }

  root.addEventListener("click", () => { if (!anim && ready) holdUntil = 0; });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((e) => {
      const was = visible; visible = e[0].isIntersecting;
      if (visible && !was && !anim) holdUntil = performance.now() + 600;
    }).observe(root);
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && anim) {
      for (let k = 0; k < 3; k++) { current[k] = anim.targets[k]; angle[k] = angleFor(current[k]); }
      anim = null; holdUntil = performance.now() + 800;
    }
  });

  addEventListener("resize", () => { resize(); draw(); });
  if ("ResizeObserver" in window) new ResizeObserver(() => { resize(); draw(); }).observe(root);
  resize();

  // opening: rings start scrambled, then lock onto the first look
  current = [2, 4, 1];
  for (let k = 0; k < 3; k++) angle[k] = angleFor(current[k]);
  const fontsReady = document.fonts ? document.fonts.load(`600 20px ${FONT}`).catch(() => {}) : Promise.resolve();
  sprite.onload = () => fontsReady.then(() => { ready = true; holdUntil = performance.now() + 500; draw(); });
  sprite.onerror = () => console.error("RUMOAR rings: could not load the sprite image. Check SPRITE_URL.");
  sprite.src = SPRITE_URL;
  requestAnimationFrame(frame);
}
