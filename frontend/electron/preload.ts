import { ipcRenderer, contextBridge, shell } from 'electron'

console.log('Preload script executing...')

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  send(channel: string, data: any) {
    ipcRenderer.send(channel, data)
  },
  on(channel: string, func: (...args: any[]) => void) {
    const subscription = (_event: any, ...args: any[]) => func(...args)
    ipcRenderer.on(channel, subscription)
    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
  off(channel: string, func: (...args: any[]) => void) {
    // Direct off might not work due to wrapping above,
    // but we use the returned disposer now.
    // Keeping this for compatibility if needed, but it's flawed as noted.
    ipcRenderer.removeListener(channel, func as any)
  },
  invoke(channel: string, ...args: any[]) {
    return ipcRenderer.invoke(channel, ...args)
  }
})

// Expose shell API for opening URLs in default browser
contextBridge.exposeInMainWorld('shell', {
  openExternal(url: string) {
    return shell.openExternal(url)
  }
})

console.log('Preload script completed, ipcRenderer and shell exposed to window')
