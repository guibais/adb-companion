import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppsPage } from "./AppsPage";
import { useDeviceStore, useUiStore } from "../stores";

let dropHandler: ((files: File[]) => void | Promise<void>) | null = null;

vi.mock("react-dropzone", () => {
  return {
    useDropzone: (opts: any) => {
      dropHandler = opts.onDrop;
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false,
      };
    },
  };
});

describe("AppsPage", () => {
  beforeEach(() => {
    useUiStore.setState({ toasts: [] } as any);

    useDeviceStore.setState({
      devices: [],
      tabs: [{ id: "tab-1", deviceId: null, label: "No Device" }],
      activeTabId: "tab-1",
    } as any);

    ((window as any).electronAPI as any)["adb:list-apps"] = vi.fn(
      async () => []
    );
    ((window as any).electronAPI as any)["adb:install-apk"] = vi.fn(
      async () => undefined
    );
    ((window as any).electronAPI as any)["adb:uninstall"] = vi.fn(
      async () => undefined
    );
    ((window as any).electronAPI as any)["adb:clear-data"] = vi.fn(
      async () => undefined
    );
    ((window as any).electronAPI as any)["adb:force-stop"] = vi.fn(
      async () => undefined
    );
    ((window as any).electronAPI as any)["shell:select-file"] = vi.fn(
      async () => null
    );
    ((window as any).electronAPI as any)["shell:select-save-path"] = vi.fn(
      async () => null
    );
    ((window as any).electronAPI as any)["adb:export-apk"] = vi.fn(
      async () => undefined
    );
  });

  it("shows no device selected", () => {
    render(<AppsPage />);
    expect(screen.getByText("No Device Selected")).toBeInTheDocument();
  });

  it("loads apps and executes actions", async () => {
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

    ((window as any).electronAPI as any)["adb:list-apps"] = vi.fn(async () => [
      {
        packageName: "com.example.app",
        appName: "My App",
        isSystem: false,
      },
    ]);

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole("button");

    await user.click(buttons.find((b) => b.title === "Force Stop")!);
    expect(
      ((window as any).electronAPI as any)["adb:force-stop"]
    ).toHaveBeenCalled();

    await user.click(buttons.find((b) => b.title === "Clear Data")!);
    expect(
      ((window as any).electronAPI as any)["adb:clear-data"]
    ).toHaveBeenCalled();

    await user.click(buttons.find((b) => b.title === "Uninstall")!);
    expect(
      ((window as any).electronAPI as any)["adb:uninstall"]
    ).toHaveBeenCalled();

    await dropHandler?.([
      { name: "app.apk", path: "/tmp/app.apk" } as any as File,
    ]);

    expect(
      ((window as any).electronAPI as any)["adb:install-apk"]
    ).toHaveBeenCalled();
  });
});
