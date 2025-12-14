import { ipcMain, dialog, shell, app } from "electron";
import { join } from "path";
import { mkdirSync, writeFileSync } from "fs";
import type { AdbService } from "./services/adb.service";
import type { ScrcpyService } from "./services/scrcpy.service";
import type { BinaryManagerService } from "./services/binary-manager.service";
import type { DeviceService } from "./services/device.service";
import type { ApkToolsService } from "./services/apk-tools.service";
import type { WifiPairingService } from "./services/wifi-pairing.service";
import type { DevToolsService } from "./services/dev-tools.service";
import { getMainWindow } from "./index";

type Services = {
  adb: AdbService;
  scrcpy: ScrcpyService;
  binaryManager: BinaryManagerService;
  device: DeviceService;
  apkTools: ApkToolsService;
  wifiPairing: WifiPairingService;
  devTools: DevToolsService;
};

export function registerIpcHandlers(services: Services) {
  ipcMain.handle("adb:list-devices", () => services.adb.listDevices());
  ipcMain.handle("adb:connect", (_, ip: string, port: number) =>
    services.adb.connect(ip, port)
  );
  ipcMain.handle("adb:pair", (_, ip: string, port: number, code: string) =>
    services.adb.pair(ip, port, code)
  );
  ipcMain.handle("adb:disconnect", (_, deviceId: string) =>
    services.adb.disconnect(deviceId)
  );
  ipcMain.handle("adb:shell", (_, deviceId: string, command: string) =>
    services.adb.shell(deviceId, command)
  );
  ipcMain.handle("adb:install-apk", (_, deviceId: string, apkPath: string) =>
    services.adb.installApk(deviceId, apkPath)
  );
  ipcMain.handle("adb:uninstall", (_, deviceId: string, packageName: string) =>
    services.adb.uninstall(deviceId, packageName)
  );
  ipcMain.handle("adb:clear-data", (_, deviceId: string, packageName: string) =>
    services.adb.clearData(deviceId, packageName)
  );
  ipcMain.handle("adb:force-stop", (_, deviceId: string, packageName: string) =>
    services.adb.forceStop(deviceId, packageName)
  );
  ipcMain.handle(
    "adb:push",
    (_, deviceId: string, localPath: string, remotePath: string) =>
      services.adb.push(deviceId, localPath, remotePath)
  );
  ipcMain.handle(
    "adb:pull",
    (_, deviceId: string, remotePath: string, localPath: string) =>
      services.adb.pull(deviceId, remotePath, localPath)
  );
  ipcMain.handle("adb:screenshot", (_, deviceId: string) =>
    services.adb.screenshot(deviceId)
  );
  ipcMain.handle(
    "adb:start-recording",
    (_, deviceId: string, options?: { duration?: number; bitRate?: number }) =>
      services.adb.startRecording(deviceId, options)
  );
  ipcMain.handle("adb:stop-recording", (_, deviceId: string) =>
    services.adb.stopRecording(deviceId)
  );
  ipcMain.handle(
    "adb:reboot",
    (
      _,
      deviceId: string,
      mode: "normal" | "recovery" | "bootloader" | "fastboot"
    ) => services.adb.reboot(deviceId, mode)
  );
  ipcMain.handle("adb:list-files", (_, deviceId: string, path: string) =>
    services.adb.listFiles(deviceId, path)
  );
  ipcMain.handle(
    "adb:list-apps",
    (_, deviceId: string, type: "user" | "system" | "all") =>
      services.adb.listApps(deviceId, type)
  );
  ipcMain.handle(
    "adb:export-apk",
    (_, deviceId: string, packageName: string, destPath: string) =>
      services.adb.exportApk(deviceId, packageName, destPath)
  );
  ipcMain.handle(
    "adb:export-all-apks",
    (_, deviceId: string, packageName: string, destDir: string) =>
      services.adb.exportAllApks(deviceId, packageName, destDir)
  );
  ipcMain.handle(
    "adb:install-multiple",
    (_, deviceId: string, apkPaths: string[]) =>
      services.adb.installMultipleApks(deviceId, apkPaths)
  );
  ipcMain.handle("adb:get-prop", (_, deviceId: string, prop: string) =>
    services.adb.getProp(deviceId, prop)
  );
  ipcMain.handle("adb:logcat-clear", (_, deviceId: string) =>
    services.adb.logcatClear(deviceId)
  );
  ipcMain.handle(
    "adb:backup",
    (
      _,
      deviceId: string,
      destPath: string,
      options?: {
        apk?: boolean;
        shared?: boolean;
        system?: boolean;
        all?: boolean;
      }
    ) => services.adb.backup(deviceId, destPath, options)
  );
  ipcMain.handle("adb:restore", (_, deviceId: string, backupPath: string) =>
    services.adb.restore(deviceId, backupPath)
  );

  ipcMain.on(
    "adb:logcat-start",
    (
      _,
      deviceId: string,
      filters?: {
        level?: string;
        tag?: string;
        packageName?: string;
        search?: string;
      }
    ) => {
      services.adb.logcatStart(deviceId, filters, (entry) => {
        getMainWindow()?.webContents.send("logcat:entry", entry);
      });
    }
  );
  ipcMain.on("adb:logcat-stop", (_, deviceId: string) =>
    services.adb.logcatStop(deviceId)
  );

  ipcMain.handle(
    "scrcpy:start",
    (_, deviceId: string, options?: Record<string, unknown>) =>
      services.scrcpy.start(deviceId, options)
  );
  ipcMain.handle("scrcpy:stop", (_, processId: number) =>
    services.scrcpy.stop(processId)
  );
  ipcMain.handle("scrcpy:is-running", (_, processId: number) =>
    services.scrcpy.isRunning(processId)
  );

  ipcMain.handle("binary:check", () => services.binaryManager.checkBinaries());
  ipcMain.handle("binary:download", async (_, name: string) => {
    await services.binaryManager.downloadBinary(name);
  });
  ipcMain.handle("binary:download-all", async () => {
    await services.binaryManager.downloadAllBinaries();
  });

  ipcMain.handle("apk:get-info", (_, apkPath: string) =>
    services.apkTools.getApkInfo(apkPath)
  );
  ipcMain.handle(
    "apk:rename-package",
    (
      _,
      options: { apkPath: string; newPackageName: string; newAppName?: string }
    ) => services.apkTools.renamePackage(options)
  );
  ipcMain.handle(
    "apk:rename-split-apks",
    (
      _,
      options: {
        apkPaths: string[];
        newPackageName: string;
        newAppName?: string;
      }
    ) => services.apkTools.renameSplitApks(options)
  );

  ipcMain.handle("device:info", (_, deviceId: string) =>
    services.device.getDeviceInfo(deviceId)
  );
  ipcMain.handle("device:battery", (_, deviceId: string) =>
    services.device.getBatteryInfo(deviceId)
  );
  ipcMain.handle("device:storage", (_, deviceId: string) =>
    services.device.getStorageInfo(deviceId)
  );
  ipcMain.handle(
    "device:save",
    (
      _,
      device: {
        id: string;
        nickname: string;
        ipAddress: string;
        port: number;
        lastConnected: number;
      }
    ) => services.device.saveDevice(device)
  );
  ipcMain.handle("device:get-saved", () => services.device.getSavedDevices());
  ipcMain.handle("device:remove-saved", (_, id: string) =>
    services.device.removeSavedDevice(id)
  );

  ipcMain.handle("shell:open-external", (_, url: string) =>
    shell.openExternal(url)
  );
  ipcMain.handle(
    "shell:select-file",
    async (
      _,
      options?: {
        filters?: { name: string; extensions: string[] }[];
        directory?: boolean;
      }
    ) => {
      const result = await dialog.showOpenDialog({
        properties: options?.directory ? ["openDirectory"] : ["openFile"],
        filters: options?.filters,
      });
      return result.canceled ? null : result.filePaths[0];
    }
  );
  ipcMain.handle(
    "shell:select-save-path",
    async (
      _,
      defaultName: string,
      filters?: { name: string; extensions: string[] }[]
    ) => {
      const result = await dialog.showSaveDialog({
        defaultPath: defaultName,
        filters,
      });
      return result.canceled ? null : result.filePath;
    }
  );

  ipcMain.handle(
    "shell:write-temp-file",
    async (_, fileName: string, bytes: number[]) => {
      const dir = join(app.getPath("temp"), "adb-companion", "uploads");
      mkdirSync(dir, { recursive: true });
      const safeName = `${Date.now()}-${fileName}`;
      const filePath = join(dir, safeName);
      writeFileSync(filePath, Buffer.from(bytes));
      return filePath;
    }
  );

  ipcMain.handle("app:get-version", () => app.getVersion());
  ipcMain.handle("app:get-platform", () => process.platform);
  ipcMain.handle("app:get-user-data-path", () => app.getPath("userData"));

  ipcMain.handle("wifi:start-pairing", async () => {
    const info = await services.wifiPairing.startPairing();
    return info;
  });

  ipcMain.handle("wifi:stop-pairing", () => {
    services.wifiPairing.stopPairing();
  });

  ipcMain.handle("wifi:get-pairing-info", () => {
    return services.wifiPairing.getPairingInfo();
  });

  ipcMain.handle(
    "wifi:manual-pair",
    (_, ip: string, port: number, code: string) =>
      services.wifiPairing.manualPair(ip, port, code)
  );

  ipcMain.handle("wifi:connect", (_, ip: string, port: number) =>
    services.wifiPairing.connect(ip, port)
  );

  services.wifiPairing.on("state-change", (info) => {
    getMainWindow()?.webContents.send("wifi:pairing-state", info);
  });

  services.wifiPairing.on("connected", (device) => {
    getMainWindow()?.webContents.send("wifi:connected", device);
  });

  ipcMain.handle("devtools:check", () => services.devTools.checkTools());
  ipcMain.handle("devtools:available", () =>
    services.devTools.getAvailableTools()
  );
  ipcMain.handle("devtools:download", async (_, toolId: string) => {
    services.devTools.setProgressCallback((progress) => {
      getMainWindow()?.webContents.send("devtools:progress", progress);
    });
    await services.devTools.downloadTool(toolId);
  });
  ipcMain.handle("devtools:launch", (_, toolId: string) =>
    services.devTools.launchTool(toolId)
  );
  ipcMain.handle("devtools:stop", (_, toolId: string) =>
    services.devTools.stopTool(toolId)
  );
}
