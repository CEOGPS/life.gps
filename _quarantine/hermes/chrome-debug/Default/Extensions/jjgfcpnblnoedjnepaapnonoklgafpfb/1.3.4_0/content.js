// ─── Theme Presets ────────────────────────────────────────────────────────────
// Each preset defines the baseline filter values and the page background color.
// Users can layer fine-tune tweaks on top without losing preset identity.

const PRESETS = {
  default: {
    brightness: 100, contrast: 90, sepia: 10,
    paperColor: '#1a1a2e',
  },
  nord: {
    brightness: 95, contrast: 88, sepia: 0,
    paperColor: '#2e3440',
  },
  dracula: {
    brightness: 92, contrast: 95, sepia: 0,
    paperColor: '#282a36',
  },
  solarized: {
    brightness: 90, contrast: 85, sepia: 25,
    paperColor: '#002b36',
  },
  monokai: {
    brightness: 93, contrast: 92, sepia: 8,
    paperColor: '#272822',
  },
};

// ─── Theme Engine ─────────────────────────────────────────────────────────────

class ThemeEngine {
  static #THEME_ID = 'nightwatch-theme';
  static #FOCUS_ID = 'nightwatch-focus';

  static #resolve(state) {
    const preset = PRESETS[state.preset] ?? PRESETS.default;
    const t = state.tweaks ?? {};
    return {
      brightness: t.brightness ?? preset.brightness,
      contrast:   t.contrast   ?? preset.contrast,
      sepia:      t.sepia      ?? preset.sepia,
      paperColor: preset.paperColor,
    };
  }

  static #themeCSS(v) {
    const f = [
      'invert(100%)',
      'hue-rotate(180deg)',
      `brightness(${v.brightness}%)`,
      `contrast(${v.contrast}%)`,
      v.sepia > 0 ? `sepia(${v.sepia}%)` : null,
    ].filter(Boolean).join(' ');

    return `
      html { filter: ${f}; background: ${v.paperColor} !important; }

      img, video, embed, svg image,
      [style*="background-image:url"] {
        filter: invert(100%) hue-rotate(180deg);
      }

      ::-webkit-scrollbar              { background: #111; width: 8px; }
      ::-webkit-scrollbar-thumb        { background: #404040; border-radius: 4px; }
      ::-webkit-scrollbar-corner       { background: #111; }
    `;
  }

  static #focusCSS() {
    return `
      #docs-bars,
      .docs-titlebar,
      .docs-gm-bar,
      .kix-appview-editor-header,
      .docs-ruler-container,
      .docs-sidebar,
      .gb_Ld, .gb_2e {
        display: none !important;
      }
      .kix-appview-editor { top: 0 !important; }
    `;
  }

  static #upsert(id, css) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('style');
      el.id = id;
      (document.head ?? document.documentElement).appendChild(el);
    }
    el.textContent = css;
  }

  static render(state) {
    ThemeEngine.#upsert(ThemeEngine.#THEME_ID, ThemeEngine.#themeCSS(ThemeEngine.#resolve(state)));
  }

  static clear() {
    document.getElementById(ThemeEngine.#THEME_ID)?.remove();
  }

  static setFocus(on) {
    if (on) {
      ThemeEngine.#upsert(ThemeEngine.#FOCUS_ID, ThemeEngine.#focusCSS());
    } else {
      document.getElementById(ThemeEngine.#FOCUS_ID)?.remove();
    }
  }
}

// ─── State ────────────────────────────────────────────────────────────────────

let cached = null;

function isInScope(scope) {
  if (scope === 'all') return true;
  return window.location.hostname === 'docs.google.com';
}

async function boot() {
  cached = await chrome.storage.sync.get(['active', 'preset', 'tweaks', 'focusMode', 'scope']);
  if (cached.active !== false && isInScope(cached.scope)) ThemeEngine.render(cached);
  ThemeEngine.setFocus(!!cached.focusMode);
}

// Automatically disable dark mode while printing, restore after
window.addEventListener('beforeprint', () => {
  ThemeEngine.clear();
  ThemeEngine.setFocus(false);
});
window.addEventListener('afterprint', () => {
  if (cached?.active !== false) ThemeEngine.render(cached);
  ThemeEngine.setFocus(!!cached?.focusMode);
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'RENDER') {
    cached = msg.state;
    if (msg.state.active !== false && isInScope(msg.state.scope)) {
      ThemeEngine.render(msg.state);
      ThemeEngine.setFocus(!!msg.state.focusMode);
    } else {
      ThemeEngine.clear();
      ThemeEngine.setFocus(false);
    }
  }

  if (msg.action === 'SET_ACTIVE') {
    cached = { ...cached, active: msg.active };
    msg.active ? ThemeEngine.render(cached) : ThemeEngine.clear();
  }

  if (msg.action === 'PRINT') {
    window.print();
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (!['active', 'preset', 'tweaks', 'focusMode', 'scope'].some((k) => k in changes)) return;
  chrome.storage.sync.get(['active', 'preset', 'tweaks', 'focusMode', 'scope']).then((s) => {
    cached = s;
    if (s.active !== false && isInScope(s.scope)) {
      ThemeEngine.render(s);
      ThemeEngine.setFocus(!!s.focusMode);
    } else {
      ThemeEngine.clear();
      ThemeEngine.setFocus(false);
    }
  });
});

boot();
