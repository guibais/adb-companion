import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll } from "vitest";

beforeAll(() => {
  const store: Record<string, string> = {};

  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = String(value);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const key of Object.keys(store)) {
          delete store[key];
        }
      },
    },
    configurable: true,
  });

  const noopUnsub = () => {};

  const electronAPI: any = {
    "adb:list-devices": async () => [],
    "adb:connect": async () => true,
    "adb:pair": async () => true,
    "adb:disconnect": async () => undefined,
    "adb:shell": async () => "",
    "adb:install-apk": async () => undefined,
    "adb:uninstall": async () => undefined,
    "adb:clear-data": async () => undefined,
    "adb:force-stop": async () => undefined,
    "adb:push": async () => undefined,
    "adb:pull": async () => undefined,
    "adb:screenshot": async () => "",
    "adb:start-recording": async () => undefined,
    "adb:stop-recording": async () => "",
    "adb:reboot": async () => undefined,
    "adb:list-files": async () => [],
    "adb:list-apps": async () => [],
    "adb:export-apk": async () => "",
    "adb:export-all-apks": async () => [],
    "adb:install-multiple": async () => undefined,
    "adb:get-prop": async () => "",
    "adb:logcat-start": () => undefined,
    "adb:logcat-stop": () => undefined,
    "adb:logcat-clear": async () => undefined,
    "adb:backup": async () => undefined,
    "adb:restore": async () => undefined,

    "scrcpy:start": async () => 1,
    "scrcpy:stop": async () => undefined,
    "scrcpy:is-running": async () => false,

    "binary:check": async () => ({
      platformTools: { name: "platform-tools", version: "", isInstalled: true },
      scrcpy: { name: "scrcpy", version: "", isInstalled: true },
      java: { name: "java", version: "", isInstalled: true },
      apktool: { name: "apktool", version: "", isInstalled: true },
      uberApkSigner: {
        name: "uber-apk-signer",
        version: "",
        isInstalled: true,
      },
    }),
    "binary:download": async () => undefined,
    "binary:download-all": async () => undefined,

    "apk:get-info": async () => ({
      packageName: "",
      appName: "",
      versionName: "",
      versionCode: 0,
      minSdkVersion: 0,
      targetSdkVersion: 0,
      permissions: [],
      activities: [],
      services: [],
      receivers: [],
      size: 0,
      iconBase64: undefined,
    }),
    "apk:rename-package": async () => "",
    "apk:rename-split-apks": async () => [],

    "device:info": async () => ({}),
    "device:battery": async () => ({}),
    "device:storage": async () => ({}),
    "device:save": async () => undefined,
    "device:get-saved": async () => [],
    "device:remove-saved": async () => undefined,

    "shell:open-external": async () => undefined,
    "shell:select-file": async () => null,
    "shell:select-save-path": async () => null,

    "app:get-version": async () => "",
    "app:get-platform": async () => "darwin",
    "app:get-user-data-path": async () => "",

    "wifi:start-pairing": async () => undefined,
    "wifi:stop-pairing": async () => undefined,
    "wifi:get-pairing-info": async () => ({}),
    "wifi:manual-pair": async () => true,
    "wifi:connect": async () => true,

    "devtools:check": async () => [],
    "devtools:available": async () => [],
    "devtools:download": async () => undefined,
    "devtools:launch": async () => undefined,
    "devtools:stop": async () => undefined,
  };

  const electronEvents: any = {
    "logcat:entry": () => noopUnsub,
    "download:progress": () => noopUnsub,
    "device:connected": () => noopUnsub,
    "device:disconnected": () => noopUnsub,
    "scrcpy:closed": () => noopUnsub,
    "wifi:pairing-state": () => noopUnsub,
    "wifi:connected": () => noopUnsub,
    "devtools:progress": () => noopUnsub,
  };

  window.electronAPI = electronAPI;
  window.electronEvents = electronEvents;
});

afterEach(() => {
  window.localStorage.clear();
});
