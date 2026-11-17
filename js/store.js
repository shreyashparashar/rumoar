// Data layer. Talks to Firebase when configured, otherwise runs in
// demo mode (localStorage only) so the site still works end to end.

import { firebaseConfig } from "../firebase-config.js";

const SDK = "https://www.gstatic.com/firebasejs/10.12.2";
const LS_MEMBER = "rumoar.member.v1";
const LS_WISH = "rumoar.wishlist.v1";

const read = (k, fallback) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const isConfigured = !!(
  firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith("YOUR_")
);

let fbPromise = null;
function firebase() {
  if (!fbPromise) {
    fbPromise = (async () => {
      const [{ initializeApp }, authMod, fs] = await Promise.all([
        import(`${SDK}/firebase-app.js`),
        import(`${SDK}/firebase-auth.js`),
        import(`${SDK}/firebase-firestore.js`),
      ]);
      const app = initializeApp(firebaseConfig);
      const auth = authMod.getAuth(app);
      const db = fs.getFirestore(app);
      await auth.authStateReady();
      if (!auth.currentUser) await authMod.signInAnonymously(auth);
      return { auth, db, fs };
    })();
    fbPromise.catch(() => { fbPromise = null; });
  }
  return fbPromise;
}

export function createStore() {
  let member = read(LS_MEMBER, null);
  let wishlist = read(LS_WISH, []);

  async function upsertRemote(full) {
    const { auth, db, fs } = await firebase();
    const uid = auth.currentUser.uid;
    await fs.setDoc(fs.doc(db, "members", uid), {
      name: full.name,
      email: full.email,
      phone: full.phone,
      age: full.age,
      favCharacter: full.favCharacter,
      wishlist: full.wishlist,
      source: location.hostname || "local",
      createdAt: fs.serverTimestamp(),
      updatedAt: fs.serverTimestamp(),
    });
    return uid;
  }

  return {
    mode: isConfigured ? "firebase" : "demo",
    get member() { return member; },
    get wishlist() { return wishlist.slice(); },

    async signUp(data) {
      let uid = "local";
      if (isConfigured) uid = await upsertRemote({ ...data, wishlist });
      member = { ...data, uid, joinedAt: Date.now() };
      write(LS_MEMBER, member);
      return member;
    },

    async saveWishlist(list) {
      wishlist = list.slice(0, 50);
      write(LS_WISH, wishlist);
      if (!isConfigured || !member) return;
      const { auth, db, fs } = await firebase();
      const uid = auth.currentUser.uid;
      if (uid !== member.uid) {
        // Browser lost its anonymous session (storage cleared) — re-file the member.
        member = { ...member, uid: await upsertRemote({ ...member, wishlist }) };
        write(LS_MEMBER, member);
        return;
      }
      await fs.updateDoc(fs.doc(db, "members", uid), {
        wishlist,
        updatedAt: fs.serverTimestamp(),
      });
    },
  };
}
