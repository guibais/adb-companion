import { useState } from "react";
import {
  Power,
  Wifi,
  WifiOff,
  Bluetooth,
  BluetoothOff,
  Plane,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button, Modal, PageHeader } from "../components/ui";
import { useDeviceStore, useUiStore } from "../stores";

type QuickAction = {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  command: string;
  dangerous?: boolean;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "wifi-on",
    icon: Wifi,
    label: "Enable WiFi",
    description: "Turn on WiFi",
    command: "svc wifi enable",
  },
  {
    id: "wifi-off",
    icon: WifiOff,
    label: "Disable WiFi",
    description: "Turn off WiFi",
    command: "svc wifi disable",
  },
  {
    id: "bt-on",
    icon: Bluetooth,
    label: "Enable Bluetooth",
    description: "Turn on Bluetooth",
    command: "svc bluetooth enable",
  },
  {
    id: "bt-off",
    icon: BluetoothOff,
    label: "Disable Bluetooth",
    description: "Turn off Bluetooth",
    command: "svc bluetooth disable",
  },
  {
    id: "airplane-on",
    icon: Plane,
    label: "Airplane Mode On",
    description: "Enable airplane mode",
    command:
      "settings put global airplane_mode_on 1 && am broadcast -a android.intent.action.AIRPLANE_MODE",
  },
  {
    id: "airplane-off",
    icon: Plane,
    label: "Airplane Mode Off",
    description: "Disable airplane mode",
    command:
      "settings put global airplane_mode_on 0 && am broadcast -a android.intent.action.AIRPLANE_MODE",
  },
  {
    id: "volume-max",
    icon: Volume2,
    label: "Max Volume",
    description: "Set media volume to max",
    command: "cmd media_session volume --set 15 --stream 3",
  },
  {
    id: "volume-mute",
    icon: VolumeX,
    label: "Mute Volume",
    description: "Mute media volume",
    command: "cmd media_session volume --set 0 --stream 3",
  },
];

const REBOOT_OPTIONS = [
  {
    mode: "normal" as const,
    label: "Normal Reboot",
    description: "Restart the device normally",
  },
  {
    mode: "recovery" as const,
    label: "Recovery Mode",
    description: "Boot into recovery mode",
  },
  {
    mode: "bootloader" as const,
    label: "Bootloader",
    description: "Boot into bootloader/fastboot",
  },
];

export function QuickActionsPage() {
  const { devices, tabs, activeTabId } = useDeviceStore();
  const { addToast } = useUiStore();

  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [showRebootModal, setShowRebootModal] = useState(false);
  const [showFactoryResetModal, setShowFactoryResetModal] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeDevice = activeTab?.deviceId
    ? devices.find((d) => d.id === activeTab.deviceId)
    : null;

  if (!activeDevice) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Power className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">
            No Device Selected
          </h2>
          <p className="text-sm text-zinc-500">
            Connect a device to use quick actions
          </p>
        </div>
      </div>
    );
  }

  const executeAction = async (action: QuickAction) => {
    setIsExecuting(action.id);
    try {
      await window.electronAPI["adb:shell"](activeDevice.id, action.command);
      addToast({
        type: "success",
        title: action.label,
        message: "Action completed",
      });
    } catch (err) {
      addToast({ type: "error", title: "Action failed", message: String(err) });
    } finally {
      setIsExecuting(null);
    }
  };

  const handleReboot = async (mode: "normal" | "recovery" | "bootloader") => {
    try {
      await window.electronAPI["adb:reboot"](activeDevice.id, mode);
      addToast({
        type: "success",
        title: "Rebooting...",
        message: `Rebooting into ${mode} mode`,
      });
      setShowRebootModal(false);
    } catch (err) {
      addToast({ type: "error", title: "Reboot failed" });
    }
  };

  const handleFactoryReset = async () => {
    try {
      await window.electronAPI["adb:shell"](
        activeDevice.id,
        "am broadcast -a android.intent.action.MASTER_CLEAR"
      );
      addToast({ type: "warning", title: "Factory reset initiated" });
      setShowFactoryResetModal(false);
    } catch (err) {
      addToast({ type: "error", title: "Factory reset failed" });
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <PageHeader title="Quick Actions" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => executeAction(action)}
              disabled={isExecuting === action.id}
              className="bg-bg-secondary border border-border rounded-xl p-4 hover:border-accent/50 transition-all text-left group"
            >
              <div className="p-2 bg-bg-tertiary rounded-lg w-fit mb-3 group-hover:bg-accent/10 transition-colors">
                <Icon className="w-5 h-5 text-zinc-400 group-hover:text-accent" />
              </div>
              <h3 className="text-sm font-medium text-white mb-1">
                {action.label}
              </h3>
              <p className="text-xs text-zinc-500">{action.description}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-bg-secondary border border-border rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-4">Power Options</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setShowRebootModal(true)}>
            <RotateCcw className="w-4 h-4" />
            Reboot
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowFactoryResetModal(true)}
          >
            <Trash2 className="w-4 h-4" />
            Factory Reset
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showRebootModal}
        onClose={() => setShowRebootModal(false)}
        title="Reboot Device"
      >
        <div className="space-y-3">
          {REBOOT_OPTIONS.map((option) => (
            <button
              key={option.mode}
              onClick={() => handleReboot(option.mode)}
              className="w-full p-4 bg-bg-tertiary rounded-lg hover:bg-zinc-700 transition-colors text-left"
            >
              <h3 className="text-sm font-medium text-white">{option.label}</h3>
              <p className="text-xs text-zinc-500">{option.description}</p>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={showFactoryResetModal}
        onClose={() => setShowFactoryResetModal(false)}
        title="Factory Reset"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Are you sure?</h3>
          <p className="text-sm text-zinc-400 mb-6">
            This will erase all data on the device. This action cannot be
            undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowFactoryResetModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleFactoryReset}
              className="flex-1"
            >
              Factory Reset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
