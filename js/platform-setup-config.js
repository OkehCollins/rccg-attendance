// ============================================================
// PASTE YOUR OWN SECRET PHRASE HERE — replace PICK_A_PRIVATE_PHRASE
// ============================================================
// This is a friction layer, not the real lock. Anyone who has your
// deployed URL could technically view-source this file and read the
// phrase — so it does NOT depend on secrecy for its safety. The real
// lock lives in Firestore's security rules: pages/platform-setup.html
// can only ever create ONE Platform Admin account, ever, ONCE, no
// matter how many times someone finds this page or this phrase. Once
// you (Collins) complete setup, this page permanently refuses to run
// again for anyone — see the "platformMeta/bootstrap" rule in
// README.md's Step 8 (Set Firestore Security Rules).
//
// So this phrase just keeps random visitors from even seeing the setup
// form before you've had a chance to claim it. Change it to anything
// only you know, then do your one-time setup soon after deploying.
export const PLATFORM_SETUP_KEY = "GotoChurchi";
