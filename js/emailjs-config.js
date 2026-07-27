// ============================================================
// PASTE YOUR EMAILJS DETAILS HERE
// Get these from https://emailjs.com (free tier: 200 emails/month, no card):
//
//   1. Sign up → "Email Services" → "Add New Service" → connect the inbox
//      you want alerts to land in (Gmail, Outlook, etc).
//      Copy the SERVICE ID it gives you.
//
//   2. "Email Templates" → "Create New Template".
//      Set the "To email" field to your own admin email address directly
//      (not a variable — simplest and safest for a fixed recipient).
//      In the template body, use exactly these two variables and nothing
//      else — all the actual wording is built in code, this template is
//      just a passthrough:
//        Subject:  {{subject}}
//        Content:  {{message}}
//      Copy the TEMPLATE ID it gives you.
//
//   3. "Account" → "General" → copy your PUBLIC KEY.
// ============================================================
const EMAILJS_PUBLIC_KEY  = "LhMh3kCbS2RoRHL41";
const EMAILJS_SERVICE_ID  = "service_xjtdd3l";
const EMAILJS_TEMPLATE_ID = "template_q9fa0z8";
// ============================================================

import emailjs from "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm";

let initialized = false;
function ensureInit() {
  if (!initialized) {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    initialized = true;
  }
}

/**
 * Sends a notification email to the admin (excuse submitted, member flagged,
 * etc). Deliberately fire-and-forget from the caller's point of view — it
 * swallows its own errors so a slow/failed email never blocks or breaks the
 * action that triggered it (submitting an excuse, ending a meeting).
 *
 * @param {string} subject - short subject line.
 * @param {string} message - the email body (plain text).
 */
export async function sendEmailAlert(subject, message) {
  if (EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY") {
    console.warn("EmailJS isn't configured yet — paste your keys into js/emailjs-config.js. Skipping email alert.");
    return;
  }
  try {
    ensureInit();
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { subject, message });
  } catch (err) {
    console.warn("Email alert failed to send (non-blocking):", err);
  }
}
