// RUMOAR wordmark.
// Laptop: one giant line of deep pearl-white letters. Hover a letter and its
// film wipes up inside the letterform (canvas mask).
// Phone: the word stands up as a tall spine down the left of the screen, read
// bottom to top. Your finger paints the films through the letters, and the
// paint slowly heals back to pearl. When nobody is touching it, a ghost brush
// keeps drifting through the spine, and the side panel names the letter it lights up.

import { pickVideo } from "./hero-gl.js";

const LETTERS = "RUMOAR";
const NAMES = ["The Maverick", "The Outlier", "The Messenger", "The Operator", "The Strategist", "The Nomad"];
const FONT = (px) => `700 ${px}px Poppins, "Helvetica Neue", Arial, sans-serif`;
const TRACK = -4;

export function initWordmark(host, { onLetter } = {}) {
  const canvas = host.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const videos = LETTERS.split("").map((_, i) => {
    const v = Object.assign(document.createElement("video"), { src: pickVideo(`assets/letters/l${i + 1}.mp4`), muted: true, loop: true, playsInline: true, preload: "auto" });
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    return v;
  });
  const mask = document.createElement("canvas");
  // phone spine: the word is drawn flat into V, then stood up onto the screen
  const V = document.createElement("canvas"), vctx = V.getContext("2d");
  const film = document.createElement("canvas"), fctx = film.getContext("2d");
  const paint = document.createElement("canvas"), pctx = paint.getContext("2d");
  const PS = 0.33; // paint buffer resolution

  let W = 0, H = 0, dpr = 1, glyphs = [], running = false, visible = true, raf = 0, hot = -1;
  let phone = false, spine = null, lastTouch = -1e9, lit = -1, nameT;
  const mix = LETTERS.split("").map(() => 0);
  const active = LETTERS.split("").map(() => -1e9);

  function measure(c) { c.font = FONT(100); return c.measureText("R").actualBoundingBoxAscent || 70; }

  // lay out one or more rows of glyphs inside a box
  function layoutRows(rows, box, c) {
    const cap = measure(c), out = [];
    const rowH = box.h / rows.length;
    let index = 0;
    rows.forEach((row, r) => {
      const adv = row.split("").map((ch) => c.measureText(ch).width + TRACK);
      const w100 = adv.reduce((a, b) => a + b, 0) - TRACK;
      const sx = box.w / w100;
      const sy = Math.min(rowH / cap, sx * 2.1);
      const y0 = box.y + r * rowH + (rowH - cap * sy) / 2;
      let x = box.x;
      row.split("").forEach((ch, k) => {
        const last = k === row.length - 1;
        out.push({ ch, i: index++, x, y: y0, w: (adv[k] - TRACK) * sx, sw: last ? (adv[k] - TRACK) * sx + (box.pad || 0) : adv[k] * sx, h: cap * sy, sx, sy, first: k === 0 });
        x += adv[k] * sx;
      });
    });
    return out;
  }

  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    W = host.clientWidth; H = host.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    phone = W < 700;
    host.classList.toggle("is-spine", phone);
    let mctx, mw, mh;
    if (!phone) {
      glyphs = layoutRows(["RUMOAR"], { x: 18, y: 96, w: W - 36, h: H - 96 - 104, pad: 18 }, ctx);
      mw = canvas.width; mh = canvas.height;
    } else {
      // the spine: length runs up the screen, thickness across it
      const top = 78, bottom = 122, side = 14;
      const L = H - top - bottom;
      const cap = measure(ctx);
      const w100 = LETTERS.split("").reduce((a, ch) => a + ctx.measureText(ch).width + TRACK, 0) - TRACK;
      const thick = Math.min(W * 0.56, cap * (L / w100) * 2.1);
      spine = { x: side, y: top, L, T: thick };
      V.width = Math.round(L * dpr); V.height = Math.round(thick * dpr);
      film.width = V.width; film.height = V.height;
      paint.width = Math.max(1, Math.round(L * PS)); paint.height = Math.max(1, Math.round(thick * PS));
      glyphs = layoutRows(["RUMOAR"], { x: 0, y: 0, w: L, h: thick }, vctx);
      host.style.setProperty("--spine-x", `${side + thick}px`);
      host.style.setProperty("--spine-top", `${top}px`);
      host.style.setProperty("--spine-h", `${L}px`);
      mw = V.width; mh = V.height;
    }
    mask.width = mw; mask.height = mh;
    mctx = mask.getContext("2d");
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mctx.fillStyle = "#000";
    glyphs.forEach((g) => { mctx.save(); mctx.translate(g.x, g.y + g.h); mctx.scale(g.sx, g.sy); mctx.font = FONT(100); mctx.fillText(g.ch, 0, 0); mctx.restore(); });
  }

  function cover(c, v, x, y, w, h) {
    const vw = v.videoWidth, vh = v.videoHeight;
    if (!vw || v.readyState < 2) return false;
    const s = Math.max(w / vw, h / vh);
    c.drawImage(v, x + (w - vw * s) / 2, y + (h - vh * s) / 2, vw * s, vh * s);
    return true;
  }

  function pearl(c, w, h, now) {
    // warm white with a slow sheen travelling across the word
    const sheen = ((now / 5200) % 1.6) - 0.3;
    const g = c.createLinearGradient(0, 0, w, h * 0.4);
    const cl = (v) => Math.min(0.999, Math.max(0.001, v));
    g.addColorStop(0, "#efe7da");
    g.addColorStop(cl(sheen - 0.08), "#f3ece1");
    g.addColorStop(cl(sheen), "#fffdf8");
    g.addColorStop(cl(sheen + 0.08), "#f3ece1");
    g.addColorStop(1, "#e6ddcf");
    return g;
  }

  /* ── laptop: hover a letter ── */
  function drawDesk(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = pearl(ctx, W, H, now); ctx.fillRect(0, 0, W, H);
    glyphs.forEach((g) => {
      const x0 = g.first ? 0 : g.x, x1 = g.x + g.sw, y0 = g.y - 4, y1 = g.y + g.h + 4;
      const k = mix[g.i];
      if (k > 0.001) {
        // the film wipes up from the bottom of the letter
        const top = y1 - (y1 - y0) * k;
        ctx.save();
        ctx.beginPath(); ctx.rect(x0, top, x1 - x0, y1 - top); ctx.clip();
        ctx.filter = "brightness(1.15) contrast(1.06)";
        if (!cover(ctx, videos[g.i], x0, y0, x1 - x0, y1 - y0)) { ctx.fillStyle = "#2a0c06"; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }
        ctx.restore();
      }
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  }

  /* ── phone: paint the films through the spine ── */
  function toV(px, py) { return { u: spine.y + spine.L - py, v: px - spine.x }; }
  function glyphAtU(u) { const g = glyphs.find((g) => u >= g.x && u < g.x + g.sw); return g ? g.i : -1; }
  let prev = null;
  function brush(u, v, r, strength = 1) {
    const now = performance.now();
    const steps = prev ? Math.max(1, Math.ceil(Math.hypot(u - prev.u, v - prev.v) / (r * 0.35))) : 1;
    for (let s = 1; s <= steps; s++) {
      const k = s / steps, bu = prev ? prev.u + (u - prev.u) * k : u, bv = prev ? prev.v + (v - prev.v) * k : v;
      const g = pctx.createRadialGradient(bu * PS, bv * PS, 0, bu * PS, bv * PS, r * PS);
      g.addColorStop(0, `rgba(0,0,0,${0.9 * strength})`); g.addColorStop(0.6, `rgba(0,0,0,${0.45 * strength})`); g.addColorStop(1, "rgba(0,0,0,0)");
      pctx.fillStyle = g; pctx.fillRect((bu - r) * PS, (bv - r) * PS, r * 2 * PS, r * 2 * PS);
      // wake up every letter the brush touches
      glyphs.forEach((gl) => { if (bu + r > gl.x && bu - r < gl.x + gl.sw) active[gl.i] = now; });
    }
    prev = { u, v };
    // name the letter once it has stayed lit for a moment
    const i = glyphAtU(u);
    if (i >= 0 && i !== lit) {
      lit = i; clearTimeout(nameT);
      nameT = setTimeout(() => { if (lit === i) onLetter?.(i, NAMES[i]); }, 380);
    }
  }

  function drawPhone(now) {
    const { L, T } = spine;
    // heal: the paint fades back towards pearl
    pctx.globalCompositeOperation = "destination-out";
    pctx.fillStyle = "rgba(0,0,0,0.028)"; pctx.fillRect(0, 0, paint.width, paint.height);
    pctx.globalCompositeOperation = "source-over";
    // ghost brush when nobody is touching
    if (now - lastTouch > 2600) {
      const t = now / 1000;
      const u = L * (0.5 + 0.46 * Math.sin(t * 0.42)), v = T * (0.5 + 0.32 * Math.sin(t * 1.7 + 1));
      brush(u, v, T * 0.42, 0.55);
    } else if (now - lastTouch > 300) prev = null;

    // play only the letters that are lit
    videos.forEach((vd, i) => {
      const on = now - active[i] < 2600;
      if (on && vd.paused) vd.play().catch(() => {});
      else if (!on && !vd.paused) vd.pause();
    });

    // films for lit letters, kept only where the paint is
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fctx.globalCompositeOperation = "source-over";
    fctx.clearRect(0, 0, L, T);
    fctx.filter = "brightness(1.12) contrast(1.06)";
    glyphs.forEach((g) => { if (now - active[g.i] < 2600) cover(fctx, videos[g.i], g.x, 0, g.sw, T); });
    fctx.filter = "none";
    fctx.globalCompositeOperation = "destination-in";
    fctx.drawImage(paint, 0, 0, L, T);

    vctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    vctx.globalCompositeOperation = "source-over";
    vctx.clearRect(0, 0, L, T);
    vctx.fillStyle = pearl(vctx, L, T, now); vctx.fillRect(0, 0, L, T);
    vctx.setTransform(1, 0, 0, 1, 0, 0);
    vctx.drawImage(film, 0, 0);
    vctx.globalCompositeOperation = "destination-in";
    vctx.drawImage(mask, 0, 0);
    vctx.globalCompositeOperation = "source-over";

    // stand the word up: it reads bottom to top
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(spine.x, spine.y + L);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(V, 0, 0, L, T);
  }

  /* ── input ── */
  function setHot(i) {
    if (i === hot) return;
    if (hot >= 0) videos[hot].pause();
    hot = i;
    host.classList.toggle("is-hot", i >= 0);
    if (i >= 0) { const v = videos[i]; try { v.currentTime = 0; } catch {} v.play().catch(() => {}); }
  }
  function glyphAt(px, py) {
    const g = glyphs.find((g) => px >= (g.first ? 0 : g.x) && px < g.x + g.sw && py >= g.y - 10 && py <= g.y + g.h + 10);
    return g ? g.i : -1;
  }
  const local = (e) => { const r = host.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  host.addEventListener("pointermove", (e) => {
    const [px, py] = local(e);
    if (phone) {
      if (e.pointerType === "mouse" && !e.buttons) return;
      lastTouch = performance.now();
      const { u, v } = toV(px, py);
      if (v > -40 && v < spine.T + 40) brush(u, v, spine.T * 0.36);
      return;
    }
    if (e.pointerType !== "touch") setHot(glyphAt(px, py));
  });
  host.addEventListener("pointerdown", (e) => {
    if (!phone) return;
    const [px, py] = local(e);
    lastTouch = performance.now(); prev = null;
    const { u, v } = toV(px, py);
    if (v > -40 && v < spine.T + 40) { brush(u, v, spine.T * 0.5); host.classList.add("is-touched"); }
  });
  host.addEventListener("pointerup", () => { prev = null; });
  host.addEventListener("pointercancel", () => { prev = null; });
  host.addEventListener("pointerleave", () => { if (!phone) setHot(-1); });

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!visible) return;
    if (phone) return drawPhone(now);
    mix.forEach((m, i) => { mix[i] += ((i === hot ? 1 : 0) - m) * 0.16; });
    drawDesk(now);
  }

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible) videos.forEach((v) => v.pause());
    else if (!phone && hot >= 0) videos[hot].play().catch(() => {});
  }, { threshold: 0.01 }).observe(host);
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (running) { const was = phone; layout(); if (was !== phone) videos.forEach((v) => v.pause()); } }, 120); });

  return {
    async start() {
      if (running) return;
      running = true;
      try { await document.fonts.load(FONT(100)); } catch {}
      layout();
      raf = requestAnimationFrame(loop);
    },
  };
}
