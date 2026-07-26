# RCCG Champions Cathedral — Media Team Portal
## Setup Guide (Read This First)

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

## STEP 4: Enable Storage (new — needed for profile pictures)

1. Click "Storage" in the sidebar → "Get started"
2. Choose "Start in test mode" → Next → Done
3. Note the bucket name shown at the top (e.g. `rccg-champions-media.firebasestorage.app`)

---

## STEP 5: Get Your Firebase Config

1. Click the gear icon ⚙️ → "Project settings"
2. Scroll to "Your apps" → click "</>" (Web icon)
3. App nickname: media-portal → Register app
4. Copy the firebaseConfig object shown

---

## STEP 6: Paste Config in ONE Place

Unlike before, the config now lives in a single shared file:

  js/firebase-config.js

Open it and replace the object under `// PASTE YOUR FIREBASE CONFIG HERE`.
All three pages (index.html, pages/member.html, pages/admin.html) import from
this one file, so you only ever edit it in one place.

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

## STEP 8: Set Storage Security Rules (new — for profile pictures)

In Firebase → Storage → Rules tab, paste this:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-pictures/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (
        request.auth.uid + '.jpg' == userId ||
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin'
      ) && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

This lets a member upload their own photo, lets an admin upload on behalf of
any member, caps uploads at 5MB, and only accepts image files. Click Publish.

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
├── favicon.ico
├── css/
│   └── style.css           ← All styling + motion system
├── js/
│   ├── firebase-config.js  ← Firebase config lives here ONLY
│   ├── icons.js             ← Shared icon set
│   ├── motion.js            ← Reveal animations, confetti, toast, image upload helper
│   └── devotionals.js       ← Daily devotional content + streak helpers
├── assets/
│   ├── logo.png             ← RCCG crest (navbar + login)
│   └── favicon-*.png / apple-touch-icon.png
├── pages/
│   ├── member.html          ← Member dashboard
│   └── admin.html           ← Admin dashboard
└── README.md                ← This file
```

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
before upload, then stored in Firebase Storage under `profile-pictures/`.
Admins can also update a member's photo directly from the Members tab (hover
a member card → the small camera icon). Members without a photo simply show
a gold initials avatar — nothing breaks if they skip it.

---

## GETTING YOUR VENUE GPS COORDINATES

When creating a meeting, click "My Location" while standing at the venue.
Or right-click the location on Google Maps and copy the coordinates.

RCCG Champions Cathedral, Warri — approximate coordinates:
- Latitude:  5.5167
- Longitude: 5.7500
(Verify this on Google Maps for your exact location — "approximate" is not
precise enough for the geofence radius.)
