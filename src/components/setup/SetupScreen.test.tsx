import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SetupScreen } from "./SetupScreen";
import { useBinaryStore, useUiStore } from "../../stores";

describe("SetupScreen", () => {
  let downloadProgressCallback: ((progress: any) => void) | null = null;

  beforeEach(() => {
    vi.useRealTimers();
    downloadProgressCallback = null;

    useUiStore.setState({ isSetupComplete: false } as any);
    useBinaryStore.setState({ status: null, isDownloading: false } as any);

    (window.electronAPI as any)["binary:check"] = vi.fn(async () => ({
      platformTools: {
        name: "platform-tools",
        version: "35.0.0",
        isInstalled: true,
      },
      scrcpy: { name: "scrcpy", version: "2.6", isInstalled: true },
      java: { name: "java", version: "21", isInstalled: true },
      apktool: { name: "apktool", version: "2.9", isInstalled: true },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "1.3",
        isInstalled: true,
      },
    }));

    (window.electronAPI as any)["binary:download-all"] = vi.fn(
      async () => undefined
    );

    (window.electronAPI as any)["binary:download"] = vi.fn(
      async () => undefined
    );

    (window.electronEvents as any)["download:progress"] = vi.fn((cb: any) => {
      downloadProgressCallback = cb;
      return () => {
        downloadProgressCallback = null;
      };
    });

    (window.electronAPI as any)["shell:open-external"] = vi.fn(
      async () => undefined
    );
  });

  it("loads binary status and allows continue", async () => {
    const user = userEvent.setup({ delay: null });

    render(<SetupScreen />);

    await waitFor(() => {
      expect((window.electronAPI as any)["binary:check"]).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: "Get Started" }));

    expect(useUiStore.getState().isSetupComplete).toBe(true);
  });

  it("runs download all when clicking Download All Tools", async () => {
    const user = userEvent.setup({ delay: null });

    (window.electronAPI as any)["binary:check"] = vi.fn(async () => {
      await new Promise((resolve) => globalThis.setTimeout(resolve, 0));
      return {
        platformTools: {
          name: "platform-tools",
          version: "",
          isInstalled: false,
        },
        scrcpy: { name: "scrcpy", version: "", isInstalled: false },
        java: { name: "java", version: "", isInstalled: false },
        apktool: { name: "apktool", version: "", isInstalled: false },
        uberApkSigner: {
          name: "uber-apk-signer",
          version: "",
          isInstalled: false,
        },
      };
    });

    render(<SetupScreen />);

    await waitFor(() => {
      expect((window.electronAPI as any)["binary:check"]).toHaveBeenCalled();
    });

    await user.click(
      screen.getByRole("button", { name: "Download All Tools" })
    );

    expect(
      (window.electronAPI as any)["binary:download-all"]
    ).toHaveBeenCalled();
  });

  it("handles download:progress events and shows progress", async () => {
    (window.electronAPI as any)["binary:check"] = vi.fn(async () => ({
      platformTools: {
        name: "platform-tools",
        version: "",
        isInstalled: false,
      },
      scrcpy: { name: "scrcpy", version: "", isInstalled: false },
      java: { name: "java", version: "", isInstalled: false },
      apktool: { name: "apktool", version: "", isInstalled: false },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "",
        isInstalled: false,
      },
    }));

    render(<SetupScreen />);

    await waitFor(() => {
      expect(downloadProgressCallback).not.toBeNull();
    });

    act(() => {
      downloadProgressCallback?.({
        name: "platform-tools",
        version: "35.0.0",
        totalBytes: 1024 * 1024 * 50,
        downloadedBytes: 1024 * 1024 * 25,
        percentage: 50,
        speed: 1024 * 1024,
        eta: 25,
        status: "downloading",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("25 MB / 50 MB")).toBeInTheDocument();
      expect(screen.getByText("1 MB/s")).toBeInTheDocument();
    });
  });

  it("handles download:progress completed status and rechecks binaries", async () => {
    vi.useFakeTimers();

    (window.electronAPI as any)["binary:check"] = vi.fn(async () => ({
      platformTools: {
        name: "platform-tools",
        version: "",
        isInstalled: false,
      },
      scrcpy: { name: "scrcpy", version: "", isInstalled: false },
      java: { name: "java", version: "", isInstalled: false },
      apktool: { name: "apktool", version: "", isInstalled: false },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "",
        isInstalled: false,
      },
    }));

    render(<SetupScreen />);

    await vi.waitFor(() => {
      expect(downloadProgressCallback).not.toBeNull();
    });

    const checkCallsBefore = (window.electronAPI as any)["binary:check"].mock
      .calls.length;

    act(() => {
      downloadProgressCallback?.({
        name: "platform-tools",
        version: "35.0.0",
        totalBytes: 1024,
        downloadedBytes: 1024,
        percentage: 100,
        speed: 0,
        eta: 0,
        status: "completed",
      });
    });

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect((window.electronAPI as any)["binary:check"].mock.calls.length).toBe(
      checkCallsBefore + 1
    );

    vi.useRealTimers();
  });

  it("handles binary:check error gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    (window.electronAPI as any)["binary:check"] = vi.fn(async () => {
      throw new Error("Check failed");
    });

    render(<SetupScreen />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to check binaries:",
        expect.any(Error)
      );
    });

    expect(
      screen.getByText(
        "Failed to check installed tools. Please restart the application."
      )
    ).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("handles download-all error gracefully", async () => {
    const user = userEvent.setup({ delay: null });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    (window.electronAPI as any)["binary:check"] = vi.fn(async () => ({
      platformTools: {
        name: "platform-tools",
        version: "",
        isInstalled: false,
      },
      scrcpy: { name: "scrcpy", version: "", isInstalled: false },
      java: { name: "java", version: "", isInstalled: false },
      apktool: { name: "apktool", version: "", isInstalled: false },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "",
        isInstalled: false,
      },
    }));

    (window.electronAPI as any)["binary:download-all"] = vi.fn(async () => {
      throw new Error("Network error");
    });

    render(<SetupScreen />);

    await waitFor(() => {
      expect((window.electronAPI as any)["binary:check"]).toHaveBeenCalled();
    });

    await user.click(
      screen.getByRole("button", { name: "Download All Tools" })
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Download failed:",
        expect.any(Error)
      );
    });

    expect(
      screen.getByText(/Download failed: Network error/)
    ).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("handles retry item success", async () => {
    const user = userEvent.setup({ delay: null });

    (window.electronAPI as any)["binary:check"] = vi.fn(async () => ({
      platformTools: {
        name: "platform-tools",
        version: "",
        isInstalled: false,
      },
      scrcpy: { name: "scrcpy", version: "", isInstalled: false },
      java: { name: "java", version: "", isInstalled: false },
      apktool: { name: "apktool", version: "", isInstalled: false },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "",
        isInstalled: false,
      },
    }));

    render(<SetupScreen />);

    await waitFor(() => {
      expect(downloadProgressCallback).not.toBeNull();
    });

    act(() => {
      downloadProgressCallback?.({
        name: "platform-tools",
        version: "35.0.0",
        totalBytes: 1024,
        downloadedBytes: 0,
        percentage: 0,
        speed: 0,
        eta: 0,
        status: "failed",
        error: "Connection timeout",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Connection timeout")).toBeInTheDocument();
    });

    const retryButtons = screen.getAllByRole("button", { name: /Retry/i });
    await user.click(retryButtons[0]);

    expect((window.electronAPI as any)["binary:download"]).toHaveBeenCalledWith(
      "platform-tools"
    );
  });

  it("handles retry item failure", async () => {
    const user = userEvent.setup({ delay: null });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    (window.electronAPI as any)["binary:check"] = vi.fn(async () => ({
      platformTools: {
        name: "platform-tools",
        version: "",
        isInstalled: false,
      },
      scrcpy: { name: "scrcpy", version: "", isInstalled: false },
      java: { name: "java", version: "", isInstalled: false },
      apktool: { name: "apktool", version: "", isInstalled: false },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "",
        isInstalled: false,
      },
    }));

    (window.electronAPI as any)["binary:download"] = vi.fn(async () => {
      throw new Error("Retry failed");
    });

    render(<SetupScreen />);

    await waitFor(() => {
      expect(downloadProgressCallback).not.toBeNull();
    });

    act(() => {
      downloadProgressCallback?.({
        name: "platform-tools",
        version: "35.0.0",
        totalBytes: 1024,
        downloadedBytes: 0,
        percentage: 0,
        speed: 0,
        eta: 0,
        status: "failed",
        error: "Initial failure",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Initial failure")).toBeInTheDocument();
    });

    const retryButtons = screen.getAllByRole("button", { name: /Retry/i });
    await user.click(retryButtons[0]);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Retry failed for platform-tools:",
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it("shows hasAnyFailed button text when there are failed downloads", async () => {
    (window.electronAPI as any)["binary:check"] = vi.fn(async () => ({
      platformTools: {
        name: "platform-tools",
        version: "",
        isInstalled: false,
      },
      scrcpy: { name: "scrcpy", version: "", isInstalled: false },
      java: { name: "java", version: "", isInstalled: false },
      apktool: { name: "apktool", version: "", isInstalled: false },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "",
        isInstalled: false,
      },
    }));

    render(<SetupScreen />);

    await waitFor(() => {
      expect(downloadProgressCallback).not.toBeNull();
    });

    act(() => {
      downloadProgressCallback?.({
        name: "platform-tools",
        version: "35.0.0",
        totalBytes: 1024,
        downloadedBytes: 0,
        percentage: 0,
        speed: 0,
        eta: 0,
        status: "failed",
        error: "Failed",
      });
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Retry Failed Downloads" })
      ).toBeInTheDocument();
    });
  });

  it("shows skip setup button when required tools are not installed", async () => {
    const user = userEvent.setup({ delay: null });

    (window.electronAPI as any)["binary:check"] = vi.fn(async () => ({
      platformTools: {
        name: "platform-tools",
        version: "",
        isInstalled: false,
      },
      scrcpy: { name: "scrcpy", version: "", isInstalled: false },
      java: { name: "java", version: "", isInstalled: false },
      apktool: { name: "apktool", version: "", isInstalled: false },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "",
        isInstalled: false,
      },
    }));

    render(<SetupScreen />);

    await waitFor(() => {
      expect((window.electronAPI as any)["binary:check"]).toHaveBeenCalled();
    });

    const skipButton = screen.getByRole("button", {
      name: "Skip Setup (Limited Functionality)",
    });
    await user.click(skipButton);

    expect(useUiStore.getState().isSetupComplete).toBe(true);
  });

  it("shows continue skip optional button when only required are installed", async () => {
    const user = userEvent.setup({ delay: null });

    (window.electronAPI as any)["binary:check"] = vi.fn(async () => ({
      platformTools: {
        name: "platform-tools",
        version: "35.0.0",
        isInstalled: true,
      },
      scrcpy: { name: "scrcpy", version: "2.6", isInstalled: true },
      java: { name: "java", version: "", isInstalled: false },
      apktool: { name: "apktool", version: "", isInstalled: false },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "",
        isInstalled: false,
      },
    }));

    render(<SetupScreen />);

    await waitFor(() => {
      expect((window.electronAPI as any)["binary:check"]).toHaveBeenCalled();
    });

    const continueButton = screen.getByRole("button", {
      name: "Continue (Skip Optional Tools)",
    });
    await user.click(continueButton);

    expect(useUiStore.getState().isSetupComplete).toBe(true);
  });

  it("formats bytes correctly with formatBytes via progress display", async () => {
    (window.electronAPI as any)["binary:check"] = vi.fn(async () => ({
      platformTools: {
        name: "platform-tools",
        version: "",
        isInstalled: false,
      },
      scrcpy: { name: "scrcpy", version: "", isInstalled: false },
      java: { name: "java", version: "", isInstalled: false },
      apktool: { name: "apktool", version: "", isInstalled: false },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "",
        isInstalled: false,
      },
    }));

    render(<SetupScreen />);

    await waitFor(() => {
      expect(downloadProgressCallback).not.toBeNull();
    });

    act(() => {
      downloadProgressCallback?.({
        name: "platform-tools",
        version: "35.0.0",
        totalBytes: 0,
        downloadedBytes: 0,
        percentage: 0,
        speed: 0,
        eta: 0,
        status: "downloading",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("0 B / 0 B")).toBeInTheDocument();
    });

    act(() => {
      downloadProgressCallback?.({
        name: "platform-tools",
        version: "35.0.0",
        totalBytes: 1024 * 1024 * 1024,
        downloadedBytes: 512,
        percentage: 0,
        speed: 1024,
        eta: 0,
        status: "downloading",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("512 B / 1 GB")).toBeInTheDocument();
      expect(screen.getByText("1 KB/s")).toBeInTheDocument();
    });
  });

  it("shows extracting status during extraction", async () => {
    (window.electronAPI as any)["binary:check"] = vi.fn(async () => ({
      platformTools: {
        name: "platform-tools",
        version: "",
        isInstalled: false,
      },
      scrcpy: { name: "scrcpy", version: "", isInstalled: false },
      java: { name: "java", version: "", isInstalled: false },
      apktool: { name: "apktool", version: "", isInstalled: false },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "",
        isInstalled: false,
      },
    }));

    render(<SetupScreen />);

    await waitFor(() => {
      expect(downloadProgressCallback).not.toBeNull();
    });

    act(() => {
      downloadProgressCallback?.({
        name: "platform-tools",
        version: "35.0.0",
        totalBytes: 1024,
        downloadedBytes: 1024,
        percentage: 100,
        speed: 0,
        eta: 0,
        status: "extracting",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Extracting...")).toBeInTheDocument();
    });
  });

  it("handles retry for scrcpy", async () => {
    const user = userEvent.setup({ delay: null });

    (window.electronAPI as any)["binary:check"] = vi.fn(async () => ({
      platformTools: {
        name: "platform-tools",
        version: "",
        isInstalled: false,
      },
      scrcpy: { name: "scrcpy", version: "", isInstalled: false },
      java: { name: "java", version: "", isInstalled: false },
      apktool: { name: "apktool", version: "", isInstalled: false },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "",
        isInstalled: false,
      },
    }));

    render(<SetupScreen />);

    await waitFor(() => {
      expect(downloadProgressCallback).not.toBeNull();
    });

    act(() => {
      downloadProgressCallback?.({
        name: "scrcpy",
        version: "2.6",
        totalBytes: 1024,
        downloadedBytes: 0,
        percentage: 0,
        speed: 0,
        eta: 0,
        status: "failed",
        error: "Scrcpy download failed",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Scrcpy download failed")).toBeInTheDocument();
    });

    const retryButtons = screen.getAllByRole("button", { name: /Retry/i });
    await user.click(retryButtons[0]);

    expect((window.electronAPI as any)["binary:download"]).toHaveBeenCalledWith(
      "scrcpy"
    );
  });

  it("handles retry for java", async () => {
    const user = userEvent.setup({ delay: null });

    (window.electronAPI as any)["binary:check"] = vi.fn(async () => ({
      platformTools: {
        name: "platform-tools",
        version: "",
        isInstalled: false,
      },
      scrcpy: { name: "scrcpy", version: "", isInstalled: false },
      java: { name: "java", version: "", isInstalled: false },
      apktool: { name: "apktool", version: "", isInstalled: false },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "",
        isInstalled: false,
      },
    }));

    render(<SetupScreen />);

    await waitFor(() => {
      expect(downloadProgressCallback).not.toBeNull();
    });

    act(() => {
      downloadProgressCallback?.({
        name: "java",
        version: "21",
        totalBytes: 1024,
        downloadedBytes: 0,
        percentage: 0,
        speed: 0,
        eta: 0,
        status: "failed",
        error: "Java download failed",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Java download failed")).toBeInTheDocument();
    });

    const retryButtons = screen.getAllByRole("button", { name: /Retry/i });
    await user.click(retryButtons[0]);

    expect((window.electronAPI as any)["binary:download"]).toHaveBeenCalledWith(
      "java"
    );
  });

  it("handles retry for apktool", async () => {
    const user = userEvent.setup({ delay: null });

    (window.electronAPI as any)["binary:check"] = vi.fn(async () => ({
      platformTools: {
        name: "platform-tools",
        version: "",
        isInstalled: false,
      },
      scrcpy: { name: "scrcpy", version: "", isInstalled: false },
      java: { name: "java", version: "", isInstalled: false },
      apktool: { name: "apktool", version: "", isInstalled: false },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "",
        isInstalled: false,
      },
    }));

    render(<SetupScreen />);

    await waitFor(() => {
      expect(downloadProgressCallback).not.toBeNull();
    });

    act(() => {
      downloadProgressCallback?.({
        name: "apktool",
        version: "2.9",
        totalBytes: 1024,
        downloadedBytes: 0,
        percentage: 0,
        speed: 0,
        eta: 0,
        status: "failed",
        error: "Apktool download failed",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Apktool download failed")).toBeInTheDocument();
    });

    const retryButtons = screen.getAllByRole("button", { name: /Retry/i });
    await user.click(retryButtons[0]);

    expect((window.electronAPI as any)["binary:download"]).toHaveBeenCalledWith(
      "apktool"
    );
  });

  it("handles retry for uber-apk-signer", async () => {
    const user = userEvent.setup({ delay: null });

    (window.electronAPI as any)["binary:check"] = vi.fn(async () => ({
      platformTools: {
        name: "platform-tools",
        version: "",
        isInstalled: false,
      },
      scrcpy: { name: "scrcpy", version: "", isInstalled: false },
      java: { name: "java", version: "", isInstalled: false },
      apktool: { name: "apktool", version: "", isInstalled: false },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "",
        isInstalled: false,
      },
    }));

    render(<SetupScreen />);

    await waitFor(() => {
      expect(downloadProgressCallback).not.toBeNull();
    });

    act(() => {
      downloadProgressCallback?.({
        name: "uber-apk-signer",
        version: "1.3",
        totalBytes: 1024,
        downloadedBytes: 0,
        percentage: 0,
        speed: 0,
        eta: 0,
        status: "failed",
        error: "Signer download failed",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Signer download failed")).toBeInTheDocument();
    });

    const retryButtons = screen.getAllByRole("button", { name: /Retry/i });
    await user.click(retryButtons[0]);

    expect((window.electronAPI as any)["binary:download"]).toHaveBeenCalledWith(
      "uber-apk-signer"
    );
  });

  it("opens GitHub link when clicking Learn More", async () => {
    const user = userEvent.setup({ delay: null });

    render(<SetupScreen />);

    await waitFor(() => {
      expect((window.electronAPI as any)["binary:check"]).toHaveBeenCalled();
    });

    const learnMoreLink = screen.getByText("Learn More");
    await user.click(learnMoreLink);

    expect(
      (window.electronAPI as any)["shell:open-external"]
    ).toHaveBeenCalledWith("https://github.com/adb-companion/adb-companion");
  });
});
