import { FolderOpen } from "lucide-react";
import { PageHeader } from "../components/ui";
import { useDeviceStore } from "../stores";

export function FilesPage() {
  const { devices, tabs, activeTabId } = useDeviceStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeDevice = activeTab?.deviceId
    ? devices.find((d) => d.id === activeTab.deviceId)
    : null;

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
    <div className="p-6 space-y-4 overflow-hidden h-full flex flex-col">
      <PageHeader title="Files" />

      <div className="flex-1 flex items-center justify-center bg-bg-secondary border border-border rounded-lg">
        <div className="text-center">
          <FolderOpen className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">File manager removed</p>
        </div>
      </div>
    </div>
  );
}
