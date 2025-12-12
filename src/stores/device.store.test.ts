import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDeviceStore } from "./device.store";

describe("useDeviceStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));

    useDeviceStore.setState({
      devices: [],
      tabs: [{ id: "tab-1", deviceId: null, label: "No Device" }],
      activeTabId: "tab-1",
      savedDevices: [],
      isLoadingDevices: false,
    });

    window.localStorage.clear();
  });

  it("manages devices list", () => {
    useDeviceStore.getState().addDevice({
      id: "d1",
      model: "Pixel",
      status: "connected",
      connectionType: "usb",
      androidVersion: "14",
      sdkVersion: 34,
    } as any);

    expect(useDeviceStore.getState().devices).toHaveLength(1);

    useDeviceStore
      .getState()
      .updateDevice("d1", { status: "disconnected" } as any);

    expect(useDeviceStore.getState().devices[0].status).toBe("disconnected");

    useDeviceStore.getState().removeDevice("d1");

    expect(useDeviceStore.getState().devices).toHaveLength(0);
  });

  it("manages tabs and active tab", () => {
    useDeviceStore.getState().addDevice({
      id: "d1",
      model: "Pixel",
      status: "connected",
      connectionType: "usb",
      androidVersion: "14",
      sdkVersion: 34,
    } as any);

    useDeviceStore.getState().addTab("d1");

    const { tabs, activeTabId } = useDeviceStore.getState();
    expect(tabs).toHaveLength(2);
    expect(activeTabId).toBe(tabs[1].id);
    expect(tabs[1].label).toBe("Pixel");

    useDeviceStore.getState().updateTab(tabs[1].id, { label: "My Device" });
    expect(useDeviceStore.getState().tabs[1].label).toBe("My Device");

    useDeviceStore.getState().removeTab(tabs[1].id);
    expect(useDeviceStore.getState().tabs).toHaveLength(1);
  });

  it("does not remove last tab", () => {
    useDeviceStore.getState().removeTab("tab-1");
    expect(useDeviceStore.getState().tabs).toHaveLength(1);
  });

  it("manages saved devices", () => {
    useDeviceStore.getState().addSavedDevice({
      id: "s1",
      nickname: "Office Phone",
      ipAddress: "192.168.0.10",
      port: 5555,
      lastConnected: Date.now(),
    } as any);

    expect(useDeviceStore.getState().savedDevices).toHaveLength(1);

    useDeviceStore.getState().addSavedDevice({
      id: "s1",
      nickname: "Office Phone 2",
      ipAddress: "192.168.0.10",
      port: 5555,
      lastConnected: Date.now(),
    } as any);

    expect(useDeviceStore.getState().savedDevices).toHaveLength(1);
    expect(useDeviceStore.getState().savedDevices[0].nickname).toBe(
      "Office Phone 2"
    );

    useDeviceStore.getState().removeSavedDevice("s1");
    expect(useDeviceStore.getState().savedDevices).toHaveLength(0);
  });
});
