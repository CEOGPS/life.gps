const { app, BrowserWindow, BrowserView, ipcMain, safeStorage } = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = !app.isPackaged;

const PLATFORM_URLS = {
  "google-voice": "https://voice.google.com/u/0/messages",
  messenger:      "https://www.messenger.com",
  snapchat:       "https://web.snapchat.com",
  tiktok:         "https://www.tiktok.com/messages",
  instagram:      "https://www.instagram.com/direct/inbox/",
  linkedin:       "https://www.linkedin.com/messaging/",
  x:              "https://x.com/messages",
  reddit:         "https://www.reddit.com/message/inbox/",
  telegram:       "https://web.telegram.org/k/",
  signal:         "https://www.signal.org/download/",
};

const LOGIN_SELECTORS = {
  messenger:  { user: 'input[name="email"]',         pass: 'input[name="pass"]' },
  instagram:  { user: 'input[name="username"]',      pass: 'input[name="password"]' },
  snapchat:   { user: 'input[data-testid="username-field"]', pass: 'input[data-testid="password-field"]' },
  tiktok:     { user: 'input[name="username"]',      pass: 'input[placeholder*="password" i]' },
  linkedin:   { user: 'input[id="username"]',        pass: 'input[id="password"]' },
  x:          { user: 'input[name="text"]',          pass: 'input[name="password"]' },
  reddit:     { user: 'input[id="loginUsername"]',   pass: 'input[id="loginPassword"]' },
};

var CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
var UA_SPOOF_PLATFORMS = new Set(["snapchat","tiktok","instagram","x","reddit","messenger","linkedin"]);

let mainWindow;
const platformViews = {};
var credStore = {};
var credFilePath = "";

function getCredFilePath() {
  return path.join(app.getPath("userData"), "lifeos_creds.json");
}

function loadCredStore() {
  try {
    credFilePath = getCredFilePath();
    if (fs.existsSync(credFilePath)) {
      credStore = JSON.parse(fs.readFileSync(credFilePath, "utf8"));
    }
  } catch (e) { credStore = {}; }
}

function saveCredStore() {
  try { fs.writeFileSync(credFilePath, JSON.stringify(credStore), "utf8"); } catch (e) {}
}

function encryptPassword(plain) {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(plain).toString("base64");
  }
  return Buffer.from(plain).toString("base64");
}

function decryptPassword(encrypted) {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(encrypted, "base64"));
    }
    return Buffer.from(encrypted, "base64").toString("utf8");
  } catch (e) { return ""; }
}

function viewKey(platformId, accountIndex) {
  return platformId + "__" + (accountIndex || 0);
}

function buildAutofillScript(platformId, username, password) {
  var sel = LOGIN_SELECTORS[platformId];
  if (!sel) return null;
  var u = JSON.stringify(username);
  var p = JSON.stringify(password);
  return [
    "(function() {",
    "  function fill() {",
    "    var userEl = document.querySelector(" + JSON.stringify(sel.user) + ");",
    "    var passEl = document.querySelector(" + JSON.stringify(sel.pass) + ");",
    "    if (!userEl || !passEl) return false;",
    "    var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;",
    "    setter.call(userEl, " + u + ");",
    "    userEl.dispatchEvent(new Event('input', { bubbles: true }));",
    "    setter.call(passEl, " + p + ");",
    "    passEl.dispatchEvent(new Event('input', { bubbles: true }));",
    "    return true;",
    "  }",
    "  if (!fill()) {",
    "    var obs = new MutationObserver(function() { if (fill()) obs.disconnect(); });",
    "    obs.observe(document.body, { childList: true, subtree: true });",
    "    setTimeout(function() { obs.disconnect(); }, 8000);",
    "  }",
    "})()"
  ].join("\n");
}

function attachAutofill(view, platformId, key) {
  view.webContents.on("did-finish-load", function() {
    var cred = credStore[key];
    if (!cred || !cred.username) return;
    var password = decryptPassword(cred.encryptedPassword);
    var script = buildAutofillScript(platformId, cred.username, password);
    if (script) view.webContents.executeJavaScript(script).catch(function() {});
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1024, minHeight: 700,
    titleBarStyle: "hiddenInset", backgroundColor: "#0d0e17",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true, nodeIntegration: false, webSecurity: true,
    },
  });
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", function() {
    Object.values(platformViews).forEach(function(v) {
      try { mainWindow.removeBrowserView(v); } catch (e) {}
    });
    mainWindow = null;
  });
}

ipcMain.handle("platform:open", async function(event, args) {
  var platformId = args.platformId;
  var accountIndex = args.accountIndex || 0;
  var bounds = args.bounds;
  var url = PLATFORM_URLS[platformId];
  if (!url || !mainWindow) return { ok: false, error: "Unknown platform" };
  var key = viewKey(platformId, accountIndex);
  if (!platformViews[key]) {
    var view = new BrowserView({
      webPreferences: {
        webSecurity: false, contextIsolation: true, nodeIntegration: false,
        partition: "persist:" + key,
      },
    });
    platformViews[key] = view;
    if (UA_SPOOF_PLATFORMS.has(platformId)) {
      view.webContents.setUserAgent(CHROME_UA);
    }
    attachAutofill(view, platformId, key);
    view.webContents.loadURL(url);
  }
  Object.values(platformViews).forEach(function(v) {
    try { mainWindow.removeBrowserView(v); } catch (e) {}
  });
  mainWindow.addBrowserView(platformViews[key]);
  platformViews[key].setBounds({
    x: Math.round(bounds.x), y: Math.round(bounds.y),
    width: Math.round(bounds.width), height: Math.round(bounds.height),
  });
  platformViews[key].setAutoResize({ width: false, height: false });
  return { ok: true };
});

ipcMain.handle("platform:hide", async function(event, args) {
  args = args || {};
  if (args.platformId !== undefined) {
    var key = viewKey(args.platformId, args.accountIndex || 0);
    if (platformViews[key]) {
      try { mainWindow.removeBrowserView(platformViews[key]); } catch (e) {}
    }
  } else {
    Object.values(platformViews).forEach(function(v) {
      try { mainWindow.removeBrowserView(v); } catch (e) {}
    });
  }
  return { ok: true };
});

ipcMain.handle("platform:resize", async function(event, args) {
  var key = viewKey(args.platformId, args.accountIndex || 0);
  if (platformViews[key]) {
    platformViews[key].setBounds({
      x: Math.round(args.bounds.x), y: Math.round(args.bounds.y),
      width: Math.round(args.bounds.width), height: Math.round(args.bounds.height),
    });
  }
  return { ok: true };
});

ipcMain.handle("platform:navigate", async function(event, args) {
  var key = viewKey(args.platformId, args.accountIndex || 0);
  var view = platformViews[key];
  if (!view) return { ok: false };
  if (args.action === "back" && view.webContents.canGoBack()) view.webContents.goBack();
  if (args.action === "forward" && view.webContents.canGoForward()) view.webContents.goForward();
  if (args.action === "reload") view.webContents.reload();
  if (args.action === "home") view.webContents.loadURL(PLATFORM_URLS[args.platformId]);
  return { ok: true };
});

ipcMain.handle("platform:clearSession", async function(event, args) {
  var key = viewKey(args.platformId, args.accountIndex || 0);
  if (platformViews[key]) {
    try { mainWindow.removeBrowserView(platformViews[key]); } catch (e) {}
    var ses = platformViews[key].webContents.session;
    await ses.clearStorageData();
    await ses.clearCache();
    platformViews[key].webContents.loadURL(PLATFORM_URLS[args.platformId]);
  }
  return { ok: true };
});

ipcMain.handle("platform:saveCredentials", async function(event, args) {
  var key = viewKey(args.platformId, args.accountIndex || 0);
  credStore[key] = { username: args.username, encryptedPassword: encryptPassword(args.password) };
  saveCredStore();
  return { ok: true };
});

ipcMain.handle("platform:getCredentials", async function(event, args) {
  var key = viewKey(args.platformId, args.accountIndex || 0);
  var cred = credStore[key];
  if (!cred) return { ok: true, username: "", hasSavedPassword: false };
  return { ok: true, username: cred.username, hasSavedPassword: !!cred.encryptedPassword };
});

ipcMain.handle("platform:deleteCredentials", async function(event, args) {
  var key = viewKey(args.platformId, args.accountIndex || 0);
  delete credStore[key];
  saveCredStore();
  return { ok: true };
});

ipcMain.handle("platform:triggerAutofill", async function(event, args) {
  var key = viewKey(args.platformId, args.accountIndex || 0);
  var view = platformViews[key];
  if (!view) return { ok: false };
  var cred = credStore[key];
  if (!cred || !cred.username) return { ok: false, error: "No credentials saved" };
  var password = decryptPassword(cred.encryptedPassword);
  var script = buildAutofillScript(args.platformId, cred.username, password);
  if (!script) return { ok: false, error: "No autofill config for this platform" };
  await view.webContents.executeJavaScript(script).catch(function() {});
  return { ok: true };
});

app.whenReady().then(function() {
  loadCredStore();
  createWindow();
  app.on("activate", function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function() {
  if (process.platform !== "darwin") app.quit();
});
