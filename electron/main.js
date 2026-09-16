const { app, BrowserWindow, BrowserView, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "CEO GPS",
    backgroundColor: "#0a0a0a",
    autoHideMenuBar: true,
  });

  // In dev, load from Vite server. In prod, load from dist/index.html
  const startUrl = process.env.NODE_ENV === "development" 
    ? "http://localhost:5173" 
    : `file://${path.join(__dirname, "../dist/index.html")}`;

  mainWindow.loadURL(startUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// BrowserView management for "Unified Inbox" (Ferdium style)
// This allows bypassing X-Frame-Options
ipcMain.on("create-service-view", (event, { provider, url }) => {
  const view = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });
  
  mainWindow.setBrowserView(view);
  view.setBounds({ x: 0, y: 0, width: 1400, height: 900 });
  view.setAutoResize({ width: true, height: true });
  view.webContents.loadURL(url);
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
