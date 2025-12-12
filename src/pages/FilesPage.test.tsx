import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { FilesPage } from "./FilesPage";
import { useDeviceStore } from "../stores";

describe("FilesPage", () => {
  beforeEach(() => {
    useDeviceStore.setState({
      devices: [],
      tabs: [{ id: "tab-1", deviceId: null, label: "No Device" }],
      activeTabId: "tab-1",
    } as any);
  });

  it("shows no device selected", () => {
    render(<FilesPage />);

    expect(screen.getByText("No Device Selected")).toBeInTheDocument();
    expect(
      screen.getByText("Connect a device to browse files")
    ).toBeInTheDocument();
  });

  it("shows placeholder when device is selected", () => {
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

    render(<FilesPage />);

    expect(screen.getByText("Files")).toBeInTheDocument();
    expect(screen.getByText("File manager removed")).toBeInTheDocument();
  });
});
