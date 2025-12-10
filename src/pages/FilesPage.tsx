import { useState, useEffect, useCallback } from "react";
import {
  FolderOpen,
  File,
  ChevronRight,
  ChevronUp,
  Upload,
  Download,
  Trash2,
  FolderPlus,
  RefreshCw,
  Home,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button, PageHeader } from "../components/ui";
import { useDeviceStore, useUiStore } from "../stores";
import type { FileEntry } from "../types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "-";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(timestamp: number): string {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FilesPage() {
  const { devices, tabs, activeTabId } = useDeviceStore();
  const { addToast } = useUiStore();

  const [currentPath, setCurrentPath] = useState("/sdcard");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeDevice = activeTab?.deviceId
    ? devices.find((d) => d.id === activeTab.deviceId)
    : null;

  const loadFiles = useCallback(async () => {
    if (!activeDevice) return;

    setIsLoading(true);
    try {
      const fileList = await window.electronAPI["adb:list-files"](
        activeDevice.id,
        currentPath
      );
      setFiles(fileList);
      setSelectedFiles(new Set());
    } catch {
      addToast({ type: "error", title: "Failed to load files" });
    } finally {
      setIsLoading(false);
    }
  }, [activeDevice?.id, currentPath, addToast]);

  useEffect(() => {
    if (activeDevice?.id) {
      loadFiles();
    }
  }, [activeDevice?.id, currentPath]);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
  };

  const navigateUp = () => {
    const parts = currentPath.split("/").filter(Boolean);
    if (parts.length > 1) {
      parts.pop();
      setCurrentPath("/" + parts.join("/"));
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!activeDevice) return;

      for (const file of acceptedFiles) {
        try {
          const remotePath = `${currentPath}/${file.name}`;
          await window.electronAPI["adb:push"](
            activeDevice.id,
            file.path,
            remotePath
          );
          addToast({ type: "success", title: `Uploaded ${file.name}` });
        } catch (err) {
          addToast({ type: "error", title: `Failed to upload ${file.name}` });
        }
      }
      loadFiles();
    },
    [activeDevice?.id, currentPath, loadFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
  });

  const handleDownload = async (file: FileEntry) => {
    if (!activeDevice) return;

    const savePath = await window.electronAPI["shell:select-save-path"](
      file.name
    );
    if (!savePath) return;

    try {
      await window.electronAPI["adb:pull"](
        activeDevice.id,
        file.path,
        savePath
      );
      addToast({ type: "success", title: `Downloaded ${file.name}` });
    } catch (err) {
      addToast({ type: "error", title: `Failed to download ${file.name}` });
    }
  };

  const pathParts = currentPath.split("/").filter(Boolean);

  if (!activeDevice) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FolderOpen className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">
            No Device Selected
          </h2>
          <p className="text-sm text-zinc-500">
            Connect a device to browse files
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className="p-6 space-y-4 overflow-hidden h-full flex flex-col relative"
    >
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="absolute inset-0 bg-accent/10 border-2 border-dashed border-accent rounded-xl z-50 flex items-center justify-center">
          <div className="text-center">
            <Upload className="w-16 h-16 text-accent mx-auto mb-4" />
            <p className="text-lg font-medium text-white">
              Drop files here to upload
            </p>
          </div>
        </div>
      )}

      <PageHeader title="File Manager">
        <Button
          variant="secondary"
          size="sm"
          onClick={loadFiles}
          loading={isLoading}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            const path = await window.electronAPI["shell:select-file"]({
              directory: false,
            });
            if (path)
              onDrop([{ path, name: path.split("/").pop() || "file" } as File]);
          }}
        >
          <Upload className="w-4 h-4" />
          Upload
        </Button>
      </PageHeader>

      <div className="flex items-center gap-1 bg-bg-secondary border border-border rounded-lg px-2 py-1 overflow-x-auto">
        <button
          onClick={() => navigateTo("/sdcard")}
          className="p-1 hover:bg-bg-tertiary rounded"
        >
          <Home className="w-4 h-4 text-zinc-400" />
        </button>
        <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
        {pathParts.map((part, idx) => (
          <div key={idx} className="flex items-center">
            <button
              onClick={() =>
                navigateTo("/" + pathParts.slice(0, idx + 1).join("/"))
              }
              className="px-2 py-1 text-sm text-zinc-300 hover:text-white hover:bg-bg-tertiary rounded"
            >
              {part}
            </button>
            {idx < pathParts.length - 1 && (
              <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-bg-secondary border border-border rounded-lg">
        <div className="sticky top-0 bg-bg-tertiary border-b border-border px-4 py-2 grid grid-cols-12 gap-4 text-xs text-zinc-500 font-medium">
          <div className="col-span-6">Name</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-3">Modified</div>
          <div className="col-span-1"></div>
        </div>

        {currentPath !== "/" && (
          <div
            onClick={navigateUp}
            className="px-4 py-2 grid grid-cols-12 gap-4 items-center hover:bg-bg-tertiary cursor-pointer border-b border-border"
          >
            <div className="col-span-6 flex items-center gap-2">
              <ChevronUp className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-300">..</span>
            </div>
            <div className="col-span-2"></div>
            <div className="col-span-3"></div>
            <div className="col-span-1"></div>
          </div>
        )}

        {files.map((file) => (
          <div
            key={file.path}
            onClick={() => file.type === "directory" && navigateTo(file.path)}
            className={`px-4 py-2 grid grid-cols-12 gap-4 items-center border-b border-border transition-colors ${
              file.type === "directory"
                ? "cursor-pointer hover:bg-bg-tertiary"
                : ""
            }`}
          >
            <div className="col-span-6 flex items-center gap-2 min-w-0">
              {file.type === "directory" ? (
                <FolderOpen className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              ) : (
                <File className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              )}
              <span
                className={`text-sm truncate ${
                  file.isHidden ? "text-zinc-500" : "text-zinc-300"
                }`}
              >
                {file.name}
              </span>
            </div>
            <div className="col-span-2 text-xs text-zinc-500">
              {file.type === "file" ? formatBytes(file.size) : "-"}
            </div>
            <div className="col-span-3 text-xs text-zinc-500">
              {formatDate(file.modifiedDate)}
            </div>
            <div className="col-span-1 flex justify-end">
              {file.type === "file" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(file);
                  }}
                  className="p-1 hover:bg-bg-tertiary rounded"
                >
                  <Download className="w-4 h-4 text-zinc-400 hover:text-white" />
                </button>
              )}
            </div>
          </div>
        ))}

        {files.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">This folder is empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
