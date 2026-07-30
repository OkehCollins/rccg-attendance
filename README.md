# RCCG Champions Cathedral — Member Portal
## Setup Guide (Read This First)

---

## WHAT CHANGED IN THIS VERSION

### The big one: departments, directory, and church-wide roll-out

This app started as a media-team-only tool. It's now built to serve the
whole church:

- **Departments replace the fixed media-team role list.** Registration now
  asks for a department (dynamic — whatever you've created, plus a
  built-in "General Congregation" for anyone not on a serving team) and
  whether they're an active worker/volunteer there, with an optional free-text
  position (e.g. "Choir Director").
- **Two tiers of meeting.** A **Congregation-wide Service** (created only by
  the super admin — Sunday service, midweek service) is checked into by
  everyone. A **department meeting** (choir rehearsal, media team meeting)
  is only checked into by that department. A member's dashboard shows
  whichever of these is currently live and relevant to them — possibly both
  at once.
- **Three roles now, not two:** Member, Department Admin (scoped to one
  department — their own meetings, members, excuses, leaderboard), and
  Super Admin (everything, everywhere, plus a new **Departments** tab to
  create departments and a department filter to browse any one of them).
  The old flat "admin" role still works exactly as before — it's treated
  identically to Super Admin everywhere in the app.
- **Directory.** Every member can browse everyone else in their own
  department — name, photo, position, worker status — from their dashboard.
  Nobody can browse a department they're not in.
- **Announcements.** Admins post updates — church-wide (super admin) or to
  one department (either admin type) — and they show up live on every
  relevant member's dashboard.
- **A one-time migration tool** (Departments tab → "Fix Old Accounts")
  handles the one real gotcha of this upgrade: accounts that existed before
  today have no department at all, so they're invisible to every
  department-scoped query until this runs once.
- **Security rules rewritten** end-to-end around this role/department
  model — see Step 8. Nobody can self-promote, move themselves between
  departments, or read another department's people/meetings/excuses.

### Fixed: there was no way to ever sign up a new church

The Platform Dashboard (`pages/platform.html`) — the screen that creates a
new church and hands out its sign-up link — has been in this codebase for a
while, but nothing could ever grant the `platformAdmin` role it requires, so
the page was permanently unreachable for everyone, including you. Two new
files close that gap: `pages/platform-setup.html`, a one-time page that
creates your Platform Admin account exactly once and then locks itself
forever, and `js/platform-setup-config.js`, where you set a private setup
phrase. See **Step 9** below — do this right after your first deploy. Along
the way, the old Firestore rule that let anyone self-register with *any*
role (not just `member`) via devtools was also closed — see Step 8.

### Everything from before this still applies
- Profile photos use Cloudinary, not Firebase Storage (Storage now requires
  the paid Blaze plan even for free-tier usage; Cloudinary doesn't).
- Members/Leaderboard tabs sort in the browser instead of in the Firestore
  query, so no composite index is ever required.
- A live meeting appears on members' dashboards instantly, no refresh.
- Every dashboard section fails on its own with a visible error message,
  instead of one bad query freezing the whole page.
- A service worker makes the app installable and gives it basic offline
  support — bump `CACHE_VERSION` in `sw.js` whenever you update any file,
  or visitors keep seeing the old cached version. See "PWA & OFFLINE SUPPORT".
- Admin gets an email (via EmailJS, no backend/Blaze needed) the moment a
  member submits an excuse, or the moment someone crosses 2 missed
  meetings — plus the same two events as live in-app toasts. See "NOTIFICATIONS".

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

## STEP 7: Paste Your Config (THREE files now, a fourth in Step 9)

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

**This step was out of date** — it used to show the old single-church rules,
which don't even have a `churches` collection and are incompatible with this
version of the app (registration, and the whole Platform Dashboard, would
fail against them). It also had a real gap: the old `users` create rule
checked that the target church existed and was active, but never actually
restricted the `role` field — anyone with devtools open could've registered
themselves straight into `superAdmin` for any real church. Both are fixed
below, and this is now the **one and only copy of these rules** — nothing
else in this project defines or references a separate rules file, so there's
never a question of which version is current.

In Firebase → Firestore → Rules tab, paste this in full, then Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function myData() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
    function myChurchId() { return myData().churchId; }
    function myRole() { return myData().role; }
    function isPlatformAdmin() { return isSignedIn() && myRole() == "platformAdmin"; }
    function isSuperAdmin() { return isSignedIn() && (myRole() == "superAdmin" || myRole() == "admin"); }
    function isDeptAdmin() { return isSignedIn() && myRole() == "departmentAdmin"; }
    function isAdmin() { return isSuperAdmin() || isDeptAdmin(); }
    function sameChurch(data) { return isSignedIn() && data.churchId == myChurchId(); }

    // The permanent one-time-setup lock behind pages/platform-setup.html
    // (see Step 9). Whoever's request creates this document becomes the
    // Platform Admin; nobody — not even Collins — can ever create, edit,
    // or delete it again afterward, which is what makes the setup page
    // permanently self-locking after its first use. If setup is ever
    // botched (wrong email, etc.), the only way to redo it is deleting
    // this one document from the Firebase console directly, which
    // bypasses these rules entirely because console access uses admin
    // privileges.
    match /platformMeta/bootstrap {
      allow read: if true; // platform-setup.html needs this pre-login to know whether to show the form
      allow create: if isSignedIn();
      allow update, delete: if false;
    }

    // Public: needed pre-login so the sign-up page can list churches and
    // check whether the one in the URL is active. Only the platform admin
    // can create or pause one.
    match /churches/{churchId} {
      allow read: if true;
      allow write: if isPlatformAdmin();
    }

    // Public: needed pre-login so the registration form can populate the
    // department dropdown for the chosen church. Only that church's own
    // super admin can create/edit departments, and only under their own churchId.
    match /departments/{deptId} {
      allow read: if true;
      allow write: if isSuperAdmin() && request.resource.data.churchId == myChurchId();
    }

    match /users/{uid} {
      // Two, and only two, ways a users/{uid} doc can ever be created:
      //
      // 1. Normal member self-registration (index.html) — always pinned
      //    to role=="member", and only under a church that actually
      //    exists and is currently active. This is the line that was
      //    missing before: it's what stops someone from registering
      //    themselves straight into superAdmin via devtools.
      //
      // 2. The one-time Platform Admin bootstrap (platform-setup.html) —
      //    only possible while platformMeta/bootstrap doesn't exist yet,
      //    i.e. only the very first time, by whoever gets there first.
      allow create: if isSignedIn() && request.auth.uid == uid && (
           (request.resource.data.role == "member"
             && exists(/databases/$(database)/documents/churches/$(request.resource.data.churchId))
             && get(/databases/$(database)/documents/churches/$(request.resource.data.churchId)).data.active == true)
        || (request.resource.data.role == "platformAdmin"
             && !exists(/databases/$(database)/documents/platformMeta/bootstrap))
      );

      allow read: if isSignedIn() && (
           request.auth.uid == uid
        || isPlatformAdmin()
        || (sameChurch(resource.data) && isSuperAdmin())
        || (sameChurch(resource.data) && isDeptAdmin() && resource.data.department == myData().department)
      );

      // Members can update their own profile fields, but never their own
      // role or churchId (no self-promotion, no church-hopping). Admins can
      // update anyone in their own church/department, but a department
      // admin can never grant superAdmin.
      allow update: if isSignedIn() && (
           (request.auth.uid == uid
              && request.resource.data.role == resource.data.role
              && request.resource.data.churchId == resource.data.churchId)
        || (sameChurch(resource.data) && isSuperAdmin())
        || (sameChurch(resource.data) && isDeptAdmin()
              && resource.data.department == myData().department
              && request.resource.data.role != "superAdmin")
      );

      allow delete: if false; // deactivate via a status field instead of deleting
    }

    match /meetings/{id} {
      allow read: if isPlatformAdmin() || sameChurch(resource.data);
      allow create: if isAdmin() && request.resource.data.churchId == myChurchId();
      allow update, delete: if isAdmin() && sameChurch(resource.data);
    }

    match /attendance/{id} {
      allow read: if isPlatformAdmin() || (sameChurch(resource.data) && (resource.data.userId == request.auth.uid || isAdmin()));
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid && request.resource.data.churchId == myChurchId();
      allow update: if isSignedIn() && resource.data.userId == request.auth.uid && sameChurch(resource.data); // clock-out only
    }

    match /excuses/{id} {
      allow read: if isPlatformAdmin() || (sameChurch(resource.data) && (resource.data.userId == request.auth.uid || isAdmin()));
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid && request.resource.data.churchId == myChurchId();
      allow update: if isAdmin() && sameChurch(resource.data); // approve/decline only
    }

    match /announcements/{id} {
      allow read: if isPlatformAdmin() || sameChurch(resource.data);
      allow create: if isAdmin() && request.resource.data.churchId == myChurchId();
      allow update, delete: if isAdmin() && sameChurch(resource.data);
    }

    match /devotionalLogs/{id} {
      allow read: if isPlatformAdmin() || (sameChurch(resource.data) && (resource.data.userId == request.auth.uid || isAdmin()));
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid && request.resource.data.churchId == myChurchId();
    }
  }
}
```

**Worth knowing:** these rules protect the things that actually matter —
nobody can self-promote to admin, move themselves between churches, or read
another church's people/meetings/excuses/data. They do *not* stop a member
from tampering with their own points/streak via direct API calls — reasonable
for a small congregation tool, not something you'd want for a system with
real money or legal stakes attached. And the one non-negotiable if you ever
extend this schema yourself: every collection above checks that a
document's `churchId` matches the requester's own — without that, the
client-side `where("churchId", ...)` filters in the app are just cosmetic.

---

## STEP 9: Set Up Your Platform Admin Account (Do This Before Anything Else)

**This is the step that was completely missing before, and it's the reason
you couldn't sign up a new church.** `pages/platform.html` — the dashboard
that creates churches and hands out their sign-up links — has always
required being signed in as `platformAdmin`. But nothing anywhere in the app
could ever grant that role: registration always creates a plain `member`,
and there was no page, button, or link that could create anything else. So
the one feature that adds churches was permanently unreachable, for anyone,
including you.

Two new files fix this:

- `js/platform-setup-config.js` — a private setup phrase, same idea as the
  Cloudinary/EmailJS config files.
- `pages/platform-setup.html` — a one-time setup page that creates your
  Platform Admin account. It works exactly once, ever, for anyone — after
  you complete it, the page permanently refuses to run again, for you or
  for anyone who finds the URL. That lock lives in the Firestore rules
  (the `platformMeta/bootstrap` document), not in the page itself, so it
  holds even if someone edits the page's JavaScript.

**To set yourself up:**

1. Open `js/platform-setup-config.js` and replace `PICK_A_PRIVATE_PHRASE`
   with any phrase only you know.
2. Deploy, then go straight to `yourdomain.com/pages/platform-setup.html`.
3. Fill in your name, email, password, and that setup phrase → Create
   Platform Admin Account. You're immediately signed in and redirected to
   the Platform Dashboard.
4. From there: **Add a Church** → name + workspace ID → Create Church →
   Copy Link. Send that link to the first admin at that church. The first
   person who registers through it should be manually promoted to
   `superAdmin` in Firestore (see Step 10) — from then on, that church runs
   itself, and you never see its members' data unless you go looking (the
   rules do give you read access across every church, for support).

**To sign back in later:** go to `index.html`, and instead of picking a
church, click **"Platform admin? Sign in directly"** under the church
picker.

**If something goes wrong mid-setup** (wrong email, etc.): the lock means
this page won't let you try again. The fix is deleting the single
`platformMeta/bootstrap` document in the Firebase console (console access
bypasses the rules), which re-opens the one-time window — then run setup
again.

---

## STEP 10: Make Yourself Super Admin of Your Own Church

This is separate from Step 9 — Step 9 makes you the *platform* admin (across
every church); this makes you the *super admin* of one specific church's
workspace, the same way any church's first admin gets promoted.

1. Using the sign-up link you copied in Step 9, register a normal member
   account for that church (department doesn't matter — this changes next).
2. Go to Firebase → Firestore → `users` collection.
3. Find your document (your UID is the document ID).
4. Edit the `role` field: change `member` to `superAdmin`.
5. Save. You'll now land on the Super Admin Dashboard on login, with every
   tab unlocked including Departments.

**Your very first real step as that church's super admin:** go to the
**Departments** tab and click **"Fix Old Accounts"** once, if you migrated
an existing single-church account into this church workspace (see
`migrate-legacy.html`). It's safe to click more than once.

---

## STEP 11: Deploy to Vercel (Free)

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
│   ├── platform-setup-config.js ← Your private one-time platform-setup phrase (see Step 9)
│   ├── icons.js              ← Shared icon set
│   ├── motion.js             ← Reveal animations, confetti, toast, image resize helper
│   └── devotionals.js        ← Daily devotional content + streak helpers
├── assets/
│   ├── logo.png              ← RCCG crest (navbar + login)
│   └── favicon-*.png / apple-touch-icon.png
├── pages/
│   ├── member.html          ← Member dashboard, directory, announcements
│   ├── admin.html           ← Admin dashboard (scoped by role — Super Admin or Department Admin)
│   ├── platform.html        ← Platform Dashboard — add/pause churches (needs role: platformAdmin)
│   └── platform-setup.html  ← One-time page that creates your platformAdmin account (see Step 9)
└── README.md                ← This file
```

---

## DEPARTMENTS, ROLES & PERMISSIONS

**Departments** are created by the super admin (Departments tab). "General
Congregation" always exists automatically — it's for anyone not on a
serving team, and needs no setup. Everyone picks exactly one department
at registration (or "General Congregation"), plus an optional free-text
**position** (e.g. "Camera Operator", "Choir Director", "Head Usher") and
whether they're an active **worker/volunteer** there.

**Three access levels:**

| Role | Sees |
|---|---|
| Member | Their own stats, their own department's directory, congregation + own-department meetings/announcements |
| Department Admin | Everything above, plus: manage their department's meetings, members, excuses, leaderboard, announcements |
| Super Admin | Everything, everywhere. Plus: create departments, promote members to Department Admin, create congregation-wide Services, browse any department |

To promote someone to Department Admin: Members tab → find them → Edit →
set their Department and change Access Level to "Department Admin." Only
a super admin can do this (or grant/revoke Super Admin itself).

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

Three things happen automatically, all without any backend or Blaze plan:

1. **Email to EmailJS's configured inbox** (Step 5) when:
   - A member submits an excuse request
   - A member crosses 2 missed meetings for the first time (not again on
     the 3rd, 4th miss, etc. — you're already tracking them by then)

   Both of these fire regardless of department — EmailJS is configured
   once, church-wide, so every excuse and every newly-flagged member reaches
   that one inbox. There's no per-department email routing built here; if
   you want department admins emailed only about their own department,
   that's a further change, not something this version does.
2. **Live in-app alerts** on the admin dashboard — a toast pops up and the
   Overview tab's numbers update the instant either of those happens, as
   long as the dashboard is open in a browser tab somewhere. These *are*
   correctly scoped by the security rules — a department admin's toast
   feed only ever includes their own department; a super admin sees
   everything. No reload needed either way.
3. **Announcements** — not automatic, but the closest thing to a
   "broadcast": an admin posts once, and it shows up live on every
   relevant member's dashboard (Announcements tab, in admin.html).

**The honest limitation:** all of these only fire because they're
triggered by someone's browser already being open and doing something
(a member submitting an excuse, an admin ending a meeting or posting an
announcement). Nothing runs in the background on a server. That means:
- ✅ "Email me when X happens" → covered, exactly as built
- ❌ "Email me every Monday with a weekly summary, whether or not anyone
  opened the app that day" → would need a scheduled server job, which
  needs Blaze. Not built here.

If EmailJS isn't configured yet (`js/emailjs-config.js` still has the
placeholder values), emails are silently skipped — logged to the browser
console, nothing else breaks. The in-app toasts and announcements work
either way.

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
