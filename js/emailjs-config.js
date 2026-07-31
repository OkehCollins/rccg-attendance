// ============================================================
// PASTE YOUR EMAILJS DETAILS HERE
// Get these from https://emailjs.com (free tier: 200 emails/month, no card):
//
//   1. Sign up → "Email Services" → "Add New Service" → connect the inbox
//      you want alerts to land in (Gmail, Outlook, etc).
//      Copy the SERVICE ID it gives you — both templates below use it.
//
//   2. ADMIN ALERTS TEMPLATE (excuses, missed meetings, payment requests):
//      "Email Templates" → "Create New Template".
//      Set the "To email" field to your own admin email address directly
//      (not a variable — simplest and safest for a fixed recipient).
//      In the template body, use exactly these two variables and nothing
//      else — all the actual wording is built in code, this template is
//      just a passthrough:
//        Subject:  {{subject}}
//        Content:  {{message}}
//      Copy the TEMPLATE ID it gives you into EMAILJS_TEMPLATE_ID.
//
//   3. USER EMAILS TEMPLATE (welcome emails, "you're now an admin",
//      "payment confirmed" — anything that goes to a specific person
//      rather than to you):
//      "Email Templates" → "Create New Template" (a second one).
//      This time set the "To email" field to the variable {{to_email}}
//      instead of a fixed address, and "To name" to {{to_name}}.
//      Same passthrough body:
//        Subject:  {{subject}}
//        Content:  {{message}}
//      Copy this TEMPLATE ID into EMAILJS_USER_TEMPLATE_ID.
//
//   4. "Account" → "General" → copy your PUBLIC KEY.
// ============================================================
const EMAILJS_PUBLIC_KEY       = "LhMh3kCbS2RoRHL41";
const EMAILJS_SERVICE_ID       = "service_xjtdd3l";
const EMAILJS_TEMPLATE_ID      = "template_q9fa0z8";
const EMAILJS_USER_TEMPLATE_ID = "template_mgk54as";
// ============================================================

import emailjs from "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm";

let initialized = false;
function ensureInit() {
  if (!initialized) {
    emailjs.init({ publicKey: LhMh3kCbS2RoRHL41 });
    initialized = true;
  }
}

/**
 * Sends a notification email to the admin (excuse submitted, member flagged,
 * payment request submitted, etc). Deliberately fire-and-forget from the
 * caller's point of view — it swallows its own errors so a slow/failed
 * email never blocks or breaks the action that triggered it.
 *
 * @param {string} subject - short subject line.
 * @param {string} message - the email body (plain text).
 */
export async function sendEmailAlert(subject, message) {
  if (EMAILJS_PUBLIC_KEY === "LhMh3kCbS2RoRHL41") {
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

/**
 * Sends an email to a specific person — a new member's welcome email, a
 * promotion notice, a payment confirmation. Needs the second EmailJS
 * template described above (dynamic "To email"). Also fire-and-forget;
 * never throws, so it can be called without awaiting or wrapping in
 * try/catch at the call site.
 *
 * @param {string} toEmail - recipient's email address.
 * @param {string} toName - recipient's display name.
 * @param {string} subject - short subject line.
 * @param {string} message - the email body (plain text).
 */
export async function sendUserEmail(toEmail, toName, subject, message) {
  if (EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY" || EMAILJS_USER_TEMPLATE_ID === "YOUR_USER_TEMPLATE_ID") {
    console.warn("EmailJS user-email template isn't configured yet — see js/emailjs-config.js. Skipping.");
    return;
  }
  if (!toEmail) return;
  try {
    ensureInit();
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_USER_TEMPLATE_ID, { to_email: toEmail, to_name: toName || "there", subject, message });
  } catch (err) {
    console.warn("User email failed to send (non-blocking):", err);
  }
}
