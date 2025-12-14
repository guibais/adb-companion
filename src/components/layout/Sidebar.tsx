import { clsx } from "clsx";
import {
  Smartphone,
  Monitor,
  Package,
  FileText,
  Terminal,
  Camera,
  Wrench,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUiStore, useDeviceStore } from "../../stores";

const menuItems = [
  { id: "device", label: "Device Info", icon: Smartphone },
  { id: "mirror", label: "Screen Mirror", icon: Monitor },
  { id: "apps", label: "Applications", icon: Package },
  { id: "logcat", label: "Logcat", icon: FileText },
  { id: "shell", label: "Shell", icon: Terminal },
  { id: "screenshot", label: "Screenshot", icon: Camera },
  { id: "apk-tools", label: "APK Tools", icon: Wrench },
  { id: "quick-actions", label: "Quick Actions", icon: Zap },
] as const;

export function Sidebar() {
  const { currentPage, setCurrentPage, sidebarCollapsed, toggleSidebar } =
    useUiStore();
  const { tabs, activeTabId } = useDeviceStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const hasDevice = activeTab?.deviceId !== null;

  return (
    <aside
      className={clsx(
        "h-full bg-bg-secondary border-r border-border flex flex-col transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const isDisabled = item.id !== "device" && !hasDevice;

            return (
              <button
                key={item.id}
                onClick={() =>
                  !isDisabled && setCurrentPage(item.id as typeof currentPage)
                }
                disabled={isDisabled}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  isActive
                    ? "bg-accent/10 text-accent border-l-2 border-accent"
                    : isDisabled
                    ? "text-zinc-600 cursor-not-allowed"
                    : "text-zinc-400 hover:text-white hover:bg-bg-tertiary",
                  sidebarCollapsed && "justify-center"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-2 border-t border-border">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 text-zinc-400 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
