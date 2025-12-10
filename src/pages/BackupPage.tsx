import { useState } from "react";
import {
  HardDrive,
  Upload,
  Download,
  FolderOpen,
  AlertTriangle,
} from "lucide-react";
import { Button, ProgressBar, PageHeader } from "../components/ui";
import { useDeviceStore, useUiStore } from "../stores";

export function BackupPage() {
  const { devices, tabs, activeTabId } = useDeviceStore();
  const { addToast } = useUiStore();

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupOptions, setBackupOptions] = useState({
    apk: true,
    shared: true,
    system: false,
    all: false,
  });

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeDevice = activeTab?.deviceId
    ? devices.find((d) => d.id === activeTab.deviceId)
    : null;

  const handleBackup = async () => {
    if (!activeDevice) return;

    const savePath = await window.electronAPI["shell:select-save-path"](
      `backup_${activeDevice.model.replace(/\s/g, "_")}_${Date.now()}.ab`,
      [{ name: "Android Backup", extensions: ["ab"] }]
    );

    if (!savePath) return;

    setIsBackingUp(true);
    try {
      await window.electronAPI["adb:backup"](
        activeDevice.id,
        savePath,
        backupOptions
      );
      addToast({
        type: "success",
        title: "Backup started",
        message: "Confirm on your device",
      });
    } catch (err) {
      addToast({ type: "error", title: "Backup failed", message: String(err) });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    if (!activeDevice) return;

    const backupPath = await window.electronAPI["shell:select-file"]({
      filters: [{ name: "Android Backup", extensions: ["ab"] }],
    });

    if (!backupPath) return;

    setIsRestoring(true);
    try {
      await window.electronAPI["adb:restore"](activeDevice.id, backupPath);
      addToast({
        type: "success",
        title: "Restore started",
        message: "Confirm on your device",
      });
    } catch (err) {
      addToast({
        type: "error",
        title: "Restore failed",
        message: String(err),
      });
    } finally {
      setIsRestoring(false);
    }
  };

  if (!activeDevice) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <HardDrive className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">
            No Device Selected
          </h2>
          <p className="text-sm text-zinc-500">
            Connect a device to backup/restore
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <PageHeader
        title="Backup & Restore"
        description="Create and restore device backups"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Download className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Backup</h2>
              <p className="text-sm text-zinc-500">
                Create a backup of your device
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {[
              {
                key: "apk",
                label: "Include APKs",
                desc: "Backup installed applications",
              },
              {
                key: "shared",
                label: "Shared Storage",
                desc: "Backup shared storage data",
              },
              {
                key: "system",
                label: "System Apps",
                desc: "Include system applications",
              },
              {
                key: "all",
                label: "All Apps",
                desc: "Backup all installed apps",
              },
            ].map(({ key, label, desc }) => (
              <label
                key={key}
                className="flex items-start gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={backupOptions[key as keyof typeof backupOptions]}
                  onChange={(e) =>
                    setBackupOptions({
                      ...backupOptions,
                      [key]: e.target.checked,
                    })
                  }
                  className="mt-1 w-4 h-4 rounded border-border bg-bg-tertiary text-accent"
                />
                <div>
                  <p className="text-sm text-white">{label}</p>
                  <p className="text-xs text-zinc-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>

          <Button
            onClick={handleBackup}
            loading={isBackingUp}
            className="w-full"
          >
            <Download className="w-4 h-4" />
            Create Backup
          </Button>
        </div>

        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Upload className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Restore</h2>
              <p className="text-sm text-zinc-500">
                Restore from a backup file
              </p>
            </div>
          </div>

          <div className="bg-bg-tertiary rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 text-yellow-500 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">Warning</span>
            </div>
            <p className="text-xs text-zinc-400">
              Restoring a backup will overwrite existing data on your device.
              Make sure you have a recent backup before proceeding.
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={handleRestore}
            loading={isRestoring}
            className="w-full"
          >
            <Upload className="w-4 h-4" />
            Select Backup File
          </Button>
        </div>
      </div>

      <div className="bg-bg-secondary border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-white mb-3">Important Notes</h3>
        <ul className="text-sm text-zinc-400 space-y-2">
          <li>
            • You will need to confirm the backup/restore on your device screen
          </li>
          <li>• Set a password when prompted for encrypted backups</li>
          <li>• Some apps may not allow backup due to restrictions</li>
          <li>• Backup files can be large depending on options selected</li>
          <li>• The device must stay connected during the entire process</li>
        </ul>
      </div>
    </div>
  );
}
