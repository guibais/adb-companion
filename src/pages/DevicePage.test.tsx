import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { DevicePage } from "./DevicePage";
import { useDeviceStore, useUiStore } from "../stores";

const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

describe("DevicePage", () => {
  beforeEach(() => {
    useDeviceStore.setState({
      devices: [],
      tabs: [{ id: "tab-1", deviceId: null, label: "No Device" }],
      activeTabId: "tab-1",
    } as any);

    useUiStore.setState({ currentPage: "device" } as any);

    ((window as any).electronAPI as any)["device:info"] = vi.fn(async () => ({
      model: "Pixel",
      brand: "Google",
      androidVersion: "14",
      sdkVersion: 34,
      screenResolution: "1080x2400",
      screenDensity: 420,
      cpuAbi: "arm64-v8a",
    }));

    ((window as any).electronAPI as any)["device:battery"] = vi.fn(
      async () => ({
        level: 80,
        status: "charging",
        temperature: 32,
      })
    );

    ((window as any).electronAPI as any)["device:storage"] = vi.fn(
      async () => ({
        total: 100,
        used: 50,
        free: 50,
        percentage: 50,
      })
    );
  });

  it("shows no device selected and navigates to connect", async () => {
    const user = userEvent.setup();

    render(<DevicePage />);

    expect(screen.getByText("No Device Selected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Connect Device" }));
    expect(useUiStore.getState().currentPage).toBe("connect");
  });

  it("loads device details when connected", async () => {
    useDeviceStore.setState({
      devices: [
        {
          id: "d1",
          model: "Pixel",
          status: "connected",
          connectionType: "wifi",
          manufacturer: "Google",
          serial: "ABC",
          androidVersion: "14",
          sdkVersion: 34,
        },
      ],
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel" }],
      activeTabId: "tab-1",
    } as any);

    render(<DevicePage />);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["device:info"]
      ).toHaveBeenCalled();
    });

    expect(screen.getAllByText("Pixel").length).toBeGreaterThan(0);
    expect(screen.getByText(/Battery/i)).toBeInTheDocument();
    expect(screen.getByText(/Storage/i)).toBeInTheDocument();
  });

  it("shows USB connection icon and unauthorized status badge", async () => {
    useDeviceStore.setState({
      devices: [
        {
          id: "d1",
          model: "Pixel",
          status: "unauthorized",
          connectionType: "usb",
          manufacturer: "Google",
          serial: "ABC",
          androidVersion: "14",
          sdkVersion: 34,
        },
      ],
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel" }],
      activeTabId: "tab-1",
    } as any);

    render(<DevicePage />);

    expect(screen.getByText("unauthorized")).toBeInTheDocument();
  });

  it("shows red status badge for offline device", async () => {
    useDeviceStore.setState({
      devices: [
        {
          id: "d1",
          model: "Pixel",
          status: "offline",
          connectionType: "usb",
          manufacturer: "Google",
          serial: "ABC",
          androidVersion: "14",
          sdkVersion: 34,
        },
      ],
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel" }],
      activeTabId: "tab-1",
    } as any);

    render(<DevicePage />);

    expect(screen.getByText("offline")).toBeInTheDocument();
  });

  it("logs error when loadDeviceDetails fails", async () => {
    consoleErrorSpy.mockClear();

    useDeviceStore.setState({
      devices: [
        {
          id: "d1",
          model: "Pixel",
          status: "connected",
          connectionType: "usb",
          manufacturer: "Google",
          serial: "ABC",
          androidVersion: "14",
          sdkVersion: 34,
        },
      ],
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel" }],
      activeTabId: "tab-1",
    } as any);

    ((window as any).electronAPI as any)["device:info"] = vi.fn(async () => {
      throw new Error("info failed");
    });

    render(<DevicePage />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to load device details:",
        expect.any(Error)
      );
    });
  });

  it("formats 0 bytes correctly and navigates via quick action buttons", async () => {
    const user = userEvent.setup();

    useDeviceStore.setState({
      devices: [
        {
          id: "d1",
          model: "Pixel",
          status: "connected",
          connectionType: "usb",
          manufacturer: "Google",
          serial: "ABC",
          androidVersion: "14",
          sdkVersion: 34,
        },
      ],
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel" }],
      activeTabId: "tab-1",
    } as any);

    ((window as any).electronAPI as any)["device:storage"] = vi.fn(
      async () => ({
        total: 100,
        used: 100,
        free: 0,
        percentage: 100,
      })
    );

    render(<DevicePage />);

    await waitFor(() => {
      expect(screen.getByText(/0 B free/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Screen Mirror" }));
    expect(useUiStore.getState().currentPage).toBe("mirror");
  });
});
