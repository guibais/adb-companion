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

    expect(
      ((window as any).electronAPI as any)["scrcpy:start"]
    ).toHaveBeenCalledWith(
      "d1",
      expect.objectContaining({
        bitRate: 8 * 1000000,
        windowTitle: "Pixel - ADB Companion",
      })
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Stop/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Stop/i }));
    expect(
      ((window as any).electronAPI as any)["scrcpy:stop"]
    ).toHaveBeenCalledWith(7);
  });

  it("updates scrcpy options via settings controls", async () => {
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

    const maxResSelect = screen
      .getByText("Max Resolution")
      .parentElement?.querySelector("select") as HTMLSelectElement | null;
    if (!maxResSelect) throw new Error("Missing Max Resolution select");
    await user.selectOptions(maxResSelect, "720");

    const bitrateInput = screen
      .getByText("Bitrate (Mbps)")
      .parentElement?.querySelector("input") as HTMLInputElement | null;
    if (!bitrateInput) throw new Error("Missing Bitrate input");
    await user.clear(bitrateInput);
    await user.type(bitrateInput, "12");

    const fpsSelect = screen
      .getByText("Max FPS")
      .parentElement?.querySelector("select") as HTMLSelectElement | null;
    if (!fpsSelect) throw new Error("Missing Max FPS select");
    await user.selectOptions(fpsSelect, "120");

    const codecSelect = screen
      .getByText("Video Codec")
      .parentElement?.querySelector("select") as HTMLSelectElement | null;
    if (!codecSelect) throw new Error("Missing Video Codec select");
    await user.selectOptions(codecSelect, "h265");

    const showTouchesCheckbox = screen.getByLabelText("Show Touches");
    await user.click(showTouchesCheckbox);

    await user.click(screen.getByRole("button", { name: /Start Mirror/i }));

    expect(
      ((window as any).electronAPI as any)["scrcpy:start"]
    ).toHaveBeenCalledWith(
      "d1",
      expect.objectContaining({
        maxSize: 720,
        maxFps: 120,
        videoCodec: "h265",
        showTouches: true,
        bitRate: 12 * 1000000,
      })
    );
  });

  it("passes undefined bitRate when option is 0", async () => {
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

    const bitrateInput = screen
      .getByText("Bitrate (Mbps)")
      .parentElement?.querySelector("input") as HTMLInputElement | null;
    if (!bitrateInput) throw new Error("Missing Bitrate input");
    await user.clear(bitrateInput);
    await user.type(bitrateInput, "0");

    await user.click(screen.getByRole("button", { name: /Start Mirror/i }));

    expect(
      ((window as any).electronAPI as any)["scrcpy:start"]
    ).toHaveBeenCalledWith(
      "d1",
      expect.objectContaining({
        bitRate: undefined,
      })
    );
  });

  it("disables Stop when processId is null", async () => {
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

    ((window as any).electronAPI as any)["scrcpy:start"] = vi.fn(
      async () => null
    );

    render(<ScreenMirrorPage />);

    await user.click(screen.getByRole("button", { name: /Start Mirror/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Stop/i })).toBeInTheDocument();
    });

    const stopButton = screen.getByRole("button", { name: /Stop/i });
    expect(stopButton).toBeDisabled();
  });

  it("shows toast on stop error", async () => {
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

    ((window as any).electronAPI as any)["scrcpy:stop"] = vi.fn(async () => {
      throw new Error("stop failed");
    });

    render(<ScreenMirrorPage />);

    await user.click(screen.getByRole("button", { name: /Start Mirror/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Stop/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Stop/i }));

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(toasts.some((t: any) => t.title === "Failed to stop scrcpy")).toBe(
        true
      );
    });
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
