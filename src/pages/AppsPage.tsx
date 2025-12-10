import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Search,
  Trash2,
  Download,
  StopCircle,
  Eraser,
  RefreshCw,
  Upload,
  Copy,
  Loader2,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button, Input, Modal, PageHeader } from "../components/ui";
import { useDeviceStore, useUiStore } from "../stores";
import type { InstalledApp } from "../types";

export function AppsPage() {
  const { devices, tabs, activeTabId } = useDeviceStore();
  const { addToast } = useUiStore();

  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "user" | "system">("user");
  const [isInstalling, setIsInstalling] = useState(false);

  const [cloneModal, setCloneModal] = useState<InstalledApp | null>(null);
  const [newPackageName, setNewPackageName] = useState("");
  const [newAppName, setNewAppName] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  const [cloneProgress, setCloneProgress] = useState({
    step: 0,
    total: 5,
    message: "",
  });

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeDevice = activeTab?.deviceId
    ? devices.find((d) => d.id === activeTab.deviceId)
    : null;

  const loadApps = useCallback(async () => {
    if (!activeDevice) return;

    setIsLoading(true);
    try {
      const appList = await window.electronAPI["adb:list-apps"](
        activeDevice.id,
        filter
      );
      setApps(appList);
    } catch {
      addToast({ type: "error", title: "Failed to load apps" });
    } finally {
      setIsLoading(false);
    }
  }, [activeDevice?.id, filter, addToast]);

  useEffect(() => {
    if (activeDevice?.id) {
      loadApps();
    }
  }, [activeDevice?.id, filter]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!activeDevice) return;

      const apkFiles = acceptedFiles.filter((f) => f.name.endsWith(".apk"));
      if (apkFiles.length === 0) {
        addToast({ type: "warning", title: "No APK files found" });
        return;
      }

      setIsInstalling(true);
      for (const file of apkFiles) {
        try {
          await window.electronAPI["adb:install-apk"](
            activeDevice.id,
            file.path
          );
          addToast({ type: "success", title: `Installed ${file.name}` });
        } catch (err) {
          addToast({ type: "error", title: `Failed to install ${file.name}` });
        }
      }
      setIsInstalling(false);
      loadApps();
    },
    [activeDevice?.id, loadApps]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/vnd.android.package-archive": [".apk"] },
    noClick: true,
  });

  const handleUninstall = async (packageName: string) => {
    if (!activeDevice) return;

    try {
      await window.electronAPI["adb:uninstall"](activeDevice.id, packageName);
      addToast({ type: "success", title: "App uninstalled" });
      loadApps();
    } catch (err) {
      addToast({ type: "error", title: "Failed to uninstall app" });
    }
  };

  const handleClearData = async (packageName: string) => {
    if (!activeDevice) return;

    try {
      await window.electronAPI["adb:clear-data"](activeDevice.id, packageName);
      addToast({ type: "success", title: "App data cleared" });
    } catch (err) {
      addToast({ type: "error", title: "Failed to clear app data" });
    }
  };

  const handleForceStop = async (packageName: string) => {
    if (!activeDevice) return;

    try {
      await window.electronAPI["adb:force-stop"](activeDevice.id, packageName);
      addToast({ type: "success", title: "App stopped" });
    } catch (err) {
      addToast({ type: "error", title: "Failed to stop app" });
    }
  };

  const handleExportApk = async (app: InstalledApp) => {
    if (!activeDevice) return;

    const savePath = await window.electronAPI["shell:select-save-path"](
      `${app.packageName}.apk`,
      [{ name: "APK Files", extensions: ["apk"] }]
    );

    if (!savePath) return;

    try {
      await window.electronAPI["adb:export-apk"](
        activeDevice.id,
        app.packageName,
        savePath
      );
      addToast({ type: "success", title: "APK exported", message: savePath });
    } catch {
      addToast({ type: "error", title: "Failed to export APK" });
    }
  };

  const openCloneModal = (app: InstalledApp) => {
    setCloneModal(app);
    setNewPackageName(app.packageName + ".clone");
    setNewAppName(app.appName + " Clone");
  };

  const handleCloneApp = async () => {
    if (!activeDevice || !cloneModal) return;

    setIsCloning(true);
    setCloneProgress({
      step: 1,
      total: 4,
      message: "Exporting APK(s) from device...",
    });

    try {
      const tempPath = await window.electronAPI["app:get-user-data-path"]();
      const tempDir = `${tempPath}/clone_${Date.now()}`;

      const apkPaths = await window.electronAPI["adb:export-all-apks"](
        activeDevice.id,
        cloneModal.packageName,
        tempDir
      );

      const isSplitApk = apkPaths.length > 1;

      setCloneProgress({
        step: 2,
        total: 5,
        message: isSplitApk
          ? `Decompiling ${apkPaths.length} APK files...`
          : "Decompiling APK...",
      });

      let modifiedApkPaths: string[];

      if (isSplitApk) {
        setCloneProgress({
          step: 3,
          total: 5,
          message: "Modifying package references & signing...",
        });
        modifiedApkPaths = await window.electronAPI["apk:rename-split-apks"]({
          apkPaths,
          newPackageName,
          newAppName: newAppName || undefined,
        });
      } else {
        setCloneProgress({
          step: 3,
          total: 5,
          message: "Modifying package references & signing...",
        });
        const modifiedApkPath = await window.electronAPI["apk:rename-package"]({
          apkPath: apkPaths[0],
          newPackageName,
          newAppName: newAppName || undefined,
        });
        modifiedApkPaths = [modifiedApkPath];
      }

      setCloneProgress({
        step: 4,
        total: 5,
        message: "Installing cloned app...",
      });

      if (modifiedApkPaths.length > 1) {
        await window.electronAPI["adb:install-multiple"](
          activeDevice.id,
          modifiedApkPaths
        );
      } else {
        await window.electronAPI["adb:install-apk"](
          activeDevice.id,
          modifiedApkPaths[0]
        );
      }

      setCloneProgress({ step: 5, total: 5, message: "Done!" });
      addToast({ type: "success", title: "App cloned successfully!" });
      setCloneModal(null);
      loadApps();
    } catch (err) {
      addToast({
        type: "error",
        title: "Failed to clone app",
        message: String(err),
      });
    } finally {
      setIsCloning(false);
      setCloneProgress({ step: 0, total: 5, message: "" });
    }
  };

  const filteredApps = apps.filter(
    (app) =>
      app.packageName.toLowerCase().includes(search.toLowerCase()) ||
      app.appName.toLowerCase().includes(search.toLowerCase())
  );

  if (!activeDevice) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Package className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">
            No Device Selected
          </h2>
          <p className="text-sm text-zinc-500">
            Connect a device to manage apps
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className="p-6 space-y-4 overflow-y-auto h-full relative"
    >
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="absolute inset-0 bg-accent/10 border-2 border-dashed border-accent rounded-xl z-50 flex items-center justify-center">
          <div className="text-center">
            <Upload className="w-16 h-16 text-accent mx-auto mb-4" />
            <p className="text-lg font-medium text-white">
              Drop APK files here to install
            </p>
          </div>
        </div>
      )}

      <PageHeader title="Applications">
        <Button
          variant="secondary"
          size="sm"
          onClick={loadApps}
          loading={isLoading}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          onClick={async () => {
            const path = await window.electronAPI["shell:select-file"]({
              filters: [{ name: "APK Files", extensions: ["apk"] }],
            });
            if (path)
              onDrop([
                { path, name: path.split("/").pop() || "app.apk" } as File,
              ]);
          }}
          loading={isInstalling}
        >
          <Upload className="w-4 h-4" />
          Install APK
        </Button>
      </PageHeader>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex rounded-lg overflow-hidden border border-border">
          {(["user", "system", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-sm capitalize ${
                filter === f
                  ? "bg-accent text-white"
                  : "bg-bg-tertiary text-zinc-400 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm text-zinc-500">{filteredApps.length} apps</div>

      <div className="space-y-2">
        {filteredApps.map((app) => (
          <div
            key={app.packageName}
            className="bg-bg-secondary border border-border rounded-lg p-3 hover:border-accent/50 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 bg-bg-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {app.appName}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {app.packageName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {app.isSystem && (
                  <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded mr-2">
                    System
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleForceStop(app.packageName)}
                  title="Force Stop"
                >
                  <StopCircle className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleClearData(app.packageName)}
                  title="Clear Data"
                >
                  <Eraser className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExportApk(app)}
                  title="Export APK"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openCloneModal(app)}
                  title="Clone App"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                {!app.isSystem && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleUninstall(app.packageName)}
                    title="Uninstall"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={!!cloneModal}
        onClose={() => !isCloning && setCloneModal(null)}
        title="Clone App"
      >
        <div className="space-y-4">
          {isCloning ? (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-sm text-zinc-300">
                  {cloneProgress.message}
                </span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (cloneProgress.step / cloneProgress.total) * 100
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-2 text-center">
                Step {cloneProgress.step} of {cloneProgress.total}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-zinc-400">
                Clone{" "}
                <strong className="text-white">{cloneModal?.appName}</strong>{" "}
                with a new package name. This allows you to install multiple
                copies of the same app.
              </p>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  New Package Name
                </label>
                <Input
                  value={newPackageName}
                  onChange={(e) => setNewPackageName(e.target.value)}
                  placeholder="com.example.app.clone"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  New App Name (optional)
                </label>
                <Input
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="App Name Clone"
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-xs text-yellow-400">
                  <strong>Note:</strong> Cloning requires Java, APK Tool, and
                  Uber APK Signer to be installed. The process may take a few
                  minutes.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setCloneModal(null)}>
                  Cancel
                </Button>
                <Button onClick={handleCloneApp}>
                  <Copy className="w-4 h-4" />
                  Clone App
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
