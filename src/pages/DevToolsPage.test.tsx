import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { DevToolsPage } from "./DevToolsPage";
import { useUiStore } from "../stores";

describe("DevToolsPage", () => {
  let devtoolsProgressCallback: ((progress: any) => void) | null = null;

  beforeEach(() => {
    useUiStore.setState({ toasts: [] } as any);
    devtoolsProgressCallback = null;

    (window as any).electronEvents = {
      ...(window as any).electronEvents,
      "devtools:progress": (cb: any) => {
        devtoolsProgressCallback = cb;
        return () => {
          devtoolsProgressCallback = null;
        };
      },
    };

    ((window as any).electronAPI as any)["devtools:check"] = vi.fn(
      async () => []
    );
    ((window as any).electronAPI as any)["devtools:download"] = vi.fn(
      async () => undefined
    );
    ((window as any).electronAPI as any)["devtools:launch"] = vi.fn(
      async () => undefined
    );
    ((window as any).electronAPI as any)["devtools:stop"] = vi.fn(
      async () => undefined
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders empty state when no tools", async () => {
    ((window as any).electronAPI as any)["devtools:check"] = vi.fn(
      async () => []
    );

    render(<DevToolsPage />);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["devtools:check"]
      ).toHaveBeenCalled();
    });

    expect(screen.getByText("No Tools Available")).toBeInTheDocument();
  });

  it("downloads and launches tools", async () => {
    const user = userEvent.setup();

    const checkMock = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: "reactotron",
          name: "Reactotron",
          description: "Desc",
          version: "1",
          isInstalled: false,
          isRunning: false,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "reactotron",
          name: "Reactotron",
          description: "Desc",
          version: "1",
          isInstalled: true,
          isRunning: false,
          path: "/tmp/reactotron",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "reactotron",
          name: "Reactotron",
          description: "Desc",
          version: "1",
          isInstalled: true,
          isRunning: true,
          path: "/tmp/reactotron",
        },
      ])
      .mockResolvedValue([
        {
          id: "reactotron",
          name: "Reactotron",
          description: "Desc",
          version: "1",
          isInstalled: true,
          isRunning: true,
          path: "/tmp/reactotron",
        },
      ]);

    ((window as any).electronAPI as any)["devtools:check"] = checkMock;

    ((window as any).electronAPI as any)["devtools:download"] = vi.fn(
      async () => undefined
    );
    ((window as any).electronAPI as any)["devtools:launch"] = vi.fn(
      async () => undefined
    );
    ((window as any).electronAPI as any)["devtools:stop"] = vi.fn(
      async () => undefined
    );

    render(<DevToolsPage />);

    await waitFor(() => {
      expect(screen.getByText("Reactotron")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Download/i }));
    expect(
      ((window as any).electronAPI as any)["devtools:download"]
    ).toHaveBeenCalledWith("reactotron");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Launch/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Launch/i }));
    expect(
      ((window as any).electronAPI as any)["devtools:launch"]
    ).toHaveBeenCalledWith("reactotron");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Stop/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Stop/i }));
    expect(
      ((window as any).electronAPI as any)["devtools:stop"]
    ).toHaveBeenCalledWith("reactotron");

    expect(useUiStore.getState().toasts.length).toBeGreaterThan(0);
  });

  it("handles download error", async () => {
    const user = userEvent.setup();

    ((window as any).electronAPI as any)["devtools:check"] = vi.fn(async () => [
      {
        id: "reactotron",
        name: "Reactotron",
        description: "Desc",
        version: "1",
        isInstalled: false,
        isRunning: false,
      },
    ]);

    ((window as any).electronAPI as any)["devtools:download"] = vi.fn(
      async () => {
        throw new Error("Download failed");
      }
    );

    render(<DevToolsPage />);

    await waitFor(() => {
      expect(screen.getByText("Reactotron")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Download/i }));

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(toasts.some((t: any) => t.title === "Download failed")).toBe(true);
    });
  });

  it("handles launch error", async () => {
    const user = userEvent.setup();

    ((window as any).electronAPI as any)["devtools:check"] = vi.fn(async () => [
      {
        id: "reactotron",
        name: "Reactotron",
        description: "Desc",
        version: "1",
        isInstalled: true,
        isRunning: false,
        path: "/tmp/reactotron",
      },
    ]);

    ((window as any).electronAPI as any)["devtools:launch"] = vi.fn(
      async () => {
        throw new Error("Launch failed");
      }
    );

    render(<DevToolsPage />);

    await waitFor(() => {
      expect(screen.getByText("Reactotron")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Launch/i }));

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(toasts.some((t: any) => t.title === "Failed to launch tool")).toBe(
        true
      );
    });
  });

  it("handles stop error", async () => {
    const user = userEvent.setup();

    ((window as any).electronAPI as any)["devtools:check"] = vi.fn(async () => [
      {
        id: "reactotron",
        name: "Reactotron",
        description: "Desc",
        version: "1",
        isInstalled: true,
        isRunning: true,
        path: "/tmp/reactotron",
      },
    ]);

    ((window as any).electronAPI as any)["devtools:stop"] = vi.fn(async () => {
      throw new Error("Stop failed");
    });

    render(<DevToolsPage />);

    await waitFor(() => {
      expect(screen.getByText("Reactotron")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Stop/i }));

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(toasts.some((t: any) => t.title === "Failed to stop tool")).toBe(
        true
      );
    });
  });

  it("shows download progress", async () => {
    ((window as any).electronAPI as any)["devtools:check"] = vi.fn(async () => [
      {
        id: "reactotron",
        name: "Reactotron",
        description: "Desc",
        version: "1",
        isInstalled: false,
        isRunning: false,
      },
    ]);

    render(<DevToolsPage />);

    await waitFor(() => {
      expect(screen.getByText("Reactotron")).toBeInTheDocument();
    });

    act(() => {
      devtoolsProgressCallback?.({
        id: "reactotron",
        status: "downloading",
        percentage: 50,
        speed: 1024 * 1024,
        downloadedBytes: 512 * 1024,
        totalBytes: 1024 * 1024,
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Downloading...")).toBeInTheDocument();
    });
  });

  it("shows extracting progress", async () => {
    ((window as any).electronAPI as any)["devtools:check"] = vi.fn(async () => [
      {
        id: "reactotron",
        name: "Reactotron",
        description: "Desc",
        version: "1",
        isInstalled: false,
        isRunning: false,
      },
    ]);

    render(<DevToolsPage />);

    await waitFor(() => {
      expect(screen.getByText("Reactotron")).toBeInTheDocument();
    });

    act(() => {
      devtoolsProgressCallback?.({
        id: "reactotron",
        status: "extracting",
        percentage: 75,
        speed: 0,
        downloadedBytes: 0,
        totalBytes: 0,
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Extracting...")).toBeInTheDocument();
    });
  });

  it("shows installed badge for installed tools", async () => {
    ((window as any).electronAPI as any)["devtools:check"] = vi.fn(async () => [
      {
        id: "reactotron",
        name: "Reactotron",
        description: "Desc",
        version: "1",
        isInstalled: true,
        isRunning: false,
        path: "/tmp/reactotron",
      },
    ]);

    render(<DevToolsPage />);

    await waitFor(() => {
      expect(screen.getByText("Reactotron")).toBeInTheDocument();
    });

    expect(screen.getByText("Installed")).toBeInTheDocument();
  });

  it("calls loadTools after completed progress", async () => {
    const checkMock = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: "reactotron",
          name: "Reactotron",
          description: "Desc",
          version: "1",
          isInstalled: false,
          isRunning: false,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "reactotron",
          name: "Reactotron",
          description: "Desc",
          version: "1",
          isInstalled: true,
          isRunning: false,
          path: "/tmp/reactotron",
        },
      ]);

    ((window as any).electronAPI as any)["devtools:check"] = checkMock;

    render(<DevToolsPage />);

    await waitFor(() => {
      expect(screen.getByText("Reactotron")).toBeInTheDocument();
    });

    vi.useFakeTimers();

    act(() => {
      devtoolsProgressCallback?.({
        id: "reactotron",
        status: "completed",
        percentage: 100,
        speed: 0,
        downloadedBytes: 0,
        totalBytes: 0,
      });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(checkMock).toHaveBeenCalledTimes(2);
  });

  it("logs error when loadTools fails", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    ((window as any).electronAPI as any)["devtools:check"] = vi.fn(async () => {
      throw new Error("check failed");
    });

    render(<DevToolsPage />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to load tools:",
        expect.any(Error)
      );
    });
  });
});
