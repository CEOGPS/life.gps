/**
 * Shared phone auto-formatting helpers for LifeOS1 forms.
 *
 * `formatPhone` normalizes a full value to display form `(###) ###-####`
 * (returns the raw digits untouched if they don't form a valid 10-digit
 * US/NA number). Use for display / on-save.
 *
 * `formatPhoneForInput` formats progressively as the user types (used in
 * live `onChange`) — it never "eats" digits the user is still typing.
 */

const DIGITS = /\D/g;

export function formatPhone(raw: unknown): string {
  if (raw == null) return "";
  const s = String(raw);
  if (!s.trim()) return "";
  const digits = s.replace(DIGITS, "");
  const local =
    digits.length === 11 && digits[0] === "1" ? digits.slice(1) : digits;
  if (local.length !== 10) return digits.length ? digits : "";
  return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}

export function formatPhoneForInput(raw: unknown): string {
  if (raw == null) return "";
  const digits = String(raw).replace(DIGITS, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return "(" + digits;
  if (digits.length <= 6)
    return "(" + digits.slice(0, 3) + ") " + digits.slice(3);
  return (
    "(" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6)
  );
}

/**
 * Format a newline-separated list of phone numbers (for multi-value inputs
 * such as the Profile modal's phone textarea). Preserves empty lines so the
 * user can keep editing across multiple numbers.
 */
export function formatPhoneList(raw: unknown): string {
  if (raw == null) return "";
  return String(raw)
    .split("\n")
    .map((line) => {
      if (line.trim() === "") return "";
      return formatPhone(line.trim()) || line.trim();
    })
    .join("\n");
}
