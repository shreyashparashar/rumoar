// ─────────────────────────────────────────────────────────────
//  Paste your Firebase web-app config here (see README, step 2).
//  These values are safe to commit publicly — Firebase web keys
//  identify your project, they don't grant access. Access is
//  controlled by firestore.rules.
//
//  While apiKey still says "YOUR_API_KEY" the site runs in DEMO
//  MODE: everything works, but sign-ups stay in the visitor's own
//  browser instead of reaching your database.
// ─────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "AIza....",
  authDomain: "rumoar-xxxx.firebaseapp.com",
  projectId: "rumoar-xxxx",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

// The Google account allowed to open /admin.html and see sign-ups.
// Must match the email in firestore.rules.
export const ADMIN_EMAIL = "shreyashm3624@gmail.com";
