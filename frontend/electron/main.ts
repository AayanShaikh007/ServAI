import { app, BrowserWindow, ipcMain } from 'electron'
import { spawn } from 'child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

import fs from 'node:fs'

const logFile = path.join(process.env.APP_ROOT, 'electron.log')
function logToFile(msg: string) {
  try {
    fs.appendFileSync(logFile, `${new Date().toISOString()} ${msg}\n`)
  } catch (e) {
    // ignore
  }
}

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

// Disable hardware acceleration to fix GPU tile memory issues
// This prevents visual glitches but may slightly reduce performance
app.disableHardwareAcceleration()

let win: BrowserWindow | null
let pythonProcess: any = null

function createPythonProcess() {
  const isDev = !!VITE_DEV_SERVER_URL
  // In dev: dist-electron/main.js -> ../../backend
  const pythonExecutable = isDev
    ? path.join(process.env.APP_ROOT, '../backend/venv/Scripts/python.exe')
    : path.join(process.resourcesPath, 'backend/venv/Scripts/python.exe')

  const scriptPath = isDev
    ? path.join(process.env.APP_ROOT, '../backend/api.py')
    : path.join(process.resourcesPath, 'backend/api.py')

  console.log('Starting Python backend:', pythonExecutable, scriptPath)
  logToFile(`Starting Python backend: ${pythonExecutable} ${scriptPath}`)

  try {
    pythonProcess = spawn(pythonExecutable, [scriptPath])

    pythonProcess.stdout.on('data', (data: any) => {
      console.log('Python output:', data.toString())
      logToFile(`Python output: ${data.toString()}`)
      // Forward to renderer
      win?.webContents.send('python-message', data.toString())
    })

    pythonProcess.stderr.on('data', (data: any) => {
      console.error('Python error:', data.toString())
      logToFile(`Python error: ${data.toString()}`)
    })

    pythonProcess.on('close', (code: any) => {
      console.log(`Python process exited with code ${code}`)
      logToFile(`Python process exited with code ${code}`)
    })

    pythonProcess.on('error', (err: any) => {
      logToFile(`Python process error: ${err}`)
    })
  } catch (error) {
    console.error('Failed to spawn python process:', error)
    logToFile(`Failed to spawn python process: ${error}`)
  }
}

ipcMain.on('to-python', (_event, data) => {
  if (pythonProcess && pythonProcess.stdin) {
    console.log('Sending to python:', data)
    pythonProcess.stdin.write(JSON.stringify(data) + '\n')
  } else {
    console.error('Python process not ready')
  }
})


function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 700,
    show: false,
    frame: false, // Frameless for custom glass UI
    transparent: false,
    autoHideMenuBar: true,
    backgroundColor: '#1a1a2e', // Solid dark background
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  console.log('Preload path:', path.join(__dirname, 'preload.js'))

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
    win?.show() // Show window after content loads
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // DevTools can be opened manually with Ctrl+Shift+I if needed
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (pythonProcess) {
    pythonProcess.kill()
  }
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()
  createPythonProcess()
})
