import { app } from "electron";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import type {
  DeviceInfo,
  BatteryInfo,
  StorageInfo,
  SavedDevice,
} from "../../../src/types/device.types";
import { AdbService } from "./adb.service";

export class DeviceService {
  private adb: AdbService;
  private savedDevicesPath: string = "";

  constructor() {
    this.adb = new AdbService();
    this.savedDevicesPath = join(
      app.getPath("userData"),
      "devices",
      "saved-devices.json"
    );
  }

  async getDeviceInfo(deviceId: string): Promise<DeviceInfo> {
    const getProp = async (prop: string): Promise<string> => {
      try {
        return (await this.adb.getProp(deviceId, prop)).trim();
      } catch {
        return "";
      }
    };

    const props = await Promise.all([
      getProp("ro.product.model"),
      getProp("ro.product.manufacturer"),
      getProp("ro.product.brand"),
      getProp("ro.product.device"),
      getProp("ro.product.name"),
      getProp("ro.build.version.release"),
      getProp("ro.build.version.sdk"),
      getProp("ro.build.version.security_patch"),
      getProp("ro.build.display.id"),
      getProp("ro.product.cpu.abi"),
      getProp("ro.serialno"),
    ]);

    let screenResolution = "";
    let screenDensity = 0;
    let totalMemory = 0;

    try {
      const wmSize = await this.adb.shell(deviceId, "wm size");
      const sizeMatch = wmSize.match(/Physical size: (\d+x\d+)/);
      if (sizeMatch) screenResolution = sizeMatch[1];

      const wmDensity = await this.adb.shell(deviceId, "wm density");
      const densityMatch = wmDensity.match(/Physical density: (\d+)/);
      if (densityMatch) screenDensity = parseInt(densityMatch[1], 10);
    } catch {}

    return {
      model: props[0],
      manufacturer: props[1],
      brand: props[2],
      device: props[3],
      product: props[4],
      androidVersion: props[5],
      sdkVersion: parseInt(props[6], 10) || 0,
      securityPatch: props[7],
      buildNumber: props[8],
      screenResolution,
      screenDensity,
      cpuAbi: props[9],
      totalMemory,
      serialNumber: props[10],
    };
  }

  async getBatteryInfo(deviceId: string): Promise<BatteryInfo> {
    const output = await this.adb.shell(deviceId, "dumpsys battery");

    const level = parseInt(output.match(/level: (\d+)/)?.[1] || "0", 10);
    const statusCode = parseInt(output.match(/status: (\d+)/)?.[1] || "0", 10);
    const pluggedCode = parseInt(
      output.match(/plugged: (\d+)/)?.[1] || "0",
      10
    );
    const temperature =
      parseInt(output.match(/temperature: (\d+)/)?.[1] || "0", 10) / 10;
    const voltage = parseInt(output.match(/voltage: (\d+)/)?.[1] || "0", 10);

    const statusMap: Record<number, BatteryInfo["status"]> = {
      2: "charging",
      3: "discharging",
      4: "not_charging",
      5: "full",
    };

    const pluggedMap: Record<number, BatteryInfo["plugged"]> = {
      0: "none",
      1: "ac",
      2: "usb",
      4: "wireless",
    };

    return {
      level,
      status: statusMap[statusCode] || "unknown",
      plugged: pluggedMap[pluggedCode] || "none",
      temperature,
      voltage,
      health: "Good",
    };
  }

  async getStorageInfo(deviceId: string): Promise<StorageInfo> {
    const output = await this.adb.shell(deviceId, "df /data | tail -1");
    const parts = output.split(/\s+/);

    if (parts.length >= 4) {
      const total = parseInt(parts[1], 10) * 1024;
      const used = parseInt(parts[2], 10) * 1024;
      const free = parseInt(parts[3], 10) * 1024;
      return {
        total,
        used,
        free,
        percentage: Math.round((used / total) * 100),
      };
    }

    return { total: 0, used: 0, free: 0, percentage: 0 };
  }

  async saveDevice(device: SavedDevice): Promise<void> {
    const devices = await this.getSavedDevices();
    const idx = devices.findIndex((d) => d.id === device.id);
    if (idx >= 0) devices[idx] = device;
    else devices.push(device);
    this.writeSavedDevices(devices);
  }

  async getSavedDevices(): Promise<SavedDevice[]> {
    if (!existsSync(this.savedDevicesPath)) return [];
    try {
      return JSON.parse(readFileSync(this.savedDevicesPath, "utf-8"));
    } catch {
      return [];
    }
  }

  async removeSavedDevice(id: string): Promise<void> {
    const devices = await this.getSavedDevices();
    this.writeSavedDevices(devices.filter((d) => d.id !== id));
  }

  private writeSavedDevices(devices: SavedDevice[]): void {
    const dir = join(app.getPath("userData"), "devices");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(this.savedDevicesPath, JSON.stringify(devices, null, 2));
  }
}
