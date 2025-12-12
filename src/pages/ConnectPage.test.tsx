import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConnectPage } from "./ConnectPage";
import { useDeviceStore, useUiStore } from "../stores";

describe("ConnectPage", () => {
  let wifiPairingListeners: Array<(info: any) => void> = [];
  let wifiConnectedListeners: Array<(info: any) => void> = [];

  beforeEach(() => {
    vi.useRealTimers();
    wifiPairingListeners = [];
    wifiConnectedListeners = [];

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

    act(() => {
      listeners[0]?.({ state: "paired" });
    });
    expect(useUiStore.getState().toasts.length).toBeGreaterThan(0);

    act(() => {
      listeners[0]?.({ state: "error", error: "nope" });
    });
    expect(useUiStore.getState().toasts.length).toBeGreaterThan(1);
  });

  it("handles wifi:connected event", async () => {
    const user = userEvent.setup();

    render(<ConnectPage />);

    const wifiCard = screen.getByText("WiFi Connection").closest("button");
    if (!wifiCard) throw new Error("Missing WiFi Connection button");
    await user.click(wifiCard);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["wifi:start-pairing"]
      ).toHaveBeenCalled();
    });

    act(() => {
      wifiConnectedListeners[0]?.({ address: "192.168.1.100", port: 5555 });
    });

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(toasts.some((t: any) => t.title === "Connected!")).toBe(true);
    });
  });

  it("handles manual pairing", async () => {
    const user = userEvent.setup();

    render(<ConnectPage />);

    const wifiCard = screen.getByText("WiFi Connection").closest("button");
    if (!wifiCard) throw new Error("Missing WiFi Connection button");
    await user.click(wifiCard);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["wifi:start-pairing"]
      ).toHaveBeenCalled();
    });

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "192.168.0.10");
    await user.type(inputs[1], "37123");
    await user.type(inputs[2], "123456");

    await user.click(screen.getByRole("button", { name: /^Pair$/i }));

    expect(
      ((window as any).electronAPI as any)["wifi:manual-pair"]
    ).toHaveBeenCalledWith("192.168.0.10", 37123, "123456");
  });

  it("handles manual pairing failure", async () => {
    const user = userEvent.setup();

    ((window as any).electronAPI as any)["wifi:manual-pair"] = vi.fn(
      async () => false
    );

    render(<ConnectPage />);

    const wifiCard = screen.getByText("WiFi Connection").closest("button");
    if (!wifiCard) throw new Error("Missing WiFi Connection button");
    await user.click(wifiCard);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["wifi:start-pairing"]
      ).toHaveBeenCalled();
    });

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "192.168.0.10");
    await user.type(inputs[1], "37123");
    await user.type(inputs[2], "123456");

    await user.click(screen.getByRole("button", { name: /^Pair$/i }));

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(toasts.some((t: any) => t.title === "Pairing failed")).toBe(true);
    });
  });

  it("handles manual pairing error", async () => {
    const user = userEvent.setup();

    ((window as any).electronAPI as any)["wifi:manual-pair"] = vi.fn(
      async () => {
        throw new Error("Network error");
      }
    );

    render(<ConnectPage />);

    const wifiCard = screen.getByText("WiFi Connection").closest("button");
    if (!wifiCard) throw new Error("Missing WiFi Connection button");
    await user.click(wifiCard);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["wifi:start-pairing"]
      ).toHaveBeenCalled();
    });

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "192.168.0.10");
    await user.type(inputs[1], "37123");
    await user.type(inputs[2], "123456");

    await user.click(screen.getByRole("button", { name: /^Pair$/i }));

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(toasts.some((t: any) => t.title === "Pairing error")).toBe(true);
    });
  });

  it("handles connection failure", async () => {
    const user = userEvent.setup();

    ((window as any).electronAPI as any)["wifi:connect"] = vi.fn(
      async () => false
    );

    render(<ConnectPage />);

    const wifiCard = screen.getByText("WiFi Connection").closest("button");
    if (!wifiCard) throw new Error("Missing WiFi Connection button");
    await user.click(wifiCard);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["wifi:start-pairing"]
      ).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: /Skip/i }));

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "192.168.0.10");

    await user.click(screen.getByRole("button", { name: /^Connect$/i }));

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(toasts.some((t: any) => t.title === "Connection failed")).toBe(
        true
      );
    });
  });

  it("handles connection error", async () => {
    const user = userEvent.setup();

    ((window as any).electronAPI as any)["wifi:connect"] = vi.fn(async () => {
      throw new Error("Connection error");
    });

    render(<ConnectPage />);

    const wifiCard = screen.getByText("WiFi Connection").closest("button");
    if (!wifiCard) throw new Error("Missing WiFi Connection button");
    await user.click(wifiCard);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["wifi:start-pairing"]
      ).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: /Skip/i }));

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "192.168.0.10");

    await user.click(screen.getByRole("button", { name: /^Connect$/i }));

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(toasts.some((t: any) => t.title === "Connection error")).toBe(
        true
      );
    });
  });

  it("handles wifi:start-pairing error", async () => {
    const user = userEvent.setup();

    ((window as any).electronAPI as any)["wifi:start-pairing"] = vi.fn(
      async () => {
        throw new Error("Failed to start pairing");
      }
    );

    render(<ConnectPage />);

    const wifiCard = screen.getByText("WiFi Connection").closest("button");
    if (!wifiCard) throw new Error("Missing WiFi Connection button");
    await user.click(wifiCard);

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(
        toasts.some((t: any) => t.message === "Failed to start WiFi pairing")
      ).toBe(true);
    });
  });

  it("shows unauthorized device status", async () => {
    ((window as any).electronAPI as any)["adb:list-devices"] = vi.fn(
      async () => [
        {
          id: "d1",
          model: "Pixel",
          manufacturer: "Google",
          androidVersion: "14",
          sdkVersion: 34,
          status: "unauthorized",
          connectionType: "usb",
        },
      ]
    );

    render(<ConnectPage />);

    await waitFor(() => {
      expect(screen.getByText("unauthorized")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "Open" })).toBeNull();
  });

  it("shows wifi device icon", async () => {
    ((window as any).electronAPI as any)["adb:list-devices"] = vi.fn(
      async () => [
        {
          id: "d1",
          model: "Pixel",
          manufacturer: "Google",
          androidVersion: "14",
          sdkVersion: 34,
          status: "connected",
          connectionType: "wifi",
        },
      ]
    );

    render(<ConnectPage />);

    await waitFor(() => {
      expect(screen.getByText("Pixel")).toBeInTheDocument();
    });

    const wifiIcon = document.querySelector(".lucide-wifi");
    expect(wifiIcon).toBeInTheDocument();
  });

  it("navigates back to pair from connect", async () => {
    const user = userEvent.setup();

    render(<ConnectPage />);

    const wifiCard = screen.getByText("WiFi Connection").closest("button");
    if (!wifiCard) throw new Error("Missing WiFi Connection button");
    await user.click(wifiCard);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["wifi:start-pairing"]
      ).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: /Skip/i }));

    expect(screen.getByText("Paired!")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Back to Pair/i }));

    expect(screen.getByText("Pair with Code")).toBeInTheDocument();
  });

  it("clicks USB Connection card to start scanning", async () => {
    const user = userEvent.setup();

    render(<ConnectPage />);

    const usbCard = screen.getByText("USB Connection").closest("button");
    if (!usbCard) throw new Error("Missing USB Connection button");
    await user.click(usbCard);

    expect(screen.getByText("Scanning for devices...")).toBeInTheDocument();
  });

  it("logs refreshDevices error to console.error", async () => {
    const user = userEvent.setup();
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    ((window as any).electronAPI as any)["adb:list-devices"] = vi.fn(
      async () => {
        throw new Error("boom");
      }
    );

    useDeviceStore.setState({
      devices: [
        {
          id: "d1",
          model: "Pixel",
          manufacturer: "Google",
          androidVersion: "14",
          sdkVersion: 34,
          status: "connected",
          connectionType: "usb",
        },
      ],
    } as any);

    render(<ConnectPage />);

    const refreshButton = screen.getByRole("button", { name: /Refresh/i });
    await user.click(refreshButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to refresh devices:",
        expect.any(Error)
      );
    });
  });

  it("closeWifiModal stops pairing and resets form", async () => {
    const user = userEvent.setup();

    render(<ConnectPage />);

    const wifiCard = screen.getByText("WiFi Connection").closest("button");
    if (!wifiCard) throw new Error("Missing WiFi Connection button");
    await user.click(wifiCard);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["wifi:start-pairing"]
      ).toHaveBeenCalled();
    });

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "192.168.0.10");

    const backdrop = document.querySelector(
      ".fixed.inset-0.z-50 .absolute.inset-0"
    ) as HTMLDivElement | null;
    if (!backdrop) throw new Error("Missing modal backdrop");
    fireEvent.click(backdrop);

    expect(
      ((window as any).electronAPI as any)["wifi:stop-pairing"]
    ).toHaveBeenCalled();

    await user.click(wifiCard);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["wifi:start-pairing"]
      ).toHaveBeenCalledTimes(2);
    });

    const inputsAfter = screen.getAllByRole("textbox");
    expect((inputsAfter[0] as HTMLInputElement).value).toBe("");
  });

  it("renders USB card non-scanning style after opening WiFi modal", async () => {
    const user = userEvent.setup();

    render(<ConnectPage />);

    const wifiCard = screen.getByText("WiFi Connection").closest("button");
    if (!wifiCard) throw new Error("Missing WiFi Connection button");
    await user.click(wifiCard);

    const usbCard = screen.getByText("USB Connection").closest("button");
    if (!usbCard) throw new Error("Missing USB Connection button");
    expect(usbCard.className).toContain("border-border");
  });

  it("shows Pairing... indicator when pairingInfo.state is pairing", async () => {
    const user = userEvent.setup();

    ((window as any).electronAPI as any)["wifi:start-pairing"] = vi.fn(
      async () => ({
        qrCodeDataUrl: "data:image/png;base64,xyz",
        state: "pairing",
      })
    );

    render(<ConnectPage />);

    const wifiCard = screen.getByText("WiFi Connection").closest("button");
    if (!wifiCard) throw new Error("Missing WiFi Connection button");
    await user.click(wifiCard);

    await waitFor(() => {
      expect(screen.getByText("Pairing...")).toBeInTheDocument();
    });
  });

  it("early returns in handleConnect when connectIp is empty", async () => {
    const user = userEvent.setup();

    render(<ConnectPage />);

    const wifiCard = screen.getByText("WiFi Connection").closest("button");
    if (!wifiCard) throw new Error("Missing WiFi Connection button");
    await user.click(wifiCard);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["wifi:start-pairing"]
      ).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: /Skip/i }));

    const connectButton = screen.getByRole("button", { name: /^Connect$/i });
    fireEvent.click(connectButton);

    expect(
      ((window as any).electronAPI as any)["wifi:connect"]
    ).not.toHaveBeenCalled();
  });

  it("early returns in handleManualPair when inputs missing", async () => {
    const user = userEvent.setup();

    render(<ConnectPage />);

    const wifiCard = screen.getByText("WiFi Connection").closest("button");
    if (!wifiCard) throw new Error("Missing WiFi Connection button");
    await user.click(wifiCard);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["wifi:start-pairing"]
      ).toHaveBeenCalled();
    });

    const pairButton = screen.getByRole("button", { name: /^Pair$/i });
    fireEvent.click(pairButton);

    expect(
      ((window as any).electronAPI as any)["wifi:manual-pair"]
    ).not.toHaveBeenCalled();
  });

  it("shows offline device status", async () => {
    ((window as any).electronAPI as any)["adb:list-devices"] = vi.fn(
      async () => [
        {
          id: "d1",
          model: "Pixel",
          manufacturer: "Google",
          androidVersion: "14",
          sdkVersion: 34,
          status: "offline",
          connectionType: "usb",
        },
      ]
    );

    render(<ConnectPage />);

    await waitFor(() => {
      expect(screen.getByText("offline")).toBeInTheDocument();
    });
  });
});
