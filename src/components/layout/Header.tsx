import { useEffect, useState } from "react";
import { Smartphone, Wifi, Cable, Plus, X, Settings } from "lucide-react";
import { useDeviceStore, useUiStore } from "../../stores";

export function Header() {
  const { devices, tabs, activeTabId, addTab, removeTab, setActiveTab } =
    useDeviceStore();
  const { setCurrentPage, currentPage } = useUiStore();

  const [platform, setPlatform] = useState<string>("");

  useEffect(() => {
    window.electronAPI["app:get-platform"]()
      .then(setPlatform)
      .catch(() => setPlatform(""));
  }, []);

  const dragStyle = {
    WebkitAppRegion: "drag",
  } as unknown as React.CSSProperties;
  const noDragStyle = {
    WebkitAppRegion: "no-drag",
  } as unknown as React.CSSProperties;

  const connectedDevices = devices.filter((d) => d.status === "connected");

  const handleDeviceClick = (deviceId: string) => {
    const existingTab = tabs.find((t) => t.deviceId === deviceId);
    if (existingTab) {
      setActiveTab(existingTab.id);
    } else {
      addTab(deviceId);
    }
    setCurrentPage("device");
  };

  return (
    <header
      className={`h-14 bg-bg-secondary border-b border-border flex items-center px-4 gap-4 shrink-0 ${
        platform === "darwin" ? "pl-20" : ""
      }`}
      style={dragStyle}
    >
      <div className="flex items-center gap-2" style={noDragStyle}>
        <div className="w-8 h-8 bg-gradient-to-br from-accent to-green-400 rounded-lg flex items-center justify-center">
          <span className="text-sm font-bold text-white">A</span>
        </div>
        <h1 className="text-sm font-semibold text-white hidden sm:block">
          ADB Companion
        </h1>
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setCurrentPage("connect")}
          style={noDragStyle}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
            currentPage === "connect"
              ? "bg-accent text-white"
              : "text-zinc-400 hover:text-white hover:bg-bg-tertiary"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Connect</span>
        </button>

        {tabs
          .filter((t) => t.deviceId)
          .map((tab) => {
            const device = devices.find((d) => d.id === tab.deviceId);
            const isActive =
              tab.id === activeTabId && currentPage !== "connect";

            return (
              <div
                key={tab.id}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "text-zinc-400 hover:text-white hover:bg-bg-tertiary"
                }`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage("device");
                }}
                style={noDragStyle}
              >
                {device?.connectionType === "wifi" ? (
                  <Wifi className="w-3.5 h-3.5" />
                ) : (
                  <Cable className="w-3.5 h-3.5" />
                )}
                <span className="max-w-32 truncate">{tab.label}</span>
                {device && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      device.status === "connected"
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    }`}
                  />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTab(tab.id);
                  }}
                  style={noDragStyle}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

        {connectedDevices.filter((d) => !tabs.find((t) => t.deviceId === d.id))
          .length > 0 && (
          <div className="relative group">
            <button
              className="flex items-center gap-1 px-2 py-1.5 text-sm text-zinc-500 hover:text-white transition-colors"
              style={noDragStyle}
            >
              <Smartphone className="w-4 h-4" />
              <span>
                +
                {
                  connectedDevices.filter(
                    (d) => !tabs.find((t) => t.deviceId === d.id)
                  ).length
                }
              </span>
            </button>
            <div className="absolute top-full left-0 mt-1 bg-bg-secondary border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-48">
              {connectedDevices
                .filter((d) => !tabs.find((t) => t.deviceId === d.id))
                .map((device) => (
                  <button
                    key={device.id}
                    onClick={() => handleDeviceClick(device.id)}
                    style={noDragStyle}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-bg-tertiary first:rounded-t-lg last:rounded-b-lg"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{device.model}</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setCurrentPage("settings")}
        style={noDragStyle}
        className={`p-2 rounded-lg transition-colors ${
          currentPage === "settings"
            ? "bg-accent text-white"
            : "text-zinc-400 hover:text-white hover:bg-bg-tertiary"
        }`}
      >
        <Settings className="w-5 h-5" />
      </button>
    </header>
  );
}
