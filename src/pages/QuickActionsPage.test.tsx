import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuickActionsPage } from "./QuickActionsPage";
import { useDeviceStore, useUiStore } from "../stores";

describe("QuickActionsPage", () => {
  beforeEach(() => {
    useUiStore.setState({ toasts: [] } as any);

    useDeviceStore.setState({
      devices: [],
      tabs: [{ id: "tab-1", deviceId: null, label: "No Device" }],
      activeTabId: "tab-1",
    } as any);

    ((window as any).electronAPI as any)["adb:shell"] = vi.fn(async () => "ok");
    ((window as any).electronAPI as any)["adb:reboot"] = vi.fn(
      async () => undefined
    );
  });

  it("shows no device selected", () => {
    render(<QuickActionsPage />);
    expect(screen.getByText("No Device Selected")).toBeInTheDocument();
  });

  it("executes an action and opens reboot modal", async () => {
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
      ],
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel" }],
      activeTabId: "tab-1",
    } as any);

    render(<QuickActionsPage />);

    await user.click(screen.getByRole("button", { name: /Enable WiFi/i }));

    expect(
      ((window as any).electronAPI as any)["adb:shell"]
    ).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Reboot/i }));

    await user.click(screen.getByRole("button", { name: /Normal Reboot/i }));

    expect(
      ((window as any).electronAPI as any)["adb:reboot"]
    ).toHaveBeenCalledWith("d1", "normal");
  });

  it("handles factory reset modal", async () => {
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
      ],
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel" }],
      activeTabId: "tab-1",
    } as any);

    render(<QuickActionsPage />);

    await user.click(screen.getByRole("button", { name: /Factory Reset/i }));

    const factoryResetButtons = screen.getAllByRole("button", {
      name: /^Factory Reset$/i,
    });
    await user.click(factoryResetButtons[factoryResetButtons.length - 1]);

    expect(
      ((window as any).electronAPI as any)["adb:shell"]
    ).toHaveBeenCalledWith("d1", expect.stringContaining("MASTER_CLEAR"));

    await waitFor(() => {
      expect(useUiStore.getState().toasts.length).toBeGreaterThan(0);
    });
  });
});
