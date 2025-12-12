import { useEffect, useState } from "react";
import {
  Smartphone,
  Battery,
  HardDrive,
  Cpu,
  Monitor,
  Wifi,
  Cable,
} from "lucide-react";
import { useDeviceStore, useUiStore } from "../stores";
import type { DeviceInfo, BatteryInfo, StorageInfo } from "../types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function InfoCard({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="bg-bg-tertiary rounded-xl p-4 flex items-start gap-3">
      <div className="p-2 bg-accent/10 rounded-lg">
        <Icon className="w-5 h-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-white truncate">{value}</p>
        {subValue && (
          <p className="text-xs text-zinc-400 truncate">{subValue}</p>
        )}
      </div>
    </div>
  );
}

export function DevicePage() {
  const { devices, tabs, activeTabId } = useDeviceStore();
  const { setCurrentPage } = useUiStore();

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo | null>(null);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeDevice = activeTab?.deviceId
    ? devices.find((d) => d.id === activeTab.deviceId)
    : null;

  useEffect(() => {
    if (activeDevice?.status === "connected") {
      const loadDeviceDetails = async () => {
        setIsLoading(true);
        try {
          const [info, battery, storage] = await Promise.all([
            window.electronAPI["device:info"](activeDevice.id),
            window.electronAPI["device:battery"](activeDevice.id),
            window.electronAPI["device:storage"](activeDevice.id),
          ]);
          setDeviceInfo(info);
          setBatteryInfo(battery);
          setStorageInfo(storage);
        } catch (err) {
          console.error("Failed to load device details:", err);
        } finally {
          setIsLoading(false);
        }
      };
      loadDeviceDetails();
    } else {
      setDeviceInfo(null);
      setBatteryInfo(null);
      setStorageInfo(null);
    }
  }, [activeDevice?.id, activeDevice?.status]);

  if (!activeDevice) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Smartphone className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">
            No Device Selected
          </h2>
          <p className="text-sm text-zinc-500 mb-4">
            Select a device tab or connect a new device
          </p>
          <button
            onClick={() => setCurrentPage("connect")}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Connect Device
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-accent/10 rounded-2xl">
          <Smartphone className="w-10 h-10 text-accent" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              {activeDevice.model}
            </h1>
            {activeDevice.connectionType === "wifi" ? (
              <Wifi className="w-5 h-5 text-purple-400" />
            ) : (
              <Cable className="w-5 h-5 text-blue-400" />
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeDevice.status === "connected"
                  ? "bg-green-500/20 text-green-400"
                  : activeDevice.status === "unauthorized"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {activeDevice.status}
            </span>
          </div>
          <p className="text-zinc-400">
            {activeDevice.manufacturer} • {activeDevice.serial}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-bg-tertiary rounded-xl p-4 animate-pulse"
            >
              <div className="h-4 bg-bg-secondary rounded w-20 mb-2" />
              <div className="h-5 bg-bg-secondary rounded w-32" />
            </div>
          ))}
        </div>
      ) : (
        deviceInfo && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <InfoCard
              icon={Smartphone}
              label="Model"
              value={deviceInfo.model}
              subValue={deviceInfo.brand}
            />
            <InfoCard
              icon={Cpu}
              label="Android Version"
              value={deviceInfo.androidVersion}
              subValue={`SDK ${deviceInfo.sdkVersion}`}
            />
            <InfoCard
              icon={Monitor}
              label="Screen"
              value={deviceInfo.screenResolution}
              subValue={`${deviceInfo.screenDensity} dpi`}
            />
            <InfoCard icon={Cpu} label="CPU" value={deviceInfo.cpuAbi} />
            {batteryInfo && (
              <InfoCard
                icon={Battery}
                label="Battery"
                value={`${batteryInfo.level}%`}
                subValue={`${batteryInfo.status} • ${batteryInfo.temperature}°C`}
              />
            )}
            {storageInfo && (
              <InfoCard
                icon={HardDrive}
                label="Storage"
                value={`${storageInfo.percentage}% used`}
                subValue={`${formatBytes(storageInfo.free)} free`}
              />
            )}
          </div>
        )
      )}

      {deviceInfo && (
        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Screen Mirror", page: "mirror" },
              { label: "Apps", page: "apps" },
              { label: "Files", page: "files" },
              { label: "Shell", page: "shell" },
              { label: "Logcat", page: "logcat" },
              { label: "Screenshot", page: "screenshot" },
              { label: "Quick Actions", page: "quick-actions" },
              { label: "Backup", page: "backup" },
            ].map(({ label, page }) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page as any)}
                className="p-4 bg-bg-tertiary rounded-xl text-sm font-medium text-white hover:bg-zinc-700 transition-colors text-left"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
