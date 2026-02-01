/// <reference types="vite/client" />

interface Window {
    ipcRenderer: {
        send: (channel: string, data: any) => void
        on: (channel: string, func: (...args: any[]) => void) => () => void
        off: (channel: string, func: (...args: any[]) => void) => void
        invoke: (channel: string, ...args: any[]) => Promise<any>
    }
    shell: {
        openExternal: (url: string) => Promise<void>
    }
}
