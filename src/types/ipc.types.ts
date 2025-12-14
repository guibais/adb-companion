import type {
  Device,
  DeviceInfo,
  BatteryInfo,
  StorageInfo,
  SavedDevice,
} from "./device.types";
import type { InstalledApp, ApkInfo, ApkRenameOptions } from "./app.types";
import type { FileEntry } from "./file.types";

export type LogLevel = "V" | "D" | "I" | "W" | "E" | "F";

export type LogcatFilter = {
  level?: LogLevel;
  tag?: string;
  packageName?: string;
  search?: string;
};

export type LogcatEntry = {
  timestamp: string;
  pid: number;
  tid: number;
  level: LogLevel;
  tag: string;
  message: string;
};

export type ScrcpyOptions = {
  maxSize?: number;
  bitRate?: number;
  maxFps?: number;
  noAudio?: boolean;
  videoCodec?: "h264" | "h265";
  record?: string;
  showTouches?: boolean;
  stayAwake?: boolean;
  turnScreenOff?: boolean;
  fullscreen?: boolean;
  borderless?: boolean;
  alwaysOnTop?: boolean;
  windowTitle?: string;
  rotation?: 0 | 1 | 2 | 3;
  crop?: string;
  display?: number;
  videoSource?: "display" | "camera";
  cameraFacing?: "front" | "back";
};

export type BinaryInfo = {
  name: string;
  version: string;
  isInstalled: boolean;
  path?: string;
  size?: number;
};

export type BinaryStatus = {
  platformTools: BinaryInfo;
  scrcpy: BinaryInfo;
  java: BinaryInfo;
  apktool: BinaryInfo;
  uberApkSigner: BinaryInfo;
};

export type DownloadProgress = {
  name: string;
  version: string;
  totalBytes: number;
  downloadedBytes: number;
  percentage: number;
  speed: number;
  eta: number;
  status: "pending" | "downloading" | "extracting" | "completed" | "failed";
  error?: string;
};

export type WifiPairingState =
  | "idle"
  | "waiting"
  | "pairing"
  | "paired"
  | "error";

export type WifiPairingInfo = {
  name: string;
  password: string;
  qrCodeDataUrl: string;
  state: WifiPairingState;
  error?: string;
  device?: {
    address: string;
    port: number;
  };
};

export type IpcApi = {
  "adb:list-devices": () => Promise<Device[]>;
  "adb:connect": (ip: string, port: number) => Promise<boolean>;
  "adb:pair": (ip: string, port: number, code: string) => Promise<boolean>;
  "adb:disconnect": (deviceId: string) => Promise<void>;
  "adb:shell": (deviceId: string, command: string) => Promise<string>;
  "adb:install-apk": (deviceId: string, apkPath: string) => Promise<void>;
  "adb:uninstall": (deviceId: string, packageName: string) => Promise<void>;
  "adb:clear-data": (deviceId: string, packageName: string) => Promise<void>;
  "adb:force-stop": (deviceId: string, packageName: string) => Promise<void>;
  "adb:push": (
    deviceId: string,
    localPath: string,
    remotePath: string
  ) => Promise<void>;
  "adb:pull": (
    deviceId: string,
    remotePath: string,
    localPath: string
  ) => Promise<void>;
  "adb:screenshot": (deviceId: string) => Promise<string>;
  "adb:start-recording": (
    deviceId: string,
    options?: { duration?: number; bitRate?: number }
  ) => Promise<void>;
  "adb:stop-recording": (deviceId: string) => Promise<string>;
  "adb:reboot": (
    deviceId: string,
    mode: "normal" | "recovery" | "bootloader" | "fastboot"
  ) => Promise<void>;
  "adb:list-files": (deviceId: string, path: string) => Promise<FileEntry[]>;
  "adb:list-apps": (
    deviceId: string,
    type: "user" | "system" | "all"
  ) => Promise<InstalledApp[]>;
  "adb:export-apk": (
    deviceId: string,
    packageName: string,
    destPath: string
  ) => Promise<string>;
  "adb:export-all-apks": (
    deviceId: string,
    packageName: string,
    destDir: string
  ) => Promise<string[]>;
  "adb:install-multiple": (
    deviceId: string,
    apkPaths: string[]
  ) => Promise<void>;
  "adb:get-prop": (deviceId: string, prop: string) => Promise<string>;
  "adb:logcat-start": (deviceId: string, filters?: LogcatFilter) => void;
  "adb:logcat-stop": (deviceId: string) => void;
  "adb:logcat-clear": (deviceId: string) => Promise<void>;
  "adb:backup": (
    deviceId: string,
    destPath: string,
    options?: {
      apk?: boolean;
      shared?: boolean;
      system?: boolean;
      all?: boolean;
    }
  ) => Promise<void>;
  "adb:restore": (deviceId: string, backupPath: string) => Promise<void>;

  "scrcpy:start": (
    deviceId: string,
    options?: ScrcpyOptions
  ) => Promise<number>;
  "scrcpy:stop": (processId: number) => Promise<void>;
  "scrcpy:is-running": (processId: number) => Promise<boolean>;

  "binary:check": () => Promise<BinaryStatus>;
  "binary:download": (name: string) => Promise<void>;
  "binary:download-all": () => Promise<void>;

  "apk:get-info": (apkPath: string) => Promise<ApkInfo>;
  "apk:rename-package": (options: ApkRenameOptions) => Promise<string>;
  "apk:rename-split-apks": (options: {
    apkPaths: string[];
    newPackageName: string;
    newAppName?: string;
  }) => Promise<string[]>;

  "device:info": (deviceId: string) => Promise<DeviceInfo>;
  "device:battery": (deviceId: string) => Promise<BatteryInfo>;
  "device:storage": (deviceId: string) => Promise<StorageInfo>;
  "device:save": (device: SavedDevice) => Promise<void>;
  "device:get-saved": () => Promise<SavedDevice[]>;
  "device:remove-saved": (id: string) => Promise<void>;

  "shell:open-external": (url: string) => Promise<void>;
  "shell:select-file": (options?: {
    filters?: { name: string; extensions: string[] }[];
    directory?: boolean;
  }) => Promise<string | null>;
  "shell:select-save-path": (
    defaultName: string,
    filters?: { name: string; extensions: string[] }[]
  ) => Promise<string | null>;
  "shell:write-temp-file": (
    fileName: string,
    bytes: number[]
  ) => Promise<string>;

  "app:get-version": () => Promise<string>;
  "app:get-platform": () => Promise<NodeJS.Platform>;
  "app:get-user-data-path": () => Promise<string>;

  "wifi:start-pairing": () => Promise<WifiPairingInfo>;
  "wifi:stop-pairing": () => Promise<void>;
  "wifi:get-pairing-info": () => Promise<WifiPairingInfo | null>;
  "wifi:manual-pair": (
    ip: string,
    port: number,
    code: string
  ) => Promise<boolean>;
  "wifi:connect": (ip: string, port: number) => Promise<boolean>;

  "devtools:check": () => Promise<DevToolInfo[]>;
  "devtools:available": () => Promise<DevToolConfig[]>;
  "devtools:download": (toolId: string) => Promise<void>;
  "devtools:launch": (toolId: string) => Promise<void>;
  "devtools:stop": (toolId: string) => Promise<void>;
};

export type DevToolInfo = {
  id: string;
  name: string;
  description: string;
  version: string;
  isInstalled: boolean;
  isRunning: boolean;
  path?: string;
};

export type DevToolConfig = {
  id: string;
  name: string;
  description: string;
  version: string;
};

export type DevToolDownloadProgress = {
  id: string;
  name: string;
  totalBytes: number;
  downloadedBytes: number;
  percentage: number;
  speed: number;
  status: "downloading" | "extracting" | "completed" | "failed";
  error?: string;
};

export type IpcEvents = {
  "logcat:entry": (entry: LogcatEntry) => void;
  "download:progress": (progress: DownloadProgress) => void;
  "device:connected": (device: Device) => void;
  "device:disconnected": (deviceId: string) => void;
  "scrcpy:closed": (processId: number) => void;
  "wifi:pairing-state": (info: WifiPairingInfo) => void;
  "wifi:connected": (device: { address: string; port: number }) => void;
  "devtools:progress": (progress: DevToolDownloadProgress) => void;
};
