import { contextBridge, ipcRenderer } from "electron";
import type {
  IpcApi,
  IpcEvents,
  LogcatEntry,
  DownloadProgress,
  Device,
  WifiPairingInfo,
  DevToolDownloadProgress,
} from "../src/types";

const api: IpcApi = {
  "adb:list-devices": () => ipcRenderer.invoke("adb:list-devices"),
  "adb:connect": (ip, port) => ipcRenderer.invoke("adb:connect", ip, port),
  "adb:pair": (ip, port, code) =>
    ipcRenderer.invoke("adb:pair", ip, port, code),
  "adb:disconnect": (deviceId) =>
    ipcRenderer.invoke("adb:disconnect", deviceId),
  "adb:shell": (deviceId, command) =>
    ipcRenderer.invoke("adb:shell", deviceId, command),
  "adb:install-apk": (deviceId, apkPath) =>
    ipcRenderer.invoke("adb:install-apk", deviceId, apkPath),
  "adb:uninstall": (deviceId, packageName) =>
    ipcRenderer.invoke("adb:uninstall", deviceId, packageName),
  "adb:clear-data": (deviceId, packageName) =>
    ipcRenderer.invoke("adb:clear-data", deviceId, packageName),
  "adb:force-stop": (deviceId, packageName) =>
    ipcRenderer.invoke("adb:force-stop", deviceId, packageName),
  "adb:push": (deviceId, localPath, remotePath) =>
    ipcRenderer.invoke("adb:push", deviceId, localPath, remotePath),
  "adb:pull": (deviceId, remotePath, localPath) =>
    ipcRenderer.invoke("adb:pull", deviceId, remotePath, localPath),
  "adb:screenshot": (deviceId) =>
    ipcRenderer.invoke("adb:screenshot", deviceId),
  "adb:start-recording": (deviceId, options) =>
    ipcRenderer.invoke("adb:start-recording", deviceId, options),
  "adb:stop-recording": (deviceId) =>
    ipcRenderer.invoke("adb:stop-recording", deviceId),
  "adb:reboot": (deviceId, mode) =>
    ipcRenderer.invoke("adb:reboot", deviceId, mode),
  "adb:list-files": (deviceId, path) =>
    ipcRenderer.invoke("adb:list-files", deviceId, path),
  "adb:list-apps": (deviceId, type) =>
    ipcRenderer.invoke("adb:list-apps", deviceId, type),
  "adb:export-apk": (deviceId, packageName, destPath) =>
    ipcRenderer.invoke("adb:export-apk", deviceId, packageName, destPath),
  "adb:export-all-apks": (deviceId, packageName, destDir) =>
    ipcRenderer.invoke("adb:export-all-apks", deviceId, packageName, destDir),
  "adb:install-multiple": (deviceId, apkPaths) =>
    ipcRenderer.invoke("adb:install-multiple", deviceId, apkPaths),
  "adb:get-prop": (deviceId, prop) =>
    ipcRenderer.invoke("adb:get-prop", deviceId, prop),
  "adb:logcat-start": (deviceId, filters) =>
    ipcRenderer.send("adb:logcat-start", deviceId, filters),
  "adb:logcat-stop": (deviceId) =>
    ipcRenderer.send("adb:logcat-stop", deviceId),
  "adb:logcat-clear": (deviceId) =>
    ipcRenderer.invoke("adb:logcat-clear", deviceId),
  "adb:backup": (deviceId, destPath, options) =>
    ipcRenderer.invoke("adb:backup", deviceId, destPath, options),
  "adb:restore": (deviceId, backupPath) =>
    ipcRenderer.invoke("adb:restore", deviceId, backupPath),

  "scrcpy:start": (deviceId, options) =>
    ipcRenderer.invoke("scrcpy:start", deviceId, options),
  "scrcpy:stop": (processId) => ipcRenderer.invoke("scrcpy:stop", processId),
  "scrcpy:is-running": (processId) =>
    ipcRenderer.invoke("scrcpy:is-running", processId),

  "binary:check": () => ipcRenderer.invoke("binary:check"),
  "binary:download": (name) => ipcRenderer.invoke("binary:download", name),
  "binary:download-all": () => ipcRenderer.invoke("binary:download-all"),

  "apk:get-info": (apkPath) => ipcRenderer.invoke("apk:get-info", apkPath),
  "apk:rename-package": (options) =>
    ipcRenderer.invoke("apk:rename-package", options),
  "apk:rename-split-apks": (options) =>
    ipcRenderer.invoke("apk:rename-split-apks", options),

  "device:info": (deviceId) => ipcRenderer.invoke("device:info", deviceId),
  "device:battery": (deviceId) =>
    ipcRenderer.invoke("device:battery", deviceId),
  "device:storage": (deviceId) =>
    ipcRenderer.invoke("device:storage", deviceId),
  "device:save": (device) => ipcRenderer.invoke("device:save", device),
  "device:get-saved": () => ipcRenderer.invoke("device:get-saved"),
  "device:remove-saved": (id) => ipcRenderer.invoke("device:remove-saved", id),

  "shell:open-external": (url) =>
    ipcRenderer.invoke("shell:open-external", url),
  "shell:select-file": (options) =>
    ipcRenderer.invoke("shell:select-file", options),
  "shell:select-save-path": (defaultName, filters) =>
    ipcRenderer.invoke("shell:select-save-path", defaultName, filters),

  "app:get-version": () => ipcRenderer.invoke("app:get-version"),
  "app:get-platform": () => ipcRenderer.invoke("app:get-platform"),
  "app:get-user-data-path": () => ipcRenderer.invoke("app:get-user-data-path"),

  "wifi:start-pairing": () => ipcRenderer.invoke("wifi:start-pairing"),
  "wifi:stop-pairing": () => ipcRenderer.invoke("wifi:stop-pairing"),
  "wifi:get-pairing-info": () => ipcRenderer.invoke("wifi:get-pairing-info"),
  "wifi:manual-pair": (ip, port, code) =>
    ipcRenderer.invoke("wifi:manual-pair", ip, port, code),
  "wifi:connect": (ip, port) => ipcRenderer.invoke("wifi:connect", ip, port),

  "devtools:check": () => ipcRenderer.invoke("devtools:check"),
  "devtools:available": () => ipcRenderer.invoke("devtools:available"),
  "devtools:download": (toolId) =>
    ipcRenderer.invoke("devtools:download", toolId),
  "devtools:launch": (toolId) => ipcRenderer.invoke("devtools:launch", toolId),
  "devtools:stop": (toolId) => ipcRenderer.invoke("devtools:stop", toolId),
};

const events = {
  "logcat:entry": (callback: (entry: LogcatEntry) => void) => {
    const handler = (_: Electron.IpcRendererEvent, entry: LogcatEntry) =>
      callback(entry);
    ipcRenderer.on("logcat:entry", handler);
    return () => ipcRenderer.removeListener("logcat:entry", handler);
  },
  "download:progress": (callback: (progress: DownloadProgress) => void) => {
    const handler = (
      _: Electron.IpcRendererEvent,
      progress: DownloadProgress
    ) => callback(progress);
    ipcRenderer.on("download:progress", handler);
    return () => ipcRenderer.removeListener("download:progress", handler);
  },
  "device:connected": (callback: (device: Device) => void) => {
    const handler = (_: Electron.IpcRendererEvent, device: Device) =>
      callback(device);
    ipcRenderer.on("device:connected", handler);
    return () => ipcRenderer.removeListener("device:connected", handler);
  },
  "device:disconnected": (callback: (deviceId: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, deviceId: string) =>
      callback(deviceId);
    ipcRenderer.on("device:disconnected", handler);
    return () => ipcRenderer.removeListener("device:disconnected", handler);
  },
  "scrcpy:closed": (callback: (processId: number) => void) => {
    const handler = (_: Electron.IpcRendererEvent, processId: number) =>
      callback(processId);
    ipcRenderer.on("scrcpy:closed", handler);
    return () => ipcRenderer.removeListener("scrcpy:closed", handler);
  },
  "wifi:pairing-state": (callback: (info: WifiPairingInfo) => void) => {
    const handler = (_: Electron.IpcRendererEvent, info: WifiPairingInfo) =>
      callback(info);
    ipcRenderer.on("wifi:pairing-state", handler);
    return () => ipcRenderer.removeListener("wifi:pairing-state", handler);
  },
  "wifi:connected": (
    callback: (device: { address: string; port: number }) => void
  ) => {
    const handler = (
      _: Electron.IpcRendererEvent,
      device: { address: string; port: number }
    ) => callback(device);
    ipcRenderer.on("wifi:connected", handler);
    return () => ipcRenderer.removeListener("wifi:connected", handler);
  },
  "devtools:progress": (
    callback: (progress: DevToolDownloadProgress) => void
  ) => {
    const handler = (
      _: Electron.IpcRendererEvent,
      progress: DevToolDownloadProgress
    ) => callback(progress);
    ipcRenderer.on("devtools:progress", handler);
    return () => ipcRenderer.removeListener("devtools:progress", handler);
  },
};

contextBridge.exposeInMainWorld("electronAPI", api);
contextBridge.exposeInMainWorld("electronEvents", events);

declare global {
  interface Window {
    electronAPI: IpcApi;
    electronEvents: typeof events;
  }
}
