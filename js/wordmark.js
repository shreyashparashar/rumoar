// RUMOAR wordmark. Deep pearl-white letters that fill the screen; hover a
// letter and its film wipes up *inside the letterform* (canvas mask). On
// touch screens the letters take turns, and a tap plays one.
// One line on laptops, three rows (RU / MO / AR) on phones.

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
  const touch = !matchMedia("(hover: hover)").matches;
  let W = 0, H = 0, dpr = 1, glyphs = [], running = false, visible = true, raf = 0, hot = -1, auto = 0, autoTimer;
  const mix = LETTERS.split("").map(() => 0);

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
    const track = -4;
    const rowH = availH / rows.length;
    glyphs = [];
    let index = 0;
    rows.forEach((row, r) => {
      const adv = row.split("").map((ch) => ctx.measureText(ch).width + track);
      const w100 = adv.reduce((a, b) => a + b, 0) - track;
      const sx = availW / w100;
      const sy = Math.min(rowH / cap, sx * 2.1);
      const y0 = top + r * (rowH + gap) + (rowH - cap * sy) / 2;
      let x = side;
      row.split("").forEach((ch, k) => {
        const last = k === row.length - 1;
        glyphs.push({ ch, i: index++, x, y: y0, w: (adv[k] - track) * sx, sw: last ? (adv[k] - track) * sx + side : adv[k] * sx, h: cap * sy, sx, sy, first: k === 0 });
        x += adv[k] * sx;
      });
    });
    mask.width = canvas.width; mask.height = canvas.height;
    const m = mask.getContext("2d");
    m.setTransform(dpr, 0, 0, dpr, 0, 0);
    m.fillStyle = "#000";
    glyphs.forEach((g) => { m.save(); m.translate(g.x, g.y + g.h); m.scale(g.sx, g.sy); m.font = FONT(100); m.fillText(g.ch, 0, 0); m.restore(); });
  }

  function cover(v, x, y, w, h) {
    const vw = v.videoWidth, vh = v.videoHeight;
    if (!vw) return false;
    const s = Math.max(w / vw, h / vh);
    ctx.drawImage(v, x + (w - vw * s) / 2, y + (h - vh * s) / 2, vw * s, vh * s);
    return true;
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    // pearl: warm white with a slow sheen travelling across the word
    const sheen = ((now / 5200) % 1.6) - 0.3;
    const pearl = ctx.createLinearGradient(0, 0, W, H * 0.4);
    pearl.addColorStop(0, "#efe7da");
    const cl = (v) => Math.min(0.999, Math.max(0.001, v));
    pearl.addColorStop(cl(sheen - 0.08), "#f3ece1");
    pearl.addColorStop(cl(sheen), "#fffdf8");
    pearl.addColorStop(cl(sheen + 0.08), "#f3ece1");
    pearl.addColorStop(1, "#e6ddcf");
    glyphs.forEach((g) => {
      const x0 = g.first ? 0 : g.x, x1 = g.x + g.sw, y0 = g.y - 4, y1 = g.y + g.h + 4;
      ctx.fillStyle = pearl; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      const k = mix[g.i];
      if (k > 0.001) {
        // the film wipes up from the bottom of the letter
        const top = y1 - (y1 - y0) * k;
        ctx.save();
        ctx.beginPath(); ctx.rect(x0, top, x1 - x0, y1 - top); ctx.clip();
        ctx.filter = "brightness(1.15) contrast(1.06)";
        if (!cover(videos[g.i], x0, y0, x1 - x0, y1 - y0)) { ctx.fillStyle = "#2a0c06"; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }
        ctx.restore();
      }
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  }

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
  host.addEventListener("pointermove", (e) => { if (e.pointerType === "touch") return; const r = host.getBoundingClientRect(); setHot(glyphAt(e.clientX - r.left, e.clientY - r.top)); });
  host.addEventListener("pointerleave", () => setHot(-1));
  host.addEventListener("click", (e) => { const r = host.getBoundingClientRect(); const i = glyphAt(e.clientX - r.left, e.clientY - r.top); if (i >= 0) { setHot(i); clearInterval(autoTimer); startAuto(4000); } });

  function startAuto(delay = 0) {
    if (!touch) return;
    clearTimeout(autoTimer); clearInterval(autoTimer);
    autoTimer = setTimeout(() => { autoTimer = setInterval(() => { auto = (auto + 1) % LETTERS.length; setHot(auto); }, 1900); }, delay);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!visible) return;
    mix.forEach((m, i) => { mix[i] += ((i === hot ? 1 : 0) - m) * 0.16; });
    draw(now);
  }

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (running && hot >= 0) (visible ? videos[hot].play().catch(() => {}) : videos[hot].pause());
  }, { threshold: 0.01 }).observe(host);
  addEventListener("resize", () => { if (running) layout(); });

  return {
    async start() {
      if (running) return;
      running = true;
      try { await document.fonts.load(FONT(100)); } catch {}
      layout();
      raf = requestAnimationFrame(loop);
      if (touch) { setHot(0); startAuto(1900); }
    },
  };
}
