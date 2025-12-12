import { Github, RefreshCw } from "lucide-react";
import { Button, Input } from "../components/ui";
import { useSettingsStore, useBinaryStore, useUiStore } from "../stores";

export function SettingsPage() {
  const settings = useSettingsStore();
  const { status } = useBinaryStore();
  const { addToast } = useUiStore();

  const handleCheckUpdates = async () => {
    addToast({ type: "info", title: "Checking for updates..." });
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
          {[
            { name: "Platform Tools", info: status?.platformTools },
            { name: "scrcpy", info: status?.scrcpy },
            { name: "Java Runtime", info: status?.java },
            { name: "APK Tool", info: status?.apktool },
            { name: "APK Signer", info: status?.uberApkSigner },
          ].map(({ name, info }) => (
            <div
              key={name}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <span className="text-sm text-zinc-300">{name}</span>
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
