import { spawn, execSync, ChildProcess } from "child_process";
import { join } from "path";
import { app } from "electron";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import type {
  Device,
  DeviceConnectionType,
  DeviceStatus,
} from "../../src/types/device.types";
import type { InstalledApp } from "../../src/types/app.types";
import type { FileEntry, FileType } from "../../src/types/file.types";
import type { LogcatEntry, LogLevel } from "../../src/types/ipc.types";

export class AdbService {
  private adbPath: string = "";
  private logcatProcesses: Map<string, ChildProcess> = new Map();
  private recordingProcesses: Map<
    string,
    { process: ChildProcess; remotePath: string }
  > = new Map();
  private serverInitialized = false;

  getAdbPath(): string {
    if (this.adbPath) return this.adbPath;

    const userDataPath = app.getPath("userData");
    const platformToolsPath = join(userDataPath, "binaries", "platform-tools");
    const adbName = process.platform === "win32" ? "adb.exe" : "adb";
    const localPath = join(platformToolsPath, adbName);

    if (existsSync(localPath)) {
      this.adbPath = localPath;
      return this.adbPath;
    }

    try {
      const systemAdb = execSync("which adb", { encoding: "utf-8" }).trim();
      if (systemAdb) {
        this.adbPath = systemAdb;
        return this.adbPath;
      }
    } catch {}

    return "adb";
  }

  private exec(args: string[], deviceId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const adbArgs = deviceId ? ["-s", deviceId, ...args] : args;
      const adb = spawn(this.getAdbPath(), adbArgs);

      let stdout = "";
      let stderr = "";

      adb.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      adb.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      adb.on("close", (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(stderr || `ADB exited with code ${code}`));
        }
      });

      adb.on("error", reject);
    });
  }

  private async ensureServerReady(): Promise<void> {
    if (this.serverInitialized) return;

    try {
      if (process.platform === "darwin" || process.platform === "linux") {
        execSync("killall -9 adb 2>/dev/null || true", { stdio: "ignore" });
        execSync("lsof -ti :5037 | xargs kill -9 2>/dev/null || true", {
          stdio: "ignore",
        });
      } else if (process.platform === "win32") {
        execSync("taskkill /F /IM adb.exe 2>nul || exit 0", {
          stdio: "ignore",
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch {}

    this.serverInitialized = true;
  }

  async listDevices(): Promise<Device[]> {
    await this.ensureServerReady();
    const output = await this.exec(["devices", "-l"]);
    const lines = output
      .split("\n")
      .slice(1)
      .filter((line) => line.trim());

    const devices: Device[] = [];

    for (const line of lines) {
      const parts = line.split(/\s+/);
      const serial = parts[0];
      const statusStr = parts[1];

      if (!serial || serial === "*") continue;

      const statusMap: Record<string, DeviceStatus> = {
        device: "connected",
        offline: "offline",
        unauthorized: "unauthorized",
        "no permissions": "unauthorized",
      };

      const status = statusMap[statusStr] || "disconnected";
      const isWifi = serial.includes(":");
      const connectionType: DeviceConnectionType = isWifi ? "wifi" : "usb";

      let model = "Unknown";
      let manufacturer = "Unknown";
      let androidVersion = "";
      let sdkVersion = 0;

      const modelMatch = line.match(/model:(\S+)/);
      if (modelMatch) model = modelMatch[1].replace(/_/g, " ");

      if (status === "connected") {
        try {
          const props = await this.exec(["shell", "getprop"], serial);
          const manufacturerMatch = props.match(
            /\[ro\.product\.manufacturer\]: \[([^\]]+)\]/
          );
          const versionMatch = props.match(
            /\[ro\.build\.version\.release\]: \[([^\]]+)\]/
          );
          const sdkMatch = props.match(
            /\[ro\.build\.version\.sdk\]: \[([^\]]+)\]/
          );

          if (manufacturerMatch) manufacturer = manufacturerMatch[1];
          if (versionMatch) androidVersion = versionMatch[1];
          if (sdkMatch) sdkVersion = parseInt(sdkMatch[1], 10);
        } catch {}
      }

      devices.push({
        id: serial,
        serial,
        model,
        manufacturer,
        androidVersion,
        sdkVersion,
        connectionType,
        status,
        ipAddress: isWifi ? serial.split(":")[0] : undefined,
        port: isWifi ? parseInt(serial.split(":")[1], 10) : undefined,
      });
    }

    return devices;
  }

  async connect(ip: string, port: number): Promise<boolean> {
    try {
      const output = await this.exec(["connect", `${ip}:${port}`]);
      return output.includes("connected");
    } catch {
      return false;
    }
  }

  async pair(ip: string, port: number, code: string): Promise<boolean> {
    try {
      const output = await this.exec(["pair", `${ip}:${port}`, code]);
      return output.includes("Successfully paired");
    } catch {
      return false;
    }
  }

  async disconnect(deviceId: string): Promise<void> {
    await this.exec(["disconnect", deviceId]);
  }

  async shell(deviceId: string, command: string): Promise<string> {
    return this.exec(["shell", command], deviceId);
  }

  async installApk(deviceId: string, apkPath: string): Promise<void> {
    await this.exec(["install", "-r", apkPath], deviceId);
  }

  async uninstall(deviceId: string, packageName: string): Promise<void> {
    await this.exec(["uninstall", packageName], deviceId);
  }

  async clearData(deviceId: string, packageName: string): Promise<void> {
    await this.exec(["shell", "pm", "clear", packageName], deviceId);
  }

  async forceStop(deviceId: string, packageName: string): Promise<void> {
    await this.exec(["shell", "am", "force-stop", packageName], deviceId);
  }

  async push(
    deviceId: string,
    localPath: string,
    remotePath: string
  ): Promise<void> {
    await this.exec(["push", localPath, remotePath], deviceId);
  }

  async pull(
    deviceId: string,
    remotePath: string,
    localPath: string
  ): Promise<void> {
    await this.exec(["pull", remotePath, localPath], deviceId);
  }

  async screenshot(deviceId: string): Promise<string> {
    const timestamp = Date.now();
    const remotePath = `/sdcard/screenshot_${timestamp}.png`;
    const localDir = join(app.getPath("pictures"), "ADB Companion");

    if (!existsSync(localDir)) {
      mkdirSync(localDir, { recursive: true });
    }

    const localPath = join(localDir, `screenshot_${timestamp}.png`);

    await this.exec(["shell", "screencap", "-p", remotePath], deviceId);
    await this.exec(["pull", remotePath, localPath], deviceId);
    await this.exec(["shell", "rm", remotePath], deviceId);

    return localPath;
  }

  async startRecording(
    deviceId: string,
    options?: { duration?: number; bitRate?: number }
  ): Promise<void> {
    const timestamp = Date.now();
    const remotePath = `/sdcard/recording_${timestamp}.mp4`;

    const args = ["shell", "screenrecord"];
    if (options?.duration) args.push("--time-limit", String(options.duration));
    if (options?.bitRate) args.push("--bit-rate", String(options.bitRate));
    args.push(remotePath);

    const adb = spawn(this.getAdbPath(), ["-s", deviceId, ...args]);
    this.recordingProcesses.set(deviceId, { process: adb, remotePath });
  }

  async stopRecording(deviceId: string): Promise<string> {
    const recording = this.recordingProcesses.get(deviceId);
    if (!recording) throw new Error("No recording in progress");

    recording.process.kill("SIGINT");
    this.recordingProcesses.delete(deviceId);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const localDir = join(app.getPath("videos"), "ADB Companion");
    if (!existsSync(localDir)) {
      mkdirSync(localDir, { recursive: true });
    }

    const timestamp = Date.now();
    const localPath = join(localDir, `recording_${timestamp}.mp4`);

    await this.exec(["pull", recording.remotePath, localPath], deviceId);
    await this.exec(["shell", "rm", recording.remotePath], deviceId);

    return localPath;
  }

  async reboot(
    deviceId: string,
    mode: "normal" | "recovery" | "bootloader" | "fastboot"
  ): Promise<void> {
    const modeArg = mode === "normal" ? "" : mode;
    if (modeArg) {
      await this.exec(["reboot", modeArg], deviceId);
    } else {
      await this.exec(["reboot"], deviceId);
    }
  }

  async listFiles(deviceId: string, remotePath: string): Promise<FileEntry[]> {
    const output = await this.exec(
      ["shell", "ls", "-la", remotePath],
      deviceId
    );
    const lines = output
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("total"));

    const entries: FileEntry[] = [];

    for (const line of lines) {
      const match = line.match(
        /^([drwxlst-]{10})\s+\d+\s+(\S+)\s+(\S+)\s+(\d+)\s+(.+?)\s+(.+)$/
      );
      if (!match) continue;

      const [, permissions, owner, group, sizeStr, dateStr, name] = match;

      if (name === "." || name === "..") continue;

      const typeChar = permissions[0];
      const typeMap: Record<string, FileType> = {
        d: "directory",
        l: "symlink",
        "-": "file",
      };

      const cleanName = name.split(" -> ")[0].trim();
      const fullPath = remotePath.endsWith("/")
        ? `${remotePath}${cleanName}`
        : `${remotePath}/${cleanName}`;

      entries.push({
        name: cleanName,
        path: fullPath,
        type: typeMap[typeChar] || "file",
        size: parseInt(sizeStr, 10) || 0,
        permissions,
        owner,
        group,
        modifiedDate: Date.now(),
        isHidden: cleanName.startsWith("."),
      });
    }

    return entries.sort((a, b) => {
      if (a.type === "directory" && b.type !== "directory") return -1;
      if (a.type !== "directory" && b.type === "directory") return 1;
      return a.name.localeCompare(b.name);
    });
  }

  async listApps(
    deviceId: string,
    type: "user" | "system" | "all"
  ): Promise<InstalledApp[]> {
    const flag = type === "system" ? "-s" : type === "user" ? "-3" : "";
    const output = await this.exec(
      ["shell", "pm", "list", "packages", "-f", flag].filter(Boolean),
      deviceId
    );
    const lines = output.split("\n").filter((line) => line.trim());

    const apps: InstalledApp[] = [];

    for (const line of lines) {
      const match = line.match(/package:(.+)=(.+)/);
      if (!match) continue;

      const [, apkPath, packageName] = match;
      const isSystem =
        apkPath.startsWith("/system/") || apkPath.startsWith("/product/");

      const appName = packageName.split(".").pop() || packageName;

      apps.push({
        packageName,
        appName,
        versionName: "",
        versionCode: 0,
        isSystem,
        isEnabled: true,
        apkPath,
      });
    }

    return apps.sort((a, b) => a.packageName.localeCompare(b.packageName));
  }

  async exportApk(
    deviceId: string,
    packageName: string,
    destPath: string
  ): Promise<string> {
    const output = await this.exec(
      ["shell", "pm", "path", packageName],
      deviceId
    );

    const lines = output.split("\n").filter((l) => l.startsWith("package:"));
    if (lines.length === 0) {
      throw new Error(`Could not find APK path for ${packageName}`);
    }

    const apkPath = lines[0].replace("package:", "").trim();
    console.log("Pulling APK from:", apkPath, "to:", destPath);

    await this.exec(["pull", apkPath, destPath], deviceId);
    return destPath;
  }

  async exportAllApks(
    deviceId: string,
    packageName: string,
    destDir: string
  ): Promise<string[]> {
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    const output = await this.exec(
      ["shell", "pm", "path", packageName],
      deviceId
    );

    const lines = output.split("\n").filter((l) => l.startsWith("package:"));
    if (lines.length === 0) {
      throw new Error(`Could not find APK path for ${packageName}`);
    }

    const exportedPaths: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const apkPath = lines[i].replace("package:", "").trim();
      const fileName = i === 0 ? "base.apk" : `split_${i}.apk`;
      const localPath = join(destDir, fileName);
      console.log(`Pulling APK ${i + 1}/${lines.length}:`, apkPath);
      await this.exec(["pull", apkPath, localPath], deviceId);
      exportedPaths.push(localPath);
    }

    return exportedPaths;
  }

  async installMultipleApks(
    deviceId: string,
    apkPaths: string[]
  ): Promise<void> {
    await this.exec(["install-multiple", "-r", ...apkPaths], deviceId);
  }

  async getProp(deviceId: string, prop: string): Promise<string> {
    return this.exec(["shell", "getprop", prop], deviceId);
  }

  logcatStart(
    deviceId: string,
    filters?: {
      level?: string;
      tag?: string;
      packageName?: string;
      search?: string;
    },
    callback?: (entry: LogcatEntry) => void
  ): void {
    this.logcatStop(deviceId);

    const args = ["logcat", "-v", "threadtime"];

    if (filters?.tag) {
      args.push(`${filters.tag}:*`);
      args.push("*:S");
    }

    const adb = spawn(this.getAdbPath(), ["-s", deviceId, ...args]);
    this.logcatProcesses.set(deviceId, adb);

    adb.stdout.on("data", (data) => {
      const lines = data
        .toString()
        .split("\n")
        .filter((l: string) => l.trim());

      for (const line of lines) {
        const match = line.match(
          /^(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+(\d+)\s+([VDIWEF])\s+(\S+)\s*:\s*(.*)$/
        );
        if (!match) continue;

        const [, timestamp, pid, tid, level, tag, message] = match;

        if (filters?.level && level < filters.level) continue;
        if (
          filters?.search &&
          !message.toLowerCase().includes(filters.search.toLowerCase())
        )
          continue;

        callback?.({
          timestamp,
          pid: parseInt(pid, 10),
          tid: parseInt(tid, 10),
          level: level as LogLevel,
          tag,
          message,
        });
      }
    });
  }

  logcatStop(deviceId: string): void {
    const process = this.logcatProcesses.get(deviceId);
    if (process) {
      process.kill();
      this.logcatProcesses.delete(deviceId);
    }
  }

  async logcatClear(deviceId: string): Promise<void> {
    await this.exec(["logcat", "-c"], deviceId);
  }

  async backup(
    deviceId: string,
    destPath: string,
    options?: {
      apk?: boolean;
      shared?: boolean;
      system?: boolean;
      all?: boolean;
    }
  ): Promise<void> {
    const args = ["backup"];
    if (options?.apk) args.push("-apk");
    if (options?.shared) args.push("-shared");
    if (options?.system) args.push("-system");
    if (options?.all) args.push("-all");
    args.push("-f", destPath);

    await this.exec(args, deviceId);
  }

  async restore(deviceId: string, backupPath: string): Promise<void> {
    await this.exec(["restore", backupPath], deviceId);
  }

  async killServer(): Promise<void> {
    try {
      await this.exec(["kill-server"]);
    } catch {}
  }
}
