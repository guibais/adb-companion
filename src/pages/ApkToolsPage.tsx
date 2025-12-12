import { useState } from "react";
import { Upload, Package, Copy, Edit3 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import type { FileWithPath } from "react-dropzone";
import { Button, Input, ProgressBar, PageHeader } from "../components/ui";
import { useUiStore } from "../stores";
import type { ApkInfo } from "../types";

export function ApkToolsPage() {
  const { addToast } = useUiStore();

  const [selectedApk, setSelectedApk] = useState<string | null>(null);
  const [apkInfo, setApkInfo] = useState<ApkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newPackageName, setNewPackageName] = useState("");
  const [newAppName, setNewAppName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const onDrop = async (acceptedFiles: FileWithPath[]) => {
    const apkFile = acceptedFiles.find((f) => f.name.endsWith(".apk"));
    if (!apkFile) {
      addToast({ type: "warning", title: "Please select an APK file" });
      return;
    }

    if (!apkFile.path) {
      addToast({ type: "error", title: "Failed to read APK" });
      return;
    }

    setSelectedApk(apkFile.path);
    setIsLoading(true);

    try {
      const info = await window.electronAPI["apk:get-info"](apkFile.path);
      setApkInfo(info);
      setNewPackageName(info.packageName + ".clone");
      setNewAppName(info.appName + " Clone");
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

  const handleRenamePackage = async () => {
    if (!selectedApk || !newPackageName) return;

    setIsRenaming(true);
    try {
      const outputPath = await window.electronAPI["apk:rename-package"]({
        apkPath: selectedApk,
        newPackageName,
        newAppName: newAppName || undefined,
      });

      addToast({
        type: "success",
        title: "APK modified successfully",
        message: outputPath,
      });
    } catch (err) {
      addToast({
        type: "error",
        title: "Failed to modify APK",
        message: String(err),
      });
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <PageHeader
        title="APK Tools"
        description="Clone, rename, and modify APK packages"
      />

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
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Copy className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">Clone APK</h2>
                <p className="text-sm text-zinc-500">
                  Create a modified copy with a new package name
                </p>
              </div>
            </div>

            <div className="space-y-4">
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
              <Button
                onClick={handleRenamePackage}
                loading={isRenaming}
                className="w-full"
              >
                <Edit3 className="w-4 h-4" />
                Create Modified APK
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
