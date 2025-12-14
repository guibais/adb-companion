import { app, BrowserWindow, shell, ipcMain, dialog } from "electron";
import { join } from "path";
import { AdbService } from "./services/adb.service";
import { ScrcpyService } from "./services/scrcpy.service";
import { BinaryManagerService } from "./services/binary-manager.service";
import { DeviceService } from "./services/device.service";
import { ApkToolsService } from "./services/apk-tools.service";
import { WifiPairingService } from "./services/wifi-pairing.service";
import { DevToolsService } from "./services/dev-tools.service";
import { registerIpcHandlers } from "./ipc-handlers";

process.env.DIST_ELECTRON = join(__dirname, "..");
process.env.DIST = join(process.env.DIST_ELECTRON, "../dist");
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, "../public")
  : process.env.DIST;

app.setName("ADB Companion");

let mainWindow: BrowserWindow | null = null;

const preload = join(__dirname, "../preload/index.js");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, "index.html");

export const binaryManager = new BinaryManagerService();
const adbService = new AdbService();

export const services = {
  adb: adbService,
  scrcpy: new ScrcpyService(),
  binaryManager,
  device: new DeviceService(),
  apkTools: new ApkToolsService(),
  wifiPairing: new WifiPairingService(() => adbService.getAdbPath()),
  devTools: new DevToolsService(),
};

async function createWindow() {
  mainWindow = new BrowserWindow({
    title: "ADB Companion",
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    titleBarOverlay:
      process.platform === "win32" || process.platform === "linux"
        ? {
            color: "#0f0f0f",
            symbolColor: "#d4d4d8",
            height: 56,
          }
        : undefined,
    backgroundColor: "#0f0f0f",
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:") || url.startsWith("http:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(url!);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(indexHtml);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

app.whenReady().then(async () => {
  await services.binaryManager.initialize();

  registerIpcHandlers(services);

  const win = await createWindow();
  services.binaryManager.setMainWindow(win);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().then((w) => services.binaryManager.setMainWindow(w));
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", async () => {
  await services.scrcpy.stopAll();
  await services.adb.killServer();
});

export function getMainWindow() {
  return mainWindow;
}
