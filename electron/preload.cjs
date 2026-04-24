'use strict';
/**
 * Electron Preload Script — CJS format required (see main.cjs for why)
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getApiPort:   () => ipcRenderer.invoke('get-api-port'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  isElectron:   true,
});
