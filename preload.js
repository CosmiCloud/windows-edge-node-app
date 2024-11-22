const { contextBridge, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    console.log('Preload script loaded');
});

// Expose ipcRenderer to the renderer process in a secure manner
contextBridge.exposeInMainWorld('api', {
    // Define methods to interact with IPC
    invoke: (channel, data) => ipcRenderer.invoke(channel, data),
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    info: (message) => log.info(message),
    error: (message) => log.error(message),
    warn: (message) => log.warn(message)
});
