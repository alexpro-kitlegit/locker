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
