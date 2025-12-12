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

  it("does not backup when savePath is null", async () => {
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
      async () => null
    );

    render(<BackupPage />);

    await user.click(screen.getByRole("button", { name: /Create Backup/i }));

    expect(
      ((window as any).electronAPI as any)["adb:backup"]
    ).not.toHaveBeenCalled();
  });

  it("does not restore when backupPath is null", async () => {
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

    ((window as any).electronAPI as any)["shell:select-file"] = vi.fn(
      async () => null
    );

    render(<BackupPage />);

    await user.click(
      screen.getByRole("button", { name: /Select Backup File/i })
    );

    expect(
      ((window as any).electronAPI as any)["adb:restore"]
    ).not.toHaveBeenCalled();
  });

  it("handles backup error", async () => {
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

    ((window as any).electronAPI as any)["adb:backup"] = vi.fn(async () => {
      throw new Error("Backup failed");
    });

    render(<BackupPage />);

    await user.click(screen.getByRole("button", { name: /Create Backup/i }));

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(toasts.some((t: any) => t.title === "Backup failed")).toBe(true);
    });
  });

  it("handles restore error", async () => {
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

    ((window as any).electronAPI as any)["shell:select-file"] = vi.fn(
      async () => "/tmp/restore.ab"
    );

    ((window as any).electronAPI as any)["adb:restore"] = vi.fn(async () => {
      throw new Error("Restore failed");
    });

    render(<BackupPage />);

    await user.click(
      screen.getByRole("button", { name: /Select Backup File/i })
    );

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(toasts.some((t: any) => t.title === "Restore failed")).toBe(true);
    });
  });

  it("toggles backup options checkboxes", async () => {
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

    render(<BackupPage />);

    const checkboxes = screen.getAllByRole("checkbox");

    const apkCheckbox = checkboxes[0];
    expect(apkCheckbox).toBeChecked();
    await user.click(apkCheckbox);
    expect(apkCheckbox).not.toBeChecked();

    const sharedCheckbox = checkboxes[1];
    expect(sharedCheckbox).toBeChecked();
    await user.click(sharedCheckbox);
    expect(sharedCheckbox).not.toBeChecked();

    const systemCheckbox = checkboxes[2];
    expect(systemCheckbox).not.toBeChecked();
    await user.click(systemCheckbox);
    expect(systemCheckbox).toBeChecked();

    const allCheckbox = checkboxes[3];
    expect(allCheckbox).not.toBeChecked();
    await user.click(allCheckbox);
    expect(allCheckbox).toBeChecked();
  });
});
