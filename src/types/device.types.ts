export type DeviceConnectionType = "usb" | "wifi";
export type DeviceStatus =
  | "connected"
  | "disconnected"
  | "unauthorized"
  | "offline"
  | "pairing";

export type Device = {
  id: string;
  serial: string;
  model: string;
  manufacturer: string;
  androidVersion: string;
  sdkVersion: number;
  connectionType: DeviceConnectionType;
  status: DeviceStatus;
  ipAddress?: string;
  port?: number;
  nickname?: string;
  lastConnected?: number;
};

export type DeviceInfo = {
  model: string;
  manufacturer: string;
  brand: string;
  device: string;
  product: string;
  androidVersion: string;
  sdkVersion: number;
  securityPatch: string;
  buildNumber: string;
  screenResolution: string;
  screenDensity: number;
  cpuAbi: string;
  totalMemory: number;
  serialNumber: string;
};

export type BatteryInfo = {
  level: number;
  status: "charging" | "discharging" | "full" | "not_charging" | "unknown";
  plugged: "ac" | "usb" | "wireless" | "none";
  temperature: number;
  voltage: number;
  health: string;
};

export type StorageInfo = {
  total: number;
  used: number;
  free: number;
  percentage: number;
};

export type SavedDevice = {
  id: string;
  nickname: string;
  ipAddress: string;
  port: number;
  lastConnected: number;
};
