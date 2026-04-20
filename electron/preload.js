/**
 * Electron Preload Script
 * Runs in the renderer process with Node access before the page loads.
 * Exposes a safe, constrained API to the renderer via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /** Get the dynamically assigned API server port */
  getApiPort: () => ipcRenderer.invoke('get-api-port'),

  /** Open a URL in the system browser */
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  /** Whether we're running inside Electron */
  isElectron: true,
});
