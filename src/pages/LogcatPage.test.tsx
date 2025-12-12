import { render, screen, waitFor } from "@testing-library/react";
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
  beforeEach(() => {
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

    const listeners: Array<(entry: any) => void> = [];
    (window as any).electronEvents = {
      ...(window as any).electronEvents,
      "logcat:entry": (cb: any) => {
        listeners.push(cb);
        return () => undefined;
      },
    };
    (globalThis as any).__logcatListeners = listeners;

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
});
