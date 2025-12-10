import { useState } from "react";
import {
  Camera,
  Video,
  Play,
  Square,
  FolderOpen,
  Download,
} from "lucide-react";
import { Button, PageHeader } from "../components/ui";
import { useDeviceStore, useUiStore } from "../stores";

export function ScreenshotPage() {
  const { devices, tabs, activeTabId } = useDeviceStore();
  const { addToast } = useUiStore();

  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(30);
  const [recordingBitrate, setRecordingBitrate] = useState(4000000);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeDevice = activeTab?.deviceId
    ? devices.find((d) => d.id === activeTab.deviceId)
    : null;

  const handleScreenshot = async () => {
    if (!activeDevice) return;

    setIsCapturing(true);
    try {
      const path = await window.electronAPI["adb:screenshot"](activeDevice.id);
      setLastScreenshot(path);
      addToast({ type: "success", title: "Screenshot saved", message: path });
    } catch (err) {
      addToast({
        type: "error",
        title: "Screenshot failed",
        message: String(err),
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleStartRecording = async () => {
    if (!activeDevice) return;

    try {
      await window.electronAPI["adb:start-recording"](activeDevice.id, {
        duration: recordingDuration,
        bitRate: recordingBitrate,
      });
      setIsRecording(true);
      addToast({ type: "success", title: "Recording started" });
    } catch (err) {
      addToast({ type: "error", title: "Failed to start recording" });
    }
  };

  const handleStopRecording = async () => {
    if (!activeDevice) return;

    try {
      const path = await window.electronAPI["adb:stop-recording"](
        activeDevice.id
      );
      setIsRecording(false);
      addToast({ type: "success", title: "Recording saved", message: path });
    } catch (err) {
      addToast({ type: "error", title: "Failed to stop recording" });
    }
  };

  const openFolder = async (path: string) => {
    const folder = path.split("/").slice(0, -1).join("/");
    await window.electronAPI["shell:open-external"](`file://${folder}`);
  };

  if (!activeDevice) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Camera className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">
            No Device Selected
          </h2>
          <p className="text-sm text-zinc-500">
            Connect a device to capture screenshots
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <PageHeader title="Screenshot & Recording" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Camera className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Screenshot</h2>
              <p className="text-sm text-zinc-500">Capture device screen</p>
            </div>
          </div>

          <Button
            onClick={handleScreenshot}
            loading={isCapturing}
            className="w-full mb-4"
          >
            <Camera className="w-4 h-4" />
            Take Screenshot
          </Button>

          {lastScreenshot && (
            <div className="mt-4 space-y-3">
              <div className="rounded-lg overflow-hidden border border-border bg-black">
                <img
                  src={`file://${lastScreenshot}`}
                  alt="Screenshot"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openFolder(lastScreenshot)}
                  className="flex-1"
                >
                  <FolderOpen className="w-4 h-4" />
                  Open Folder
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Video className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">
                Screen Recording
              </h2>
              <p className="text-sm text-zinc-500">Record device screen</p>
            </div>
          </div>

          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Duration (seconds)
              </label>
              <input
                type="range"
                min="10"
                max="180"
                value={recordingDuration}
                onChange={(e) => setRecordingDuration(parseInt(e.target.value))}
                className="w-full"
                disabled={isRecording}
              />
              <p className="text-xs text-zinc-500 mt-1">{recordingDuration}s</p>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Quality
              </label>
              <select
                value={recordingBitrate}
                onChange={(e) => setRecordingBitrate(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-white text-sm"
                disabled={isRecording}
              >
                <option value="2000000">Low (2 Mbps)</option>
                <option value="4000000">Medium (4 Mbps)</option>
                <option value="8000000">High (8 Mbps)</option>
                <option value="12000000">Very High (12 Mbps)</option>
              </select>
            </div>
          </div>

          {isRecording ? (
            <Button
              variant="danger"
              onClick={handleStopRecording}
              className="w-full"
            >
              <Square className="w-4 h-4" />
              Stop Recording
            </Button>
          ) : (
            <Button onClick={handleStartRecording} className="w-full">
              <Play className="w-4 h-4" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <div className="mt-4 flex items-center justify-center gap-2 text-red-400">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm">Recording...</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-bg-secondary border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-white mb-3">Notes</h3>
        <ul className="text-sm text-zinc-400 space-y-2">
          <li>• Screenshots are saved to your Pictures folder</li>
          <li>• Recordings are saved to your Videos folder</li>
          <li>• Screen recording is limited to 3 minutes max</li>
          <li>• Audio recording requires Android 11+</li>
        </ul>
      </div>
    </div>
  );
}
