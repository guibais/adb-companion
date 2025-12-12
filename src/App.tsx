import { useEffect, useState } from "react";
import { Header, StatusBar, Sidemenu } from "./components/layout";
import { ToastContainer } from "./components/ui";
import { SetupScreen } from "./components/setup";
import {
  ConnectPage,
  DevicePage,
  ScreenMirrorPage,
  AppsPage,
  FilesPage,
  LogcatPage,
  ShellPage,
  ScreenshotPage,
  ApkToolsPage,
  QuickActionsPage,
  SettingsPage,
  DevToolsPage,
} from "./pages";
import { useUiStore, useBinaryStore, useDeviceStore } from "./stores";

const pageComponents: Record<string, () => JSX.Element> = {
  connect: ConnectPage,
  device: DevicePage,
  mirror: ScreenMirrorPage,
  apps: AppsPage,
  files: FilesPage,
  logcat: LogcatPage,
  shell: ShellPage,
  screenshot: ScreenshotPage,
  "apk-tools": ApkToolsPage,
  "quick-actions": QuickActionsPage,
  settings: SettingsPage,
  "dev-tools": DevToolsPage,
};

const DEVICE_PAGES = [
  "device",
  "mirror",
  "apps",
  "files",
  "logcat",
  "shell",
  "screenshot",
  "apk-tools",
  "quick-actions",
  "dev-tools",
];

export default function App() {
  const { currentPage, isSetupComplete } = useUiStore();
  const { setStatus, setChecking } = useBinaryStore();
  const { activeTabId } = useDeviceStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const unsubFinishHydration = useUiStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    if (useUiStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  useEffect(() => {
    if (isHydrated) {
      checkSetup();
    }
  }, [isHydrated]);

  const checkSetup = async () => {
    setChecking(true);
    try {
      const status = await window.electronAPI["binary:check"]();
      setStatus(status);
    } catch (err) {
      console.error("Failed to check binaries:", err);
    } finally {
      setChecking(false);
    }
  };

  if (!isHydrated) {
    return null;
  }

  if (!isSetupComplete) {
    return (
      <>
        <SetupScreen />
        <ToastContainer />
      </>
    );
  }

  const PageComponent = pageComponents[currentPage] || ConnectPage;
  const showSidemenu = DEVICE_PAGES.includes(currentPage) && activeTabId;

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {showSidemenu && <Sidemenu />}
        <main className="flex-1 overflow-hidden">
          <PageComponent />
        </main>
      </div>
      <StatusBar />
      <ToastContainer />
    </div>
  );
}
