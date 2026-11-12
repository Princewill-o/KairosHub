// Same rule as checkName in public/accounts.mjs (kept in step by kharis.test.mjs), so the
// Edge Function bundle doesn't need the browser accounts module.
export function checkName(name) {
  const v = String(name ?? "").trim();
  if (!v) return { ok: false, error: "Enter a first name or nickname." };
  if (v.length > 20) return { ok: false, error: "Use 20 characters or fewer." };
  if (!/^[\p{L}][\p{L} '\-.]*$/u.test(v)) return { ok: false, error: "Use letters only, like a first name or nickname." };
  return { ok: true, name: v };
}
