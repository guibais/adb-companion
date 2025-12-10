import { create } from "zustand";
import { persist } from "zustand/middleware";

type Settings = {
  screenshotPath: string;
  recordingPath: string;
  defaultScrcpyResolution: number;
  defaultScrcpyBitrate: number;
  autoConnectLastDevice: boolean;
  showSystemApps: boolean;
  theme: "dark";
};

type SettingsState = Settings & {
  updateSettings: (updates: Partial<Settings>) => void;
  resetSettings: () => void;
};

const defaultSettings: Settings = {
  screenshotPath: "",
  recordingPath: "",
  defaultScrcpyResolution: 1080,
  defaultScrcpyBitrate: 8,
  autoConnectLastDevice: true,
  showSystemApps: false,
  theme: "dark",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      updateSettings: (updates) => set((state) => ({ ...state, ...updates })),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: "settings-storage",
    }
  )
);
