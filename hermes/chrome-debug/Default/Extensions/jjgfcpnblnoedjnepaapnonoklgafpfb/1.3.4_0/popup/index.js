// Preset baseline values — mirrors content.js PRESETS
const PRESET_DEFAULTS = {
  default:   { brightness: 100, contrast: 90,  sepia: 10 },
  nord:      { brightness: 95,  contrast: 88,  sepia: 0  },
  dracula:   { brightness: 92,  contrast: 95,  sepia: 0  },
  solarized: { brightness: 90,  contrast: 85,  sepia: 25 },
  monokai:   { brightness: 93,  contrast: 92,  sepia: 8  },
};

let state = {};

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const qs = (sel) => document.querySelector(sel);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function persist(patch) {
  Object.assign(state, patch);
  await chrome.storage.sync.set(patch);
}

function setSlider(key, value) {
  qs(`#sl-${key}`).value = value;
  qs(`#out-${key}`).textContent = `${value}%`;
}

// ─── Render ───────────────────────────────────────────────────────────────────

function render(s) {
  state = s;

  // Main toggle
  qs('#active-switch').checked = s.active !== false;
  qs('#panel-body').classList.toggle('off', s.active === false);

  // Preset chips
  document.querySelectorAll('.preset-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.preset === (s.preset ?? 'default'));
  });

  // Sliders: show preset defaults merged with any user tweaks
  const defaults = PRESET_DEFAULTS[s.preset ?? 'default'];
  const tweaks   = s.tweaks ?? {};
  setSlider('brightness', tweaks.brightness ?? defaults.brightness);
  setSlider('contrast',   tweaks.contrast   ?? defaults.contrast);
  setSlider('sepia',      tweaks.sepia      ?? defaults.sepia);

  // Scope chips
  document.querySelectorAll('.scope-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.scope === (s.scope ?? 'docs'));
  });

  // Focus mode
  qs('#focus-switch').checked = !!s.focusMode;

  // Schedule
  const sched = s.schedule ?? {};
  qs('#schedule-switch').checked = !!sched.enabled;
  qs('#schedule-times').hidden   = !sched.enabled;
  qs('#schedule-from').value     = sched.from ?? '20:00';
  qs('#schedule-to').value       = sched.to   ?? '07:00';
}

// ─── Bindings ─────────────────────────────────────────────────────────────────

// Main on/off
qs('#active-switch').addEventListener('change', (e) => {
  persist({ active: e.target.checked });
});

// Theme preset selection — clears tweaks so preset defaults take effect
document.querySelectorAll('.preset-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const preset = chip.dataset.preset;
    persist({ preset, tweaks: { brightness: null, contrast: null, sepia: null } })
      .then(() => render(state));
  });
});

// Fine-tune sliders
['brightness', 'contrast', 'sepia'].forEach((key) => {
  const sl  = qs(`#sl-${key}`);
  const out = qs(`#out-${key}`);

  sl.addEventListener('input', () => { out.textContent = `${sl.value}%`; });
  sl.addEventListener('change', () => {
    persist({ tweaks: { ...(state.tweaks ?? {}), [key]: Number(sl.value) } });
  });
});

// Reset tweaks to the current preset's defaults
qs('#btn-reset').addEventListener('click', () => {
  persist({ tweaks: { brightness: null, contrast: null, sepia: null } })
    .then(() => render(state));
});

// Scope selection
document.querySelectorAll('.scope-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    persist({ scope: chip.dataset.scope }).then(() => render(state));
  });
});

// Focus mode
qs('#focus-switch').addEventListener('change', (e) => {
  persist({ focusMode: e.target.checked });
});

// Schedule enable/disable
qs('#schedule-switch').addEventListener('change', async (e) => {
  const enabling = e.target.checked;
  if (enabling) {
    const granted = await chrome.permissions.request({ permissions: ['alarms'] });
    if (!granted) {
      e.target.checked = false;
      return;
    }
  }
  qs('#schedule-times').hidden = !enabling;
  persist({ schedule: { ...(state.schedule ?? {}), enabled: enabling } });
});

// Schedule time inputs
['from', 'to'].forEach((key) => {
  qs(`#schedule-${key}`).addEventListener('change', (e) => {
    persist({ schedule: { ...(state.schedule ?? {}), [key]: e.target.value } });
  });
});

// Print: open system print dialog; beforeprint/afterprint in content.js handles the rest
qs('#btn-print').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  chrome.tabs.sendMessage(tab.id, { action: 'PRINT' }, { frameId: 0 });
});

// ─── Init ─────────────────────────────────────────────────────────────────────

chrome.storage.sync.get(['active', 'preset', 'tweaks', 'focusMode', 'schedule', 'scope']).then(render);
