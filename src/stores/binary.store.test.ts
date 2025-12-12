import { describe, expect, it, beforeEach } from "vitest";
import { useBinaryStore } from "./binary.store";

describe("useBinaryStore", () => {
  beforeEach(() => {
    useBinaryStore.setState({
      status: null,
      downloadProgress: new Map(),
      isDownloading: false,
      isChecking: false,
    });
  });

  it("sets status", () => {
    const status = {
      platformTools: { name: "platform-tools", version: "", isInstalled: true },
      scrcpy: { name: "scrcpy", version: "", isInstalled: false },
      java: { name: "java", version: "", isInstalled: false },
      apktool: { name: "apktool", version: "", isInstalled: false },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "",
        isInstalled: false,
      },
    };

    useBinaryStore.getState().setStatus(status as any);

    expect(useBinaryStore.getState().status).toEqual(status);
  });

  it("tracks download progress per tool", () => {
    useBinaryStore.getState().setDownloadProgress("platform-tools", {
      name: "platform-tools",
      version: "",
      totalBytes: 100,
      downloadedBytes: 10,
      percentage: 10,
      speed: 1,
      eta: 0,
      status: "downloading",
    } as any);

    expect(
      useBinaryStore.getState().downloadProgress.has("platform-tools")
    ).toBe(true);

    useBinaryStore.getState().clearDownloadProgress("platform-tools");

    expect(
      useBinaryStore.getState().downloadProgress.has("platform-tools")
    ).toBe(false);
  });

  it("computes isAllInstalled", () => {
    expect(useBinaryStore.getState().isAllInstalled()).toBe(false);

    useBinaryStore.getState().setStatus({
      platformTools: { name: "platform-tools", version: "", isInstalled: true },
      scrcpy: { name: "scrcpy", version: "", isInstalled: false },
      java: { name: "java", version: "", isInstalled: false },
      apktool: { name: "apktool", version: "", isInstalled: false },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "",
        isInstalled: false,
      },
    } as any);

    expect(useBinaryStore.getState().isAllInstalled()).toBe(true);
  });
});
