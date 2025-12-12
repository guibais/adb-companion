import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { SettingsPage } from "./SettingsPage";
import { useBinaryStore, useSettingsStore, useUiStore } from "../stores";

describe("SettingsPage", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      screenshotPath: "",
      recordingPath: "",
      defaultScrcpyResolution: 1080,
      defaultScrcpyBitrate: 8,
      autoConnectLastDevice: true,
      showSystemApps: false,
      theme: "dark",
    } as any);

    useBinaryStore.setState({
      status: {
        platformTools: {
          name: "platform-tools",
          version: "35.0.0",
          isInstalled: true,
        },
        scrcpy: { name: "scrcpy", version: "2.6", isInstalled: false },
        java: { name: "java", version: "21", isInstalled: true },
        apktool: { name: "apktool", version: "2.9", isInstalled: false },
        uberApkSigner: {
          name: "uber-apk-signer",
          version: "1.3",
          isInstalled: true,
        },
      },
    } as any);

    useUiStore.setState({ toasts: [] } as any);

    ((window as any).electronAPI as any)["shell:open-external"] = vi.fn(
      async () => undefined
    );
  });

  it("toggles checkboxes and opens github link", async () => {
    const user = userEvent.setup();

    render(<SettingsPage />);

    const [autoConnect, showSystem] = screen.getAllByRole("checkbox");

    await user.click(autoConnect);
    expect(useSettingsStore.getState().autoConnectLastDevice).toBe(false);

    await user.click(showSystem);
    expect(useSettingsStore.getState().showSystemApps).toBe(true);

    await user.click(screen.getByRole("button", { name: "GitHub" }));
    expect(
      ((window as any).electronAPI as any)["shell:open-external"]
    ).toHaveBeenCalled();
  });

  it("shows installed tools status and triggers update toast", async () => {
    const user = userEvent.setup();

    render(<SettingsPage />);

    expect(screen.getByText("Installed Tools")).toBeInTheDocument();
    expect(screen.getByText("Platform Tools")).toBeInTheDocument();
    expect(screen.getByText("v35.0.0")).toBeInTheDocument();
    expect(screen.getAllByText("Not installed").length).toBeGreaterThan(0);

    await user.click(
      screen.getByRole("button", { name: /Check for Updates/i })
    );
    expect(useUiStore.getState().toasts[0]?.title).toBe(
      "Checking for updates..."
    );
  });
});
