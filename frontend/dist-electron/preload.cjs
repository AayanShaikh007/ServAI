"use strict";
const electron = require("electron");
console.log("Preload script executing...");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  send(channel, data) {
    electron.ipcRenderer.send(channel, data);
  },
  on(channel, func) {
    const subscription = (_event, ...args) => func(...args);
    electron.ipcRenderer.on(channel, subscription);
    return () => {
      electron.ipcRenderer.removeListener(channel, subscription);
    };
  },
  off(channel, func) {
    electron.ipcRenderer.removeListener(channel, func);
  },
  invoke(channel, ...args) {
    return electron.ipcRenderer.invoke(channel, ...args);
  }
});
electron.contextBridge.exposeInMainWorld("shell", {
  openExternal(url) {
    return electron.shell.openExternal(url);
  }
});
console.log("Preload script completed, ipcRenderer and shell exposed to window");
