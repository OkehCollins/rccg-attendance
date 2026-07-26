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

You'll paste both values into `js/cloudinary-config.js` in Step 6 below.

---

## STEP 5: Get Your Firebase Config

1. Click the gear icon ⚙️ → "Project settings"
2. Scroll to "Your apps" → click "</>" (Web icon)
3. App nickname: media-portal → Register app
4. Copy the firebaseConfig object shown

---

## STEP 6: Paste Your Config (TWO files, one time each)

**Firebase config** lives in `js/firebase-config.js` — open it and replace
the object under `// PASTE YOUR FIREBASE CONFIG HERE`.
All three pages (index.html, pages/member.html, pages/admin.html) import
from this one file, so you only ever edit it in one place.

**Cloudinary config** lives in `js/cloudinary-config.js` — open it and
replace `YOUR_CLOUD_NAME` and `YOUR_UNSIGNED_PRESET` with the values from
Step 4. Both dashboards import from this one file too.

---

## STEP 7: Set Firestore Security Rules

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

## STEP 8: Make Yourself Admin

1. Open index.html, register your account
2. Go to Firebase → Firestore → users collection
3. Find your document (your UID is the document ID)
4. Edit the "role" field: change "member" to "admin"
5. Save. You'll now land on the Admin Dashboard on login.

---

## STEP 9: Deploy to Vercel (Free)

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
├── favicon.ico
├── css/
│   └── style.css           ← All styling + motion system
├── js/
│   ├── firebase-config.js   ← Firebase config lives here ONLY
│   ├── cloudinary-config.js ← Cloudinary config + upload helper (profile photos)
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
