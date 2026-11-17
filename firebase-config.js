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
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000",
};

// The Google account allowed to open /admin.html and see sign-ups.
// Must match the email in firestore.rules.
export const ADMIN_EMAIL = "you@example.com";
