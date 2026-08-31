import { contextBridge, ipcRenderer } from 'electron';

// Expose native desktop APIs to the React web app securely via the context bridge
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  getAppVersion: () => process.env.npm_package_version || '1.0.0',
});
