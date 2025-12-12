import {
  Smartphone,
  Monitor,
  Package,
  FolderOpen,
  FileText,
  Terminal,
  Camera,
  Zap,
  Wrench,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUiStore } from "../../stores";
import packageJson from "../../../package.json";

type Page =
  | "device"
  | "mirror"
  | "apps"
  | "files"
  | "logcat"
  | "shell"
  | "screenshot"
  | "apk-tools"
  | "quick-actions"
  | "dev-tools";

type MenuItem = {
  id: Page;
  label: string;
  icon: React.ElementType;
  description?: string;
};

const MENU_ITEMS: MenuItem[] = [
  {
    id: "device",
    label: "Overview",
    icon: Smartphone,
    description: "Device info",
  },
  {
    id: "mirror",
    label: "Screen Mirror",
    icon: Monitor,
    description: "scrcpy",
  },
  {
    id: "apps",
    label: "Applications",
    icon: Package,
    description: "Manage apps",
  },
  {
    id: "files",
    label: "File Manager",
    icon: FolderOpen,
    description: "Browse files",
  },
  { id: "logcat", label: "Logcat", icon: FileText, description: "View logs" },
  {
    id: "shell",
    label: "ADB Shell",
    icon: Terminal,
    description: "Run commands",
  },
  {
    id: "screenshot",
    label: "Capture",
    icon: Camera,
    description: "Screenshot & Record",
  },
  {
    id: "quick-actions",
    label: "Quick Actions",
    icon: Zap,
    description: "Device controls",
  },
  {
    id: "apk-tools",
    label: "APK Tools",
    icon: Wrench,
    description: "Modify APKs",
  },
  {
    id: "dev-tools",
    label: "Dev Tools",
    icon: Wrench,
    description: "Reactotron, Flipper",
  },
];

export function Sidemenu() {
  const { currentPage, setCurrentPage, sidebarCollapsed, toggleSidebar } =
    useUiStore();

  return (
    <aside
      className={`bg-bg-secondary border-r border-border flex flex-col transition-all duration-200 ${
        sidebarCollapsed ? "w-16" : "w-56"
      }`}
    >
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left group ${
                  isActive
                    ? "bg-accent text-white"
                    : "text-zinc-400 hover:text-white hover:bg-bg-tertiary"
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isActive
                      ? "text-white"
                      : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
                />
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block truncate">
                      {item.label}
                    </span>
                    {item.description && (
                      <span
                        className={`text-xs truncate block ${
                          isActive ? "text-white/70" : "text-zinc-600"
                        }`}
                      >
                        {item.description}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-2 border-t border-border">
        {!sidebarCollapsed && (
          <div className="text-xs text-zinc-600 text-center mb-2">
            v{packageJson.version}
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-zinc-500 hover:text-white hover:bg-bg-tertiary transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
