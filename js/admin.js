// Admin view: sign in with the Google account in ADMIN_EMAIL to see
// every sign-up, what they wishlisted, and download it all as CSV.

import { firebaseConfig, ADMIN_EMAIL } from "../firebase-config.js";
import { PRODUCTS, byId } from "./products.js";
import { isConfigured } from "./store.js";

const SDK = "https://www.gstatic.com/firebasejs/10.12.2";
const app = document.getElementById("app");
const who = document.getElementById("who");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

if (!isConfigured) {
  app.innerHTML = `<div class="msg"><h2>Firebase isn’t connected yet</h2><p class="muted">Fill in <code>firebase-config.js</code> (README, step 2) and this page will show your sign-ups.</p></div>`;
} else {
  boot();
}

async function boot() {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-auth.js`), import(`${SDK}/firebase-firestore.js`),
  ]);
  const fb = initializeApp(firebaseConfig);
  const auth = A.getAuth(fb), db = F.getFirestore(fb);

  A.onAuthStateChanged(auth, async (user) => {
    if (!user || user.isAnonymous) {
      who.textContent = "";
      app.innerHTML = `<div class="msg"><h2>Sign in</h2><p class="muted">Use the Google account set as admin.</p><br/><button class="ink" id="in">Sign in with Google</button></div>`;
      document.getElementById("in").onclick = () => A.signInWithPopup(auth, new A.GoogleAuthProvider()).catch((e) => alertBox(e.message));
      return;
    }
    who.innerHTML = `${esc(user.email)} &nbsp; <button id="out">Sign out</button>`;
    document.getElementById("out").onclick = () => A.signOut(auth);
    if (user.email !== ADMIN_EMAIL) {
      app.innerHTML = `<div class="msg"><h2>Not authorised</h2><p class="muted">${esc(user.email)} isn’t the admin account set in firebase-config.js and firestore.rules.</p></div>`;
      return;
    }
    try {
      const snap = await F.getDocs(F.query(F.collection(db, "members"), F.orderBy("createdAt", "desc")));
      render(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      alertBox("Couldn’t read members: " + e.message + ". Check the admin email in firestore.rules.");
    }
  });
}

function alertBox(m) { app.innerHTML = `<div class="msg"><h2>Hmm.</h2><p class="muted">${esc(m)}</p></div>`; }

function render(rows) {
  const counts = Object.fromEntries(PRODUCTS.map((p) => [p.id, 0]));
  rows.forEach((r) => (r.wishlist || []).forEach((id) => { if (id in counts) counts[id]++; }));
  const ranked = PRODUCTS.map((p) => ({ p, n: counts[p.id] })).sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...ranked.map((x) => x.n));
  const totalWish = ranked.reduce((s, x) => s + x.n, 0);
  const fmt = (ts) => (ts?.toDate ? ts.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "");

  app.innerHTML = `
    <section class="stats">
      <div class="stat"><span>Members</span><strong>${rows.length}</strong></div>
      <div class="stat"><span>Wishlist adds</span><strong>${totalWish}</strong></div>
      <div class="stat"><span>Top piece</span><strong style="font-size:20px;font-weight:500">${esc(ranked[0]?.n ? ranked[0].p.name : "None yet")}</strong></div>
      <div class="stat" style="display:grid;align-content:center"><button class="ink" id="csv">Download CSV</button></div>
    </section>
    <section><h2>Most wishlisted</h2><div class="bars">${ranked.map(({ p, n }) =>
      `<div class="bar"><span>${esc(p.name)}</span><i style="width:${(n / max) * 100}%"></i><b>${n}</b></div>`).join("")}</div></section>
    <section><h2>Members</h2><div class="tablewrap"><table>
      <thead><tr><th>Joined</th><th>Name</th><th>Email</th><th>Phone</th><th>Age</th><th>Fav character</th><th>Wishlist</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${fmt(r.createdAt)}</td><td>${esc(r.name)}</td><td>${esc(r.email)}</td><td>${esc(r.phone)}</td><td>${esc(r.age)}</td><td>${esc(r.favCharacter)}</td><td>${(r.wishlist || []).map((id) => esc(byId[id]?.name || id)).join(", ")}</td></tr>`).join("")}</tbody>
    </table></div></section>`;

  document.getElementById("csv").onclick = () => {
    const head = ["joined", "name", "email", "phone", "age", "fav_character", "wishlist"];
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [head.join(",")].concat(rows.map((r) => [
      r.createdAt?.toDate ? r.createdAt.toDate().toISOString() : "", r.name, r.email, r.phone, r.age, r.favCharacter,
      (r.wishlist || []).map((id) => byId[id]?.name || id).join(" | "),
    ].map(q).join(",")));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `rumoar-members-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };
}
