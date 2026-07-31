// ============================================================
// SUBSCRIPTION PRICING — edit these numbers to change what churches pay.
// Nothing else in the app needs to change; every page that shows a price
// or checks subscription status imports from here.
// ============================================================
export const CURRENCY_SYMBOL = "₦";
export const PRICE_PER_MEMBER = 25;        // NGN, per member, per month
export const MINIMUM_MONTHLY_FEE = 20000;  // NGN — whichever is higher wins
export const GRACE_PERIOD_DAYS = 14;       // days after expiry before a church is locked out
export const REMINDER_DAYS_BEFORE_EXPIRY = 7; // send a heads-up email/banner this many days out
export const TRIAL_PERIOD_DAYS = 30;       // free trial length for a newly created church
// ============================================================

export function formatNaira(amount) {
  return CURRENCY_SYMBOL + Math.round(amount).toLocaleString("en-NG");
}

/** Monthly fee = the higher of the flat minimum or per-member pricing. */
export function calculateMonthlyFee(memberCount) {
  return Math.max(MINIMUM_MONTHLY_FEE, (memberCount || 0) * PRICE_PER_MEMBER);
}

/**
 * Given a church doc's subscriptionExpiresAt (ISO date string, or null/undefined
 * for a church that predates billing or was never started), returns its current
 * billing state and how many days are left in that state.
 *   "none"    — no subscription on file yet (e.g. legacy church)
 *   "active"  — paid up, full access
 *   "grace"   — expired, but still inside the grace window; full access with a warning
 *   "expired" — past the grace window; access blocked, same as a manual pause
 */
export function getSubscriptionState(subscriptionExpiresAt) {
  if (!subscriptionExpiresAt) return { state: "none", daysLeft: 0 };
  const now = new Date();
  const expires = new Date(subscriptionExpiresAt);
  const graceEnd = new Date(expires.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  if (now <= expires) {
    return { state: "active", daysLeft: Math.max(1, Math.ceil((expires - now) / 86400000)) };
  }
  if (now <= graceEnd) {
    return { state: "grace", daysLeft: Math.max(1, Math.ceil((graceEnd - now) / 86400000)) };
  }
  return { state: "expired", daysLeft: 0 };
}

/**
 * True if a still-active subscription is close enough to expiry to warrant
 * a heads-up (banner and/or reminder email). Doesn't know anything about
 * whether a reminder was already sent — that dedup lives wherever the
 * reminder is actually triggered from, since it needs its own doc to track.
 */
export function isInReminderWindow(subscriptionExpiresAt) {
  const { state, daysLeft } = getSubscriptionState(subscriptionExpiresAt);
  return state === "active" && daysLeft <= REMINDER_DAYS_BEFORE_EXPIRY;
}

/** ISO string for "today + N days" — used both for a new trial and for renewals. */
export function addDaysISO(fromISO, days) {
  const base = fromISO ? new Date(fromISO) : new Date();
  const from = isNaN(base) ? new Date() : base;
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}
