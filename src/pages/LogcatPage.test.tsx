import { render, screen, waitFor, act, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LogcatPage } from "./LogcatPage";
import { useDeviceStore, useUiStore } from "../stores";

vi.mock("react-virtuoso", () => {
  return {
    Virtuoso: ({ data, itemContent }: any) => {
      return (
        <div>
          {(data || []).map((item: any, idx: number) => (
            <div key={idx}>{itemContent(idx, item)}</div>
          ))}
        </div>
      );
    },
  };
});

describe("LogcatPage", () => {
  let logcatListeners: Array<(entry: any) => void> = [];

  beforeEach(() => {
    logcatListeners = [];
    useUiStore.setState({ toasts: [] } as any);

    useDeviceStore.setState({
      devices: [],
      tabs: [{ id: "tab-1", deviceId: null, label: "No Device" }],
      activeTabId: "tab-1",
    } as any);

    ((window as any).electronAPI as any)["adb:logcat-start"] = vi.fn(
      () => undefined
    );
    ((window as any).electronAPI as any)["adb:logcat-stop"] = vi.fn(
      () => undefined
    );
    ((window as any).electronAPI as any)["adb:logcat-clear"] = vi.fn(
      async () => undefined
    );

    (window as any).electronEvents = {
      ...(window as any).electronEvents,
      "logcat:entry": (cb: any) => {
        logcatListeners.push(cb);
        return () => undefined;
      },
    };
    (globalThis as any).__logcatListeners = logcatListeners;

    vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
      const el = document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        tag
      ) as any;
      if (tag === "a") {
        el.click = () => undefined;
      }
      return el;
    }) as any);
  });

  it("shows no device selected", () => {
    render(<LogcatPage />);
    expect(screen.getByText("No Device Selected")).toBeInTheDocument();
  });

  it("starts/stops/clears and filters", async () => {
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

    render(<LogcatPage />);

    await user.click(screen.getByRole("button", { name: /^Start$/i }));
    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["adb:logcat-start"]
      ).toHaveBeenCalled();
    });

    const listeners = (globalThis as any).__logcatListeners as Array<
      (e: any) => void
    >;
    listeners[0]?.({
      timestamp: "2025-01-01 00:00:00.000",
      pid: 1,
      tid: 2,
      level: "I",
      tag: "MyTag",
      message: "hello",
    });

    await waitFor(() => {
      expect(screen.getByText("hello")).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText("Filter by tag..."), "mytag");
    expect(screen.getByText(/\(filtered\)/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Stop/i }));
    expect(
      ((window as any).electronAPI as any)["adb:logcat-stop"]
    ).toHaveBeenCalled();

    const clearSvg = document.querySelector("svg.lucide-trash2");
    const clearButton = clearSvg?.closest("button") as HTMLButtonElement | null;
    if (!clearButton) throw new Error("Missing clear button");
    await user.click(clearButton);
    expect(
      ((window as any).electronAPI as any)["adb:logcat-clear"]
    ).toHaveBeenCalled();
  });

  it("exports logs", async () => {
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

    render(<LogcatPage />);

    const listeners = (globalThis as any).__logcatListeners as Array<
      (e: any) => void
    >;
    listeners[0]?.({
      timestamp: "2025-01-01 00:00:00.000",
      pid: 1,
      tid: 2,
      level: "I",
      tag: "MyTag",
      message: "hello",
    });

    await waitFor(() => {
      expect(screen.getByText("hello")).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole("button")[1]);
    expect(useUiStore.getState().toasts.length).toBeGreaterThan(0);
  });

  it("filters by log level", async () => {
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

    render(<LogcatPage />);

    act(() => {
      logcatListeners[0]?.({
        timestamp: "2025-01-01 00:00:00.000",
        pid: 1,
        tid: 2,
        level: "D",
        tag: "Debug",
        message: "debug message",
      });
      logcatListeners[0]?.({
        timestamp: "2025-01-01 00:00:01.000",
        pid: 1,
        tid: 2,
        level: "E",
        tag: "Error",
        message: "error message",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("debug message")).toBeInTheDocument();
      expect(screen.getByText("error message")).toBeInTheDocument();
    });

    const levelSelect = screen.getByRole("combobox");
    await user.selectOptions(levelSelect, "E");

    expect(screen.queryByText("debug message")).toBeNull();
    expect(screen.getByText("error message")).toBeInTheDocument();
  });

  it("filters by search message", async () => {
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

    render(<LogcatPage />);

    act(() => {
      logcatListeners[0]?.({
        timestamp: "2025-01-01 00:00:00.000",
        pid: 1,
        tid: 2,
        level: "I",
        tag: "Tag1",
        message: "first message",
      });
      logcatListeners[0]?.({
        timestamp: "2025-01-01 00:00:01.000",
        pid: 1,
        tid: 2,
        level: "I",
        tag: "Tag2",
        message: "second message",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("first message")).toBeInTheDocument();
    });

    await user.type(
      screen.getByPlaceholderText("Search messages..."),
      "second"
    );

    expect(screen.queryByText("first message")).toBeNull();
    expect(screen.getByText("second message")).toBeInTheDocument();
  });

  it("toggles auto-scroll", async () => {
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

    render(<LogcatPage />);

    const autoScrollCheckbox = screen.getByRole("checkbox");
    expect(autoScrollCheckbox).toBeChecked();

    await user.click(autoScrollCheckbox);
    expect(autoScrollCheckbox).not.toBeChecked();

    await user.click(autoScrollCheckbox);
    expect(autoScrollCheckbox).toBeChecked();
  });

  it("shows waiting for logs when running with no logs", async () => {
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

    render(<LogcatPage />);

    expect(
      screen.getByText("Click Start to begin capturing logs")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Start$/i }));

    await waitFor(() => {
      expect(screen.getByText("Waiting for logs...")).toBeInTheDocument();
    });
  });

  it("displays different log level colors", async () => {
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

    render(<LogcatPage />);

    act(() => {
      logcatListeners[0]?.({
        timestamp: "2025-01-01 00:00:00.000",
        pid: 1,
        tid: 2,
        level: "V",
        tag: "Verbose",
        message: "verbose msg",
      });
      logcatListeners[0]?.({
        timestamp: "2025-01-01 00:00:01.000",
        pid: 1,
        tid: 2,
        level: "D",
        tag: "Debug",
        message: "debug msg",
      });
      logcatListeners[0]?.({
        timestamp: "2025-01-01 00:00:02.000",
        pid: 1,
        tid: 2,
        level: "W",
        tag: "Warning",
        message: "warning msg",
      });
      logcatListeners[0]?.({
        timestamp: "2025-01-01 00:00:03.000",
        pid: 1,
        tid: 2,
        level: "E",
        tag: "Error",
        message: "error msg",
      });
      logcatListeners[0]?.({
        timestamp: "2025-01-01 00:00:04.000",
        pid: 1,
        tid: 2,
        level: "F",
        tag: "Fatal",
        message: "fatal msg",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("verbose msg")).toBeInTheDocument();
      expect(screen.getByText("debug msg")).toBeInTheDocument();
      expect(screen.getByText("warning msg")).toBeInTheDocument();
      expect(screen.getByText("error msg")).toBeInTheDocument();
      expect(screen.getByText("fatal msg")).toBeInTheDocument();
    });
  });

  it("shows recording status when running", async () => {
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

    render(<LogcatPage />);

    expect(screen.getByText("⏸️ Paused")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Start$/i }));

    await waitFor(() => {
      expect(screen.getByText("🔴 Recording")).toBeInTheDocument();
    });
  });

  it("passes filter options to logcat-start", async () => {
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

    render(<LogcatPage />);

    await user.type(screen.getByPlaceholderText("Filter by tag..."), "MyApp");
    await user.type(screen.getByPlaceholderText("Search messages..."), "error");
    await user.selectOptions(screen.getByRole("combobox"), "W");

    await user.click(screen.getByRole("button", { name: /^Start$/i }));

    expect(
      ((window as any).electronAPI as any)["adb:logcat-start"]
    ).toHaveBeenCalledWith("d1", {
      tag: "MyApp",
      level: "W",
      search: "error",
    });
  });

  it("filters out logs below selected level", async () => {
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

    render(<LogcatPage />);

    act(() => {
      logcatListeners[0]?.({
        timestamp: "2025-01-01 00:00:00.000",
        pid: 1,
        tid: 2,
        level: "V",
        tag: "Tag",
        message: "verbose",
      });
      logcatListeners[0]?.({
        timestamp: "2025-01-01 00:00:01.000",
        pid: 1,
        tid: 2,
        level: "I",
        tag: "Tag",
        message: "info",
      });
      logcatListeners[0]?.({
        timestamp: "2025-01-01 00:00:02.000",
        pid: 1,
        tid: 2,
        level: "W",
        tag: "Tag",
        message: "warning",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("verbose")).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByRole("combobox"), "I");

    expect(screen.queryByText("verbose")).toBeNull();
    expect(screen.getByText("info")).toBeInTheDocument();
    expect(screen.getByText("warning")).toBeInTheDocument();
  });

  it("does not call start/stop/clear without active device", async () => {
    render(<LogcatPage />);

    expect(screen.getByText("No Device Selected")).toBeInTheDocument();

    expect(
      ((window as any).electronAPI as any)["adb:logcat-start"]
    ).not.toHaveBeenCalled();
    expect(
      ((window as any).electronAPI as any)["adb:logcat-stop"]
    ).not.toHaveBeenCalled();
    expect(
      ((window as any).electronAPI as any)["adb:logcat-clear"]
    ).not.toHaveBeenCalled();
  });
});
