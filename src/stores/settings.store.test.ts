import { beforeEach, describe, expect, it } from "vitest";
import { useSettingsStore } from "./settings.store";

describe("useSettingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      screenshotPath: "",
      recordingPath: "",
      defaultScrcpyResolution: 1080,
      defaultScrcpyBitrate: 8,
      autoConnectLastDevice: true,
      showSystemApps: false,
      theme: "dark",
    } as any);

    window.localStorage.clear();
  });

  it("updates settings", () => {
    useSettingsStore.getState().updateSettings({
      screenshotPath: "/tmp/screens",
      showSystemApps: true,
    });

    const state = useSettingsStore.getState();
    expect(state.screenshotPath).toBe("/tmp/screens");
    expect(state.showSystemApps).toBe(true);
  });

  it("resets settings", () => {
    useSettingsStore.getState().updateSettings({
      defaultScrcpyResolution: 720,
      autoConnectLastDevice: false,
    });

    useSettingsStore.getState().resetSettings();

    const state = useSettingsStore.getState();
    expect(state.defaultScrcpyResolution).toBe(1080);
    expect(state.autoConnectLastDevice).toBe(true);
  });
});
