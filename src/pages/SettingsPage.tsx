import { Github, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, Input } from "../components/ui";
import { useSettingsStore, useBinaryStore, useUiStore } from "../stores";
import type { DownloadProgress } from "../types";

type ToolKey =
  | "platform-tools"
  | "scrcpy"
  | "java"
  | "apktool"
  | "uber-apk-signer";

export function SettingsPage() {
  const settings = useSettingsStore();
  const { status, setStatus, setChecking } = useBinaryStore();
  const { addToast } = useUiStore();
  const [downloadingTool, setDownloadingTool] = useState<ToolKey | null>(null);
  const [progressMap, setProgressMap] = useState<Map<string, DownloadProgress>>(
    new Map()
  );

  const handleCheckUpdates = async () => {
    addToast({ type: "info", title: "Checking for updates..." });
  };

  const tools = useMemo(
    () => [
      {
        key: "platform-tools" as const,
        label: "Platform Tools",
        info: status?.platformTools,
      },
      { key: "scrcpy" as const, label: "scrcpy", info: status?.scrcpy },
      {
        key: "java" as const,
        label: "Java Runtime",
        info: status?.java,
      },
      {
        key: "apktool" as const,
        label: "APK Tool",
        info: status?.apktool,
      },
      {
        key: "uber-apk-signer" as const,
        label: "APK Signer",
        info: status?.uberApkSigner,
      },
    ],
    [status]
  );

  const refreshBinaryStatus = async () => {
    setChecking(true);
    try {
      const nextStatus = await window.electronAPI["binary:check"]();
      setStatus(nextStatus);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const unsubscribe = window.electronEvents?.["download:progress"]?.(
      (progress: DownloadProgress) => {
        setProgressMap((prev) => {
          const next = new Map(prev);
          next.set(progress.name, progress);
          return next;
        });

        if (progress.status === "completed") {
          setTimeout(() => {
            refreshBinaryStatus();
          }, 300);
        }
      }
    );

    return () => unsubscribe?.();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleDownloadAgain = async (tool: ToolKey) => {
    setDownloadingTool(tool);
    addToast({ type: "info", title: "Downloading tool..." });
    try {
      await window.electronAPI["binary:download"](tool);
      await refreshBinaryStatus();
      addToast({ type: "success", title: "Tool downloaded" });
    } catch (err) {
      addToast({
        type: "error",
        title: "Download failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setDownloadingTool(null);
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h1 className="text-xl font-semibold text-white">Settings</h1>

      <div className="bg-bg-secondary border border-border rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-4">General</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Auto-connect last device</p>
              <p className="text-xs text-zinc-500">
                Automatically connect to the last used device
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoConnectLastDevice}
              onChange={(e) =>
                settings.updateSettings({
                  autoConnectLastDevice: e.target.checked,
                })
              }
              className="w-5 h-5 rounded border-border bg-bg-tertiary text-accent"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Show system apps</p>
              <p className="text-xs text-zinc-500">
                Display system apps in the app list by default
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showSystemApps}
              onChange={(e) =>
                settings.updateSettings({ showSystemApps: e.target.checked })
              }
              className="w-5 h-5 rounded border-border bg-bg-tertiary text-accent"
            />
          </label>
        </div>
      </div>

      <div className="bg-bg-secondary border border-border rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-4">scrcpy Defaults</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Default Resolution
            </label>
            <select
              value={settings.defaultScrcpyResolution}
              onChange={(e) =>
                settings.updateSettings({
                  defaultScrcpyResolution: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-white"
            >
              <option value="480">480p</option>
              <option value="720">720p</option>
              <option value="1080">1080p</option>
              <option value="1440">1440p</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Default Bitrate (Mbps)
            </label>
            <Input
              type="number"
              value={settings.defaultScrcpyBitrate}
              onChange={(e) =>
                settings.updateSettings({
                  defaultScrcpyBitrate: parseInt(e.target.value),
                })
              }
              min={1}
              max={100}
            />
          </div>
        </div>
      </div>

      <div className="bg-bg-secondary border border-border rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-4">Installed Tools</h2>
        <div className="space-y-3">
          {tools.map(({ key, label, info }) => (
            <div
              key={key}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300">{label}</span>
                  <div className="flex items-center gap-2">
                    {info?.isInstalled ? (
                      <>
                        <span className="text-xs text-zinc-500">
                          v{info.version}
                        </span>
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-zinc-500">
                          Not installed
                        </span>
                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                      </>
                    )}
                  </div>
                </div>

                {(() => {
                  const progress = progressMap.get(key);
                  if (!progress) return null;

                  const isActive =
                    progress.status === "downloading" ||
                    progress.status === "extracting";

                  if (!isActive && progress.status !== "failed") return null;

                  return (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                        <span>
                          {progress.status === "extracting"
                            ? "Extracting..."
                            : progress.status === "failed"
                            ? "Failed"
                            : "Downloading..."}
                        </span>
                        {progress.status !== "failed" && (
                          <span>
                            {formatBytes(progress.downloadedBytes)} /{" "}
                            {formatBytes(progress.totalBytes)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="w-full">
                            <div className="w-full bg-bg-tertiary rounded-full overflow-hidden h-2">
                              <div
                                className="h-full bg-gradient-to-r from-accent to-green-400 rounded-full transition-all duration-300"
                                style={{ width: `${progress.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-zinc-500 w-10 text-right">
                          {Math.round(progress.percentage)}%
                        </span>
                      </div>
                      {progress.status === "failed" && progress.error && (
                        <p className="text-xs text-red-400 mt-2">
                          {progress.error}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2">
                {info?.isInstalled ? (
                  <>
                    <span className="text-xs text-zinc-500">
                      v{info.version}
                    </span>
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                  </>
                ) : (
                  <>
                    <span className="text-xs text-zinc-500">Not installed</span>
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  loading={downloadingTool === key}
                  onClick={() => handleDownloadAgain(key)}
                >
                  Download again
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={handleCheckUpdates}
        >
          <RefreshCw className="w-4 h-4" />
          Check for Updates
        </Button>
      </div>

      <div className="bg-bg-secondary border border-border rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-4">About</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
            <span className="text-xl font-bold text-white">A</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">ADB Companion</h3>
            <p className="text-sm text-zinc-500">Version 1.0.0</p>
          </div>
        </div>
        <p className="text-sm text-zinc-400 mb-4">
          A comprehensive GUI wrapper for Android Debug Bridge (ADB) and related
          tools. Open source and free to use.
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              window.electronAPI["shell:open-external"](
                "https://github.com/adb-companion/adb-companion"
              )
            }
          >
            <Github className="w-4 h-4" />
            GitHub
          </Button>
        </div>
      </div>
    </div>
  );
}
