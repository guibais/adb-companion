import { useState, useEffect } from "react";
import { Download, Play, Square, Wrench, RefreshCw } from "lucide-react";
import { Button, PageHeader, ProgressBar } from "../components/ui";
import { useUiStore } from "../stores";
import type { DevToolInfo, DevToolDownloadProgress } from "../types";

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function DevToolsPage() {
  const { addToast } = useUiStore();
  const [tools, setTools] = useState<DevToolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState<
    Map<string, DevToolDownloadProgress>
  >(new Map());

  useEffect(() => {
    loadTools();

    const unsubscribe = window.electronEvents?.["devtools:progress"]?.(
      (progress: DevToolDownloadProgress) => {
        setDownloadProgress((prev) => {
          const newMap = new Map(prev);
          newMap.set(progress.id, progress);
          return newMap;
        });

        if (progress.status === "completed") {
          setTimeout(loadTools, 500);
        }
      }
    );

    return () => unsubscribe?.();
  }, []);

  const loadTools = async () => {
    setIsLoading(true);
    try {
      const toolList = await window.electronAPI["devtools:check"]();
      setTools(toolList);
    } catch (err) {
      console.error("Failed to load tools:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (toolId: string) => {
    try {
      await window.electronAPI["devtools:download"](toolId);
      addToast({ type: "success", title: "Tool downloaded successfully" });
      loadTools();
    } catch (err) {
      addToast({
        type: "error",
        title: "Download failed",
        message: String(err),
      });
    }
  };

  const handleLaunch = async (toolId: string) => {
    try {
      await window.electronAPI["devtools:launch"](toolId);
      addToast({ type: "success", title: "Tool launched" });
      loadTools();
    } catch (err) {
      addToast({
        type: "error",
        title: "Failed to launch tool",
        message: String(err),
      });
    }
  };

  const handleStop = async (toolId: string) => {
    try {
      await window.electronAPI["devtools:stop"](toolId);
      addToast({ type: "info", title: "Tool stopped" });
      loadTools();
    } catch (err) {
      addToast({ type: "error", title: "Failed to stop tool" });
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <PageHeader
        title="Developer Tools"
        description="Install and launch debugging tools"
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={loadTools}
          loading={isLoading}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => {
          const progress = downloadProgress.get(tool.id);
          const isDownloading =
            progress?.status === "downloading" ||
            progress?.status === "extracting";

          return (
            <div
              key={tool.id}
              className="bg-bg-secondary border border-border rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{tool.name}</h3>
                    <p className="text-xs text-zinc-500">v{tool.version}</p>
                  </div>
                </div>
                {tool.isInstalled && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                    Installed
                  </span>
                )}
              </div>

              <p className="text-sm text-zinc-400 mb-4">{tool.description}</p>

              {isDownloading && progress && (
                <div className="mb-4">
                  <ProgressBar value={progress.percentage} showLabel />
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>
                      {progress.status === "extracting"
                        ? "Extracting..."
                        : "Downloading..."}
                    </span>
                    <span>{formatBytes(progress.speed)}/s</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {tool.isInstalled ? (
                  <>
                    {tool.isRunning ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleStop(tool.id)}
                        className="flex-1"
                      >
                        <Square className="w-4 h-4" />
                        Stop
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleLaunch(tool.id)}
                        className="flex-1"
                      >
                        <Play className="w-4 h-4" />
                        Launch
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleDownload(tool.id)}
                    loading={isDownloading}
                    disabled={isDownloading}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {tools.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Wrench className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No Tools Available
          </h3>
          <p className="text-sm text-zinc-500">
            Developer tools are not available for your platform
          </p>
        </div>
      )}

      <div className="bg-bg-secondary border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-white mb-3">
          About Developer Tools
        </h3>
        <ul className="text-sm text-zinc-400 space-y-2">
          <li>
            • <strong className="text-zinc-300">Reactotron</strong> - Debug
            React and React Native apps with timeline, state inspection, and API
            monitoring
          </li>
          <li>
            • <strong className="text-zinc-300">Flipper</strong> - Meta's
            extensible mobile debugger with plugins for logs, layout, network,
            and databases
          </li>
        </ul>
      </div>
    </div>
  );
}
