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

  it("adds tab without deviceId (No Device label)", () => {
    useDeviceStore.getState().addTab();

    const { tabs, activeTabId } = useDeviceStore.getState();
    expect(tabs).toHaveLength(2);
    expect(tabs[1].deviceId).toBeNull();
    expect(tabs[1].label).toBe("No Device");
    expect(activeTabId).toBe(tabs[1].id);
  });

  it("adds tab with non-existent deviceId (No Device label)", () => {
    useDeviceStore.getState().addTab("non-existent-device");

    const { tabs } = useDeviceStore.getState();
    expect(tabs).toHaveLength(2);
    expect(tabs[1].deviceId).toBe("non-existent-device");
    expect(tabs[1].label).toBe("No Device");
  });

  it("removes tab that is not the active tab", () => {
    useDeviceStore.getState().addTab();
    vi.advanceTimersByTime(1);
    useDeviceStore.getState().addTab();

    const { tabs } = useDeviceStore.getState();
    expect(tabs).toHaveLength(3);

    useDeviceStore.getState().setActiveTab(tabs[2].id);

    useDeviceStore.getState().removeTab(tabs[1].id);

    const newState = useDeviceStore.getState();
    expect(newState.tabs).toHaveLength(2);
    expect(newState.activeTabId).toBe(tabs[2].id);
  });

  it("updateTab does not modify other tabs", () => {
    useDeviceStore.getState().addTab();

    const { tabs } = useDeviceStore.getState();
    const originalLabel = tabs[0].label;

    useDeviceStore.getState().updateTab(tabs[1].id, { label: "Updated" });

    expect(useDeviceStore.getState().tabs[0].label).toBe(originalLabel);
    expect(useDeviceStore.getState().tabs[1].label).toBe("Updated");
  });

  it("updateTab with non-existent tabId does not change tabs", () => {
    const originalTabs = [...useDeviceStore.getState().tabs];

    useDeviceStore.getState().updateTab("non-existent-tab", { label: "Test" });

    expect(useDeviceStore.getState().tabs[0].label).toBe(originalTabs[0].label);
  });

  it("setSavedDevices replaces all saved devices", () => {
    useDeviceStore.getState().addSavedDevice({
      id: "s1",
      nickname: "Phone 1",
      ipAddress: "192.168.0.10",
      port: 5555,
      lastConnected: Date.now(),
    } as any);

    expect(useDeviceStore.getState().savedDevices).toHaveLength(1);

    useDeviceStore.getState().setSavedDevices([
      {
        id: "s2",
        nickname: "Phone 2",
        ipAddress: "192.168.0.20",
        port: 5555,
        lastConnected: Date.now(),
      } as any,
      {
        id: "s3",
        nickname: "Phone 3",
        ipAddress: "192.168.0.30",
        port: 5555,
        lastConnected: Date.now(),
      } as any,
    ]);

    expect(useDeviceStore.getState().savedDevices).toHaveLength(2);
    expect(useDeviceStore.getState().savedDevices[0].id).toBe("s2");
    expect(useDeviceStore.getState().savedDevices[1].id).toBe("s3");
  });

  it("setLoadingDevices updates loading state", () => {
    expect(useDeviceStore.getState().isLoadingDevices).toBe(false);

    useDeviceStore.getState().setLoadingDevices(true);
    expect(useDeviceStore.getState().isLoadingDevices).toBe(true);

    useDeviceStore.getState().setLoadingDevices(false);
    expect(useDeviceStore.getState().isLoadingDevices).toBe(false);
  });

  it("setDevices replaces all devices", () => {
    useDeviceStore.getState().setDevices([
      {
        id: "d1",
        model: "Pixel",
        status: "connected",
        connectionType: "usb",
        androidVersion: "14",
        sdkVersion: 34,
      } as any,
      {
        id: "d2",
        model: "Galaxy",
        status: "connected",
        connectionType: "wifi",
        androidVersion: "13",
        sdkVersion: 33,
      } as any,
    ]);

    expect(useDeviceStore.getState().devices).toHaveLength(2);
    expect(useDeviceStore.getState().devices[0].id).toBe("d1");
    expect(useDeviceStore.getState().devices[1].id).toBe("d2");
  });

  it("updateDevice does not modify other devices", () => {
    useDeviceStore.getState().setDevices([
      {
        id: "d1",
        model: "Pixel",
        status: "connected",
        connectionType: "usb",
        androidVersion: "14",
        sdkVersion: 34,
      } as any,
      {
        id: "d2",
        model: "Galaxy",
        status: "connected",
        connectionType: "wifi",
        androidVersion: "13",
        sdkVersion: 33,
      } as any,
    ]);

    useDeviceStore.getState().updateDevice("d1", { status: "offline" } as any);

    expect(useDeviceStore.getState().devices[0].status).toBe("offline");
    expect(useDeviceStore.getState().devices[1].status).toBe("connected");
  });

  it("addDevice replaces existing device with same id", () => {
    useDeviceStore.getState().addDevice({
      id: "d1",
      model: "Pixel",
      status: "connected",
      connectionType: "usb",
      androidVersion: "14",
      sdkVersion: 34,
    } as any);

    useDeviceStore.getState().addDevice({
      id: "d1",
      model: "Pixel Pro",
      status: "connected",
      connectionType: "wifi",
      androidVersion: "14",
      sdkVersion: 34,
    } as any);

    expect(useDeviceStore.getState().devices).toHaveLength(1);
    expect(useDeviceStore.getState().devices[0].model).toBe("Pixel Pro");
  });
});
