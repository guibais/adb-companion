import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { StatusBar } from "./StatusBar";
import { useBinaryStore, useDeviceStore } from "../../stores";

describe("StatusBar", () => {
  beforeEach(() => {
    useDeviceStore.setState({
      devices: [],
      tabs: [{ id: "tab-1", deviceId: null, label: "No Device" }],
      activeTabId: "tab-1",
    } as any);

    useBinaryStore.setState({
      status: {
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
      },
    } as any);
  });

  it("shows no device message", () => {
    render(<StatusBar />);

    expect(screen.getByText("No device connected")).toBeInTheDocument();
    expect(screen.getByText("ADB v35.0.0")).toBeInTheDocument();
    expect(screen.getByText("scrcpy v2.6")).toBeInTheDocument();
  });

  it("shows active device details", () => {
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

    render(<StatusBar />);

    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("via USB")).toBeInTheDocument();
    expect(screen.getByText("Pixel")).toBeInTheDocument();
  });
});
