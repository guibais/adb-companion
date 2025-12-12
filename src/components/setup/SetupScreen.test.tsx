import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SetupScreen } from "./SetupScreen";
import { useBinaryStore, useUiStore } from "../../stores";

describe("SetupScreen", () => {
  beforeEach(() => {
    vi.useRealTimers();

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
});
