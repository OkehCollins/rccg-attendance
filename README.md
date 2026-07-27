# RCCG Champions Cathedral — Media Team Portal
## Setup Guide (Read This First)

---

## WHAT CHANGED IN THIS VERSION

- **Profile photos now use Cloudinary, not Firebase Storage** — Storage
  requires the paid Blaze plan even for free-tier usage; Cloudinary doesn't.
- **Fixed: Members tab and Leaderboard tab could silently fail to load.**
  Both queries combined a filter with a sort on a different field, which
  Firestore requires a manual "composite index" for — one that never
  existed in this project, so the query quietly errored out and the tab
  stayed empty. Both now sort in the browser instead, so no index is needed.
- **Fixed: a meeting the admin starts now appears on members' dashboards
  automatically**, without needing a page refresh (uses a live Firestore
  listener instead of a one-time page-load check). The admin's own
  "Active Meeting" card updates live the same way.
- **Added resilience:** every dashboard section now fails on its own if a
  query has a problem, instead of one failure freezing the whole page —
  and shows the actual error message inline so it's easy to diagnose.
- **Added six new media team roles** to registration (see below).
- **Added a service worker** — the app now works offline (once opened at
  least once) and is installable as an app icon on Android/desktop, not
  just iOS. See "PWA & OFFLINE SUPPORT" below — there's one important habit
  to build when you update the site in future: bump the version number in
  `sw.js`, or visitors will keep seeing the old cached version.
- **Added admin notifications** — an email now goes out the moment a
  member submits an excuse, and again the moment someone crosses 2 missed
  meetings (only once per person, not on every miss after that). No
  backend or Blaze plan involved — see "NOTIFICATIONS" below. The admin
  dashboard also now shows the same two events as live in-app toasts and
  live badge counts, no reload needed.

---

## STEP 1: Create Your Firebase Project

1. Go to https://firebase.google.com
2. Click "Get started" → "Create a project"
3. Name it: rccg-champions-media
4. Disable Google Analytics → Create project

---

## STEP 2: Enable Authentication

1. Click "Authentication" in the sidebar → "Get started"
2. Under "Sign-in method" → click "Email/Password" → Enable → Save

---

## STEP 3: Create Firestore Database

1. Click "Firestore Database" → "Create database"
2. Choose "Start in test mode" → Next
3. Select your region → Done

---

## STEP 4: Create Your Cloudinary Account (for profile pictures)

Firebase Storage now requires a paid Blaze plan even for free-tier usage, so
profile photos are hosted on **Cloudinary** instead — free, no card required.

1. Go to https://cloudinary.com → sign up (free plan, no card needed)
2. On your dashboard, copy your **Cloud Name** (shown at the top)
3. Go to **Settings** (gear icon) → **Upload** tab → scroll to "Upload presets"
4. Click **"Add upload preset"**
5. Set **Signing Mode** to **"Unsigned"** → **Save**
6. Copy the preset name it gives you (e.g. `ml_default` or a random name)

You'll paste both values into `js/cloudinary-config.js` in Step 7 below.

---

## STEP 5: Create Your EmailJS Account (for admin notifications)

This sends you an email when a member submits an excuse, or when someone
crosses 2 missed meetings — free, no backend, no card required.

1. Go to https://emailjs.com → sign up (free plan, 200 emails/month)
2. **"Email Services"** → **"Add New Service"** → connect the inbox you
   want alerts to land in (Gmail, Outlook, etc.) → copy the **Service ID**
3. **"Email Templates"** → **"Create New Template"**
4. Set the **"To email"** field to your own admin email address directly
   (not a variable — this app always sends to one fixed inbox)
5. In the template body, use exactly these two variables and nothing else
   — the actual wording is built in code, this template just displays it:
   - Subject: `{{subject}}`
   - Content: `{{message}}`
6. Save → copy the **Template ID**
7. **"Account"** → **"General"** → copy your **Public Key**

You'll paste all three values into `js/emailjs-config.js` in Step 7 below.

---

## STEP 6: Get Your Firebase Config

1. Click the gear icon ⚙️ → "Project settings"
2. Scroll to "Your apps" → click "</>" (Web icon)
3. App nickname: media-portal → Register app
4. Copy the firebaseConfig object shown

---

## STEP 7: Paste Your Config (THREE files, one time each)

**Firebase config** lives in `js/firebase-config.js` — open it and replace
the object under `// PASTE YOUR FIREBASE CONFIG HERE`.
All three pages (index.html, pages/member.html, pages/admin.html) import
from this one file, so you only ever edit it in one place.

**Cloudinary config** lives in `js/cloudinary-config.js` — open it and
replace `YOUR_CLOUD_NAME` and `YOUR_UNSIGNED_PRESET` with the values from
Step 4. Both dashboards import from this one file too.

**EmailJS config** lives in `js/emailjs-config.js` — open it and replace
`YOUR_PUBLIC_KEY`, `YOUR_SERVICE_ID`, and `YOUR_TEMPLATE_ID` with the
values from Step 5. Both dashboards import from this one file too. If you
skip this step, the app still works fine — it just quietly skips sending
the email (logged to the browser console) and nothing breaks.

---

## STEP 8: Set Firestore Security Rules

In Firebase → Firestore → Rules tab, paste this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /meetings/{meetingId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /attendance/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /excuses/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /devotionalLogs/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;
    }
  }
}
```

Click Publish.

---

## STEP 9: Make Yourself Admin

1. Open index.html, register your account
2. Go to Firebase → Firestore → users collection
3. Find your document (your UID is the document ID)
4. Edit the "role" field: change "member" to "admin"
5. Save. You'll now land on the Admin Dashboard on login.

---

## STEP 10: Deploy to Vercel (Free)

1. Go to vercel.com → Sign up with GitHub
2. Upload the rccg-attendance folder to a GitHub repository
3. In Vercel → New Project → import your repo → Deploy
4. You get a free URL like rccg-media.vercel.app

---

## FILE STRUCTURE

```
rccg-attendance/
├── index.html              ← Login / Registration / Forgot Password
├── manifest.webmanifest    ← App icons (favicon / home-screen icon)
├── sw.js                   ← Service worker (offline support + installability)
├── favicon.ico
├── css/
│   └── style.css           ← All styling + motion system
├── js/
│   ├── firebase-config.js   ← Firebase config lives here ONLY
│   ├── cloudinary-config.js ← Cloudinary config + upload helper (profile photos)
│   ├── emailjs-config.js    ← EmailJS config + send helper (admin notifications)
│   ├── icons.js              ← Shared icon set
│   ├── motion.js             ← Reveal animations, confetti, toast, image resize helper
│   └── devotionals.js        ← Daily devotional content + streak helpers
├── assets/
│   ├── logo.png              ← RCCG crest (navbar + login)
│   └── favicon-*.png / apple-touch-icon.png
├── pages/
│   ├── member.html          ← Member dashboard
│   └── admin.html           ← Admin dashboard
└── README.md                ← This file
```

---

## MEDIA TEAM ROLES

Shown on the registration form's "Role on Media Team" dropdown:

Camera Operator · Videography · Sound Engineer · Live Stream Operator ·
Graphics & Display · Photography · Video Editor · Reels · Content Creator ·
Content Curator · Content Strategist · Social Media · Anchor ·
Media Director · Other

To add more later, edit the `<select id="regRole">` list in `index.html`.

---

## POINTS SYSTEM

- On-time clock-in     = +10 points
- Late clock-in        = +5 points
- Daily devotional check-in = +3 points
- Missed meeting       = streak resets to 0

## BADGES

🌟 First Steps  — attended first meeting
🔥 On Fire      — 3-meeting streak
⚡ Committed    — 5-meeting streak
👑 Champion     — 10-meeting streak
🎯 Dedicated    — 10 meetings attended
💎 Elite        — 25 meetings attended
🕯️ Firestarter  — 3-day devotional streak
📖 Rooted       — 7-day devotional streak
✨ Steadfast    — 30-day devotional streak

## RANK TITLES (based on total points)

Rookie (0) → Committed (50) → Elite (150) → Champion (350) → Legend (700)

---

## DAILY DEVOTIONAL ("Today's Word")

A short devotional (verse reference + original reflection, geared toward media
team serving) rotates automatically every day for the whole team — no admin
setup required. The content lives in `js/devotionals.js`; add more entries to
the `DEVOTIONALS` array any time to extend the rotation. Each member's
check-in is logged once per day, building its own streak independent of
meeting attendance.

---

## PWA & OFFLINE SUPPORT

The app now has a **service worker** (`sw.js`, at the site root), which does
two things:

1. **Installable everywhere.** On iOS it already worked via "Add to Home
   Screen." Now Android and desktop Chrome will also offer a real
   "Install" prompt, giving your team an app icon with no browser bar.
2. **Works with no signal.** Once someone has opened the app at least once
   with internet, the page itself (layout, styling, logo, devotionals text)
   will still load even if their connection drops — useful in a venue with
   patchy wifi during a live meeting. Live data — clock-in, meeting status,
   Firestore reads/writes, sign-in, photo uploads — always needs a real
   connection and will not work offline; the app will show an "You're
   offline" toast if that happens mid-session.

**⚠️ One habit to build:** whenever you change any file in the app (HTML,
CSS, JS, icons) and redeploy, open `sw.js` and bump this line:

```js
const CACHE_VERSION = "cc-media-shell-v1";
```

to `"cc-media-shell-v2"`, `"v3"`, and so on. Without this, browsers that
already cached the old version may keep serving it even after you've
redeployed a fix — bumping the version forces everyone's browser to fetch
the new files. Nothing else needs to change when you bump it.

**Publishing to app stores:** this technically qualifies the app for
Google Play Store via "Trusted Web Activity" (Android only — Apple's App
Store rejects PWAs outright), but that's a separate project involving a
signed Android package, domain verification, and a Play Console listing.
Not needed for an internal team tool — "Add to Home Screen" already gives
the same practical result for free.

---

## NOTIFICATIONS

Two things happen automatically, both without any backend or Blaze plan:

1. **Email to the admin** (via EmailJS — Step 5) when:
   - A member submits an excuse request
   - A member crosses 2 missed meetings for the first time (not again on
     the 3rd, 4th miss, etc. — you're already tracking them by then)
2. **Live in-app alerts** on the admin dashboard — a toast pops up and the
   Overview tab's numbers update the instant either of those happens,
   as long as the dashboard is open in a browser tab somewhere. No reload
   needed.

**The honest limitation:** both of these only fire because they're
triggered by someone's browser already being open and doing something
(a member submitting an excuse, or you ending a meeting). Nothing runs
in the background on a server. That means:
- ✅ "Email me when X happens" → covered, exactly as built
- ❌ "Email me every Monday with a weekly summary, whether or not anyone
  opened the app that day" → would need a scheduled server job, which
  needs Blaze. Not built here.

If EmailJS isn't configured yet (`js/emailjs-config.js` still has the
placeholder values), emails are silently skipped — logged to the browser
console, nothing else breaks. The in-app toasts work either way.

---

## PROFILE PICTURES

Members can add/change their photo any time from the avatar in the top-right
of their dashboard. Photos are cropped to a square and compressed client-side
before upload, then stored on **Cloudinary** (see Step 4) — Firebase Storage
is not used, since it now requires a paid Blaze plan. Admins can also update
a member's photo directly from the Members tab (the small camera icon on
each card). Members without a photo simply show a gold initials avatar —
nothing breaks if they skip it.

---

## GETTING YOUR VENUE GPS COORDINATES

When creating a meeting, click "My Location" while standing at the venue.
Or right-click the location on Google Maps and copy the coordinates.

RCCG Champions Cathedral, Warri — approximate coordinates:
- Latitude:  5.5167
- Longitude: 5.7500
(Verify this on Google Maps for your exact location — "approximate" is not
precise enough for the geofence radius.)
