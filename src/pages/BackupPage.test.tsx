import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BackupPage } from "./BackupPage";
import { useDeviceStore, useUiStore } from "../stores";

describe("BackupPage", () => {
  beforeEach(() => {
    useUiStore.setState({ toasts: [] } as any);
    useDeviceStore.setState({
      devices: [],
      tabs: [{ id: "tab-1", deviceId: null, label: "No Device" }],
      activeTabId: "tab-1",
    } as any);

    ((window as any).electronAPI as any)["shell:select-save-path"] = vi.fn(
      async () => null
    );
    ((window as any).electronAPI as any)["shell:select-file"] = vi.fn(
      async () => null
    );
    ((window as any).electronAPI as any)["adb:backup"] = vi.fn(
      async () => undefined
    );
    ((window as any).electronAPI as any)["adb:restore"] = vi.fn(
      async () => undefined
    );
  });

  it("shows no device selected", () => {
    render(<BackupPage />);

    expect(screen.getByText("No Device Selected")).toBeInTheDocument();
  });

  it("runs backup and restore flows", async () => {
    const user = userEvent.setup();

    useDeviceStore.setState({
      devices: [
        {
          id: "d1",
          model: "Pixel 8",
          status: "connected",
          connectionType: "usb",
          androidVersion: "14",
          sdkVersion: 34,
        },
      ],
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel 8" }],
      activeTabId: "tab-1",
    } as any);

    ((window as any).electronAPI as any)["shell:select-save-path"] = vi.fn(
      async () => "/tmp/backup.ab"
    );
    ((window as any).electronAPI as any)["shell:select-file"] = vi.fn(
      async () => "/tmp/restore.ab"
    );

    render(<BackupPage />);

    await user.click(screen.getByRole("button", { name: /Create Backup/i }));

    expect(
      ((window as any).electronAPI as any)["adb:backup"]
    ).toHaveBeenCalled();

    await waitFor(() => {
      expect(useUiStore.getState().toasts.length).toBeGreaterThan(0);
    });

    await user.click(
      screen.getByRole("button", { name: /Select Backup File/i })
    );

    expect(
      ((window as any).electronAPI as any)["adb:restore"]
    ).toHaveBeenCalledWith("d1", "/tmp/restore.ab");
  });
});
