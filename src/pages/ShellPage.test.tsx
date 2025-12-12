import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShellPage } from "./ShellPage";
import { useDeviceStore, useUiStore } from "../stores";

describe("ShellPage", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.spyOn(Date, "now").mockReturnValue(1735689600000);

    useUiStore.setState({ toasts: [] } as any);
    useDeviceStore.setState({
      devices: [],
      tabs: [{ id: "tab-1", deviceId: null, label: "No Device" }],
      activeTabId: "tab-1",
    } as any);

    ((window as any).electronAPI as any)["adb:shell"] = vi.fn(async () => "ok");
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
  });

  it("shows no device selected", () => {
    render(<ShellPage />);
    expect(screen.getByText("No Device Selected")).toBeInTheDocument();
  });

  it("executes command on send and handles error", async () => {
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

    ((window as any).electronAPI as any)["adb:shell"] = vi
      .fn()
      .mockResolvedValueOnce("hello")
      .mockRejectedValueOnce(new Error("fail"));

    render(<ShellPage />);

    const input = screen.getByPlaceholderText("Enter shell command...");
    const getSendButton = () => {
      const buttons = screen.getAllByRole("button");
      const button = buttons[buttons.length - 1];
      if (!button) throw new Error("Missing send button");
      return button;
    };

    await user.type(input, "echo hi");
    await user.click(getSendButton());

    await waitFor(() => {
      expect(screen.getByText("echo hi")).toBeInTheDocument();
      expect(screen.getByText("hello")).toBeInTheDocument();
    });

    await user.type(input, "bad");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("bad")).toBeInTheDocument();
      expect(screen.getByText(/Error: Error: fail/)).toBeInTheDocument();
    });
  });

  it("supports command history navigation", async () => {
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

    ((window as any).electronAPI as any)["adb:shell"] = vi.fn(
      async () => "out"
    );

    render(<ShellPage />);

    const input = screen.getByPlaceholderText("Enter shell command...");
    const getSendButton = () => {
      const buttons = screen.getAllByRole("button");
      const button = buttons[buttons.length - 1];
      if (!button) throw new Error("Missing send button");
      return button;
    };

    await user.type(input, "cmd1");
    await user.click(getSendButton());

    await user.type(input, "cmd2");
    await user.click(getSendButton());

    await waitFor(() => {
      expect(screen.getByText("cmd1")).toBeInTheDocument();
      expect(screen.getByText("cmd2")).toBeInTheDocument();
    });

    await user.click(input);
    await user.keyboard("{ArrowUp}");
    expect((input as HTMLInputElement).value).toBe("cmd2");

    await user.keyboard("{ArrowUp}");
    expect((input as HTMLInputElement).value).toBe("cmd1");

    await user.keyboard("{ArrowDown}");
    expect((input as HTMLInputElement).value).toBe("cmd2");

    await user.keyboard("{ArrowDown}");
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("clears history and copies output", async () => {
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

    ((window as any).electronAPI as any)["adb:shell"] = vi.fn(
      async () => "out"
    );

    render(<ShellPage />);

    const input = screen.getByPlaceholderText("Enter shell command...");
    const getSendButton = () => {
      const buttons = screen.getAllByRole("button");
      const button = buttons[buttons.length - 1];
      if (!button) throw new Error("Missing send button");
      return button;
    };

    await user.type(input, "cmd");
    await user.click(getSendButton());

    await waitFor(() => {
      expect(screen.getByText("cmd")).toBeInTheDocument();
      expect(screen.getByText("out")).toBeInTheDocument();
    });

    const copySvg = document.querySelector("svg.lucide-copy");
    const copyButton = copySvg?.closest("button") as HTMLButtonElement | null;
    if (!copyButton) throw new Error("Missing copy button");

    await user.click(copyButton);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("out");
    expect(useUiStore.getState().toasts.length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /Clear/i }));

    expect(screen.queryByText("cmd")).toBeNull();
  });

  it("does not execute empty command", async () => {
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

    render(<ShellPage />);

    const input = screen.getByPlaceholderText("Enter shell command...");
    const getSendButton = () => {
      const buttons = screen.getAllByRole("button");
      return buttons[buttons.length - 1];
    };

    await user.clear(input);
    await user.click(getSendButton());

    expect(
      ((window as any).electronAPI as any)["adb:shell"]
    ).not.toHaveBeenCalled();
  });

  it("does not execute whitespace-only command", async () => {
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

    render(<ShellPage />);

    const input = screen.getByPlaceholderText("Enter shell command...");
    await user.type(input, "   ");
    await user.keyboard("{Enter}");

    expect(
      ((window as any).electronAPI as any)["adb:shell"]
    ).not.toHaveBeenCalled();
  });

  it("executes quick command buttons", async () => {
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

    ((window as any).electronAPI as any)["adb:shell"] = vi.fn(async () => "14");

    render(<ShellPage />);

    const androidVersionButton = screen.getByRole("button", {
      name: "Android Version",
    });
    await user.click(androidVersionButton);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["adb:shell"]
      ).toHaveBeenCalledWith("d1", "getprop ro.build.version.release");
    });

    await waitFor(() => {
      expect(screen.getByText("14")).toBeInTheDocument();
    });
  });

  it("shows (no output) when command returns empty string", async () => {
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

    ((window as any).electronAPI as any)["adb:shell"] = vi.fn(async () => "");

    render(<ShellPage />);

    const input = screen.getByPlaceholderText("Enter shell command...");
    await user.type(input, "silent-cmd");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("silent-cmd")).toBeInTheDocument();
      expect(screen.getByText("(no output)")).toBeInTheDocument();
    });
  });
});
