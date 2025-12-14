import { useState } from "react";
import {
  Upload,
  Package,
  Copy,
  Edit3,
  Loader2,
  Smartphone,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import type { FileWithPath } from "react-dropzone";
import {
  Button,
  Input,
  Modal,
  ProgressBar,
  PageHeader,
} from "../components/ui";
import { useDeviceStore, useUiStore } from "../stores";
import type { ApkInfo } from "../types";

type ApkAction = "install" | "clone";

type ApkActionProgress = {
  step: number;
  total: number;
  message: string;
};

type ApkActionError = {
  title: string;
  message: string;
};

export function ApkToolsPage() {
  const { devices, tabs, activeTabId } = useDeviceStore();
  const { addToast } = useUiStore();

  const [selectedApk, setSelectedApk] = useState<string | null>(null);
  const [apkInfo, setApkInfo] = useState<ApkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newPackageName, setNewPackageName] = useState("");
  const [newAppName, setNewAppName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const [selectedAction, setSelectedAction] = useState<ApkAction>("install");
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionProgress, setActionProgress] = useState<ApkActionProgress>({
    step: 0,
    total: 3,
    message: "",
  });
  const [actionError, setActionError] = useState<ApkActionError | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeDevice = activeTab?.deviceId
    ? devices.find((d) => d.id === activeTab.deviceId)
    : null;

  const onDrop = async (acceptedFiles: FileWithPath[]) => {
    const apkFile = acceptedFiles.find((f) => f.name.endsWith(".apk"));
    if (!apkFile) {
      addToast({ type: "warning", title: "Please select an APK file" });
      return;
    }

    let apkPath = apkFile.path || "";
    const isAbsolutePath =
      apkPath.startsWith("/") || /^[a-zA-Z]:\\/.test(apkPath);

    if (!isAbsolutePath) {
      try {
        const buffer = await (apkFile as unknown as File).arrayBuffer();
        const bytes = Array.from(new Uint8Array(buffer));
        apkPath = await window.electronAPI["shell:write-temp-file"](
          apkFile.name || "app.apk",
          bytes
        );
      } catch (err) {
        addToast({
          type: "error",
          title: "Failed to read APK",
          message: err instanceof Error ? err.message : "Unknown error",
        });
        return;
      }
    }

    setSelectedApk(apkPath);
    setApkInfo(null);
    setIsLoading(true);

    try {
      const info = await window.electronAPI["apk:get-info"](apkPath);
      setApkInfo(info);
      setNewPackageName(info.packageName + ".clone");
      setNewAppName(info.appName + " Clone");
      setSelectedAction("install");
      setActionError(null);
      setIsActionModalOpen(true);
    } catch (err) {
      addToast({
        type: "error",
        title: "Failed to read APK",
        message: String(err),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/vnd.android.package-archive": [".apk"] },
    maxFiles: 1,
  });

  const handleSelectFile = async () => {
    const path = await window.electronAPI["shell:select-file"]({
      filters: [{ name: "APK Files", extensions: ["apk"] }],
    });

    if (path) {
      onDrop([
        {
          path,
          name: path.split("/").pop() || "app.apk",
        } as unknown as FileWithPath,
      ]);
    }
  };

  const closeActionModal = () => {
    if (isExecutingAction) return;
    setIsActionModalOpen(false);
    setActionError(null);
  };

  const setProgress = (progress: ApkActionProgress) => {
    setActionProgress(progress);
  };

  const resetProgress = () => {
    setActionProgress({ step: 0, total: 3, message: "" });
  };

  const sanitizeErrorMessage = (raw: string) => {
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const filtered = lines.filter(
      (l) =>
        !l.startsWith("at ") &&
        !l.includes("node:internal") &&
        !l.includes("<anonymous>")
    );

    return filtered.slice(0, 10).join("\n");
  };

  const runInstallOnly = async () => {
    setSelectedAction("install");
    setActionError(null);
    await executeSelectedAction();
  };

  const executeSelectedAction = async () => {
    if (!activeDevice) {
      addToast({ type: "warning", title: "No device selected" });
      return;
    }
    if (!selectedApk) return;

    setActionError(null);

    if (selectedAction === "clone" && !newPackageName.trim()) {
      addToast({ type: "warning", title: "New package name is required" });
      return;
    }

    setIsExecutingAction(true);
    setIsRenaming(selectedAction === "clone");

    try {
      if (selectedAction === "install") {
        setProgress({ step: 1, total: 2, message: "Installing APK..." });
        await window.electronAPI["adb:install-apk"](
          activeDevice.id,
          selectedApk
        );
        setProgress({ step: 2, total: 2, message: "Done!" });
        addToast({ type: "success", title: "APK installed" });
        setIsActionModalOpen(false);
        return;
      }

      setProgress({ step: 1, total: 3, message: "Modifying & signing APK..." });
      const modifiedApkPath = await window.electronAPI["apk:rename-package"]({
        apkPath: selectedApk,
        newPackageName: newPackageName.trim(),
        newAppName: newAppName.trim() || undefined,
      });

      setProgress({ step: 2, total: 3, message: "Installing modified APK..." });
      await window.electronAPI["adb:install-apk"](
        activeDevice.id,
        modifiedApkPath
      );

      setProgress({ step: 3, total: 3, message: "Done!" });
      addToast({ type: "success", title: "Modified APK installed" });
      setIsActionModalOpen(false);
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const shortMsg = sanitizeErrorMessage(raw);

      setActionError({
        title: selectedAction === "clone" ? "Clone failed" : "Install failed",
        message: shortMsg,
      });

      addToast({
        type: "error",
        title: "Operation failed",
        message:
          selectedAction === "clone"
            ? "Could not rebuild APK after modification"
            : "Install failed",
      });
    } finally {
      setIsExecutingAction(false);
      setIsRenaming(false);
      resetProgress();
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <PageHeader
        title="APK Tools"
        description="Clone, rename, and modify APK packages"
      />

      {!activeDevice && (
        <div className="flex items-center justify-center">
          <div className="text-center py-10">
            <Smartphone className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-white mb-2">
              No Device Selected
            </h2>
            <p className="text-sm text-zinc-500">
              Connect a device to install APKs
            </p>
          </div>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`bg-bg-secondary border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? "border-accent bg-accent/5"
            : "border-border hover:border-accent/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          {isDragActive ? "Drop APK here" : "Select APK File"}
        </h3>
        <p className="text-sm text-zinc-500 mb-4">
          Drag and drop an APK file or click to browse
        </p>
        <Button variant="secondary" onClick={handleSelectFile}>
          Browse Files
        </Button>
      </div>

      {isLoading && (
        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <ProgressBar value={50} />
          <p className="text-sm text-zinc-400 text-center mt-2">
            Reading APK...
          </p>
        </div>
      )}

      {apkInfo && (
        <>
          <div className="bg-bg-secondary border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Package className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">
                  {apkInfo.appName}
                </h2>
                <p className="text-sm text-zinc-500">{apkInfo.packageName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-zinc-500">Version</p>
                <p className="text-white">
                  {apkInfo.versionName} ({apkInfo.versionCode})
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Min SDK</p>
                <p className="text-white">API {apkInfo.minSdkVersion}</p>
              </div>
              <div>
                <p className="text-zinc-500">Target SDK</p>
                <p className="text-white">API {apkInfo.targetSdkVersion}</p>
              </div>
              <div>
                <p className="text-zinc-500">Permissions</p>
                <p className="text-white">
                  {apkInfo.permissions.length} permissions
                </p>
              </div>
            </div>
          </div>

          <div className="bg-bg-secondary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Copy className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">Next step</h2>
                  <p className="text-sm text-zinc-500">
                    Choose what you want to do with this APK
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                onClick={() => setIsActionModalOpen(true)}
                disabled={!activeDevice}
              >
                Choose Action
              </Button>
            </div>
          </div>

          {apkInfo.permissions.length > 0 && (
            <div className="bg-bg-secondary border border-border rounded-xl p-6">
              <h3 className="text-sm font-medium text-white mb-3">
                Permissions ({apkInfo.permissions.length})
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {apkInfo.permissions.map((perm, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-zinc-400 font-mono bg-bg-tertiary px-2 py-1 rounded"
                  >
                    {perm.replace("android.permission.", "")}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={isActionModalOpen}
        onClose={closeActionModal}
        title="What do you want to do?"
        size="lg"
      >
        <div className="space-y-4">
          {actionError && !isExecutingAction && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm font-medium text-red-400 mb-2">
                {actionError.title}
              </p>
              <pre className="text-xs text-zinc-300 whitespace-pre-wrap break-words">
                {actionError.message}
              </pre>

              {selectedAction === "clone" && (
                <div className="flex justify-end gap-2 mt-3">
                  <Button variant="ghost" onClick={() => setActionError(null)}>
                    Dismiss
                  </Button>
                  <Button onClick={runInstallOnly} disabled={!activeDevice}>
                    Try install only
                  </Button>
                </div>
              )}
            </div>
          )}

          {isExecutingAction ? (
            <div className="py-2">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-sm text-zinc-300">
                  {actionProgress.message}
                </span>
              </div>
              <ProgressBar
                value={actionProgress.step}
                max={Math.max(actionProgress.total, 1)}
                showLabel
              />
              <p className="text-xs text-zinc-500 mt-2 text-center">
                Step {actionProgress.step} of {actionProgress.total}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedAction("install")}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    selectedAction === "install"
                      ? "border-accent bg-accent/10"
                      : "border-border bg-bg-tertiary hover:border-accent/50"
                  }`}
                >
                  <h3 className="text-sm font-medium text-white mb-1">
                    Install only
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Install this APK on the selected device
                  </p>
                </button>

                <button
                  onClick={() => setSelectedAction("clone")}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    selectedAction === "clone"
                      ? "border-accent bg-accent/10"
                      : "border-border bg-bg-tertiary hover:border-accent/50"
                  }`}
                >
                  <h3 className="text-sm font-medium text-white mb-1">
                    Clone / modify
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Change package name and optional app name, then install
                  </p>
                </button>
              </div>

              {selectedAction === "clone" && (
                <div className="space-y-3">
                  <Input
                    label="New Package Name"
                    value={newPackageName}
                    onChange={(e) => setNewPackageName(e.target.value)}
                    placeholder="com.example.app.clone"
                  />
                  <Input
                    label="New App Name (optional)"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    placeholder="App Name Clone"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={closeActionModal}>
                  Cancel
                </Button>
                <Button
                  onClick={executeSelectedAction}
                  disabled={!activeDevice || !selectedApk}
                  loading={isRenaming}
                >
                  <Edit3 className="w-4 h-4" />
                  Run
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <div className="bg-bg-secondary border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-white mb-3">
          About APK Cloning
        </h3>
        <ul className="text-sm text-zinc-400 space-y-2">
          <li>
            • Cloning allows you to install the same app twice with different
            identities
          </li>
          <li>• The cloned APK will be re-signed with a debug certificate</li>
          <li>• Some apps may detect modification and refuse to work</li>
          <li>• Use this feature responsibly and only with apps you own</li>
        </ul>
      </div>
    </div>
  );
}
