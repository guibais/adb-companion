import { app, BrowserWindow } from "electron";
import { join } from "path";
import {
  existsSync,
  mkdirSync,
  createWriteStream,
  chmodSync,
  unlinkSync,
  renameSync,
  readdirSync,
} from "fs";
import https from "https";
import http from "http";
import type {
  BinaryStatus,
  BinaryInfo,
  DownloadProgress,
} from "../../src/types/ipc.types";

type BinaryConfig = {
  name: string;
  version: string;
  urls: Record<string, string>;
  extractPath?: string;
  executable?: string;
  requiresJava?: boolean;
  skipOnPlatform?: string[];
};

const BINARY_CONFIGS: BinaryConfig[] = [
  {
    name: "platform-tools",
    version: "35.0.0",
    urls: {
      win32:
        "https://dl.google.com/android/repository/platform-tools-latest-windows.zip",
      darwin:
        "https://dl.google.com/android/repository/platform-tools-latest-darwin.zip",
      linux:
        "https://dl.google.com/android/repository/platform-tools-latest-linux.zip",
    },
    extractPath: "platform-tools",
    executable: "adb",
  },
  {
    name: "scrcpy",
    version: "3.1",
    urls: {
      win32:
        "https://github.com/Genymobile/scrcpy/releases/download/v3.1/scrcpy-win64-v3.1.zip",
      linux:
        "https://github.com/Genymobile/scrcpy/releases/download/v3.1/scrcpy-linux-x86_64-v3.1.tar.gz",
    },
    extractPath: "scrcpy",
    executable: "scrcpy",
    skipOnPlatform: ["darwin"],
  },
  {
    name: "java",
    version: "21",
    urls: {
      win32:
        "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.2%2B13/OpenJDK21U-jre_x64_windows_hotspot_21.0.2_13.zip",
      darwin_x64:
        "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.2%2B13/OpenJDK21U-jre_x64_mac_hotspot_21.0.2_13.tar.gz",
      darwin_arm64:
        "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.2%2B13/OpenJDK21U-jre_aarch64_mac_hotspot_21.0.2_13.tar.gz",
      linux:
        "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.2%2B13/OpenJDK21U-jre_x64_linux_hotspot_21.0.2_13.tar.gz",
    },
    extractPath: "java",
    executable: process.platform === "win32" ? "bin/java.exe" : "bin/java",
  },
  {
    name: "apktool",
    version: "2.9.3",
    urls: {
      all: "https://github.com/iBotPeaches/Apktool/releases/download/v2.9.3/apktool_2.9.3.jar",
    },
    requiresJava: true,
  },
  {
    name: "uber-apk-signer",
    version: "1.3.0",
    urls: {
      all: "https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar",
    },
    requiresJava: true,
  },
];

export class BinaryManagerService {
  private binariesPath: string = "";
  private initialized: boolean = false;
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  private emitProgress(progress: DownloadProgress) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send("download:progress", progress);
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.binariesPath = join(app.getPath("userData"), "binaries");

    if (!existsSync(this.binariesPath)) {
      mkdirSync(this.binariesPath, { recursive: true });
    }

    this.initialized = true;
  }

  getBinaryPath(name: string): string {
    const config = BINARY_CONFIGS.find((c) => c.name === name);
    if (!config) return "";

    if (config.name === "apktool" || config.name === "uber-apk-signer") {
      return join(this.binariesPath, "jars", `${name}.jar`);
    }

    const basePath = join(this.binariesPath, config.extractPath || name);

    if (!config.executable) return basePath;

    const ext =
      process.platform === "win32" && !config.executable.includes(".")
        ? ".exe"
        : "";

    if (config.name === "java") {
      if (!existsSync(basePath)) return "";

      const extractedDirs = readdirSync(basePath);
      const jreDir = extractedDirs.find(
        (d) =>
          d.startsWith("jdk-") ||
          d.startsWith("jre") ||
          d.includes("jre") ||
          d.includes("temurin") ||
          d.includes("adoptium")
      );

      if (jreDir) {
        const javaPath = join(basePath, jreDir, config.executable + ext);
        if (existsSync(javaPath)) return javaPath;

        const contentsPath = join(
          basePath,
          jreDir,
          "Contents",
          "Home",
          config.executable
        );
        if (existsSync(contentsPath)) return contentsPath;
      }

      const directPath = join(basePath, config.executable + ext);
      if (existsSync(directPath)) return directPath;

      return "";
    }

    return join(basePath, config.executable + ext);
  }

  async checkBinaries(): Promise<BinaryStatus> {
    await this.initialize();

    const checkBinary = (name: string): BinaryInfo => {
      const config = BINARY_CONFIGS.find((c) => c.name === name);
      if (!config) return { name, version: "", isInstalled: false };

      if (config.skipOnPlatform?.includes(process.platform)) {
        return {
          name,
          version: config.version,
          isInstalled: true,
          path: "bundled",
        };
      }

      const path = this.getBinaryPath(name);
      const isInstalled = path ? existsSync(path) : false;

      return {
        name,
        version: config.version,
        isInstalled,
        path: isInstalled ? path : undefined,
      };
    };

    return {
      platformTools: checkBinary("platform-tools"),
      scrcpy: checkBinary("scrcpy"),
      java: checkBinary("java"),
      apktool: checkBinary("apktool"),
      uberApkSigner: checkBinary("uber-apk-signer"),
    };
  }

  private getDownloadUrl(config: BinaryConfig): string {
    if (config.urls.all) return config.urls.all;

    const platform = process.platform;
    const arch = process.arch;

    if (platform === "darwin" && config.urls[`darwin_${arch}`]) {
      return config.urls[`darwin_${arch}`];
    }

    if (
      platform === "darwin" &&
      config.urls["darwin_x64"] &&
      !config.urls["darwin_arm64"]
    ) {
      return config.urls["darwin_x64"];
    }

    return config.urls[platform] || "";
  }

  async downloadBinary(name: string): Promise<void> {
    await this.initialize();

    const config = BINARY_CONFIGS.find((c) => c.name === name);
    if (!config) throw new Error(`Unknown binary: ${name}`);

    if (config.skipOnPlatform?.includes(process.platform)) {
      const progress: DownloadProgress = {
        name,
        version: config.version,
        totalBytes: 0,
        downloadedBytes: 0,
        percentage: 100,
        speed: 0,
        eta: 0,
        status: "completed",
      };
      this.emitProgress(progress);
      return;
    }

    const url = this.getDownloadUrl(config);
    if (!url)
      throw new Error(
        `No download URL available for ${name} on ${process.platform}`
      );

    const progress: DownloadProgress = {
      name,
      version: config.version,
      totalBytes: 0,
      downloadedBytes: 0,
      percentage: 0,
      speed: 0,
      eta: 0,
      status: "downloading",
    };

    this.emitProgress(progress);

    const tempDir = join(this.binariesPath, "temp");
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    const isJar = url.endsWith(".jar");
    const isZip = url.endsWith(".zip");
    const isTarGz = url.endsWith(".tar.gz") || url.includes(".tar.gz");

    const ext = isJar ? ".jar" : isZip ? ".zip" : ".tar.gz";
    const tempFile = join(tempDir, `${name}-${Date.now()}${ext}`);

    try {
      await this.downloadFile(url, tempFile, (downloaded, total, speed) => {
        progress.downloadedBytes = downloaded;
        progress.totalBytes = total;
        progress.percentage =
          total > 0 ? Math.round((downloaded / total) * 100) : 0;
        progress.speed = speed;
        progress.eta = speed > 0 ? Math.round((total - downloaded) / speed) : 0;
        this.emitProgress(progress);
      });

      progress.status = "extracting";
      progress.percentage = 95;
      this.emitProgress(progress);

      if (isJar) {
        const jarsDir = join(this.binariesPath, "jars");
        if (!existsSync(jarsDir)) {
          mkdirSync(jarsDir, { recursive: true });
        }
        const destPath = join(jarsDir, `${name}.jar`);
        renameSync(tempFile, destPath);
      } else {
        const extractDir = join(this.binariesPath, config.extractPath || name);
        if (!existsSync(extractDir)) {
          mkdirSync(extractDir, { recursive: true });
        }

        if (isZip) {
          await this.extractZip(tempFile, extractDir);
        } else if (isTarGz) {
          await this.extractTarGz(tempFile, extractDir);
        }

        if (process.platform !== "win32" && config.executable) {
          const execPath = this.getBinaryPath(name);
          if (existsSync(execPath)) {
            chmodSync(execPath, 0o755);
          }
        }

        try {
          unlinkSync(tempFile);
        } catch {}
      }

      progress.status = "completed";
      progress.percentage = 100;
      this.emitProgress(progress);
    } catch (err) {
      try {
        unlinkSync(tempFile);
      } catch {}

      progress.status = "failed";
      progress.error =
        err instanceof Error ? err.message : "Unknown download error";
      this.emitProgress(progress);
      throw err;
    }
  }

  async downloadAllBinaries(): Promise<void> {
    const status = await this.checkBinaries();

    const toDownload: string[] = [];
    if (!status.platformTools.isInstalled) toDownload.push("platform-tools");
    if (!status.scrcpy.isInstalled) toDownload.push("scrcpy");
    if (!status.java.isInstalled) toDownload.push("java");
    if (!status.apktool.isInstalled) toDownload.push("apktool");
    if (!status.uberApkSigner.isInstalled) toDownload.push("uber-apk-signer");

    const errors: string[] = [];

    for (const name of toDownload) {
      try {
        await this.downloadBinary(name);
      } catch (err) {
        errors.push(
          `${name}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    if (errors.length > 0 && errors.length === toDownload.length) {
      throw new Error(`All downloads failed:\n${errors.join("\n")}`);
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
          reject(
            new Error(
              "Download timeout - please check your internet connection"
            )
          );
        });

        req.end();
      };

      makeRequest(url);
    });
  }

  private async extractZip(zipPath: string, destDir: string): Promise<void> {
    const unzipper = require("unzipper");
    const fs = require("fs");

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: destDir }))
        .on("close", resolve)
        .on("error", reject);
    });
  }

  private async extractTarGz(tarPath: string, destDir: string): Promise<void> {
    const tar = require("tar");
    await tar.x({
      file: tarPath,
      cwd: destDir,
    });
  }
}
