// emailHistory.js — shared email tracking for CRM + Contacts
// Stores to localStorage, keyed per contact by email address

const HISTORY_KEY = "lifeos_email_history";
const COMPOSE_KEY = "lifeos_email_compose";

function load() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}
function save(arr) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 2000)));
  } catch {}
}

export function logEmail({
  direction = "sent",
  from,
  to,
  cc,
  subject,
  date,
  snippet,
  threadId,
  messageId,
}) {
  const history = load();
  const id =
    messageId || `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  if (messageId && history.some((h) => h.id === messageId)) return;
  history.unshift({
    id,
    direction,
    from: from || "",
    to: to || "",
    cc: cc || "",
    subject: subject || "(no subject)",
    date: date || new Date().toISOString(),
    snippet: (snippet || "").slice(0, 200),
    threadId: threadId || "",
  });
  save(history);
}

export function getEmailsForContact(email) {
  if (!email) return [];
  const norm = email.toLowerCase().trim();
  return load()
    .filter(
      (h) =>
        h.from?.toLowerCase().includes(norm) ||
        h.to?.toLowerCase().includes(norm) ||
        h.cc?.toLowerCase().includes(norm),
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getAllHistory() {
  return load().sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Called by CRM/Contacts panels to request a compose pre-fill
export function requestCompose({ to, name, subject = "", body = "" }) {
  try {
    localStorage.setItem(
      COMPOSE_KEY,
      JSON.stringify({ to, name, subject, body, ts: Date.now() }),
    );
  } catch {}
}

// Called by EmailPanel on mount / tab focus
export function consumeComposeRequest() {
  try {
    const raw = localStorage.getItem(COMPOSE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    localStorage.removeItem(COMPOSE_KEY);
    // Ignore stale requests older than 10 seconds
    if (Date.now() - (data.ts || 0) > 10000) return null;
    return data;
  } catch {
    return null;
  }
}
