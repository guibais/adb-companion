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
});
