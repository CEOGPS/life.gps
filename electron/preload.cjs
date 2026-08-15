const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,

  openPlatform: function(platformId, accountIndex, bounds) {
    return ipcRenderer.invoke("platform:open", { platformId: platformId, accountIndex: accountIndex, bounds: bounds });
  },

  hidePlatform: function(platformId, accountIndex) {
    return ipcRenderer.invoke("platform:hide", { platformId: platformId, accountIndex: accountIndex });
  },

  resizePlatform: function(platformId, accountIndex, bounds) {
    return ipcRenderer.invoke("platform:resize", { platformId: platformId, accountIndex: accountIndex, bounds: bounds });
  },

  navigatePlatform: function(platformId, accountIndex, action) {
    return ipcRenderer.invoke("platform:navigate", { platformId: platformId, accountIndex: accountIndex, action: action });
  },

  clearPlatformSession: function(platformId, accountIndex) {
    return ipcRenderer.invoke("platform:clearSession", { platformId: platformId, accountIndex: accountIndex });
  },

  saveCredentials: function(platformId, accountIndex, username, password) {
    return ipcRenderer.invoke("platform:saveCredentials", { platformId: platformId, accountIndex: accountIndex, username: username, password: password });
  },

  getCredentials: function(platformId, accountIndex) {
    return ipcRenderer.invoke("platform:getCredentials", { platformId: platformId, accountIndex: accountIndex });
  },

  deleteCredentials: function(platformId, accountIndex) {
    return ipcRenderer.invoke("platform:deleteCredentials", { platformId: platformId, accountIndex: accountIndex });
  },

  triggerAutofill: function(platformId, accountIndex) {
    return ipcRenderer.invoke("platform:triggerAutofill", { platformId: platformId, accountIndex: accountIndex });
  },
});
