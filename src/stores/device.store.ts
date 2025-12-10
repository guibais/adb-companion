import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Device, SavedDevice } from "../types";

type DeviceTab = {
  id: string;
  deviceId: string | null;
  label: string;
};

type DeviceState = {
  devices: Device[];
  tabs: DeviceTab[];
  activeTabId: string;
  savedDevices: SavedDevice[];
  isLoadingDevices: boolean;

  setDevices: (devices: Device[]) => void;
  addDevice: (device: Device) => void;
  removeDevice: (deviceId: string) => void;
  updateDevice: (deviceId: string, updates: Partial<Device>) => void;

  addTab: (deviceId?: string) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<DeviceTab>) => void;

  setSavedDevices: (devices: SavedDevice[]) => void;
  addSavedDevice: (device: SavedDevice) => void;
  removeSavedDevice: (id: string) => void;

  setLoadingDevices: (loading: boolean) => void;
};

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      devices: [],
      tabs: [{ id: "tab-1", deviceId: null, label: "No Device" }],
      activeTabId: "tab-1",
      savedDevices: [],
      isLoadingDevices: false,

      setDevices: (devices) => set({ devices }),

      addDevice: (device) =>
        set((state) => ({
          devices: [...state.devices.filter((d) => d.id !== device.id), device],
        })),

      removeDevice: (deviceId) =>
        set((state) => ({
          devices: state.devices.filter((d) => d.id !== deviceId),
        })),

      updateDevice: (deviceId, updates) =>
        set((state) => ({
          devices: state.devices.map((d) =>
            d.id === deviceId ? { ...d, ...updates } : d
          ),
        })),

      addTab: (deviceId) => {
        const { tabs, devices } = get();
        const newId = `tab-${Date.now()}`;
        const device = deviceId ? devices.find((d) => d.id === deviceId) : null;
        const label = device ? `${device.model}` : "No Device";

        set({
          tabs: [...tabs, { id: newId, deviceId: deviceId || null, label }],
          activeTabId: newId,
        });
      },

      removeTab: (tabId) => {
        const { tabs, activeTabId } = get();
        if (tabs.length <= 1) return;

        const newTabs = tabs.filter((t) => t.id !== tabId);
        const newActiveId = activeTabId === tabId ? newTabs[0].id : activeTabId;

        set({ tabs: newTabs, activeTabId: newActiveId });
      },

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      updateTab: (tabId, updates) =>
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === tabId ? { ...t, ...updates } : t
          ),
        })),

      setSavedDevices: (savedDevices) => set({ savedDevices }),

      addSavedDevice: (device) =>
        set((state) => ({
          savedDevices: [
            ...state.savedDevices.filter((d) => d.id !== device.id),
            device,
          ],
        })),

      removeSavedDevice: (id) =>
        set((state) => ({
          savedDevices: state.savedDevices.filter((d) => d.id !== id),
        })),

      setLoadingDevices: (isLoadingDevices) => set({ isLoadingDevices }),
    }),
    {
      name: "device-storage",
      partialize: (state) => ({ savedDevices: state.savedDevices }),
    }
  )
);
