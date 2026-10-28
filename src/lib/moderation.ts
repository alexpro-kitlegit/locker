// Words that can't appear in a listing. Placeholder list: the real one is owned by trust & safety
// and covers fakes ("replica", "1:1"), taking payment off the platform, and abuse.
const BLOCKED = [
  "replica",
  "fake",
  "copy",
  "1:1",
  "aaa",
  "unofficial",
  "knock off",
  "knockoff",
  "inspired",
  "paypal",
  "bank transfer",
  "whatsapp",
  "cash only",
  "dm me",
];

/** Returns the blocked words found in the text, if any. */
export function blockedWords(text: string): string[] {
  const t = ` ${text.toLowerCase()} `;
  return BLOCKED.filter((w) => new RegExp(`(^|[^a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(t));
}

/**
 * Contact details or payment off the platform in a chat message. Returns what was found, or null.
 * Stand-in for the AI check in chats (phone numbers, emails, bank details, "pay me outside the app").
 */
export function contactDetails(text: string): string | null {
  if (/\b[\w.+-]+@[\w-]+\.[\w.]+\b/.test(text)) return "email addresses";
  if (/(\+?44|\b0)\s?7\d{3}\s?\d{3}\s?\d{3}\b|\b\d{5}\s?\d{6}\b/.test(text)) return "phone numbers";
  if (/\b\d{2}-\d{2}-\d{2}\b|\bsort code\b|\baccount number\b/i.test(text)) return "bank details";
  if (/\b(paypal|bank transfer|cash on|pay (you|me) direct|outside the app|whatsapp|instagram)\b/i.test(text)) return "payment or contact outside The Locker";
  return null;
}
