import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Header } from "./Header";
import { useDeviceStore, useUiStore } from "../../stores";

describe("Header", () => {
  beforeEach(() => {
    useUiStore.setState({ currentPage: "device" } as any);
    useDeviceStore.setState({
      devices: [
        {
          id: "d1",
          model: "Pixel",
          status: "connected",
          connectionType: "wifi",
          androidVersion: "14",
          sdkVersion: 34,
        },
      ],
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel" }],
      activeTabId: "tab-1",
    } as any);

    ((window as any).electronAPI as any)["app:get-platform"] = vi.fn(
      async () => "darwin"
    );
  });

  it("renders app title and navigates to connect/settings", async () => {
    const user = userEvent.setup();

    render(<Header />);

    expect(screen.getByText("ADB Companion")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Connect" }));
    expect(useUiStore.getState().currentPage).toBe("connect");

    const settingsButton = screen.getAllByRole("button").at(-1);
    if (!settingsButton) throw new Error("Missing settings button");

    await user.click(settingsButton);
    expect(useUiStore.getState().currentPage).toBe("settings");
  });

  it("adds missing connected device tab via + dropdown", async () => {
    const user = userEvent.setup();

    useDeviceStore.setState({
      devices: [
        {
          id: "d1",
          model: "Pixel",
          status: "connected",
          connectionType: "usb",
          androidVersion: "14",
          sdkVersion: 34,
        },
        {
          id: "d2",
          model: "Samsung",
          status: "connected",
          connectionType: "wifi",
          androidVersion: "13",
          sdkVersion: 33,
        },
      ],
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel" }],
      activeTabId: "tab-1",
    } as any);

    vi.spyOn(Date, "now").mockReturnValue(123);

    render(<Header />);

    const plusButton = await screen.findByText("+1");
    await user.hover(plusButton);

    const deviceButton = await screen.findByRole("button", { name: "Samsung" });
    await user.click(deviceButton);

    expect(
      useDeviceStore.getState().tabs.some((t) => t.deviceId === "d2")
    ).toBe(true);
    expect(useUiStore.getState().currentPage).toBe("device");

    vi.restoreAllMocks();
  });

  it("applies darwin padding class when platform is darwin", async () => {
    render(<Header />);

    await waitFor(() => {
      const header = document.querySelector("header");
      expect(header?.className).toContain("pl-20");
    });
  });

  it("handles platform error gracefully", async () => {
    ((window as any).electronAPI as any)["app:get-platform"] = vi.fn(
      async () => {
        throw new Error("Platform error");
      }
    );

    render(<Header />);

    await waitFor(() => {
      const header = document.querySelector("header");
      expect(header?.className).not.toContain("pl-20");
    });
  });

  it("clicks on tab to set active and navigate to device page", async () => {
    const user = userEvent.setup();

    useUiStore.setState({ currentPage: "connect" } as any);
    useDeviceStore.setState({
      devices: [
        {
          id: "d1",
          model: "Pixel",
          status: "connected",
          connectionType: "wifi",
          androidVersion: "14",
          sdkVersion: 34,
        },
      ],
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel" }],
      activeTabId: null,
    } as any);

    render(<Header />);

    const tabElement = screen.getByText("Pixel").closest("div");
    if (!tabElement) throw new Error("Tab element not found");

    await user.click(tabElement);

    expect(useDeviceStore.getState().activeTabId).toBe("tab-1");
    expect(useUiStore.getState().currentPage).toBe("device");
  });

  it("removes tab when clicking X button", async () => {
    const user = userEvent.setup();

    useDeviceStore.setState({
      devices: [
        {
          id: "d1",
          model: "Pixel",
          status: "connected",
          connectionType: "wifi",
          androidVersion: "14",
          sdkVersion: 34,
        },
        {
          id: "d2",
          model: "Samsung",
          status: "connected",
          connectionType: "usb",
          androidVersion: "13",
          sdkVersion: 33,
        },
      ],
      tabs: [
        { id: "tab-1", deviceId: "d1", label: "Pixel" },
        { id: "tab-2", deviceId: "d2", label: "Samsung" },
      ],
      activeTabId: "tab-1",
    } as any);

    render(<Header />);

    const closeIcons = document.querySelectorAll("svg.lucide-x");
    const closeButton = closeIcons[0]?.closest(
      "button"
    ) as HTMLButtonElement | null;
    if (!closeButton) throw new Error("Close button not found");

    await user.click(closeButton);

    expect(
      useDeviceStore.getState().tabs.find((t) => t.id === "tab-1")
    ).toBeUndefined();
  });

  it("shows green status indicator for connected device", () => {
    useDeviceStore.setState({
      devices: [
        {
          id: "d1",
          model: "Pixel",
          status: "connected",
          connectionType: "wifi",
          androidVersion: "14",
          sdkVersion: 34,
        },
      ],
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel" }],
      activeTabId: "tab-1",
    } as any);

    render(<Header />);

    const statusIndicator = document.querySelector(".bg-green-500");
    expect(statusIndicator).toBeInTheDocument();
  });

  it("shows yellow status indicator for non-connected device", () => {
    useDeviceStore.setState({
      devices: [
        {
          id: "d1",
          model: "Pixel",
          status: "unauthorized",
          connectionType: "wifi",
          androidVersion: "14",
          sdkVersion: 34,
        },
      ],
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel" }],
      activeTabId: "tab-1",
    } as any);

    render(<Header />);

    const statusIndicator = document.querySelector(".bg-yellow-500");
    expect(statusIndicator).toBeInTheDocument();
  });

  it("switches to existing tab when clicking device in dropdown", async () => {
    const user = userEvent.setup();

    useDeviceStore.setState({
      devices: [
        {
          id: "d1",
          model: "Pixel",
          status: "connected",
          connectionType: "usb",
          androidVersion: "14",
          sdkVersion: 34,
        },
        {
          id: "d2",
          model: "Samsung",
          status: "connected",
          connectionType: "wifi",
          androidVersion: "13",
          sdkVersion: 33,
        },
      ],
      tabs: [
        { id: "tab-1", deviceId: "d1", label: "Pixel" },
        { id: "tab-2", deviceId: "d2", label: "Samsung" },
      ],
      activeTabId: "tab-1",
    } as any);

    render(<Header />);

    const samsungTab = screen.getByText("Samsung").closest("div");
    if (!samsungTab) throw new Error("Samsung tab not found");

    await user.click(samsungTab);

    expect(useDeviceStore.getState().activeTabId).toBe("tab-2");
    expect(useUiStore.getState().currentPage).toBe("device");
  });

  it("shows cable icon for USB connection type", () => {
    useDeviceStore.setState({
      devices: [
        {
          id: "d1",
          model: "Pixel",
          status: "connected",
          connectionType: "usb",
          androidVersion: "14",
          sdkVersion: 34,
        },
      ],
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel" }],
      activeTabId: "tab-1",
    } as any);

    render(<Header />);

    const cableIcon = document.querySelector(".lucide-cable");
    expect(cableIcon).toBeInTheDocument();
  });

  it("switches to existing tab when clicking device in dropdown that already has a tab", async () => {
    const user = userEvent.setup();

    useDeviceStore.setState({
      devices: [
        {
          id: "d1",
          model: "Pixel",
          status: "connected",
          connectionType: "usb",
          androidVersion: "14",
          sdkVersion: 34,
        },
        {
          id: "d2",
          model: "Samsung",
          status: "connected",
          connectionType: "wifi",
          androidVersion: "13",
          sdkVersion: 33,
        },
        {
          id: "d3",
          model: "OnePlus",
          status: "connected",
          connectionType: "usb",
          androidVersion: "12",
          sdkVersion: 32,
        },
      ],
      tabs: [
        { id: "tab-1", deviceId: "d1", label: "Pixel" },
        { id: "tab-3", deviceId: "d3", label: "OnePlus" },
      ],
      activeTabId: "tab-1",
    } as any);

    render(<Header />);

    const plusButton = await screen.findByText("+1");
    await user.hover(plusButton);

    const deviceButton = await screen.findByRole("button", { name: "Samsung" });
    await user.click(deviceButton);

    const tabsAfter = useDeviceStore.getState().tabs;
    expect(tabsAfter.some((t) => t.deviceId === "d2")).toBe(true);
    expect(useUiStore.getState().currentPage).toBe("device");
  });

  it("activates existing tab when clicking device that already has tab in dropdown", async () => {
    const user = userEvent.setup();

    useDeviceStore.setState({
      devices: [
        {
          id: "d1",
          model: "Pixel",
          status: "connected",
          connectionType: "usb",
          androidVersion: "14",
          sdkVersion: 34,
        },
        {
          id: "d2",
          model: "Samsung",
          status: "connected",
          connectionType: "wifi",
          androidVersion: "13",
          sdkVersion: 33,
        },
      ],
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel" }],
      activeTabId: "tab-1",
    } as any);

    render(<Header />);

    const plusButton = await screen.findByText("+1");
    await user.hover(plusButton);

    const deviceButton = await screen.findByRole("button", { name: "Samsung" });
    await user.click(deviceButton);

    const tabsAfter = useDeviceStore.getState().tabs;
    const samsungTab = tabsAfter.find((t) => t.deviceId === "d2");
    expect(samsungTab).toBeDefined();

    useDeviceStore.setState({
      activeTabId: "tab-1",
    } as any);

    useUiStore.setState({ currentPage: "connect" } as any);

    render(<Header />);

    const plusButton2 = screen.queryByText("+1");
    expect(plusButton2).toBeNull();
  });
});
