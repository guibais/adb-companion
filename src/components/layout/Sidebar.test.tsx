import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Sidebar } from "./Sidebar";
import { useUiStore, useDeviceStore } from "../../stores";

describe("Sidebar", () => {
  beforeEach(() => {
    useUiStore.setState({
      currentPage: "device",
      sidebarCollapsed: false,
    } as any);

    useDeviceStore.setState({
      tabs: [{ id: "tab-1", deviceId: null, label: "No Device" }],
      activeTabId: "tab-1",
    } as any);
  });

  it("disables pages that require a device when none is selected", async () => {
    const user = userEvent.setup();

    render(<Sidebar />);

    const appsButton = screen.getByRole("button", { name: "Applications" });
    expect(appsButton).toBeDisabled();

    await user.click(appsButton);
    expect(useUiStore.getState().currentPage).toBe("device");
  });

  it("navigates when a device is present", async () => {
    const user = userEvent.setup();

    useDeviceStore.setState({
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel" }],
      activeTabId: "tab-1",
    } as any);

    render(<Sidebar />);

    await user.click(screen.getByRole("button", { name: "Logcat" }));
    expect(useUiStore.getState().currentPage).toBe("logcat");

    await user.click(screen.getByRole("button", { name: "Shell" }));
    expect(useUiStore.getState().currentPage).toBe("shell");
  });

  it("toggles collapsed", async () => {
    const user = userEvent.setup();

    render(<Sidebar />);

    const toggleButton = screen.getAllByRole("button").at(-1);
    if (!toggleButton) throw new Error("Missing toggle button");

    await user.click(toggleButton);
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
  });
});
