import { describe, expect, it } from "vitest";
import { ApkToolsPage } from "./ApkToolsPage";
import { AppsPage } from "./AppsPage";
import { ConnectPage } from "./ConnectPage";
import { DevicePage } from "./DevicePage";
import { DevToolsPage } from "./DevToolsPage";
import { FilesPage } from "./FilesPage";
import { LogcatPage } from "./LogcatPage";
import { QuickActionsPage } from "./QuickActionsPage";
import { ScreenMirrorPage } from "./ScreenMirrorPage";
import { ScreenshotPage } from "./ScreenshotPage";
import { SettingsPage } from "./SettingsPage";
import { ShellPage } from "./ShellPage";
import * as index from "./index";

describe("pages index", () => {
  it("re-exports pages", () => {
    expect(index.ApkToolsPage).toBe(ApkToolsPage);
    expect(index.AppsPage).toBe(AppsPage);
    expect(index.ConnectPage).toBe(ConnectPage);
    expect(index.DevicePage).toBe(DevicePage);
    expect(index.DevToolsPage).toBe(DevToolsPage);
    expect(index.FilesPage).toBe(FilesPage);
    expect(index.LogcatPage).toBe(LogcatPage);
    expect(index.QuickActionsPage).toBe(QuickActionsPage);
    expect(index.ScreenMirrorPage).toBe(ScreenMirrorPage);
    expect(index.ScreenshotPage).toBe(ScreenshotPage);
    expect(index.SettingsPage).toBe(SettingsPage);
    expect(index.ShellPage).toBe(ShellPage);
  });
});
