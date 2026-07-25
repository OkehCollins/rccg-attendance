# RCCG Champions Cathedral — Media Team Attendance Portal
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

## STEP 4: Get Your Firebase Config

1. Click the gear icon ⚙️ → "Project settings"
2. Scroll to "Your apps" → click "</>" (Web icon)
3. App nickname: media-portal → Register app
4. Copy the firebaseConfig object shown

---

## STEP 5: Paste Config into All 3 HTML Files

Find the section marked:
  // PASTE YOUR FIREBASE CONFIG HERE

Replace the placeholder in:
- index.html
- pages/member.html
- pages/admin.html

---

## STEP 6: Set Firestore Security Rules

In Firebase → Firestore → Rules tab, paste this:

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
  }
}

Click Publish.

---

## STEP 7: Make Yourself Admin

1. Open index.html, register your account
2. Go to Firebase → Firestore → users collection
3. Find your document (your UID is the document ID)
4. Edit the "role" field: change "member" to "admin"
5. Save. You'll now land on the Admin Dashboard on login.

---

## STEP 8: Deploy to Vercel (Free)

1. Go to vercel.com → Sign up with GitHub
2. Upload the rccg-attendance folder to a GitHub repository
3. In Vercel → New Project → import your repo → Deploy
4. You get a free URL like rccg-media.vercel.app

---

## FILE STRUCTURE

rccg-attendance/
├── index.html          ← Login / Registration page
├── css/
│   └── style.css       ← All styling
├── pages/
│   ├── member.html     ← Member dashboard
│   └── admin.html      ← Admin dashboard
└── README.md           ← This file

---

## POINTS SYSTEM

- On-time clock-in  = +10 points
- Late clock-in     = +5 points
- Missed meeting    = streak resets to 0

## BADGES

🌟 First Steps  — attended first meeting
🔥 On Fire      — 3-meeting streak
⚡ Committed    — 5-meeting streak
👑 Champion     — 10-meeting streak
🎯 Dedicated    — 10 meetings attended
💎 Elite        — 25 meetings attended

---

## GETTING YOUR VENUE GPS COORDINATES

When creating a meeting, click "📍 My Location" while standing at the venue.
Or right-click the location on Google Maps and copy the coordinates.

RCCG Champions Cathedral approximate coordinates:
- Latitude:  4.8242
- Longitude: 7.0336
(Verify this on Google Maps for your exact location)
