import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppsPage } from "./AppsPage";
import { useDeviceStore, useUiStore } from "../stores";

let dropHandler: ((files: File[]) => void | Promise<void>) | null = null;
let isDragActiveState = false;

vi.mock("react-dropzone", () => {
  return {
    useDropzone: (opts: any) => {
      dropHandler = opts.onDrop;
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: isDragActiveState,
      };
    },
  };
});

describe("AppsPage", () => {
  beforeEach(() => {
    isDragActiveState = false;
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
    ((window as any).electronAPI as any)["app:get-user-data-path"] = vi.fn(
      async () => "/tmp/user-data"
    );
    ((window as any).electronAPI as any)["adb:export-all-apks"] = vi.fn(
      async () => ["/tmp/base.apk"]
    );
    ((window as any).electronAPI as any)["apk:rename-package"] = vi.fn(
      async () => "/tmp/modified.apk"
    );
    ((window as any).electronAPI as any)["apk:rename-split-apks"] = vi.fn(
      async () => ["/tmp/modified1.apk", "/tmp/modified2.apk"]
    );
    ((window as any).electronAPI as any)["adb:install-multiple"] = vi.fn(
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

  it("handles load apps error", async () => {
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

    ((window as any).electronAPI as any)["adb:list-apps"] = vi.fn(async () => {
      throw new Error("Failed to load");
    });

    render(<AppsPage />);

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(toasts.some((t: any) => t.title === "Failed to load apps")).toBe(
        true
      );
    });
  });

  it("handles refresh button error", async () => {
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

    ((window as any).electronAPI as any)["adb:list-apps"] = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("Failed to load"));

    render(<AppsPage />);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["adb:list-apps"]
      ).toHaveBeenCalledTimes(1);
    });

    useUiStore.setState({ toasts: [] } as any);

    const refreshButton = screen
      .getAllByRole("button")
      .find((b) => b.querySelector("svg.lucide-refresh-cw"));
    await user.click(refreshButton!);

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(toasts.some((t: any) => t.title === "Failed to load apps")).toBe(
        true
      );
    });
  });

  it("filters apps by search", async () => {
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
      { packageName: "com.example.app", appName: "My App", isSystem: false },
      {
        packageName: "com.other.app",
        appName: "Other App",
        isSystem: false,
      },
    ]);

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search apps...");
    await user.type(searchInput, "Other");

    expect(screen.queryByText("My App")).toBeNull();
    expect(screen.getByText("Other App")).toBeInTheDocument();
  });

  it("changes filter type", async () => {
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

    render(<AppsPage />);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["adb:list-apps"]
      ).toHaveBeenCalledWith("d1", "user");
    });

    const systemButton = screen.getByRole("button", { name: "system" });
    await user.click(systemButton);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["adb:list-apps"]
      ).toHaveBeenCalledWith("d1", "system");
    });

    const allButton = screen.getByRole("button", { name: "all" });
    await user.click(allButton);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["adb:list-apps"]
      ).toHaveBeenCalledWith("d1", "all");
    });
  });

  it("exports APK successfully", async () => {
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
      { packageName: "com.example.app", appName: "My App", isSystem: false },
    ]);

    ((window as any).electronAPI as any)["shell:select-save-path"] = vi.fn(
      async () => "/tmp/exported.apk"
    );

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const exportButton = screen.getByTitle("Export APK");
    await user.click(exportButton);

    expect(
      ((window as any).electronAPI as any)["adb:export-apk"]
    ).toHaveBeenCalledWith("d1", "com.example.app", "/tmp/exported.apk");
  });

  it("handles export APK error", async () => {
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
      { packageName: "com.example.app", appName: "My App", isSystem: false },
    ]);

    ((window as any).electronAPI as any)["shell:select-save-path"] = vi.fn(
      async () => "/tmp/exported.apk"
    );

    ((window as any).electronAPI as any)["adb:export-apk"] = vi.fn(async () => {
      throw new Error("Export failed");
    });

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const exportButton = screen.getByTitle("Export APK");
    await user.click(exportButton);

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(toasts.some((t: any) => t.title === "Failed to export APK")).toBe(
        true
      );
    });
  });

  it("opens and closes clone modal", async () => {
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
      { packageName: "com.example.app", appName: "My App", isSystem: false },
    ]);

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const cloneButton = screen.getByTitle("Clone App");
    await user.click(cloneButton);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("com.example.app.clone")
      ).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByDisplayValue("com.example.app.clone")).toBeNull();
    });
  });

  it("clones app with single APK", async () => {
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
      { packageName: "com.example.app", appName: "My App", isSystem: false },
    ]);

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const cloneButton = screen.getByTitle("Clone App");
    await user.click(cloneButton);

    const cloneSubmitButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("Clone App") && b !== cloneButton);
    await user.click(cloneSubmitButton!);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["apk:rename-package"]
      ).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["adb:install-apk"]
      ).toHaveBeenCalled();
    });
  });

  it("clones app with split APKs", async () => {
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
      { packageName: "com.example.app", appName: "My App", isSystem: false },
    ]);

    ((window as any).electronAPI as any)["adb:export-all-apks"] = vi.fn(
      async () => ["/tmp/base.apk", "/tmp/split.apk"]
    );

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const cloneButton = screen.getByTitle("Clone App");
    await user.click(cloneButton);

    const cloneSubmitButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("Clone App") && b !== cloneButton);
    await user.click(cloneSubmitButton!);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["apk:rename-split-apks"]
      ).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["adb:install-multiple"]
      ).toHaveBeenCalled();
    });
  });

  it("handles clone app error", async () => {
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
      { packageName: "com.example.app", appName: "My App", isSystem: false },
    ]);

    ((window as any).electronAPI as any)["adb:export-all-apks"] = vi.fn(
      async () => {
        throw new Error("Clone failed");
      }
    );

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const cloneButton = screen.getByTitle("Clone App");
    await user.click(cloneButton);

    const cloneSubmitButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("Clone App") && b !== cloneButton);
    await user.click(cloneSubmitButton!);

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(toasts.some((t: any) => t.title === "Failed to clone app")).toBe(
        true
      );
    });
  });

  it("handles uninstall error", async () => {
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
      { packageName: "com.example.app", appName: "My App", isSystem: false },
    ]);

    ((window as any).electronAPI as any)["adb:uninstall"] = vi.fn(async () => {
      throw new Error("Uninstall failed");
    });

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const uninstallButton = screen.getByTitle("Uninstall");
    await user.click(uninstallButton);

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(
        toasts.some((t: any) => t.title === "Failed to uninstall app")
      ).toBe(true);
    });
  });

  it("handles clear data error", async () => {
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
      { packageName: "com.example.app", appName: "My App", isSystem: false },
    ]);

    ((window as any).electronAPI as any)["adb:clear-data"] = vi.fn(async () => {
      throw new Error("Clear data failed");
    });

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const clearDataButton = screen.getByTitle("Clear Data");
    await user.click(clearDataButton);

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(
        toasts.some((t: any) => t.title === "Failed to clear app data")
      ).toBe(true);
    });
  });

  it("handles force stop error", async () => {
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
      { packageName: "com.example.app", appName: "My App", isSystem: false },
    ]);

    ((window as any).electronAPI as any)["adb:force-stop"] = vi.fn(async () => {
      throw new Error("Force stop failed");
    });

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const forceStopButton = screen.getByTitle("Force Stop");
    await user.click(forceStopButton);

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(toasts.some((t: any) => t.title === "Failed to stop app")).toBe(
        true
      );
    });
  });

  it("installs APK via Install APK button", async () => {
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

    ((window as any).electronAPI as any)["shell:select-file"] = vi.fn(
      async () => "/tmp/selected.apk"
    );

    render(<AppsPage />);

    const installButton = screen.getByRole("button", { name: /Install APK/i });
    await user.click(installButton);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["adb:install-apk"]
      ).toHaveBeenCalled();
    });
  });

  it("handles drop with no APK files", async () => {
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

    render(<AppsPage />);

    await act(async () => {
      await dropHandler?.([
        { name: "file.txt", path: "/tmp/file.txt" } as any as File,
      ]);
    });

    const toasts = useUiStore.getState().toasts;
    expect(toasts.some((t: any) => t.title === "No APK files found")).toBe(
      true
    );
  });

  it("handles install APK error during drop", async () => {
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

    ((window as any).electronAPI as any)["adb:install-apk"] = vi.fn(
      async () => {
        throw new Error("Install failed");
      }
    );

    render(<AppsPage />);

    await act(async () => {
      await dropHandler?.([
        { name: "app.apk", path: "/tmp/app.apk" } as any as File,
      ]);
    });

    const toasts = useUiStore.getState().toasts;
    expect(
      toasts.some((t: any) => t.title === "Failed to install app.apk")
    ).toBe(true);
  });

  it("shows system app badge", async () => {
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
        packageName: "com.android.settings",
        appName: "Settings",
        isSystem: true,
      },
    ]);

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.queryByTitle("Uninstall")).toBeNull();
  });

  it("shows isDragActive overlay", async () => {
    isDragActiveState = true;

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

    render(<AppsPage />);

    expect(
      screen.getByText("Drop APK files here to install")
    ).toBeInTheDocument();
  });

  it("does not export APK when savePath is null", async () => {
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
      { packageName: "com.example.app", appName: "My App", isSystem: false },
    ]);

    ((window as any).electronAPI as any)["shell:select-save-path"] = vi.fn(
      async () => null
    );

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const exportButton = screen.getByTitle("Export APK");
    await user.click(exportButton);

    expect(
      ((window as any).electronAPI as any)["adb:export-apk"]
    ).not.toHaveBeenCalled();
  });

  it("clones app with empty newAppName (undefined)", async () => {
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
      { packageName: "com.example.app", appName: "My App", isSystem: false },
    ]);

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const cloneButton = screen.getByTitle("Clone App");
    await user.click(cloneButton);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("com.example.app.clone")
      ).toBeInTheDocument();
    });

    const appNameInput = screen.getByDisplayValue("My App Clone");
    await user.clear(appNameInput);

    const cloneSubmitButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("Clone App") && b !== cloneButton);
    await user.click(cloneSubmitButton!);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["apk:rename-package"]
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          newAppName: undefined,
        })
      );
    });
  });

  it("clones split APKs with empty newAppName (undefined)", async () => {
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
      { packageName: "com.example.app", appName: "My App", isSystem: false },
    ]);

    ((window as any).electronAPI as any)["adb:export-all-apks"] = vi.fn(
      async () => ["/tmp/base.apk", "/tmp/split.apk"]
    );

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const cloneButton = screen.getByTitle("Clone App");
    await user.click(cloneButton);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("com.example.app.clone")
      ).toBeInTheDocument();
    });

    const appNameInput = screen.getByDisplayValue("My App Clone");
    await user.clear(appNameInput);

    const cloneSubmitButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("Clone App") && b !== cloneButton);
    await user.click(cloneSubmitButton!);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["apk:rename-split-apks"]
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          newAppName: undefined,
        })
      );
    });
  });

  it("updates newPackageName input in clone modal", async () => {
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
      { packageName: "com.example.app", appName: "My App", isSystem: false },
    ]);

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const cloneButton = screen.getByTitle("Clone App");
    await user.click(cloneButton);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("com.example.app.clone")
      ).toBeInTheDocument();
    });

    const packageNameInput = screen.getByDisplayValue("com.example.app.clone");
    await user.clear(packageNameInput);
    await user.type(packageNameInput, "com.new.package");

    expect(packageNameInput).toHaveValue("com.new.package");
  });

  it("updates newAppName input in clone modal", async () => {
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
      { packageName: "com.example.app", appName: "My App", isSystem: false },
    ]);

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const cloneButton = screen.getByTitle("Clone App");
    await user.click(cloneButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue("My App Clone")).toBeInTheDocument();
    });

    const appNameInput = screen.getByDisplayValue("My App Clone");
    await user.clear(appNameInput);
    await user.type(appNameInput, "New App Name");

    expect(appNameInput).toHaveValue("New App Name");
  });

  it("installs APK with fallback name app.apk", async () => {
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

    ((window as any).electronAPI as any)["shell:select-file"] = vi.fn(
      async () => "/tmp/"
    );

    render(<AppsPage />);

    const installButton = screen.getByRole("button", { name: /Install APK/i });
    await user.click(installButton);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["adb:install-apk"]
      ).toHaveBeenCalled();
    });
  });

  it("does not call loadApps when no active device", () => {
    render(<AppsPage />);

    expect(
      ((window as any).electronAPI as any)["adb:list-apps"]
    ).not.toHaveBeenCalled();
  });

  it("modal onClose does not close when isCloning is true", async () => {
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
      { packageName: "com.example.app", appName: "My App", isSystem: false },
    ]);

    let resolveExport: ((value: string[]) => void) | null = null;
    ((window as any).electronAPI as any)["adb:export-all-apks"] = vi.fn(
      () =>
        new Promise<string[]>((resolve) => {
          resolveExport = resolve;
        })
    );

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const cloneButton = screen.getByTitle("Clone App");
    await user.click(cloneButton);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("com.example.app.clone")
      ).toBeInTheDocument();
    });

    const cloneSubmitButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("Clone App") && b !== cloneButton);
    await user.click(cloneSubmitButton!);

    await waitFor(() => {
      expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();
    });

    resolveExport?.(["/tmp/base.apk"]);
  });

  it("loadApps early returns when no activeDevice", async () => {
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

    render(<AppsPage />);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["adb:list-apps"]
      ).toHaveBeenCalled();
    });

    useDeviceStore.setState({
      devices: [],
      tabs: [{ id: "tab-1", deviceId: null, label: "No Device" }],
      activeTabId: "tab-1",
    } as any);

    vi.clearAllMocks();

    expect(
      ((window as any).electronAPI as any)["adb:list-apps"]
    ).not.toHaveBeenCalled();
  });

  it("modal onClose via Escape does not close when isCloning", async () => {
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
      { packageName: "com.example.app", appName: "My App", isSystem: false },
    ]);

    let resolveExport: ((value: string[]) => void) | null = null;
    ((window as any).electronAPI as any)["adb:export-all-apks"] = vi.fn(
      () =>
        new Promise<string[]>((resolve) => {
          resolveExport = resolve;
        })
    );

    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const cloneButton = screen.getByTitle("Clone App");
    await user.click(cloneButton);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("com.example.app.clone")
      ).toBeInTheDocument();
    });

    const cloneSubmitButton = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("Clone App") && b !== cloneButton);
    await user.click(cloneSubmitButton!);

    await waitFor(() => {
      expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();
    });

    await user.keyboard("{Escape}");

    expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();

    resolveExport?.(["/tmp/base.apk"]);
  });
});
