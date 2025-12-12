import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConnectPage } from "./ConnectPage";
import { useDeviceStore, useUiStore } from "../stores";

describe("ConnectPage", () => {
  beforeEach(() => {
    vi.useRealTimers();

    vi.spyOn(globalThis, "setInterval").mockImplementation(((fn: any) => {
      fn();
      return 0;
    }) as any);
    vi.spyOn(globalThis, "clearInterval").mockImplementation((() => {}) as any);

    useDeviceStore.setState({
      devices: [],
      tabs: [{ id: "tab-1", deviceId: null, label: "No Device" }],
      activeTabId: "tab-1",
      isLoadingDevices: false,
    } as any);

    useUiStore.setState({ currentPage: "connect", toasts: [] } as any);

    ((window as any).electronAPI as any)["adb:list-devices"] = vi.fn(
      async () => [
        {
          id: "d1",
          model: "Pixel",
          manufacturer: "Google",
          androidVersion: "14",
          sdkVersion: 34,
          status: "connected",
          connectionType: "usb",
        },
      ]
    );

    ((window as any).electronAPI as any)["wifi:start-pairing"] = vi.fn(
      async () => ({
        qrCodeDataUrl: "data:image/png;base64,xyz",
        state: "waiting",
      })
    );
    ((window as any).electronAPI as any)["wifi:stop-pairing"] = vi.fn(
      async () => undefined
    );
    ((window as any).electronAPI as any)["wifi:manual-pair"] = vi.fn(
      async () => true
    );
    ((window as any).electronAPI as any)["wifi:connect"] = vi.fn(
      async () => true
    );

    const wifiPairingListeners: Array<(info: any) => void> = [];
    const wifiConnectedListeners: Array<(info: any) => void> = [];

    (window as any).electronEvents = {
      ...(window as any).electronEvents,
      "wifi:pairing-state": (cb: any) => {
        wifiPairingListeners.push(cb);
        return () => undefined;
      },
      "wifi:connected": (cb: any) => {
        wifiConnectedListeners.push(cb);
        return () => undefined;
      },
    };

    (globalThis as any).__wifiPairingListeners = wifiPairingListeners;
    (globalThis as any).__wifiConnectedListeners = wifiConnectedListeners;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("refreshes devices and opens device tab", async () => {
    const user = userEvent.setup();

    render(<ConnectPage />);

    await waitFor(
      () => {
        expect(
          ((window as any).electronAPI as any)["adb:list-devices"]
        ).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );

    expect(screen.getByText("Available Devices")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open" }));

    expect(useDeviceStore.getState().tabs.length).toBeGreaterThan(1);
    expect(useUiStore.getState().currentPage).toBe("device");
  });

  it("opens wifi modal and connects", async () => {
    const user = userEvent.setup();

    render(<ConnectPage />);

    const wifiCard = screen.getByText("WiFi Connection").closest("button");
    if (!wifiCard) throw new Error("Missing WiFi Connection button");
    await user.click(wifiCard);

    await waitFor(
      () => {
        expect(
          ((window as any).electronAPI as any)["wifi:start-pairing"]
        ).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );

    await user.click(screen.getByRole("button", { name: /Skip/i }));

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "192.168.0.10");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "5555");

    await user.click(screen.getByRole("button", { name: /^Connect$/i }));

    expect(
      ((window as any).electronAPI as any)["wifi:connect"]
    ).toHaveBeenCalledWith("192.168.0.10", 5555);
  });

  it("reacts to wifi pairing-state events", async () => {
    render(<ConnectPage />);

    const listeners = (globalThis as any).__wifiPairingListeners as Array<
      (info: any) => void
    >;

    listeners[0]?.({ state: "paired" });
    expect(useUiStore.getState().toasts.length).toBeGreaterThan(0);

    listeners[0]?.({ state: "error", error: "nope" });
    expect(useUiStore.getState().toasts.length).toBeGreaterThan(1);
  });
});
