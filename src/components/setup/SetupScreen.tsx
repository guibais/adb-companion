import { useEffect, useState } from "react";
import {
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button, ProgressBar, LoadingScreen } from "../ui";
import { useBinaryStore, useUiStore } from "../../stores";
import type { DownloadProgress } from "../../types";

type BinaryItemProps = {
  displayName: string;
  info: { version: string; isInstalled: boolean } | undefined;
  progress?: DownloadProgress;
  required?: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
};

function BinaryItem({
  displayName,
  info,
  progress,
  required,
  onRetry,
  isRetrying,
}: BinaryItemProps) {
  const isDownloading =
    progress?.status === "downloading" || progress?.status === "extracting";
  const isCompleted = info?.isInstalled || progress?.status === "completed";
  const isFailed = progress?.status === "failed";

  return (
    <div className="bg-bg-tertiary rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          ) : isFailed ? (
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          ) : isDownloading || isRetrying ? (
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
              <Download className="w-5 h-5 text-zinc-400" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-white">{displayName}</h3>
              {required && !isCompleted && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                  Required
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              v{info?.version || "unknown"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFailed && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              loading={isRetrying}
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </Button>
          )}
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              isCompleted
                ? "bg-green-500/20 text-green-400"
                : isFailed
                ? "bg-red-500/20 text-red-400"
                : isDownloading || isRetrying
                ? "bg-blue-500/20 text-blue-400"
                : "bg-zinc-500/20 text-zinc-400"
            }`}
          >
            {isCompleted
              ? "Installed"
              : isFailed
              ? "Failed"
              : isRetrying
              ? "Retrying..."
              : isDownloading
              ? progress?.status === "extracting"
                ? "Extracting..."
                : "Downloading..."
              : "Pending"}
          </span>
        </div>
      </div>

      {(isDownloading || isRetrying) && progress && (
        <div className="mt-3">
          <ProgressBar value={progress.percentage} showLabel />
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>
              {formatBytes(progress.downloadedBytes)} /{" "}
              {formatBytes(progress.totalBytes)}
            </span>
            <span>{formatBytes(progress.speed)}/s</span>
          </div>
        </div>
      )}

      {isFailed && progress?.error && (
        <p className="text-xs text-red-400 mt-2 bg-red-500/10 p-2 rounded">
          {progress.error}
        </p>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function SetupScreen() {
  const {
    status,
    setStatus,
    isDownloading,
    setDownloading,
    isChecking,
    setChecking,
  } = useBinaryStore();
  const { setSetupComplete } = useUiStore();
  const [progressMap, setProgressMap] = useState<Map<string, DownloadProgress>>(
    new Map()
  );
  const [error, setError] = useState<string | null>(null);
  const [retryingItem, setRetryingItem] = useState<string | null>(null);

  useEffect(() => {
    checkBinaries();

    const unsubscribe = window.electronEvents?.["download:progress"]?.(
      (progress: DownloadProgress) => {
        setProgressMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(progress.name, progress);
          return newMap;
        });

        if (progress.status === "completed") {
          setTimeout(checkBinaries, 500);
        }
      }
    );

    return () => unsubscribe?.();
  }, []);

  const checkBinaries = async () => {
    setChecking(true);
    try {
      const binaryStatus = await window.electronAPI["binary:check"]();
      setStatus(binaryStatus);
    } catch (err) {
      console.error("Failed to check binaries:", err);
      setError(
        "Failed to check installed tools. Please restart the application."
      );
    } finally {
      setChecking(false);
    }
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    setError(null);
    setProgressMap(new Map());

    try {
      await window.electronAPI["binary:download-all"]();
      await checkBinaries();
    } catch (err) {
      console.error("Download failed:", err);
      setError(
        `Download failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }. You can retry individual tools below.`
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleRetryItem = async (name: string) => {
    setRetryingItem(name);
    setProgressMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(name);
      return newMap;
    });

    try {
      await window.electronAPI["binary:download"](name);
      await checkBinaries();
    } catch (err) {
      console.error(`Retry failed for ${name}:`, err);
      setProgressMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(name, {
          name,
          version: "",
          totalBytes: 0,
          downloadedBytes: 0,
          percentage: 0,
          speed: 0,
          eta: 0,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });
        return newMap;
      });
    } finally {
      setRetryingItem(null);
    }
  };

  const handleContinue = () => {
    setSetupComplete(true);
  };

  const allRequired =
    status?.platformTools.isInstalled && status?.scrcpy.isInstalled;
  const allOptional =
    status?.java.isInstalled &&
    status?.apktool.isInstalled &&
    status?.uberApkSigner.isInstalled;
  const allInstalled = allRequired && allOptional;

  const installedCount = [
    status?.platformTools.isInstalled,
    status?.scrcpy.isInstalled,
    status?.java.isInstalled,
    status?.apktool.isInstalled,
    status?.uberApkSigner.isInstalled,
  ].filter(Boolean).length;

  const hasAnyFailed = Array.from(progressMap.values()).some(
    (p) => p.status === "failed"
  );

  if (!status && isChecking) {
    return (
      <LoadingScreen
        title="Preparing setup"
        subtitle="Checking installed tools..."
      />
    );
  }

  return (
    <div className="min-h-screen max-h-screen bg-bg-primary overflow-y-auto">
      <div className="w-full max-w-lg mx-auto p-8 py-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-accent to-green-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/20">
            <span className="text-3xl font-bold text-white">A</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome to ADB Companion
          </h1>
          <p className="text-zinc-400">
            We need to download some tools to get started. This only happens
            once.
          </p>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-zinc-400">Installation Progress</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-green-400 transition-all duration-500"
                style={{ width: `${(installedCount / 5) * 100}%` }}
              />
            </div>
            <span className="text-sm text-white font-medium">
              {installedCount}/5
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <BinaryItem
            displayName="Android Platform Tools"
            info={status?.platformTools}
            progress={progressMap.get("platform-tools")}
            required
            onRetry={() => handleRetryItem("platform-tools")}
            isRetrying={retryingItem === "platform-tools"}
          />
          <BinaryItem
            displayName="scrcpy (Screen Mirror)"
            info={status?.scrcpy}
            progress={progressMap.get("scrcpy")}
            required
            onRetry={() => handleRetryItem("scrcpy")}
            isRetrying={retryingItem === "scrcpy"}
          />
          <BinaryItem
            displayName="Java Runtime"
            info={status?.java}
            progress={progressMap.get("java")}
            onRetry={() => handleRetryItem("java")}
            isRetrying={retryingItem === "java"}
          />
          <BinaryItem
            displayName="APK Tool"
            info={status?.apktool}
            progress={progressMap.get("apktool")}
            onRetry={() => handleRetryItem("apktool")}
            isRetrying={retryingItem === "apktool"}
          />
          <BinaryItem
            displayName="APK Signer"
            info={status?.uberApkSigner}
            progress={progressMap.get("uber-apk-signer")}
            onRetry={() => handleRetryItem("uber-apk-signer")}
            isRetrying={retryingItem === "uber-apk-signer"}
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-400 font-medium">
                  Download Error
                </p>
                <p className="text-xs text-red-400/70 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {!allInstalled && !isDownloading && (
            <Button
              onClick={handleDownloadAll}
              loading={isDownloading}
              className="w-full"
              disabled={isDownloading || retryingItem !== null}
            >
              <Download className="w-4 h-4" />
              {hasAnyFailed ? "Retry Failed Downloads" : "Download All Tools"}
            </Button>
          )}

          {allRequired ? (
            <Button
              onClick={handleContinue}
              className="w-full"
              variant={allInstalled ? "primary" : "secondary"}
              disabled={isDownloading || retryingItem !== null}
            >
              {allInstalled ? "Get Started" : "Continue (Skip Optional Tools)"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={handleContinue}
              className="w-full"
              disabled={isDownloading || retryingItem !== null}
            >
              Skip Setup (Limited Functionality)
            </Button>
          )}
        </div>

        <div className="mt-6 p-4 bg-bg-secondary rounded-lg border border-border">
          <div className="flex items-start gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5" />
            <p className="text-xs text-zinc-400">
              <strong className="text-zinc-300">Required:</strong> Platform
              Tools & scrcpy are needed for basic device communication and
              screen mirroring.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-zinc-500 mt-1.5" />
            <p className="text-xs text-zinc-500">
              <strong className="text-zinc-400">Optional:</strong> Java, APK
              Tool & Signer enable APK cloning/modification features.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-600">
          <span>Total size: ~150MB</span>
          <span>•</span>
          <button
            onClick={() =>
              window.electronAPI["shell:open-external"](
                "https://github.com/adb-companion/adb-companion"
              )
            }
            className="flex items-center gap-1 hover:text-zinc-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
