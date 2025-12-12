import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApkToolsPage } from "./ApkToolsPage";
import { useUiStore } from "../stores";

let dropHandler: ((files: File[]) => void | Promise<void>) | null = null;
let isDragActiveState = false;

vi.mock("react-dropzone", () => {
  return {
    useDropzone: (opts: any) => {
      dropHandler = opts.onDrop;
      return {
        getRootProps: () => ({ onClick: () => undefined }),
        getInputProps: () => ({}),
        isDragActive: isDragActiveState,
      };
    },
  };
});

describe("ApkToolsPage", () => {
  beforeEach(() => {
    isDragActiveState = false;
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

  it("handles read APK error", async () => {
    ((window as any).electronAPI as any)["apk:get-info"] = vi.fn(async () => {
      throw new Error("Failed to read APK");
    });

    render(<ApkToolsPage />);

    await act(async () => {
      await dropHandler?.([
        { name: "app.apk", path: "/tmp/app.apk" } as any as File,
      ]);
    });

    const toasts = useUiStore.getState().toasts;
    expect(toasts.some((t: any) => t.title === "Failed to read APK")).toBe(
      true
    );
  });

  it("handles rename package error", async () => {
    const user = userEvent.setup();

    ((window as any).electronAPI as any)["apk:rename-package"] = vi.fn(
      async () => {
        throw new Error("Rename failed");
      }
    );

    render(<ApkToolsPage />);

    await act(async () => {
      await dropHandler?.([
        { name: "app.apk", path: "/tmp/app.apk" } as any as File,
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /Create Modified APK/i })
    );

    await waitFor(() => {
      const toasts = useUiStore.getState().toasts;
      expect(toasts.some((t: any) => t.title === "Failed to modify APK")).toBe(
        true
      );
    });
  });

  it("does not rename when no APK selected or no package name", async () => {
    render(<ApkToolsPage />);

    expect(
      ((window as any).electronAPI as any)["apk:rename-package"]
    ).not.toHaveBeenCalled();
  });

  it("passes undefined newAppName when empty", async () => {
    const user = userEvent.setup();

    render(<ApkToolsPage />);

    await act(async () => {
      await dropHandler?.([
        { name: "app.apk", path: "/tmp/app.apk" } as any as File,
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const appNameInput = screen.getByPlaceholderText("App Name Clone");
    await user.clear(appNameInput);

    await user.click(
      screen.getByRole("button", { name: /Create Modified APK/i })
    );

    expect(
      ((window as any).electronAPI as any)["apk:rename-package"]
    ).toHaveBeenCalledWith({
      apkPath: "/tmp/app.apk",
      newPackageName: "com.example.app.clone",
      newAppName: undefined,
    });
  });

  it("updates package name input", async () => {
    const user = userEvent.setup();

    render(<ApkToolsPage />);

    await act(async () => {
      await dropHandler?.([
        { name: "app.apk", path: "/tmp/app.apk" } as any as File,
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const packageNameInput = screen.getByPlaceholderText(
      "com.example.app.clone"
    );
    await user.clear(packageNameInput);
    await user.type(packageNameInput, "com.new.package");

    expect(packageNameInput).toHaveValue("com.new.package");
  });

  it("updates app name input", async () => {
    const user = userEvent.setup();

    render(<ApkToolsPage />);

    await act(async () => {
      await dropHandler?.([
        { name: "app.apk", path: "/tmp/app.apk" } as any as File,
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    const appNameInput = screen.getByPlaceholderText("App Name Clone");
    await user.clear(appNameInput);
    await user.type(appNameInput, "New App Name");

    expect(appNameInput).toHaveValue("New App Name");
  });

  it("shows drag active state", async () => {
    isDragActiveState = true;

    render(<ApkToolsPage />);

    expect(screen.getByText("Drop APK here")).toBeInTheDocument();
  });

  it("shows normal state when not dragging", async () => {
    isDragActiveState = false;

    render(<ApkToolsPage />);

    expect(screen.getByText("Select APK File")).toBeInTheDocument();
  });

  it("handles browse when no file selected", async () => {
    const user = userEvent.setup();

    ((window as any).electronAPI as any)["shell:select-file"] = vi.fn(
      async () => null
    );

    render(<ApkToolsPage />);

    await user.click(screen.getByRole("button", { name: /Browse Files/i }));

    expect(
      ((window as any).electronAPI as any)["shell:select-file"]
    ).toHaveBeenCalled();

    expect(
      ((window as any).electronAPI as any)["apk:get-info"]
    ).not.toHaveBeenCalled();
  });

  it("shows permissions list", async () => {
    render(<ApkToolsPage />);

    await act(async () => {
      await dropHandler?.([
        { name: "app.apk", path: "/tmp/app.apk" } as any as File,
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    expect(screen.getByText("Permissions (1)")).toBeInTheDocument();
    expect(screen.getByText("INTERNET")).toBeInTheDocument();
  });

  it("hides permissions section when no permissions", async () => {
    ((window as any).electronAPI as any)["apk:get-info"] = vi.fn(async () => ({
      packageName: "com.example.app",
      appName: "My App",
      versionName: "1.0.0",
      versionCode: 1,
      minSdkVersion: 21,
      targetSdkVersion: 34,
      permissions: [],
      activities: [],
      services: [],
      receivers: [],
      size: 0,
    }));

    render(<ApkToolsPage />);

    await act(async () => {
      await dropHandler?.([
        { name: "app.apk", path: "/tmp/app.apk" } as any as File,
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText("My App")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Permissions \(/)).toBeNull();
  });
});
