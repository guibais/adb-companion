import type {
  IpcApi,
  LogcatEntry,
  DownloadProgress,
  Device,
  WifiPairingInfo,
  DevToolDownloadProgress,
} from "./types";

type ElectronEvents = {
  "logcat:entry": (callback: (entry: LogcatEntry) => void) => () => void;
  "download:progress": (
    callback: (progress: DownloadProgress) => void
  ) => () => void;
  "device:connected": (callback: (device: Device) => void) => () => void;
  "device:disconnected": (callback: (deviceId: string) => void) => () => void;
  "scrcpy:closed": (callback: (processId: number) => void) => () => void;
  "wifi:pairing-state": (
    callback: (info: WifiPairingInfo) => void
  ) => () => void;
  "wifi:connected": (
    callback: (device: { address: string; port: number }) => void
  ) => () => void;
  "devtools:progress": (
    callback: (progress: DevToolDownloadProgress) => void
  ) => () => void;
};

declare global {
  interface Window {
    electronAPI: IpcApi;
    electronEvents: ElectronEvents;
  }
}

export {};
