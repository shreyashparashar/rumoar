# RUMOAR — Drop 01 landing page

A members-first launch page: visitors sign up (name, email, phone, age, favourite
superhero/animated character), the collection unlocks, they wishlist pieces, and
you collect everything in Firebase. Nothing is sold; members hear first at launch.

**Cost: ₹0.** GitHub Pages (free hosting) + Firebase Spark plan (free:
50,000 reads and 20,000 writes per day, which is far more than a launch list needs).
No credit card needed.

Plain HTML/CSS/JS, no build step, no npm.

```
index.html            homepage: pixel intro, film reel, TV wall, collage strips
drop.html             Drop 01: sign-up gate, bags, wishlist
admin.html            private dashboard: sign-ups, wishlists, CSV export
firebase-config.js    your Firebase keys (already filled in)
firestore.rules       paste into Firebase to lock the database down
css/style.css         all styling; the 4 font sizes are defined at the top
js/products.js        names, prices, descriptions: edit here
js/common.js          nav, sign-up, wishlist, product view (shared by both pages)
js/home.js            homepage behaviour
js/drop.js            Drop 01 page behaviour
js/intro.js           the pixel-block intro
js/hero-gl.js         the film reel (opening sequence + clips list at the top)
js/store.js           saves sign-ups + wishlists (Firebase or demo mode)
assets/collage/       moodboard photos used across the homepage (swap freely)
assets/video/         the two street films (MP4 + WebM)
assets/letters/       the six clips that play inside the RUMOAR letters
assets/audio/         soundtrack.mp3 (instrumental loop; visitors can mute it from the nav)
assets/intro/         the red portraits used in the intro
assets/products/      30 product shots (front + side for 15 bags)
```

---

## Step 1 — Put it on GitHub Pages (about 5 minutes)

1. Go to **github.com → New repository**. Name it e.g. `rumoar`. Set it to **Public**
   (free Pages needs public). Create it.
2. On the new repo page click **"uploading an existing file"**. Unzip this folder on
   your computer and drag **everything inside it** (not the folder itself) into the
   upload box, so `index.html` sits at the top level. Commit.
   - Make sure the hidden file `.nojekyll` is uploaded too. On a Mac, press
     `Cmd + Shift + .` in Finder to show hidden files.
3. Go to **Settings → Pages**. Under *Build and deployment*, choose
   **Source: Deploy from a branch**, **Branch: `main` / `(root)`**. Save.
4. Wait about a minute. Your site is live at `https://<your-username>.github.io/rumoar/`.

At this point the site works fully in **demo mode** (small yellow pill bottom-left):
sign-ups and wishlists are kept in each visitor's own browser only. Step 2 makes
them reach you.

> Custom domain (e.g. `rumoar.in`): Settings → Pages → Custom domain. Add the DNS
> records GitHub shows you at your domain registrar. Still free.

---

## Step 2 — Connect Firebase (about 10 minutes)

1. Go to **console.firebase.google.com → Add project**. Name it `rumoar`. You can
   turn Google Analytics off. Create.
2. **Add a web app:** on the project home click the **`</>`** (Web) icon. Nickname:
   `rumoar-site`. Do **not** tick Firebase Hosting. Register.
   Firebase shows a `firebaseConfig = { ... }` block. Copy those values into
   **`firebase-config.js`** in your repo (edit on GitHub: open file → pencil icon → commit).
   Also set `ADMIN_EMAIL` to your Google account email.
3. **Turn on sign-in methods:** *Build → Authentication → Get started → Sign-in method*:
   - Enable **Anonymous** (this is how each visitor gets a private, secure record
     without a password).
   - Enable **Google** (only *you* use this, for the admin page).
4. **Allow your website's address:** *Authentication → Settings → Authorized domains
   → Add domain* → `<your-username>.github.io` (and your custom domain if you have one).
5. **Create the database:** *Build → Firestore Database → Create database* →
   pick location **asia-south1 (Mumbai)** → start in **production mode**.
6. **Paste the security rules:** in Firestore open the **Rules** tab, delete
   everything, paste the whole of **`firestore.rules`**, replace `you@example.com`
   with your Google email (the same one as `ADMIN_EMAIL`), and click **Publish**.

Done. Refresh your site: the yellow demo pill disappears, and every sign-up now lands in
Firestore → `members`.

### What gets stored (one document per visitor)

| field | example |
|---|---|
| name | Rudra Nikam |
| email | name@email.com |
| phone | +919876543210 |
| age | 28 |
| favCharacter | Batman |
| wishlist | ["maverick", "heir"] (updates live as they heart/unheart) |
| source | your-site.github.io |
| createdAt / updatedAt | timestamps |

The rules (tested against the Firestore emulator) let a visitor create **only their
own** record, change **only their wishlist** afterwards, and read nothing but their own.
Nobody can read the list except your admin account.

---

## Step 3 — See your sign-ups

Open **`https://<your-username>.github.io/rumoar/admin.html`**, sign in with the Google
account you set as admin, and you get:

- total members and wishlist adds
- **Most wishlisted** bar chart (useful for deciding production quantities)
- the full members table
- **Download CSV**: opens in Excel or Google Sheets for your launch email or WhatsApp list

The admin page is hidden from search engines and useless to anyone else: the database
refuses every account except yours.

---

## Editing

- **Names, prices, descriptions, order:** `js/products.js`. Each product has
  `name`, `type`, `colour`, `price`, `tagline`, `description`, `details`.
  Re-order the list to re-order the grid.
- **Swap a photo:** replace `assets/products/<id>-front.webp` / `-side.webp` with
  the same file name (WebP or JPG, ~1000px wide, portrait-ish).
- **Colours / spacing:** the variables at the top of `css/style.css`.
- **Instagram link:** search `instagram.com/` in `index.html`.
- **Finishes:** the copy describes materials from the renders (e.g. “crinkled
  leather”, “calf-hair texture”). Confirm against your actual production
  materials before launch.

## Testing locally (optional)

Modules don't run from a double-clicked file. In the folder run
`python3 -m http.server 8000` and open http://localhost:8000.

## Notes

- One visitor signing up on two devices creates two records (same email). The CSV makes
  de-duplicating easy.
- Sign-up details are also remembered in the visitor's browser, so returning visitors go
  straight in with their wishlist intact.
- The hero image is a cut-out of *The Vanguard* (`assets/hero-vanguard.webp`).
- Share preview image for WhatsApp/Instagram links: `assets/og.jpg`.
