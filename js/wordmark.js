// RUMOAR wordmark filled with film.
// Each letter plays its own clip *inside the letterform* (canvas: draw every
// clip into its letter's slot, then keep only the pixels under the glyphs).
// The word fills the screen: one line on laptops, three rows (RU / MO / AR)
// on phones.

import { pickVideo } from "./hero-gl.js";

const LETTERS = "RUMOAR";
const FONT = (px) => `700 ${px}px Poppins, "Helvetica Neue", Arial, sans-serif`;

export function initWordmark(host) {
  const canvas = host.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const videos = LETTERS.split("").map((_, i) => {
    const v = Object.assign(document.createElement("video"), { src: pickVideo(`assets/letters/l${i + 1}.mp4`), muted: true, loop: true, playsInline: true, preload: "auto" });
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    return v;
  });
  const mask = document.createElement("canvas");
  let W = 0, H = 0, dpr = 1, glyphs = [], running = false, visible = true, raf = 0;

  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    W = host.clientWidth; H = host.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const phone = W < 700;
    const rows = phone ? ["RU", "MO", "AR"] : ["RUMOAR"];
    const top = phone ? 76 : 96, bottom = phone ? 110 : 104, side = phone ? 12 : 18, gap = phone ? 14 : 0;
    const availW = W - side * 2, availH = H - top - bottom - gap * (rows.length - 1);
    ctx.font = FONT(100);
    const cap = ctx.measureText("R").actualBoundingBoxAscent || 70;
    const track = -4;                                  // letter-spacing at 100px
    const rowH = availH / rows.length;
    glyphs = [];
    let index = 0;
    rows.forEach((row, r) => {
      const adv = row.split("").map((ch) => ctx.measureText(ch).width + track);
      const w100 = adv.reduce((a, b) => a + b, 0) - track;
      const sx = availW / w100;
      const sy = Math.min(rowH / cap, sx * 2.1);       // tall, but never absurdly stretched
      const y0 = top + r * (rowH + gap) + (rowH - cap * sy) / 2;
      let x = side;
      row.split("").forEach((ch, k) => {
        glyphs.push({ ch, i: index++, x, y: y0, w: (adv[k] - track) * sx, sw: k === row.length - 1 ? (adv[k] - track) * sx + side : adv[k] * sx, h: cap * sy, sx, sy, cap, first: k === 0 });
        x += adv[k] * sx;
      });
    });
    // the letter mask, drawn once per layout
    mask.width = canvas.width; mask.height = canvas.height;
    const m = mask.getContext("2d");
    m.setTransform(dpr, 0, 0, dpr, 0, 0);
    m.fillStyle = "#000"; m.textBaseline = "alphabetic";
    glyphs.forEach((g) => {
      m.save(); m.translate(g.x, g.y + g.h); m.scale(g.sx, g.sy); m.font = FONT(100); m.fillText(g.ch, 0, 0); m.restore();
    });
  }

  function cover(v, x, y, w, h) {
    const vw = v.videoWidth, vh = v.videoHeight;
    if (!vw) return false;
    const s = Math.max(w / vw, h / vh);
    const dw = vw * s, dh = vh * s;
    ctx.drawImage(v, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    return true;
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    glyphs.forEach((g) => {
      // each film stays inside its own letter's slot, so neighbours never bleed
      const x0 = g.first ? 0 : g.x, x1 = g.x + g.sw, y0 = g.y - 4, y1 = g.y + g.h + 4;
      ctx.save();
      ctx.filter = "brightness(1.22) contrast(1.06) saturate(1.08)";
      ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
      if (!cover(videos[g.i], x0, y0, x1 - x0, y1 - y0)) { ctx.fillStyle = "#2a0c06"; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }
      ctx.restore();
    });
    // keep only the pixels under the letters (one mask, one pass)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    // a hairline edge so even the darkest films read as letters
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = "rgba(246, 239, 230, 0.28)";
    glyphs.forEach((g) => {
      ctx.save(); ctx.translate(g.x, g.y + g.h); ctx.scale(g.sx, g.sy);
      ctx.lineWidth = 1.1 / Math.min(g.sx, g.sy); ctx.font = FONT(100); ctx.strokeText(g.ch, 0, 0); ctx.restore();
    });
  }

  function loop() { raf = requestAnimationFrame(loop); if (visible) draw(); }

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!running) return;
    videos.forEach((v) => (visible ? v.play().catch(() => {}) : v.pause()));
  }, { threshold: 0.01 }).observe(host);
  addEventListener("resize", () => { layout(); draw(); });

  return {
    async start() {
      if (running) return;
      running = true;
      try { await document.fonts.load(FONT(100)); } catch {}
      layout();
      videos.forEach((v) => v.play().catch(() => {}));
      loop();
    },
  };
}
