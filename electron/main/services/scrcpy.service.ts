import { spawn, ChildProcess } from "child_process";
import { join } from "path";
import { app } from "electron";
import { existsSync } from "fs";
import type { ScrcpyOptions } from "../../../src/types/ipc.types";

export class ScrcpyService {
  private scrcpyPath: string = "";
  private processes: Map<number, ChildProcess> = new Map();
  private nextProcessId: number = 1;

  getScrcpyPath(): string {
    if (this.scrcpyPath) return this.scrcpyPath;

    const userDataPath = app.getPath("userData");
    const scrcpyDir = join(userDataPath, "binaries", "scrcpy");
    const scrcpyName = process.platform === "win32" ? "scrcpy.exe" : "scrcpy";
    const localPath = join(scrcpyDir, scrcpyName);

    if (existsSync(localPath)) {
      this.scrcpyPath = localPath;
      return this.scrcpyPath;
    }

    try {
      const { execSync } = require("child_process");
      const systemScrcpy = execSync("which scrcpy", {
        encoding: "utf-8",
      }).trim();
      if (systemScrcpy && existsSync(systemScrcpy)) {
        this.scrcpyPath = systemScrcpy;
        return this.scrcpyPath;
      }
    } catch {}

    return "scrcpy";
  }

  async start(deviceId: string, options?: ScrcpyOptions): Promise<number> {
    const scrcpyArgs: string[] = ["-s", deviceId];

    if (options?.maxSize) scrcpyArgs.push("-m", String(options.maxSize));
    if (options?.bitRate) scrcpyArgs.push("-b", String(options.bitRate));
    if (options?.maxFps) scrcpyArgs.push("--max-fps", String(options.maxFps));
    if (options?.noAudio) scrcpyArgs.push("--no-audio");
    if (options?.videoCodec)
      scrcpyArgs.push("--video-codec", options.videoCodec);
    if (options?.record) scrcpyArgs.push("-r", options.record);
    if (options?.showTouches) scrcpyArgs.push("--show-touches");
    if (options?.stayAwake) scrcpyArgs.push("--stay-awake");
    if (options?.turnScreenOff) scrcpyArgs.push("--turn-screen-off");
    if (options?.fullscreen) scrcpyArgs.push("-f");
    if (options?.borderless) scrcpyArgs.push("--window-borderless");
    if (options?.alwaysOnTop) scrcpyArgs.push("--always-on-top");
    if (options?.windowTitle)
      scrcpyArgs.push(`--window-title="${options.windowTitle}"`);
    if (options?.rotation !== undefined)
      scrcpyArgs.push("--rotation", String(options.rotation));
    if (options?.crop) scrcpyArgs.push("--crop", options.crop);
    if (options?.display !== undefined)
      scrcpyArgs.push("--display", String(options.display));
    if (options?.videoSource === "camera")
      scrcpyArgs.push("--video-source=camera");
    if (options?.cameraFacing)
      scrcpyArgs.push(`--camera-facing=${options.cameraFacing}`);

    const scrcpyPath = this.getScrcpyPath();
    const argsString = scrcpyArgs.join(" ");

    console.log("scrcpy path:", scrcpyPath);
    console.log("scrcpy args:", argsString);

    const processId = this.nextProcessId++;

    const scrcpy = spawn(scrcpyPath, scrcpyArgs, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    this.processes.set(processId, scrcpy);

    scrcpy.stdout?.on("data", (data) => {
      console.log("scrcpy stdout:", data.toString());
    });

    scrcpy.stderr?.on("data", (data) => {
      console.error("scrcpy stderr:", data.toString());
    });

    scrcpy.on("close", (code) => {
      console.log("scrcpy closed with code:", code);
      this.processes.delete(processId);
    });

    scrcpy.on("exit", (code) => {
      console.log("scrcpy exited with code:", code);
      this.processes.delete(processId);
    });

    scrcpy.on("error", (error) => {
      console.error("scrcpy error:", error);
      this.processes.delete(processId);
    });

    return processId;
  }

  async stop(processId: number): Promise<void> {
    const process = this.processes.get(processId);
    if (process) {
      process.kill();
      this.processes.delete(processId);
    }
  }

  async stopAll(): Promise<void> {
    for (const [id, process] of this.processes) {
      process.kill();
      this.processes.delete(id);
    }
  }

  isRunning(processId: number): boolean {
    const process = this.processes.get(processId);
    return process ? !process.killed : false;
  }
}
