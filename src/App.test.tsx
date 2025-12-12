import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { useUiStore, useBinaryStore, useDeviceStore } from "./stores";

vi.mock("./components/layout", () => ({
  Header: () => <div data-testid="header">Header</div>,
  StatusBar: () => <div data-testid="statusbar">StatusBar</div>,
  Sidemenu: () => <div data-testid="sidemenu">Sidemenu</div>,
}));

vi.mock("./components/ui", () => ({
  ToastContainer: () => <div data-testid="toast-container">ToastContainer</div>,
}));

vi.mock("./components/setup", () => ({
  SetupScreen: () => <div data-testid="setup-screen">SetupScreen</div>,
}));

vi.mock("./pages", () => ({
  ConnectPage: () => <div data-testid="connect-page">ConnectPage</div>,
  DevicePage: () => <div data-testid="device-page">DevicePage</div>,
  ScreenMirrorPage: () => <div data-testid="mirror-page">ScreenMirrorPage</div>,
  AppsPage: () => <div data-testid="apps-page">AppsPage</div>,
  FilesPage: () => <div data-testid="files-page">FilesPage</div>,
  LogcatPage: () => <div data-testid="logcat-page">LogcatPage</div>,
  ShellPage: () => <div data-testid="shell-page">ShellPage</div>,
  ScreenshotPage: () => <div data-testid="screenshot-page">ScreenshotPage</div>,
  ApkToolsPage: () => <div data-testid="apk-tools-page">ApkToolsPage</div>,
  QuickActionsPage: () => (
    <div data-testid="quick-actions-page">QuickActionsPage</div>
  ),
  SettingsPage: () => <div data-testid="settings-page">SettingsPage</div>,
  DevToolsPage: () => <div data-testid="dev-tools-page">DevToolsPage</div>,
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useBinaryStore.setState({
      status: null,
      isChecking: false,
      setStatus: useBinaryStore.getState().setStatus,
      setChecking: useBinaryStore.getState().setChecking,
    });

    useDeviceStore.setState({
      devices: [],
      tabs: [],
      activeTabId: null,
    } as any);

    ((window as any).electronAPI as any)["binary:check"] = vi.fn(async () => ({
      adb: { installed: true, version: "35.0.0", path: "/usr/bin/adb" },
      scrcpy: { installed: true, version: "2.0", path: "/usr/bin/scrcpy" },
    }));

    (useUiStore.persist as any).onFinishHydration = vi.fn(() => () => {});
    (useUiStore.persist as any).hasHydrated = vi.fn(() => true);
  });

  it("returns null before hydration", () => {
    (useUiStore.persist as any).hasHydrated = vi.fn(() => false);
    (useUiStore.persist as any).onFinishHydration = vi.fn(() => () => {});

    useUiStore.setState({
      isSetupComplete: true,
      currentPage: "connect",
    } as any);

    const { container } = render(<App />);
    expect(container.firstChild).toBeNull();
  });

  it("shows SetupScreen when setup is not complete", async () => {
    useUiStore.setState({
      isSetupComplete: false,
      currentPage: "connect",
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("setup-screen")).toBeInTheDocument();
    });
    expect(screen.getByTestId("toast-container")).toBeInTheDocument();
    expect(screen.queryByTestId("header")).toBeNull();
  });

  it("shows main layout when setup is complete", async () => {
    useUiStore.setState({
      isSetupComplete: true,
      currentPage: "connect",
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("header")).toBeInTheDocument();
    });
    expect(screen.getByTestId("statusbar")).toBeInTheDocument();
    expect(screen.getByTestId("toast-container")).toBeInTheDocument();
    expect(screen.getByTestId("connect-page")).toBeInTheDocument();
  });

  it("renders correct page based on currentPage", async () => {
    useUiStore.setState({
      isSetupComplete: true,
      currentPage: "settings",
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("settings-page")).toBeInTheDocument();
    });
  });

  it("shows Sidemenu on device pages when activeTabId exists", async () => {
    useUiStore.setState({
      isSetupComplete: true,
      currentPage: "device",
    } as any);

    useDeviceStore.setState({
      devices: [{ id: "d1", model: "Pixel", status: "connected" }],
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel" }],
      activeTabId: "tab-1",
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("sidemenu")).toBeInTheDocument();
    });
  });

  it("hides Sidemenu on non-device pages", async () => {
    useUiStore.setState({
      isSetupComplete: true,
      currentPage: "connect",
    } as any);

    useDeviceStore.setState({
      devices: [{ id: "d1", model: "Pixel", status: "connected" }],
      tabs: [{ id: "tab-1", deviceId: "d1", label: "Pixel" }],
      activeTabId: "tab-1",
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("connect-page")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("sidemenu")).toBeNull();
  });

  it("hides Sidemenu when no activeTabId", async () => {
    useUiStore.setState({
      isSetupComplete: true,
      currentPage: "device",
    } as any);

    useDeviceStore.setState({
      devices: [],
      tabs: [],
      activeTabId: null,
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("device-page")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("sidemenu")).toBeNull();
  });

  it("calls binary:check on hydration", async () => {
    useUiStore.setState({
      isSetupComplete: true,
      currentPage: "connect",
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["binary:check"]
      ).toHaveBeenCalled();
    });
  });

  it("handles binary:check error gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    ((window as any).electronAPI as any)["binary:check"] = vi.fn(async () => {
      throw new Error("Check failed");
    });

    useUiStore.setState({
      isSetupComplete: true,
      currentPage: "connect",
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to check binaries:",
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it("falls back to ConnectPage for unknown page", async () => {
    useUiStore.setState({
      isSetupComplete: true,
      currentPage: "unknown-page",
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("connect-page")).toBeInTheDocument();
    });
  });

  it("triggers hydration callback when onFinishHydration fires", async () => {
    let hydrationCallback: (() => void) | null = null;

    (useUiStore.persist as any).hasHydrated = vi.fn(() => false);
    (useUiStore.persist as any).onFinishHydration = vi.fn((cb: () => void) => {
      hydrationCallback = cb;
      return () => {};
    });

    useUiStore.setState({
      isSetupComplete: true,
      currentPage: "connect",
    } as any);

    const { container, rerender } = render(<App />);
    expect(container.firstChild).toBeNull();

    if (hydrationCallback) {
      (hydrationCallback as () => void)();
    }

    rerender(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("header")).toBeInTheDocument();
    });
  });
});
