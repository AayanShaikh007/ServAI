import { app, ipcMain, BrowserWindow } from "electron";
import { spawn } from "child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const logFile = path.join(process.env.APP_ROOT, "electron.log");
function logToFile(msg) {
  try {
    fs.appendFileSync(logFile, `${(/* @__PURE__ */ new Date()).toISOString()} ${msg}
`);
  } catch (e) {
  }
}
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
app.disableHardwareAcceleration();
let win;
let pythonProcess = null;
function createPythonProcess() {
  const isDev = !!VITE_DEV_SERVER_URL;
  const pythonExecutable = isDev ? path.join(process.env.APP_ROOT, "../backend/venv/Scripts/python.exe") : path.join(process.resourcesPath, "backend/venv/Scripts/python.exe");
  const scriptPath = isDev ? path.join(process.env.APP_ROOT, "../backend/api.py") : path.join(process.resourcesPath, "backend/api.py");
  console.log("Starting Python backend:", pythonExecutable, scriptPath);
  logToFile(`Starting Python backend: ${pythonExecutable} ${scriptPath}`);
  try {
    pythonProcess = spawn(pythonExecutable, [scriptPath]);
    pythonProcess.stdout.on("data", (data) => {
      console.log("Python output:", data.toString());
      logToFile(`Python output: ${data.toString()}`);
      win == null ? void 0 : win.webContents.send("python-message", data.toString());
    });
    pythonProcess.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
      logToFile(`Python error: ${data.toString()}`);
    });
    pythonProcess.on("close", (code) => {
      console.log(`Python process exited with code ${code}`);
      logToFile(`Python process exited with code ${code}`);
    });
    pythonProcess.on("error", (err) => {
      logToFile(`Python process error: ${err}`);
    });
  } catch (error) {
    console.error("Failed to spawn python process:", error);
    logToFile(`Failed to spawn python process: ${error}`);
  }
}
ipcMain.on("to-python", (_event, data) => {
  if (pythonProcess && pythonProcess.stdin) {
    console.log("Sending to python:", data);
    pythonProcess.stdin.write(JSON.stringify(data) + "\n");
  } else {
    console.error("Python process not ready");
  }
});
ipcMain.on("window-minimize", () => {
  win == null ? void 0 : win.minimize();
});
ipcMain.on("window-close", () => {
  win == null ? void 0 : win.close();
});
ipcMain.on("window-toggle-fullscreen", () => {
  if (win) {
    win.setFullScreen(!win.isFullScreen());
  }
});
function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 700,
    show: false,
    frame: false,
    // Frameless for custom glass UI
    transparent: false,
    autoHideMenuBar: true,
    backgroundColor: "#1a1a2e",
    // Solid dark background
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  console.log("Preload path:", path.join(__dirname$1, "preload.js"));
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
    win == null ? void 0 : win.show();
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  createWindow();
  createPythonProcess();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
