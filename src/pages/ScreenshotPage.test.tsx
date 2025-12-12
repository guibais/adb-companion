import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScreenshotPage } from "./ScreenshotPage";
import { useDeviceStore, useUiStore } from "../stores";

describe("ScreenshotPage", () => {
  beforeEach(() => {
    useUiStore.setState({ toasts: [] } as any);

    useDeviceStore.setState({
      devices: [],
      tabs: [{ id: "tab-1", deviceId: null, label: "No Device" }],
      activeTabId: "tab-1",
    } as any);

    ((window as any).electronAPI as any)["adb:screenshot"] = vi.fn(
      async () => "/tmp/a b.png"
    );
    ((window as any).electronAPI as any)["adb:start-recording"] = vi.fn(
      async () => undefined
    );
    ((window as any).electronAPI as any)["adb:stop-recording"] = vi.fn(
      async () => "/tmp/rec.mp4"
    );
    ((window as any).electronAPI as any)["shell:open-external"] = vi.fn(
      async () => undefined
    );
  });

  it("shows no device selected", () => {
    render(<ScreenshotPage />);
    expect(screen.getByText("No Device Selected")).toBeInTheDocument();
  });

  it("takes screenshot and opens folder", async () => {
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

    render(<ScreenshotPage />);

    await user.click(screen.getByRole("button", { name: /Take Screenshot/i }));

    expect(
      ((window as any).electronAPI as any)["adb:screenshot"]
    ).toHaveBeenCalledWith("d1");

    await waitFor(() => {
      expect(screen.getByAltText("Screenshot")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Open Folder/i }));
    expect(
      ((window as any).electronAPI as any)["shell:open-external"]
    ).toHaveBeenCalled();

    expect(
      ((window as any).electronAPI as any)["shell:open-external"]
    ).toHaveBeenCalledWith("file:///tmp");
  });

  it("openFolder early returns when folder is empty", async () => {
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

    ((window as any).electronAPI as any)["adb:screenshot"] = vi.fn(
      async () => "file.png"
    );

    render(<ScreenshotPage />);

    await user.click(screen.getByRole("button", { name: /Take Screenshot/i }));

    await waitFor(() => {
      expect(screen.getByAltText("Screenshot")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Open Folder/i }));

    expect(
      ((window as any).electronAPI as any)["shell:open-external"]
    ).not.toHaveBeenCalled();
  });

  it("records and stops recording", async () => {
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

    render(<ScreenshotPage />);

    await user.click(screen.getByRole("button", { name: /Start Recording/i }));
    expect(
      ((window as any).electronAPI as any)["adb:start-recording"]
    ).toHaveBeenCalled();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Stop Recording/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Stop Recording/i }));
    expect(
      ((window as any).electronAPI as any)["adb:stop-recording"]
    ).toHaveBeenCalledWith("d1");
  });

  it("updates recording duration and quality", async () => {
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

    render(<ScreenshotPage />);

    const range = screen.getByRole("slider");
    fireEvent.change(range, { target: { value: "60" } });

    const qualitySelect = screen.getByRole("combobox");
    await user.selectOptions(qualitySelect, "8000000");

    await user.click(screen.getByRole("button", { name: /Start Recording/i }));

    expect(
      ((window as any).electronAPI as any)["adb:start-recording"]
    ).toHaveBeenCalledWith(
      "d1",
      expect.objectContaining({
        duration: 60,
        bitRate: 8000000,
      })
    );
  });

  it("shows error toast on start recording error", async () => {
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

    ((window as any).electronAPI as any)["adb:start-recording"] = vi.fn(
      async () => {
        throw new Error("nope");
      }
    );

    render(<ScreenshotPage />);

    await user.click(screen.getByRole("button", { name: /Start Recording/i }));

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(
        toasts.some((t: any) => t.title === "Failed to start recording")
      ).toBe(true);
    });
  });

  it("shows error toast on stop recording error", async () => {
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

    ((window as any).electronAPI as any)["adb:stop-recording"] = vi.fn(
      async () => {
        throw new Error("nope");
      }
    );

    render(<ScreenshotPage />);

    await user.click(screen.getByRole("button", { name: /Start Recording/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Stop Recording/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Stop Recording/i }));

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(
        toasts.some((t: any) => t.title === "Failed to stop recording")
      ).toBe(true);
    });
  });

  it("shows error toast on screenshot error", async () => {
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

    ((window as any).electronAPI as any)["adb:screenshot"] = vi.fn(async () => {
      throw new Error("nope");
    });

    render(<ScreenshotPage />);

    await user.click(screen.getByRole("button", { name: /Take Screenshot/i }));
    expect(useUiStore.getState().toasts.length).toBeGreaterThan(0);
  });
});
