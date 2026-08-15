const SCHEDULE_ALARM = 'nightwatch-schedule';

const INITIAL_STATE = {
  active: true,
  preset: 'default',
  tweaks: { brightness: null, contrast: null, sepia: null },
  focusMode: false,
  schedule: { enabled: false, from: '20:00', to: '07:00' },
  scope: 'docs',
};

// ─── Install ──────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await chrome.storage.sync.set(INITIAL_STATE);
  }
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id) continue;
    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ['content.js'],
    }).catch(() => {});
  }
});

// ─── Schedule engine ──────────────────────────────────────────────────────────

function withinTimeRange(from, to) {
  const now   = new Date();
  const cur   = now.getHours() * 60 + now.getMinutes();
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  const start = fh * 60 + fm;
  const end   = th * 60 + tm;
  return start <= end ? (cur >= start && cur < end) : (cur >= start || cur < end);
}

async function syncAlarm(schedule) {
  const { permissions } = await chrome.permissions.getAll();
  if (!permissions.includes('alarms')) return;
  if (schedule?.enabled) {
    chrome.alarms.create(SCHEDULE_ALARM, { periodInMinutes: 1 });
  } else {
    chrome.alarms.clear(SCHEDULE_ALARM);
  }
}

// ─── Storage change → broadcast RENDER ───────────────────────────────────────
// Popup writes directly to storage; this listener wakes the service worker
// and fans out the new state to all content scripts.

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'sync') return;
  if ('schedule' in changes) syncAlarm(changes.schedule.newValue);
  const full = await chrome.storage.sync.get(Object.keys(INITIAL_STATE));
  broadcast({ action: 'RENDER', state: full });
});

// ─── Schedule alarm ───────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async ({ name }) => {
  if (name !== SCHEDULE_ALARM) return;
  const { schedule, active } = await chrome.storage.sync.get(['schedule', 'active']);
  if (!schedule?.enabled) return;
  const shouldBeActive = withinTimeRange(schedule.from, schedule.to);
  if (shouldBeActive === active) return;
  await chrome.storage.sync.set({ active: shouldBeActive });
  chrome.notifications.create('schedule-notification', {
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Dark mode for Google™ Docs',
    message: shouldBeActive ? 'Dark mode enabled by schedule' : 'Dark mode disabled by schedule',
  });
});

// ─── Keyboard command ─────────────────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd !== 'toggle-dark-mode') return;
  const { active } = await chrome.storage.sync.get(['active']);
  const next = !active;
  await chrome.storage.sync.set({ active: next });
  chrome.notifications.create('toggle-notification', {
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Dark mode for Google™ Docs',
    message: next ? 'Dark mode enabled' : 'Dark mode disabled',
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function broadcast(msg) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
  }
}
