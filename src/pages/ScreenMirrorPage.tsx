import { useState } from "react";
import { Play, Square, Settings2, Monitor } from "lucide-react";
import { Button, Input, PageHeader } from "../components/ui";
import { useDeviceStore, useUiStore } from "../stores";
import type { ScrcpyOptions } from "../types";

export function ScreenMirrorPage() {
  const { devices, tabs, activeTabId } = useDeviceStore();
  const { addToast } = useUiStore();

  const [isRunning, setIsRunning] = useState(false);
  const [processId, setProcessId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [options, setOptions] = useState<ScrcpyOptions>({
    maxSize: 1080,
    bitRate: 8,
    maxFps: 60,
    noAudio: false,
    videoCodec: "h264",
    showTouches: false,
    stayAwake: true,
    turnScreenOff: false,
    fullscreen: false,
    borderless: false,
    alwaysOnTop: false,
  });

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeDevice = activeTab?.deviceId
    ? devices.find((d) => d.id === activeTab.deviceId)
    : null;

  if (!activeDevice) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Monitor className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">
            No Device Selected
          </h2>
          <p className="text-sm text-zinc-500">
            Connect a device to start screen mirroring
          </p>
        </div>
      </div>
    );
  }

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const scrcpyOptions: ScrcpyOptions = {
        ...options,
        bitRate: options.bitRate ? options.bitRate * 1000000 : undefined,
        windowTitle: `${activeDevice.model} - ADB Companion`,
      };

      const pid = await window.electronAPI["scrcpy:start"](
        activeDevice.id,
        scrcpyOptions
      );
      setProcessId(pid);
      setIsRunning(true);
      addToast({ type: "success", title: "Screen mirroring started" });
    } catch (err) {
      addToast({
        type: "error",
        title: "Failed to start scrcpy",
        message: String(err),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      await window.electronAPI["scrcpy:stop"](processId as number);
      setIsRunning(false);
      setProcessId(null);
      addToast({ type: "info", title: "Screen mirroring stopped" });
    } catch (err) {
      addToast({ type: "error", title: "Failed to stop scrcpy" });
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <PageHeader
        title="Screen Mirror"
        description="Mirror and control your device screen"
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings2 className="w-4 h-4" />
          Settings
        </Button>
        {isRunning ? (
          <Button
            variant="danger"
            size="sm"
            onClick={handleStop}
            disabled={processId === null}
          >
            <Square className="w-4 h-4" />
            Stop
          </Button>
        ) : (
          <Button size="sm" onClick={handleStart} loading={isLoading}>
            <Play className="w-4 h-4" />
            Start Mirror
          </Button>
        )}
      </PageHeader>

      {showSettings && (
        <div className="bg-bg-secondary border border-border rounded-xl p-6 animate-fade-in">
          <h3 className="text-lg font-medium text-white mb-4">
            scrcpy Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Max Resolution
              </label>
              <select
                value={options.maxSize}
                onChange={(e) =>
                  setOptions({ ...options, maxSize: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-white"
              >
                <option value="480">480p</option>
                <option value="720">720p</option>
                <option value="1080">1080p</option>
                <option value="1440">1440p</option>
                <option value="0">Original</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Bitrate (Mbps)
              </label>
              <Input
                type="number"
                value={options.bitRate}
                onChange={(e) =>
                  setOptions({ ...options, bitRate: parseInt(e.target.value) })
                }
                min={1}
                max={100}
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Max FPS
              </label>
              <select
                value={options.maxFps}
                onChange={(e) =>
                  setOptions({ ...options, maxFps: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-white"
              >
                <option value="30">30 FPS</option>
                <option value="60">60 FPS</option>
                <option value="120">120 FPS</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Video Codec
              </label>
              <select
                value={options.videoCodec}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    videoCodec: e.target.value as "h264" | "h265",
                  })
                }
                className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-white"
              >
                <option value="h264">H.264</option>
                <option value="h265">H.265 (HEVC)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[
              { key: "noAudio", label: "Disable Audio" },
              { key: "showTouches", label: "Show Touches" },
              { key: "stayAwake", label: "Stay Awake" },
              { key: "turnScreenOff", label: "Turn Screen Off" },
              { key: "fullscreen", label: "Fullscreen" },
              { key: "borderless", label: "Borderless" },
              { key: "alwaysOnTop", label: "Always on Top" },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={options[key as keyof ScrcpyOptions] as boolean}
                  onChange={(e) =>
                    setOptions({ ...options, [key]: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border bg-bg-tertiary text-accent focus:ring-accent"
                />
                <span className="text-sm text-zinc-300">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="bg-bg-secondary border border-border rounded-xl p-8">
        <div className="text-center">
          {isRunning ? (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Monitor className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Mirroring Active
              </h3>
              <p className="text-sm text-zinc-500 mb-4">
                A separate scrcpy window should have opened. Look for it in your
                taskbar or use Alt+Tab.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Connected to {activeDevice?.model}
              </div>
            </>
          ) : (
            <>
              <Monitor className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Ready to Mirror
              </h3>
              <p className="text-sm text-zinc-500 mb-4">
                Click "Start Mirror" to begin screen mirroring
              </p>
              <div className="flex justify-center gap-4 text-xs text-zinc-500">
                <span>📱 {activeDevice?.model}</span>
                <span>🖥️ {options.maxSize}p</span>
                <span>🎬 {options.maxFps} FPS</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-bg-secondary border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-white mb-3">Quick Tips</h3>
        <ul className="text-sm text-zinc-400 space-y-2">
          <li>
            •{" "}
            <kbd className="bg-bg-tertiary px-1.5 py-0.5 rounded text-xs">
              Right-click
            </kbd>{" "}
            triggers BACK button
          </li>
          <li>
            •{" "}
            <kbd className="bg-bg-tertiary px-1.5 py-0.5 rounded text-xs">
              Middle-click
            </kbd>{" "}
            triggers HOME button
          </li>
          <li>
            •{" "}
            <kbd className="bg-bg-tertiary px-1.5 py-0.5 rounded text-xs">
              Alt+F
            </kbd>{" "}
            toggles fullscreen
          </li>
          <li>
            •{" "}
            <kbd className="bg-bg-tertiary px-1.5 py-0.5 rounded text-xs">
              Ctrl+C
            </kbd>{" "}
            copies device clipboard to computer
          </li>
        </ul>
      </div>
    </div>
  );
}
