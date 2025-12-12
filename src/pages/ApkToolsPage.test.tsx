import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApkToolsPage } from "./ApkToolsPage";
import { useUiStore } from "../stores";

let dropHandler: ((files: File[]) => void | Promise<void>) | null = null;

vi.mock("react-dropzone", () => {
  return {
    useDropzone: (opts: any) => {
      dropHandler = opts.onDrop;
      return {
        getRootProps: () => ({ onClick: () => undefined }),
        getInputProps: () => ({}),
        isDragActive: false,
      };
    },
  };
});

describe("ApkToolsPage", () => {
  beforeEach(() => {
    useUiStore.setState({ toasts: [] } as any);

    ((window as any).electronAPI as any)["apk:get-info"] = vi.fn(async () => ({
      packageName: "com.example.app",
      appName: "My App",
      versionName: "1.0.0",
      versionCode: 1,
      minSdkVersion: 21,
      targetSdkVersion: 34,
      permissions: ["android.permission.INTERNET"],
      activities: [],
      services: [],
      receivers: [],
      size: 0,
    }));

    ((window as any).electronAPI as any)["shell:select-file"] = vi.fn(
      async () => "/tmp/app.apk"
    );

    ((window as any).electronAPI as any)["apk:rename-package"] = vi.fn(
      async () => "/tmp/out.apk"
    );
  });

  it("shows warning when non-apk dropped", async () => {
    render(<ApkToolsPage />);

    await dropHandler?.([
      { name: "file.txt", path: "/tmp/file.txt" } as any as File,
    ]);

    expect(useUiStore.getState().toasts[0]?.type).toBe("warning");
  });

  it("loads apk info and renames package", async () => {
    const user = userEvent.setup();

    render(<ApkToolsPage />);

    await dropHandler?.([
      { name: "app.apk", path: "/tmp/app.apk" } as any as File,
    ]);

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /Create Modified APK/i })
    );

    expect(
      ((window as any).electronAPI as any)["apk:rename-package"]
    ).toHaveBeenCalled();
  });

  it("selects file via browse", async () => {
    const user = userEvent.setup();

    render(<ApkToolsPage />);

    await user.click(screen.getByRole("button", { name: /Browse Files/i }));

    expect(
      ((window as any).electronAPI as any)["shell:select-file"]
    ).toHaveBeenCalled();
  });
});
