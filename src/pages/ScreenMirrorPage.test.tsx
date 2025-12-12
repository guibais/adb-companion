import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScreenMirrorPage } from "./ScreenMirrorPage";
import { useDeviceStore, useUiStore } from "../stores";

describe("ScreenMirrorPage", () => {
  beforeEach(() => {
    useUiStore.setState({ toasts: [] } as any);

    useDeviceStore.setState({
      devices: [],
      tabs: [{ id: "tab-1", deviceId: null, label: "No Device" }],
      activeTabId: "tab-1",
    } as any);

    ((window as any).electronAPI as any)["scrcpy:start"] = vi.fn(async () => 7);
    ((window as any).electronAPI as any)["scrcpy:stop"] = vi.fn(
      async () => undefined
    );
  });

  it("shows no device selected", () => {
    render(<ScreenMirrorPage />);
    expect(screen.getByText("No Device Selected")).toBeInTheDocument();
  });

  it("toggles settings and starts/stops mirror", async () => {
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

    render(<ScreenMirrorPage />);

    await user.click(screen.getByRole("button", { name: /Settings/i }));
    expect(screen.getByText("scrcpy Settings")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Start Mirror/i }));

    expect(
      ((window as any).electronAPI as any)["scrcpy:start"]
    ).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Stop/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Stop/i }));
    expect(
      ((window as any).electronAPI as any)["scrcpy:stop"]
    ).toHaveBeenCalledWith(7);
  });

  it("shows toast on start error", async () => {
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

    ((window as any).electronAPI as any)["scrcpy:start"] = vi.fn(async () => {
      throw new Error("fail");
    });

    render(<ScreenMirrorPage />);

    await user.click(screen.getByRole("button", { name: /Start Mirror/i }));

    expect(useUiStore.getState().toasts.length).toBeGreaterThan(0);
  });
});
