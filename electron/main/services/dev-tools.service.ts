import { app } from "electron";
import { join } from "path";
import {
  existsSync,
  mkdirSync,
  createWriteStream,
  createReadStream,
  chmodSync,
  unlinkSync,
  readdirSync,
} from "fs";
import https from "https";
import http from "http";
import { spawn, ChildProcess } from "child_process";

const unzipper = require("unzipper") as unknown as {
  Extract: (options: { path: string }) => NodeJS.WritableStream;
};

type DevToolConfig = {
  id: string;
  name: string;
  description: string;
  version: string;
  urls: Record<string, string>;
  executable: string;
  extractPath: string;
  icon?: string;
};

const DEV_TOOLS: DevToolConfig[] = [
  {
    id: "reactotron",
    name: "Reactotron",
    description: "A desktop app for inspecting React and React Native apps",
    version: "3.6.2",
    urls: {
      darwin_arm64:
        "https://github.com/infinitered/reactotron/releases/download/reactotron-app%403.6.2/Reactotron-3.6.2-arm64.dmg",
      darwin_x64:
        "https://github.com/infinitered/reactotron/releases/download/reactotron-app%403.6.2/Reactotron-3.6.2.dmg",
      win32:
        "https://github.com/infinitered/reactotron/releases/download/reactotron-app%403.6.2/Reactotron-Setup-3.6.2.exe",
      linux:
        "https://github.com/infinitered/reactotron/releases/download/reactotron-app%403.6.2/Reactotron-3.6.2.AppImage",
    },
    executable:
      process.platform === "darwin"
        ? "Reactotron.app"
        : process.platform === "win32"
        ? "Reactotron.exe"
        : "Reactotron-3.6.2.AppImage",
    extractPath: "reactotron",
  },
  {
    id: "flipper",
    name: "Flipper",
    description: "Meta's extensible mobile debugger with a desktop runtime",
    version: "0.273.0",
    urls: {
      darwin_arm64:
        "https://github.com/facebook/flipper/releases/download/v0.273.0/Flipper-server-mac-aarch64.dmg",
      darwin_x64:
        "https://github.com/facebook/flipper/releases/download/v0.273.0/Flipper-server-mac-x64.dmg",
    },
    executable: "Flipper.app",
    extractPath: "flipper",
  },
  {
    id: "jadx",
    name: "JADX GUI",
    description: "Dex to Java decompiler with a GUI (APK analysis)",
    version: "1.5.3",
    urls: {
      darwin:
        "https://github.com/skylot/jadx/releases/download/v1.5.3/jadx-1.5.3.zip",
      linux:
        "https://github.com/skylot/jadx/releases/download/v1.5.3/jadx-1.5.3.zip",
      win32:
        "https://github.com/skylot/jadx/releases/download/v1.5.3/jadx-gui-1.5.3-with-jre-win.zip",
    },
    executable: process.platform === "win32" ? "jadx-gui.exe" : "bin/jadx-gui",
    extractPath: "jadx",
  },
  {
    id: "http-toolkit",
    name: "HTTP Toolkit",
    description: "Intercept & debug HTTP(S) traffic with a desktop UI",
    version: "1.24.1",
    urls: {
      darwin_arm64:
        "https://github.com/httptoolkit/httptoolkit-desktop/releases/download/v1.24.1/HttpToolkit-1.24.1-arm64.dmg",
      darwin_x64:
        "https://github.com/httptoolkit/httptoolkit-desktop/releases/download/v1.24.1/HttpToolkit-1.24.1-x64.dmg",
      win32_x64:
        "https://github.com/httptoolkit/httptoolkit-desktop/releases/download/v1.24.1/HttpToolkit-1.24.1-win-x64.zip",
      linux_x64:
        "https://github.com/httptoolkit/httptoolkit-desktop/releases/download/v1.24.1/HttpToolkit-1.24.1-x64.AppImage",
      linux_arm64:
        "https://github.com/httptoolkit/httptoolkit-desktop/releases/download/v1.24.1/HttpToolkit-1.24.1-arm64.AppImage",
    },
    executable:
      process.platform === "darwin"
        ? "HTTP Toolkit.app"
        : process.platform === "win32"
        ? "HTTP Toolkit.exe"
        : process.arch === "arm64"
        ? "HttpToolkit-1.24.1-arm64.AppImage"
        : "HttpToolkit-1.24.1-x64.AppImage",
    extractPath: "http-toolkit",
  },
];

export type DevToolInfo = {
  id: string;
  name: string;
  description: string;
  version: string;
  isInstalled: boolean;
  isRunning: boolean;
  path?: string;
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

export class DevToolsService {
  private toolsPath: string = "";
  private runningProcesses: Map<string, ChildProcess> = new Map();
  private progressCallback?: (progress: DevToolDownloadProgress) => void;

  async initialize(): Promise<void> {
    this.toolsPath = join(app.getPath("userData"), "dev-tools");
    if (!existsSync(this.toolsPath)) {
      mkdirSync(this.toolsPath, { recursive: true });
    }
  }

  private async extractZip(zipPath: string, destPath: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const stream = unzipper.Extract({ path: destPath });

      stream.on("close", () => resolve());
      stream.on("error", (err: unknown) => reject(err));

      createReadStream(zipPath).pipe(stream);
    });
  }

  private ensureExecutablePermissions(path: string) {
    if (process.platform === "win32") return;
    if (path.endsWith(".app")) return;
    try {
      chmodSync(path, 0o755);
    } catch {}
  }

  setProgressCallback(callback: (progress: DevToolDownloadProgress) => void) {
    this.progressCallback = callback;
  }

  getAvailableTools(): DevToolConfig[] {
    return DEV_TOOLS.filter((tool) => {
      const url = this.getDownloadUrl(tool);
      return url !== "";
    });
  }

  private getDownloadUrl(tool: DevToolConfig): string {
    const platform = process.platform;
    const arch = process.arch;

    const platformArchKey = `${platform}_${arch}`;

    if (tool.urls[platformArchKey]) return tool.urls[platformArchKey];
    if (platform === "darwin" && tool.urls[`darwin_${arch}`])
      return tool.urls[`darwin_${arch}`];
    if (tool.urls[platform]) return tool.urls[platform];

    return "";
  }

  async checkTools(): Promise<DevToolInfo[]> {
    await this.initialize();

    return DEV_TOOLS.reduce<DevToolInfo[]>((acc, tool) => {
      const toolPath = join(this.toolsPath, tool.extractPath);
      const installedPath = this.findExecutable(toolPath, tool) || undefined;
      const isInstalled = Boolean(installedPath);

      const isAvailable = this.getDownloadUrl(tool) !== "";
      if (!isAvailable && !isInstalled) return acc;

      acc.push({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        version: tool.version,
        isInstalled,
        isRunning: this.runningProcesses.has(tool.id),
        ...(installedPath ? { path: installedPath } : {}),
      });

      return acc;
    }, []);
  }

  private findExecutable(basePath: string, tool: DevToolConfig): string | null {
    if (!existsSync(basePath)) return null;

    if (process.platform === "darwin") {
      const appPath = join(basePath, tool.executable);
      if (existsSync(appPath)) return appPath;

      const files = readdirSync(basePath);
      const appFile = files.find((f) => f.endsWith(".app"));
      if (appFile) return join(basePath, appFile);
    }

    if (process.platform === "win32") {
      const exePath = join(basePath, tool.executable);
      if (existsSync(exePath)) return exePath;

      const files = readdirSync(basePath);
      const exeFile = files.find((f) => f.endsWith(".exe"));
      if (exeFile) return join(basePath, exeFile);
    }

    if (process.platform === "linux") {
      const appImagePath = join(basePath, tool.executable);
      if (existsSync(appImagePath)) return appImagePath;

      const files = readdirSync(basePath);
      const appImage = files.find((f) => f.endsWith(".AppImage"));
      if (appImage) return join(basePath, appImage);
    }

    return null;
  }

  async downloadTool(toolId: string): Promise<void> {
    await this.initialize();

    const tool = DEV_TOOLS.find((t) => t.id === toolId);
    if (!tool) throw new Error(`Unknown tool: ${toolId}`);

    const url = this.getDownloadUrl(tool);
    if (!url)
      throw new Error(
        `No download available for ${tool.name} on ${process.platform}`
      );

    const toolPath = join(this.toolsPath, tool.extractPath);
    if (!existsSync(toolPath)) {
      mkdirSync(toolPath, { recursive: true });
    }

    const fileName = url.split("/").pop() || "download";
    const tempFile = join(toolPath, fileName);

    const progress: DevToolDownloadProgress = {
      id: tool.id,
      name: tool.name,
      totalBytes: 0,
      downloadedBytes: 0,
      percentage: 0,
      speed: 0,
      status: "downloading",
    };

    this.progressCallback?.(progress);

    try {
      await this.downloadFile(url, tempFile, (downloaded, total, speed) => {
        progress.downloadedBytes = downloaded;
        progress.totalBytes = total;
        progress.percentage =
          total > 0 ? Math.round((downloaded / total) * 100) : 0;
        progress.speed = speed;
        this.progressCallback?.(progress);
      });

      progress.status = "extracting";
      progress.percentage = 95;
      this.progressCallback?.(progress);

      if (process.platform === "darwin" && fileName.endsWith(".dmg")) {
        await this.extractDmg(tempFile, toolPath, tool.executable);
        try {
          unlinkSync(tempFile);
        } catch {}
      } else if (fileName.endsWith(".zip")) {
        await this.extractZip(tempFile, toolPath);

        const extractedExecPath = this.findExecutable(toolPath, tool);
        if (extractedExecPath) {
          this.ensureExecutablePermissions(extractedExecPath);
        }

        try {
          unlinkSync(tempFile);
        } catch {}
      } else if (
        process.platform === "linux" &&
        fileName.endsWith(".AppImage")
      ) {
        chmodSync(tempFile, 0o755);
      }

      progress.status = "completed";
      progress.percentage = 100;
      this.progressCallback?.(progress);
    } catch (err) {
      progress.status = "failed";
      progress.error = err instanceof Error ? err.message : "Download failed";
      this.progressCallback?.(progress);
      throw err;
    }
  }

  async launchTool(toolId: string): Promise<void> {
    const tools = await this.checkTools();
    const tool = tools.find((t) => t.id === toolId);

    if (!tool || !tool.isInstalled || !tool.path) {
      throw new Error(`Tool ${toolId} is not installed`);
    }

    if (this.runningProcesses.has(toolId)) {
      return;
    }

    let proc: ChildProcess;

    if (process.platform === "darwin" && tool.path.endsWith(".app")) {
      proc = spawn("open", ["-a", tool.path], { detached: true });
    } else {
      this.ensureExecutablePermissions(tool.path);
      proc = spawn(tool.path, [], { detached: true });
    }

    proc.unref();
    this.runningProcesses.set(toolId, proc);

    proc.on("close", () => {
      this.runningProcesses.delete(toolId);
    });
  }

  async stopTool(toolId: string): Promise<void> {
    const proc = this.runningProcesses.get(toolId);
    if (proc) {
      proc.kill();
      this.runningProcesses.delete(toolId);
    }
  }

  private async extractDmg(
    dmgPath: string,
    destPath: string,
    appName: string
  ): Promise<void> {
    const { execSync } = require("child_process");
    const mountPoint = `/Volumes/TempMount_${Date.now()}`;

    try {
      execSync(
        `hdiutil attach "${dmgPath}" -mountpoint "${mountPoint}" -nobrowse -quiet`,
        {
          encoding: "utf-8",
        }
      );

      const files = readdirSync(mountPoint);
      const appFile = files.find((f) => f.endsWith(".app"));

      if (appFile) {
        const srcApp = join(mountPoint, appFile);
        const destApp = join(destPath, appFile);
        execSync(`cp -R "${srcApp}" "${destApp}"`, { encoding: "utf-8" });
      }
    } finally {
      try {
        execSync(`hdiutil detach "${mountPoint}" -quiet`, {
          encoding: "utf-8",
        });
      } catch {}
    }
  }

  private downloadFile(
    url: string,
    destPath: string,
    onProgress?: (downloaded: number, total: number, speed: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const makeRequest = (requestUrl: string, redirectCount = 0) => {
        if (redirectCount > 10) {
          reject(new Error("Too many redirects"));
          return;
        }

        const protocol = requestUrl.startsWith("https") ? https : http;
        const urlObj = new URL(requestUrl);

        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || (requestUrl.startsWith("https") ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: "GET",
          headers: {
            "User-Agent": "ADB-Companion/1.0.0",
            Accept: "*/*",
          },
        };

        const req = protocol.request(options, (response) => {
          if (
            response.statusCode === 302 ||
            response.statusCode === 301 ||
            response.statusCode === 307
          ) {
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
              const absoluteUrl = redirectUrl.startsWith("http")
                ? redirectUrl
                : `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
              makeRequest(absoluteUrl, redirectCount + 1);
              return;
            }
          }

          if (response.statusCode !== 200) {
            reject(
              new Error(
                `HTTP ${response.statusCode}: ${
                  response.statusMessage || "Download failed"
                }`
              )
            );
            return;
          }

          const totalBytes = parseInt(
            response.headers["content-length"] || "0",
            10
          );
          let downloadedBytes = 0;
          let lastTime = Date.now();
          let lastBytes = 0;

          const file = createWriteStream(destPath);

          response.on("data", (chunk) => {
            downloadedBytes += chunk.length;

            const now = Date.now();
            const elapsed = (now - lastTime) / 1000;
            if (elapsed >= 0.3) {
              const speed = (downloadedBytes - lastBytes) / elapsed;
              onProgress?.(downloadedBytes, totalBytes, speed);
              lastTime = now;
              lastBytes = downloadedBytes;
            }
          });

          response.pipe(file);

          file.on("finish", () => {
            file.close();
            onProgress?.(downloadedBytes, totalBytes, 0);
            resolve();
          });

          file.on("error", (err) => {
            try {
              unlinkSync(destPath);
            } catch {}
            reject(err);
          });

          response.on("error", (err) => {
            try {
              unlinkSync(destPath);
            } catch {}
            reject(err);
          });
        });

        req.on("error", (err) => {
          reject(new Error(`Network error: ${err.message}`));
        });

        req.setTimeout(60000, () => {
          req.destroy();
          reject(new Error("Download timeout"));
        });

        req.end();
      };

      makeRequest(url);
    });
  }
}
